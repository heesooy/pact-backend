const Client = require('serverless-mysql')

module.exports = connectToDatabase = () => {
  return Client({
    config: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB
    }
  });
};