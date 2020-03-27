const connectToDatabase = require('../db');
const uuid = require('uuid');

module.exports.create = async (user) => {
  client = connectToDatabase();
  user.user_id = uuid();
  await client.query('INSERT INTO User SET ?', user);
  client.quit();

  return user;
};

module.exports.findByEmail = async (email) => {
  client = connectToDatabase();
  let user = await client.query('SELECT * FROM User WHERE email = ?', [email]);
  if (user.length == 0) {
    return null;
  }

  return user[0];
};
