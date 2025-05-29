// Toggle Mobile Navigation Menu
document.addEventListener("DOMContentLoaded", function () {
  const menuToggle = document.querySelector(".menu-toggle");
  const navbarLinks = document.querySelector(".navbar-links");

  if (menuToggle) {
      menuToggle.addEventListener("click", function () {
          navbarLinks.classList.toggle("active");
      });
  }

  // Smooth Scrolling for Internal Links Only
  const navLinks = document.querySelectorAll(".navbar-links a");

  navLinks.forEach(link => {
      link.addEventListener("click", function (e) {
          const href = this.getAttribute("href");

          // Only prevent default for internal section links
          if (href.startsWith("#")) {
              e.preventDefault();
              const targetId = href.substring(1);
              const targetSection = document.getElementById(targetId);

              if (targetSection) {
                  window.scrollTo({
                      top: targetSection.offsetTop - 60, // Adjust for navbar height
                      behavior: "smooth"
                  });

                  // Close menu on mobile
                  if (window.innerWidth <= 768) {
                      navbarLinks.classList.remove("active");
                  }
              }
          }
      });
  });

  // Contact Form Validation
  const contactForm = document.querySelector(".contact-form form");

  if (contactForm) {
      contactForm.addEventListener("submit", function (e) {
          e.preventDefault(); // Prevent actual form submission

          const name = document.querySelector("input[name='name']").value.trim();
          const email = document.querySelector("input[name='email']").value.trim();
          const message = document.querySelector("textarea[name='message']").value.trim();

          if (name === "" || email === "" || message === "") {
              alert("Please fill in all fields.");
              return;
          }

          if (!validateEmail(email)) {
              alert("Please enter a valid email address.");
              return;
          }

          alert("Message sent successfully!");
          contactForm.reset(); // Clear the form after submission
      });
  }

  // Email Validation Function
  function validateEmail(email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailPattern.test(email);
  }
});
