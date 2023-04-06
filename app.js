const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
//const pool = require('./database').pool;
const mysql = require('promise-mysql');
var cons = require('consolidate');
const path = require('path');
const ejs = require('ejs');
const multer = require('multer');
const fs = require('fs');
const query = require('./config/database');
const passport = require("passport");
const session = require('express-session');
const initializePassport = require("./config/passport");
const flash = require('connect-flash') 
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');




app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  //cookie: { secure: true, maxAge: 60000 }
}));

app.use((req, res, next) => {
  res.locals.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  next();
});

app.use(passport.initialize());
app.use(passport.session());

app.use('/', require('./routes/user.js'));
app.use('/accountsettings', require('./routes/accountsettings'));

// Configure Passport.js
initializePassport(passport);

app.use(flash());

app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: "Oops! Something went wrong on our end. We apologize for the inconvenience. Please try again later or contact support if the issue persists." });
});




app.use(express.static('images'));
app.use(express.static('public'));
const {ensureAuthenticated, forwardAuthenticated} = require('./config/auth')

/*app.set('views', path.join(__dirname, 'public/html'));
app.set('view engine', 'html');*/
app.set('view engine', 'ejs');



dotenv.config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));




  var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./images");
    },
    filename: (req, file, cb) => {
      cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    },
  });
  var upload = multer({
    storage: storage,
  }).single("image");

  //Login
 app.get("/login", forwardAuthenticated, (req, res) => {
  let error = [];
  res.render("login", {error})

 });

 function generateRandomPassword() {
  const passwordLength = 12;
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
  let password = '';

  for (let i = 0; i < passwordLength; i++) {
    password += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return password;
}



 // Login
 app.post("/login", (req, res, next) => {
  passport.authenticate("user-local", (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.render("login", { error: info.error });

    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.redirect("/adminhome");
    });
  })(req, res, next);
});



app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      res.sendStatus(500);
      return ({ error: "Oops! Something went wrong on our end. We apologize for the inconvenience. Please try again later or contact support if the issue persists."});
    } else {
      res.render("login", { success: "You are successfully logged out" });
    }
  });
});







app.get('/users',ensureAuthenticated, async(req,res)=>{
  const user = req.user;
  const successMsg = req.flash('successMsg');
  res.render('createuser', {user,  successMsg });
});

app.post('/users', ensureAuthenticated, async(req, res) => {
  let errors = [];

  const newUser = {
    username: req.body.username,
  };

  if (!req.body.username) {
    errors.push({ msg: "Please enter a username" });
  }
  // Generate a random password for the new user
  const newPassword = generateRandomPassword();

  // Save the new user and their password to your database

   
    const name = req.body.username;
    const querys = 'SELECT * FROM users WHERE username = ?';
    try {
      const [result] = await query(querys, [name]);
      if (result && result.username === name) {
        errors.push({ msg: "Username already exists" });
        res.render("createuser", {
          errors,
          message,
          username,
        });
      } else {
        const querys = 'INSERT INTO users (username, password) VALUES (?, ?)';
        const hash = await bcrypt.hash(newPassword, 10);

        await query(querys, [newUser.username, hash])
          .then(async (result) => {
            console.log('New user created successfully');
            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD
              }
            });
            const mailOptions = {
              from: process.env.EMAIL,
              to: req.body.username,
              subject: 'Your new account credentials',
              text: `Your username is ${newUser.username} and your password is ${newPassword}. Please keep these credentials safe and do not share them with anyone.`
            };
      
            await transporter.sendMail(mailOptions);
            console.log('Email sent to new user with credentials');
      
            res.status(201).redirect('/adminhome');
          })
          .catch((error) => {
            res.status(500).send("Oops! Something went wrong on our end. We apologize for the inconvenience. Please try again later or contact support if the issue persists.");
          });
      }
    } catch (err) {
      res.redirect("/users");
      return ({ error: 'An error occurred while processing your request. Please try again later.' });
    }
  });


