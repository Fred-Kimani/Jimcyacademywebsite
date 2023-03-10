const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
//const pool = require('./database').pool;
const mysql = require('promise-mysql');
var cons = require('consolidate');
const path = require('path');
const ejs = require('ejs');


app.engine('html', cons.swig);

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
    connectTimeout: 60000000,
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
  connection.query(query, (err, cards) =>{
    if(err){
      throw err;
    }
    res.render('about', {cards})
  })
    

});

app.get('/contacts', async(req, res)=>{
  const query =  "SELECT * FROM ContactDetails"
  connection.query(query, (err, contacts) =>{
    if(err){
      throw err;
    }
    res.render('contacts', {contacts})
  })
    

});
// Adding the cards on the home page


// Getting the cards on the home page

// Editing the cards on the home page

// Deleting the cards on the home page

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
