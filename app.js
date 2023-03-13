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
 
app.get('/edithome/:id', async(req,res)=>{
  var id = req.params.id;
  const query =  "SELECT * FROM about WHERE id= ?"
  connection.query(query,[id], (err, about) =>{
    if(err){
      throw err;
    }
    res.render('edithome', {about})
  
  })
  
})

app.get('/editcontacts/:id', async(req,res)=>{
  var id = req.params.id;
  const query =  "SELECT * FROM ContactDetails WHERE id= ?"

  connection.query(query, [id], (err, contact) =>{
    if(err){
      throw err;
    }
    res.render('editcontacts', {contact})
    
  })
})

app.get('/editabout/:id', async(req,res)=>{
  const query =  "SELECT * FROM informationCards WHERE id= ?"
  var id = req.params.id;
  connection.query(query,[id], (err, card) =>{
    if(err){
      throw err;
    }
    res.render('editabout', {card})
    
  })
})

app.post('updatehome/:id', async(req,res)=>{
  const query= 'UPDATE about SET heading = ?, body=? WHERE id=?'
  var id = req.params.id;
  connection.query(query, [id], (error)=>{
    res.redirect('home');

  })


})

app.post('updateabout/:id', async(req,res)=>{
  const query = 'UPDATE informationCards SET heading = ?, body=? WHERE id=?'
  var id = req.params.id;
  connection.query(query, [id], (error)=>{
    res.redirect('about');

  })


})

app.post('updatecontacts/:id', async(req,res)=>{
  const query = 'UPDATE ContactDetails SET preference = ?, details=? WHERE id=?'
  var id = req.params.id;
  connection.query(query, [id], (error)=>{
    res.redirect('contacts');

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
