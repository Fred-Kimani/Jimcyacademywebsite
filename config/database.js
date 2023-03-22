const express = require('express');
const dotenv = require('dotenv');
//const pool = require('./database').pool;
const mysql = require('mysql2/promise');
dotenv.config();

const pool = mysql.createPool({
  user: process.env.USERNAME,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  host: process.env.HOST,
  port: process.env.DB_PORT,
  connectTimeout: 600000000,
});

module.exports = async function query(sql, values = []) {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.query(sql, values);
    return results;
  } catch (err) {
    throw err;
  } finally {
    connection.release();
  }
};

