const connectToDatabase = require('../db');
const uuid = require('uuid');

module.exports.create = async (user) => {
  client = connectToDatabase();
  user.user_id = uuid();
  await client.query('INSERT INTO User SET ?', user);
  client.quit();

  console.log(user);
  return user;
};

module.exports.findByEmail = async (email) => {
  client = connectToDatabase();
  let user = await client.query('SELECT * FROM User WHERE email = ?', email);
  if (user.length == 0) {
    return null;
  }

  console.log(user[0]);
  return user[0];
};

module.exports.findByUsername = async (username) => {
  client = connectToDatabase();
  let user = await client.query('SELECT * FROM User WHERE username = ?', [username]);
  if (user.length == 0) {
    return null;
  }
  return user[0];
};
