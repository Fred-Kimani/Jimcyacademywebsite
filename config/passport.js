const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

function SessionConstructor (userId, userGroup, details){
    this.userId= userId;
    this.userGroup = userGroup;
    this.details;
}

module.exports = function(passport) {
  passport.use('user-local', new LocalStrategy({usernameField:'username'}, (username, password, done) => {
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
      const query = 'SELECT * FROM users WHERE name = ?';
      connection.query(query, [username], (err, rows) => {
        if (err) throw err;
        if (!rows.length) {
          return done(null, false, { message: 'This email is unregistered' });
        }
        const user = rows[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: 'Password Incorrect' });
          }
        });
      });
    });
  }));
};