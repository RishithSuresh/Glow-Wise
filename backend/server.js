const express = require('express');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Database connection
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nutrition_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection()
    .then(async (connection) => {
        console.log('Database connected successfully.');
        const [rows] = await connection.query('SELECT 1');
        console.log('Test query result:', rows);
        connection.release();
    })
    .catch(err => {
        console.error('Database connection failed:', err.message);
        process.exit(1); // Exit the process if the database connection fails
    });

// API to handle user login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Username and password are required.');
    }

    try {
        const [results] = await pool.query('SELECT * FROM login WHERE username = ?', [username]);

        if (results.length > 0) {
            const user = results[0];
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (isPasswordValid) {
                res.status(200).json({ message: 'Login successful.', user_id: user.id, username: user.username });
            } else {
                res.status(401).send('Invalid password.');
            }
        } else {
            res.status(404).send('No user found. Please register.');
        }
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).send('Error checking user.');
    }
});

// API to handle user registration
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).send('Username, email, and password are required.');
    }

    try {
        const [results] = await pool.query('SELECT * FROM login WHERE username = ? OR email = ?', [username, email]);

        if (results.length > 0) {
            return res.status(409).send('Username or email already exists.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO login (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);

        res.status(201).send('User registered successfully.');
    } catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).send('Internal server error.');
    }
});

// API to log mood data
app.post('/api/mood-logs', async (req, res) => {
    const { mood, intensity, note, log_date } = req.body;

    if (!mood || !intensity || !log_date) {
        return res.status(400).send('Mood, intensity, and date are required.');
    }

    try {
        await pool.query('INSERT INTO mood_logs (mood, intensity, note, log_date) VALUES (?, ?, ?, ?)', [mood, intensity, note, log_date]);
        res.status(201).send('Mood log saved successfully.');
    } catch (err) {
        console.error('Error inserting mood log:', err);
        res.status(500).send('Error saving mood log.');
    }
});

// API to fetch mood logs
app.get('/api/mood-logs', async (req, res) => {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
        return res.status(400).send('Start date and end date are required.');
    }

    try {
        const [results] = await pool.query('SELECT mood, intensity, note, log_date FROM mood_logs WHERE log_date BETWEEN ? AND ? ORDER BY log_date ASC', [start_date, end_date]);
        res.json(results.map(log => ({
            ...log,
            log_date: log.log_date.toISOString().split('T')[0]
        })));
    } catch (err) {
        console.error('Error fetching mood logs:', err);
        res.status(500).send('Error fetching mood logs.');
    }
});

// API to fetch predefined food items
app.get('/api/food-items', async (req, res) => {
    try {
        console.log('Fetching food items from the database...');
        const [results] = await pool.query('SELECT name, calories_per_100g FROM food_items'); // Fetch only required columns
        if (results.length === 0) {
            console.warn('No food items found in the database.');
            return res.status(404).json({ success: false, message: 'No food items found.' });
        }
        console.log('Food items fetched successfully:', results); // Log fetched data for debugging
        res.json({ success: true, data: results });
    } catch (err) {
        console.error('Error fetching food items:', {
            message: err.message,
            stack: err.stack,
        }); // Log detailed error information
        res.status(500).json({ success: false, message: 'Failed to fetch food items.', error: err.message });
    }
});

// Sleep API routes
app.post('/api/sleep', async (req, res) => {
    const { bedtime, waketime } = req.body;

    if (!bedtime || !waketime) {
        return res.status(400).json({ error: 'Bedtime and waketime are required.' });
    }

    const bedTimeDate = new Date(`01/01/2000 ${bedtime}`);
    const wakeTimeDate = new Date(`01/01/2000 ${waketime}`);
    if (wakeTimeDate < bedTimeDate) {
        wakeTimeDate.setDate(wakeTimeDate.getDate() + 1);
    }

    const sleepDuration = (wakeTimeDate - bedTimeDate) / (1000 * 60 * 60);
    let sleepQuality = '';

    if (sleepDuration >= 7 && sleepDuration <= 9) {
        sleepQuality = 'Good';
    } else if (sleepDuration >= 5 && sleepDuration < 7) {
        sleepQuality = 'Moderate';
    } else {
        sleepQuality = 'Poor';
    }

    try {
        await pool.query(
            'INSERT INTO sleep_logs (bedtime, waketime, sleep_duration, sleep_quality) VALUES (?, ?, ?, ?)',
            [bedtime, waketime, sleepDuration, sleepQuality]
        );
        res.status(201).json({ message: 'Sleep data saved successfully.' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to save sleep data.' });
    }
});

app.get('/api/sleep', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM sleep_logs ORDER BY logged_at DESC');
        res.json(rows);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to fetch sleep data.' });
    }
});

// Email configuration
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "glowwise19@gmail.com",
        pass: "qjrv mrhb zoee jnoy"
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.error("SMTP connection error:", error);
    } else {
        console.log("SMTP server is ready to send emails.");
    }
});

// Email route
app.post("/send-email", (req, res) => {
    const { name, email, message } = req.body;

    const adminMailOptions = {
        from: email,
        to: "glowwise19@gmail.com",
        subject: `New Message from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
    };

    const userMailOptions = {
        from: "glowwise19@gmail.com",
        to: email,
        subject: "Thank you for contacting Glow Wise",
        text: `Hi ${name},\n\nThank you for reaching out to us. We have received your message and will get back to you soon.\n\nBest regards,\nGlow Wise Team`
    };

    transporter.sendMail(adminMailOptions, (err, info) => {
        if (err) {
            console.error("Error sending admin email:", err);
            return res.status(500).json({ error: "Failed to send admin email.", details: err.message });
        }

        transporter.sendMail(userMailOptions, (err, info) => {
            if (err) {
                console.error("Error sending user email:", err);
                return res.status(500).json({ error: "Failed to send user email.", details: err.message });
            }

            res.status(200).send("Emails sent successfully.");
        });
    });
});

// Add a health check endpoint to verify server and database connectivity
app.get('/api/health', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1');
        res.json({ success: true, message: 'Server and database are running.', databaseCheck: rows });
    } catch (err) {
        console.error('Health check failed:', err.message);
        res.status(500).json({ success: false, message: 'Health check failed.', error: err.message });
    }
});

// Add a new endpoint to refresh meal data
app.get('/api/refresh-meals', async (req, res) => {
    try {
        // Simulate fetching meal data (this can be replaced with actual database logic if needed)
        const meals = [
            { meal: 'Apple', calories: 52, quantity: 1 },
            { meal: 'Banana', calories: 89, quantity: 1 },
            { meal: 'Rice', calories: 130, quantity: 1 }
        ];
        res.json({ success: true, meals });
    } catch (err) {
        console.error('Error refreshing meals:', err.message);
        res.status(500).json({ success: false, message: 'Failed to refresh meals.', error: err.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});