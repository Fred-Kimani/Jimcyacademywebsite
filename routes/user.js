const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const query = require('../config/database');
const passport = require("passport");
const session = require('express-session');
const initializePassport = require("../config/passport");
const flash = require('connect-flash') 

dotenv.config();

// Home page
router.get('/', async (req, res) => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    try {
      const locationDetails = 'SELECT location FROM schoolDetails';
      const [location ]= await query(locationDetails);
      const querys = 'SELECT * FROM about';
      const [about ]= await query(querys);
      res.locals.googleMapsApiKey = googleMapsApiKey;
      res.render('userhome', { about:about, location: location.location });
  
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  });
  
  router.get('/about', async(req, res)=>{
    const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  
    try{
      const locationDetails = 'SELECT location FROM schoolDetails';
      const [location ]= await query(locationDetails);
      const querys =  "SELECT * FROM informationCards";
      const card = await query(querys);
      res.locals.googleMapsApiKey = googleMapsApiKey;
      res.render('userabout', {card, location: location.location })
    }
    catch (err) {
      console.log(err)
      res.status(500).send('Internal Server Error');
  
    }
  });
  
  router.get('/contacts', async(req, res)=>{
    const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  
    try{
      const locationDetails = 'SELECT location FROM schoolDetails';
      const [location ]= await query(locationDetails);

      const querys =  "SELECT * FROM ContactDetails"
      const contact = await query(querys);
      res.locals.googleMapsApiKey = googleMapsApiKey;
      res.render('usercontacts', {contact, location: location.location })
    }
    catch (err) {
      console.log(err)
      res.status(500).send('Internal Server Error');
  
    }
  });

  router.get('/settings', (req, res)=>{
    res.render('settings')
  });

  module.exports = router;