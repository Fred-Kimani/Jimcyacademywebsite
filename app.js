const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
//const pool = require('./database').pool;
const mysql = require('promise-mysql');
var cons = require('consolidate');
const path = require('path');
const ejs = require('ejs');
const { query } = require('express');
const multer = require('multer');
const fs = require('fs');

app.use(express.static('images'));
app.use(express.static('public'));

/*app.set('views', path.join(__dirname, 'public/html'));
app.set('view engine', 'html');*/
app.set('view engine', 'ejs');



dotenv.config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));


async function connectToCloudSql() {
  const config = {
    user: process.env.USERNAME,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    host: process.env.HOST,
    port: process.env.DB_PORT,
    connectTimeout: 600000000,
  };
  const connection = await mysql.createConnection(config);
  return connection;
}

connectToCloudSql().then((connection) => {
  console.log('Connected to Cloud SQL.');


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
app.get('/', async(req, res)=>{
  const query =  "SELECT * FROM about"
  connection.query(query, (err, about) =>{
    if(err){
      throw err;
    }
    res.render('home', {about})
  })
    

});

app.get('/about', async(req, res)=>{
  const query =  "SELECT * FROM informationCards"
  connection.query(query, (err, card) =>{
    if(err){
      throw err;
    }
    res.render('about', {card})
  })
    

});

app.get('/contacts', async(req, res)=>{
  const query =  "SELECT * FROM ContactDetails"
  connection.query(query, (err, contact) =>{
    if(err){
      throw err;
    }
    res.render('contacts', {contact})
  })
    

});
 
app.get('/edithome/:id', upload,async(req,res)=>{
  var id = req.params.id;
  const query =  "SELECT * FROM about WHERE id= ?"
  connection.query(query,[id], (err, results, fields) =>{
    if(err){
      throw err;
    }
    const about = results[0];
    res.render('edithome', {about:about})
  
  })
  
})

app.get('/editcontacts/:id', async(req,res)=>{
  var id = req.params.id;
  const query =  "SELECT * FROM ContactDetails WHERE id= ?"

  connection.query(query, [id], (err, results, fields) =>{
    if(err){
      throw err;
    }
    const contact = results[0];
    res.render('editcontacts', {contact:contact})
    
  })
})

app.get('/editabout/:id' , upload,  async(req,res)=>{
  const query =  "SELECT * FROM informationCards WHERE id= ?"
  var id = req.params.id;
  connection.query(query,[id], (err, results, fields) =>{
    if(err){
      throw err;
    }
    const card = results[0];
    res.render('editabout', {card:card})
    
  })
})

app.post('/updatehome/:id',upload, async(req,res)=>{
  const {heading, body} = req.body;
  let new_image = "";
  var id = req.params.id;
    //if a new file is selected on the filepicker..
    if (req.file) {
      //the variable is assigned to the selected image
      new_image = req.file.filename;

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
  const query= 'UPDATE about SET heading = ?, body=?, image=? WHERE id=?'
  connection.query(query, [heading,body,new_image,id], (error,result)=>{
    res.redirect('/');
    //res.redirect('home');

  })


})

app.post('/updateabout/:id', upload, async(req,res)=>{
  const {heading, body} = req.body;
  let new_image = "";
  var id = req.params.id;

    //if a new file is selected on the filepicker..
    if (req.file) {
      //the variable is assigned to the selected image
      new_image = req.file.filename;
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
  const query = 'UPDATE informationCards SET heading = ?, body=?, image= ? WHERE id=?'
  connection.query(query, [heading,body,new_image,id], (error,result)=>{
    //res.redirect('about');
    res.redirect('/about');
  })


})

app.post('/updatecontacts/:id', async(req,res)=>{
  const {details, preference} = req.body;
  var id = req.params.id;
  const query = 'UPDATE ContactDetails SET preference = ?, details=? WHERE id=?'
  connection.query(query, [preference, details,id], (error,result)=>{
    res.redirect('/contacts');
  })


});

app.get('/add-about', async(req,res)=>{
  res.render('addinfocard')

});

app.post('/addabout', async(req,res)=>{
  const heading = req.body.heading;
  const image = req.file.filename;
  const body = req.body.body;
  const query = 'INSERT INTO  informationCards (heading, body, image) VALUES (?,?,?)';
  connection.query(query, [heading,body,image], (error,result,fields)=>{
    //res.redirect('about');
    res.redirect('/about');
  })


})

}).catch((err) => {
  console.error('Failed to connect to Cloud SQL: ' + err.message);
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
