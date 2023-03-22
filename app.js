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

app.use(express.static('images'));
app.use(express.static('public'));

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


// Home page
app.get('/', async (req, res) => {
  try {
    const querys = 'SELECT * FROM about';
    const [about ]= await query(querys);
    res.render('home', { about:about });

  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/about', async(req, res)=>{

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

app.get('/contacts', async(req, res)=>{

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
 
app.get('/edithome/:id', upload,async(req,res,next)=>{
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

app.get('/editcontacts/:id', async(req,res)=>{
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

app.get('/editabout/:id' , upload,  async(req,res)=>{
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

app.post('/updatehome/:id', upload, async(req, res) => {
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
    res.redirect('/');
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
});




app.post('/updateabout/:id', upload, async(req,res)=>{
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
      new_image = req.body.image;
    }

    try{
      const querys = 'UPDATE informationCards SET heading = ?, body=?, image= ? WHERE id=?';
      await query(querys, [heading,body,newImage,id]);
      res.redirect('/about');

    } catch(err){
      console.log(err)
      res.status(500).send('Internal Server Error');

    }
});

app.post('/updatecontacts/:id', async(req,res)=>{
  const {details, preference} = req.body;
  var id = req.params.id;

  try{
    const querys = 'UPDATE ContactDetails SET preference = ?, details=? WHERE id=?';
    await query(querys, [preference, details,id]);
    res.redirect('/contacts');

  } catch(err){
    console.log(err)
    res.status(500).send('Internal Server Error');
  }
});

app.delete('/deleteabout/:id', async(req,res)=>{
  var id = req.params.id;

  try{
    const querys = 'DELETE FROM informationCards WHERE id=?';
    await query(querys, [id]);


  } catch(err){
    console.log(err)
    res.status(500).send('Internal Server Error'); 
  }
});

app.get('/add-about', async(req,res)=>{
  res.render('addinfocard')

});

app.post('/addabout', upload, async(req,res)=>{
  const heading = req.body.heading;
  const image = req.file.filename;
  const body = req.body.body;

  try{
    const querys = 'INSERT INTO  informationCards (heading, body, image) VALUES (?,?,?)';
    await query(querys, [heading,body,image])

    res.redirect('/about');


  } catch(err){
    console.log(err)
    res.status(500).send('Internal Server Error');
  }
})

app.get('/register', async(req,res)=>{
  res.render('register')

});


//create
app.post('/insert', (req, res)=>{
});

//read
app.get('/getAll', async(req, res)=>{
    console.log("This is a test get api....and it's working :-)");
});





//update


//delete

app.listen(process.env.PORT, ()=> console.log('Express app is running......'));
