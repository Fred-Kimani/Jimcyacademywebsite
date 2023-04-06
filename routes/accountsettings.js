const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const query = require('../config/database');
const passport = require("passport");
const session = require('express-session');
const initializePassport = require("../config/passport");
const flash = require('connect-flash');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser')
const moment =  require('moment-timezone');

const {ensureAuthenticated} = require('../config/auth');
const { now, invalid } = require('moment');

dotenv.config();

router.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
router.use(bodyParser.json());



router.use(flash());

// Handle POST requests to /password_reset


router.get('/password_reset/:token', async (req, res) => {
    try {
      const token = req.params.token;
      // Check if the token is valid and has not expired
      const querys = 'SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > NOW()';
      const results = await query(querys, [token]);

      if (results.length === 0) {
        // If the token is not valid, show an error message
        res.render('error', { message: 'Invalid or expired token' });
      } else {
        // If the token is valid, show the password reset form
        res.render('password_reset_form', { token: token });
      }
    } catch(err) {
      console.log(err);
      res.status(500).send("Oops! Something went wrong on our end. We apologize for the inconvenience. Please try again later or contact support if the issue persists.");
    }
  });
  
  router.post('/password_reset/:token', async (req, res) => {
    try {
      const token = req.params.token;
      const password = req.body.password;
      const confirm_password = req.body.confirmPassword;
      if (password !== confirm_password) {
        // If the passwords do not match, show an error message
        res.render('password_reset_form', { token: token, error: 'Passwords do not match' });
      } else {
        // If the passwords match, update the user's password in the database
        const querys = 'SELECT user_id FROM password_reset_tokens WHERE token = ? AND expires_at > NOW()';
        const results = await query(querys, [token]);

        if (results.length === 0) {
          // If the token is not valid, show an error message
          res.render('error', { message: 'Invalid or expired token' });
          console.log('invalid token!')
        } else {
          const user_id = results[0].user_id;
          const hashed_password = await bcrypt.hash(password, 10);
          const querys = 'UPDATE users SET password = ? WHERE id = ?';
          await query(querys, [hashed_password, user_id]);
   
          // Delete the password reset token from the database
          const deleteToken = 'DELETE FROM password_reset_tokens WHERE token = ?';
          await query(deleteToken, [token]);
          // Show a success message
          res.render('login', { success: 'Your password has been reset successfully' });
        }
      }
    } catch(err) {
      console.log(err);
      res.status(500).send("Oops! Something went wrong on our end. We apologize for the inconvenience. Please try again later or contact support if the issue persists.");
    }
  });
  

router.get('/password_reset', (req, res) => {
    res.render('password_reset', { error: req.flash('error'), success: req.flash('success') });
  });

router.post('/password_reset', async(req, res) => {

    const email = req.body.username;
    console.log(email)
   
    try{
       // Check whether the email address corresponds to a valid user
      const querys = 'SELECT * FROM users WHERE username = ?'
      const results = await  query(querys, [email]);
        
      if (results.length === 0) {
        // If the email address is not valid, show an error message
        res.render('password_reset', { error: 'Invalid email address' });
      } else {
        // If the email address is valid, generate a unique token
        const token = crypto.randomBytes(16).toString('hex');
  
        // Store the token in the database along with the user's ID and an expiration time
        const userId = results[0].id;
        const expiresAt = moment.utc(Date.now() + 600000).tz('Europe/Zurich').format('YYYY-MM-DD HH:mm:ss'); // 10 minutes from now
        const insertToken = 'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)';
        await query(insertToken, [userId, token, expiresAt]);


        // If the token was successfully stored, send an email to the user's email address containing a link to the password reset page
        const resetLink = `${req.protocol}://${req.get('host')}/accountsettings/password_reset/${token}`;
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD
          }
  
        });
        const mailOptions = {
          from: process.env.EMAIL,
          to: email,
          subject: 'Reset your password',
          html: `Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 10 minutes.`
        };
        await transporter.sendMail(mailOptions);
        // If the email was successfully sent, show a success message
        res.render('password_reset', { success: 'An email has been sent with instructions on how to reset your password' });
      }
  
    } catch(err){
      console.log(err);
      res.status(500).send("Oops! Something went wrong on our end. We apologize for the inconvenience. Please try again later or contact support if the issue persists.");
    }
  });


  







module.exports = router;