const User = require('../db/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs-then');

/* 
 * Functions
 */

module.exports.login = (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  return login(JSON.parse(event.body))
    .then(session => ({
      statusCode: 200,
      body: JSON.stringify(session)
    }))
    .catch(err => ({
      statusCode: err.statusCode || 500,
      headers: { 'Content-Type': 'text/plain' },
      body: { stack: err.stack, message: err.message }
    }));
};

module.exports.register = (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  return register(JSON.parse(event.body))
    .then(session => ({
      statusCode: 200,
      body: JSON.stringify(session)
    }))
    .catch(err => ({
      statusCode: err.statusCode || 500,
      headers: { 'Content-Type': 'text/plain' },
      body: err.message
    }));
};

/**
 * Helpers
 */

function signToken(id) {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: 86400 // expires in 24 hours
  });
}

function checkIfInputIsValid(eventBody) {
  if (
    !(eventBody.password &&
      eventBody.password.length >= 8)
  ) {
    return Promise.reject(new Error('Password error. Password needs to be at least 8 characters.'));
  }

  if (
    !(eventBody.username &&
      eventBody.username.length > 5 &&
      typeof eventBody.username === 'string')
  ) return Promise.reject(new Error('Username error. Username needs to be longer than 5 characters'));

  if (
    !(eventBody.email &&
      typeof eventBody.email === 'string')
  ) return Promise.reject(new Error('Email error. Email must have valid characters.'));

  return Promise.resolve();
}

function register(eventBody) {
  return checkIfInputIsValid(eventBody) // validate input
    .then(() =>
      User.findByEmail({ email: eventBody.email }) // check if user exists
    )
    .then(user =>
      user
        ? Promise.reject(new Error('User with that email exists.'))
        : bcrypt.hash(eventBody.password, 8) // hash the pass
    )
    .then(hash =>
      User.create({ firstname: eventBody.firstname, lastname: eventBody.lastname, username: eventBody.username, email: eventBody.email, password: hash, location: eventBody.location }) // create the new user
    )
    .then(user => ({ auth: true, token: signToken(user.user_id) })); // sign the token and send it back
}

function login(eventBody) {
  return User.findByEmail(eventBody.email)
    .then(user =>
      !user
        ? Promise.reject(new Error('User with that email does not exits.'))
        : comparePassword(eventBody.password, user.password, user.user_id)
    )
    .then(token => ({ auth: true, token: token }));
}

function comparePassword(eventPassword, userPassword, userId) {
  return bcrypt.compare(eventPassword, userPassword)
    .then(passwordIsValid => {
      console.log(passwordIsValid)
      return !passwordIsValid
        ? Promise.reject(new Error('The credentials do not match.'))
        : signToken(userId)
    });
}