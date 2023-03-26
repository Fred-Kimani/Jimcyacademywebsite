const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const query = require('../config/database');
const passport = require("passport");
const session = require('express-session');
const initializePassport = require("../config/passport");
const flash = require('connect-flash') 

// Home page
router.get('/', async (req, res) => {
    try {
      const querys = 'SELECT * FROM about';
      const [about ]= await query(querys);
      res.render('userhome', { about:about });
  
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  });
  
  router.get('/about', async(req, res)=>{
  
    try{
      const querys =  "SELECT * FROM informationCards";
      const card = await query(querys);
      res.render('userabout', {card})
    }
    catch (err) {
      console.log(err)
      res.status(500).send('Internal Server Error');
  
    }
  });
  
  router.get('/contacts', async(req, res)=>{
  
    try{
      const querys =  "SELECT * FROM ContactDetails"
      const contact = await query(querys);
      res.render('usercontacts', {contact})
    }
    catch (err) {
      console.log(err)
      res.status(500).send('Internal Server Error');
  
    }
  });

  module.exports = router;