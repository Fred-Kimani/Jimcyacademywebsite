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




app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', require('./routes/user.js'))

// Configure Passport.js
initializePassport(passport);

app.use(flash());

app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
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

 // Login
app.post("/login", (req, res, next) => {
  passport.authenticate("user-local", (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.redirect("/login");

    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.redirect("/adminhome");
    });
  })(req, res, next);
});

 //register
 app.get("/register", forwardAuthenticated, (req, res) =>{
  let errors = [];
  let message = [];
 
  res.render("register", {errors, message})
 }
);


app.post("/register", async (req, res) => {
  const { username, password, confirm_password } = req.body;
  let errors = [];
  let message = [];

  if (!username  || !password || !confirm_password) {
    errors.push({ msg: "Please enter all fields" });
  }

  if (password != confirm_password) {
    errors.push({ msg: "Passwords do not match" });
  }

  if (password.length < 6) {
    errors.push({ msg: "Password must be at least 6 characters" });
  }

  if (errors.length > 0) {
    res.render("register", {
      errors,
      message,
      username,
      password,
      confirm_password,
    });
  } else {
    const name = username;
    const querys = 'SELECT * FROM users WHERE username = ?';
    try {
      const [result] = await query(querys, [name]);
      if (result && result.length > 0) {
        errors.push({ msg: "Username already exists" });
        res.render("register", {
          errors,
          message,
          username,
          password,
          confirm_password,
        });
      } else {
        const hash = await bcrypt.hash(password, 10);
        const insertQuery = "INSERT INTO users (username, password) VALUES (?, ?)";
        await query(insertQuery, [username, hash]);
        req.flash("success_msg", "You are now registered and can log in");
        res.redirect("/login");
      }
    } catch (err) {
      console.log(err);
      res.redirect("/register");
    }
  }
});



// Home page
app.get('/adminhome',ensureAuthenticated, async (req, res) => {
  try {
    const querys = 'SELECT * FROM about';
    const [about ]= await query(querys);
    res.render('home', { about:about });

  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/adminabout',ensureAuthenticated, async(req, res)=>{

  try{
    const querys =  "SELECT * FROM informationCards";
    const card = await query(querys);
    res.render('about', {card})
  }
  catch (err) {
    console.log(err)
    res.status(500).send('Internal Server Error');

  }
});

app.get('/admincontacts',ensureAuthenticated,async(req, res)=>{

  try{
    const querys =  "SELECT * FROM ContactDetails"
    const contact = await query(querys);
    res.render('contacts', {contact})
  }
  catch (err) {
    console.log(err)
    res.status(500).send('Internal Server Error');

  }
});
 
app.get('/edithome/:id', ensureAuthenticated, upload,async(req,res,next)=>{
  var id = req.params.id;
  try{
    const querys =  "SELECT * FROM about WHERE id= ?"
    const [about]= await query(querys, [id]);
    res.render('edithome', {about:about})

  } catch (err){
    console.log(err)
    res.status(500).send('Internal Server Error');
  }
  
});

app.get('/editcontacts/:id', ensureAuthenticated, async(req,res)=>{
  var id = req.params.id;

  try{
    const querys = "SELECT * FROM ContactDetails WHERE id= ?"
    const [contact] = await query(querys, [id]);
    res.render('editcontacts', {contact:contact})


  } catch (err){
    console.log(err)
    res.status(500).send('Internal Server Error');

  }
})

app.get('/editabout/:id' , upload, ensureAuthenticated, async(req,res)=>{
  try{
    var id = req.params.id;
    const querys =  "SELECT * FROM informationCards WHERE id= ?";
    const [card] = await query(querys, [id]);
    res.render('editabout', {card:card})
    

  } catch (err){
    console.log(err)
    res.status(500).send('Internal Server Error');
  }

})

app.post('/updatehome/:id', upload, ensureAuthenticated,  async(req, res) => {
  const { heading, body } = req.body;
  const id = req.params.id;
  let newImage = req.body.image || req.body.old_image; // set to about.image if req.body.image is undefined

  // If a new file is selected on the filepicker..
  if (req.file) {
    // The variable is assigned to the selected image
    newImage = req.file.filename;

    if (req.body.old_image) {
      try {
        // Removing the previous image
        fs.unlinkSync("./images/" + req.body.old_image);
      } catch (err) {
        console.log(err);
      }
    }
  }

  try {
    const querys = 'UPDATE about SET heading=?, body=?, image=? WHERE id=?';
    await query(querys, [heading, body, newImage, id]);
    req.session.message = {
      type: "success",
      message: "Home page updated successfully!",
    };
    res.redirect('/adminhome');
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
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
    } else {
      //same old image variable assigned to new image variable if image is not updated
      newImage = req.body.image;
    }

    try{
      const querys = 'UPDATE informationCards SET heading = ?, body=?, image= ? WHERE id=?';
      await query(querys, [heading,body,newImage,id]);
      req.session.message = {
        type: "success",
        message: "Updated successfully!",
      };
      res.redirect('/adminabout');

    } catch(err){
      console.log(err)
      res.status(500).send('Internal Server Error');

    }
});

app.post('/updatecontacts/:id',ensureAuthenticated, async(req,res)=>{
  const {details, preference} = req.body;
  var id = req.params.id;

  try{
    const querys = 'UPDATE ContactDetails SET preference = ?, details=? WHERE id=?';
    await query(querys, [preference, details,id]);
    req.session.message = {
      type: "success",
      message: "Contact details updated successfully!",
    };
    res.redirect('/admincontacts');

  } catch(err){
    console.log(err)
    res.status(500).send('Internal Server Error');
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
    res.status(500).send('Internal Server Error');
  }
});


app.get('/add-about', ensureAuthenticated, async(req,res)=>{

  res.render('addinfocard')

});

app.post('/addabout', upload, ensureAuthenticated, async(req,res)=>{
  const heading = req.body.heading;
  const image = req.file.filename;
  const body = req.body.body;

  try{
    const querys = 'INSERT INTO  informationCards (heading, body, image) VALUES (?,?,?)';
    await query(querys, [heading,body,image])
    req.session.message = {
      type: "success",
      message: "Added successfully!",
    };

    res.redirect('/adminabout');


  } catch(err){
    console.log(err)
    res.status(500).send('Internal Server Error');
  }
})

app.get('/register',forwardAuthenticated, async(req,res)=>{
  let errors = [];
  let message = [];
  res.render('register', {errors, message})

});



app.listen(process.env.PORT, ()=> console.log('Express app is running......'));