/////////////// Admin routes

// Home page
app.get('/adminhome',ensureAuthenticated, async (req, res) => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  const user = req.user;
  const successMsg = req.flash('successMsg');
  try {
    const aboutQuery = 'SELECT * FROM about';
    const introQuery = 'SELECT * from introduction';
    const locationDetails = 'SELECT location FROM schoolDetails';
    const [location ]= await query(locationDetails);
    const [about ]= await query(aboutQuery);
    const [introduction] = await query(introQuery);
    res.locals.googleMapsApiKey = googleMapsApiKey;
    const updateSuccess = req.session.updateSuccess;
    req.session.updateSuccess = null;
    res.render('home', { about:about, location: location.location , success: updateSuccess, introduction:introduction, user, successMsg });

  } catch (err) {
    console.error(err);
    res.status(500).send("Oops! Something went wrong on our end. We apologize for the inconvenience. Please try again later or contact support if the issue persists.");
  }
});

app.get('/adminabout',ensureAuthenticated, async(req, res)=>{
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  const user = req.user;
  const successMsg = req.flash('successMsg');
  try{
    const locationDetails = 'SELECT location FROM schoolDetails';
    const [location ]= await query(locationDetails);
    const querys =  "SELECT * FROM informationCards";
    const card = await query(querys);
    res.locals.googleMapsApiKey = googleMapsApiKey;
    res.render('about', {card, location: location.location, user, successMsg })
  }
  catch (err) {
    console.log(err)
    res.status(500).send("Oops! Something went wrong on our end. We apologize for the inconvenience. Please try again later or contact support if the issue persists.");

  }
});

app.get('/admincontacts',ensureAuthenticated,async(req, res)=>{
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  const user = req.user;
  res.locals.googleMapsApiKey = googleMapsApiKey;
  const successMsg = req.flash('successMsg');
  try{
    const locationDetails = 'SELECT location FROM schoolDetails';
    const [location ]= await query(locationDetails);
    const querys =  "SELECT * FROM ContactDetails"
    const contact = await query(querys);
    res.locals.googleMapsApiKey = googleMapsApiKey;
    res.render('contacts', {contact, location: location.location, user, successMsg })
  }
  catch (err) {
    console.log(err)
    res.status(500).send("Oops! Something went wrong on our end. We apologize for the inconvenience. Please try again later or contact support if the issue persists.");

  }
});

app.get('/manage-users', ensureAuthenticated, async (req, res) => {
  const currentUserId = req.user.id;
  const successMsg = req.flash('successMsg');
  const user = req.user;
  const querys = `SELECT * FROM users WHERE id != ${currentUserId}`;
  const users = await query(querys);
  res.render('users', { users: users, user, successMsg });
});


app.post('/delete-user/:id',ensureAuthenticated, async(req, res)=>{

  try{
    const id = req.params.id;
    const querys = 'DELETE FROM users where id=?'
    await query(querys,[id]);
    req.flash('successMsg', 'User deleted successfully!');
    res.redirect('/manage-users')
  } catch (err) {
    console.log(err)
    res.status(500).send("Oops! Something went wrong on our end. We apologize for the inconvenience. Please try again later or contact support if the issue persists.");
  }
});

//////////end of admin routes

 
app.get('/edithome/:id', ensureAuthenticated, upload,async(req,res,next)=>{
  var id = req.params.id;
  const user = req.user;
  
  try{
    const querys =  "SELECT * FROM about WHERE id= ?";
    const [about]= await query(querys, [id]);
    res.render('edithome', {about:about, user})

  } catch (err){
    console.log(err)
    res.status(500).send("Oops! Something went wrong on our end. We apologize for the inconvenience. Please try again later or contact support if the issue persists.");
  }
  
});

