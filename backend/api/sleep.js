const express = require('express');
const router = express.Router();
const db = require('../db'); // Assuming a db.js file for database connection

router.post('/', async (req, res) => {
    const { bedtime, waketime } = req.body;

    if (!bedtime || !waketime) {
        console.error('Bedtime or waketime missing in request body.');
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
        console.log('Inserting sleep data into database:', { bedtime, waketime, sleepDuration, sleepQuality });
        await db.query(
            'INSERT INTO sleep_logs (bedtime, waketime, sleep_duration, sleep_quality) VALUES (?, ?, ?, ?)',
            [bedtime, waketime, sleepDuration, sleepQuality]
        );
        res.status(201).json({ message: 'Sleep data saved successfully.' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to save sleep data.' });
    }
});

router.get('/', async (req, res) => {
    try {
        console.log('Fetching sleep data from database.');
        const [rows] = await db.query('SELECT * FROM sleep_logs ORDER BY logged_at DESC');
        res.json(rows);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to fetch sleep data.' });
    }
});

module.exports = router;
