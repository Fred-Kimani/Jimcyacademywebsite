/*const mysql = require('mysql');
const dotenv = require('dotenv');

var config = {
    user: process.env.USERNAME,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
};

// Later on when running from Google Cloud, env variables will be passed in container cloud connection config
  console.log('Running from cloud. Connecting to DB through GCP socket.');
  config.socketPath = `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`;

let connection = mysql.createConnection(config);

connection.connect(function(err) {
  if (err) {
    console.error('Error connecting: ' + err.stack);
    return;
  }
  console.log('Connected as thread id: ' + connection.threadId);
});

module.exports = connection; */
'use strict';
// [START cloud_sql_mysql_mysql_connect_unix]
const mysql = require('mysql');

// pool initializes a Unix socket connection pool for
// a Cloud SQL instance of MySQL.
// [END cloud_sql_mysql_mysql_connect_unix]

var pool = mysql.createPool({
    user: process.env.USERNAME, 
    password: process.env.PASSWORD, 
    database: process.env.DATABASE,
    socketPath: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`
});

exports.pool = pool;