app.get('/editintroduction/:id', ensureAuthenticated, upload, async(req, res, next)=>{
  var id = req.params.id;
  const user = req.user;
  try{
    const querys =  "SELECT * FROM introduction WHERE id= ?";
    const [introduction]= await query(querys, [id]);
    res.render('editintro', {introduction:introduction, user});


  } catch(err){
    res.status(500).send("Oops! Something went wrong on our end. We apologize for the inconvenience. Please try again later or contact support if the issue persists.");

  }
});

app.get('/editcontacts/:id', ensureAuthenticated, async(req,res)=>{
  var id = req.params.id;
  const user = req.user;

  try{
    const querys = "SELECT * FROM ContactDetails WHERE id= ?"
    const [contact] = await query(querys, [id]);
    res.render('editcontacts', {contact:contact, user})


  } catch (err){
    console.log(err)
    res.status(500).send("Oops! Something went wrong on our end. We apologize for the inconvenience. Please try again later or contact support if the issue persists.");

  }
})

app.get('/editabout/:id' , upload, ensureAuthenticated, async(req,res)=>{
  try{
    var id = req.params.id;
    const user = req.user;
    const querys =  "SELECT * FROM informationCards WHERE id= ?";
    const [card] = await query(querys, [id]);
    res.render('editabout', {card:card, user})
    

  } catch (err){
    console.log(err)
    res.status(500).send("Oops! Something went wrong on our end. We apologize for the inconvenience. Please try again later or contact support if the issue persists.");
  }

})

app.post('/updatehome/:id', upload, ensureAuthenticated,  async(req, res) => {
  const { heading, body } = req.body;
  const id = req.params.id;
  let newImage = req.body.image || req.body.old_image; // set to about.image if req.body.image is undefined

  // If a new file is selected on the filepicker..
  if (req.file) {
    //the variable is assigned to the selected image
    newImage = req.file.filename;

    if(req.body.old_image){
      try {
        //removing the previous image
        fs.unlinkSync("./images/" + req.body.old_image);
      } catch (err) {
        console.log(err);
      }

    }
    /*else {
      //same old image variable assigned to new image variable if image is not updated
      newImage = req.body.image;
    }*/
  } 

  try {
    const querys = 'UPDATE about SET heading=?, body=?, image=? WHERE id=?';
    await query(querys, [heading, body, newImage, id]);
    req.flash('successMsg', 'Information updated successfully!');

    // Redirect to the desired page
    res.redirect('/adminhome');
  } catch (err) {
    console.log(err);
    res.status(500).send("Oops! Something went wrong on our end. We apologize for the inconvenience. Please try again later or contact support if the issue persists.");
  }
});

app.post('/updateintroduction/:id',  ensureAuthenticated,  async(req, res) => {
  const { heading, body } = req.body;
  const id = req.params.id;


  try {
    const querys = 'UPDATE introduction SET heading=?, body=? WHERE id=?';
    await query(querys, [heading, body, id]);
    res.redirect('/adminhome');
  } catch (err) {
    console.log(err);
    res.status(500).send("Oops! Something went wrong on our end. We apologize for the inconvenience. Please try again later or contact support if the issue persists.");
  }
});




app.post('/updateabout/:id', upload, ensureAuthenticated, async(req,res)=>{
  const {heading, body} = req.body;
  const id = req.params.id;
  let newImage = req.body.image || req.body.old_image; // set to about.image if req.body.image is undefined

    //if a new file is selected on the filepicker..
    if (req.file) {
      //the variable is assigned to the selected image
      newImage = req.file.filename;

      if(req.body.old_image){
        try {
          //removing the previous image
          fs.unlinkSync("./images/" + req.body.old_image);
        } catch (err) {
          console.log(err);
        }

      }
      /*else {
        //same old image variable assigned to new image variable if image is not updated
        newImage = req.body.image;
      }*/
    } 

    try{
      const querys = 'UPDATE informationCards SET heading = ?, body=?, image= ? WHERE id=?';
      await query(querys, [heading,body,newImage,id]);
      req.flash('successMsg', 'Information updated successfully!');

      
    res.redirect('/adminabout');
    } catch(err){
      console.log(err)
      res.status(500).send("Oops! Something went wrong on our end. We apologize for the inconvenience. Please try again later or contact support if the issue persists.");

    }
});

app.post('/updatecontacts/:id', upload, ensureAuthenticated, async (req, res) => {
  const { details, preference } = req.body;
  const id = req.params.id;
  console.log(req.file)

  // Check if a new image was uploaded
  let newImage;
  if (req.file) {
    newImage = req.file.filename;
  } else {
    newImage = req.body.old_image;
  }

  try {
    // Update the contact details in the database
    const querys = 'UPDATE ContactDetails SET preference = ?, details = ?, image = ? WHERE id = ?';
    await query(querys, [preference, details, newImage, id]);

    // Delete the old image file if a new image was uploaded
    if (req.file && req.body.old_image) {
      fs.unlinkSync(`./images/${req.body.old_image}`);
    }



    res.redirect('/admincontacts');
  } catch (err) {
    console.log(err);
    res.status(500).send("Oops! Something went wrong on our end. We apologize for the inconvenience. Please try again later or contact support if the issue persists.");
  }
});


app.delete('/deleteabout/:id',ensureAuthenticated, async (req, res) => {
  var id = req.params.id;

  try {
    const querys = 'DELETE FROM informationCards WHERE id=?';
    await query(querys, [id]);
    
    res.status(200).send('Successfully deleted item.');
  } catch (err) {
    console.log(err)
    res.status(500).send("Oops! Something went wrong on our end. We apologize for the inconvenience. Please try again later or contact support if the issue persists.");
  }
});


app.get('/add-about', ensureAuthenticated, async(req,res)=>{
  const user = req.user;


  res.render('addinfocard', {user})

});

app.post('/addabout', upload, ensureAuthenticated, async(req,res)=>{
  const heading = req.body.heading;
  const image = req.file.filename;
  const body = req.body.body;

  try{
    const querys = 'INSERT INTO  informationCards (heading, body, image) VALUES (?,?,?)';
    await query(querys, [heading,body,image])

    req.flash('successMsg', 'Information posted successfully');
    res.redirect('/adminabout');


  } catch(err){
    console.log(err)
    res.status(500).send("Oops! Something went wrong on our end. We apologize for the inconvenience. Please try again later or contact support if the issue persists.");
  }
});



app.post('/contactus', async (req, res) => {
  const { name, contact, message } = req.body;

  try {
    const querys = 'INSERT INTO messages (name, contact, message) VALUES (?, ?, ?)';
    await query(querys, [name, contact, message]);
    req.flash('successMsg', 'Message sent successfully');
    res.render('contacts');
  } catch (err) {
    req.flash('errorMsg', 'Error sending message');
    res.render('contacts');
  }
});


app.get('/contact-messages',ensureAuthenticated ,async (req, res) => {
  try {
    const successMsg = req.flash('successMsg');
    const user = req.user;
    const querys = 'SELECT * FROM messages';
    const messages = await query(querys);

    res.render('contact-messages.ejs', { messages, user, successMsg });
  } catch (err) {
    console.log(err);
    res.status(500).send("Oops! Something went wrong on our end. We apologize for the inconvenience. Please try again later or contact support if the issue persists.");
  }
});

app.post('/delete-message/:id', ensureAuthenticated, async(req, res) => {

  try{
  const id = req.params.id;
  const deleteQuery = 'DELETE FROM messages WHERE id=?';
  await query(deleteQuery , [id]);
  req.flash('successMsg', 'Message deleted!');

  res.redirect('/contact-messages')

  }catch(err){
    console.log(err);
    res.status(500).send("Oops! Something went wrong on our end. We apologize for the inconvenience. Please try again later or contact support if the issue persists.");

  }
});






app.listen(process.env.PORT, ()=> console.log('Express app is running......'));
