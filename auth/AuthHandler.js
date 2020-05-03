const User = require('../db/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs-then');
const VerifyToken = require('../auth/VerifyToken');
const HTTPError = require('../common/HTTPError');

/*
 * Functions
 */

module.exports.login = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  return await login(JSON.parse(event.body))
    .then(session => ({
      statusCode: 200,
      body: JSON.stringify(session)
    }))
    .catch(err => ({
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ message: err.message })
    }));
};

module.exports.register = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  return await register(JSON.parse(event.body))
    .then(session => ({
      statusCode: 200,
      body: JSON.stringify(session)
    }))
    .catch(err => ({
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ message: err.message })
    }));
};

module.exports.getInfo = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const token = event.headers.Authorization;
  const decoded = VerifyToken.decodeJwt(token);
  if (!decoded) // token empty or invalid
    return {
      statusCode: 403,
      body: JSON.stringify({ message: 'Forbidden: missing or invalid JWT.'  })
    };

  return await getInfo(decoded.id)
    .then(resp => ({
      statusCode: 200,
      body: JSON.stringify(resp)
    }))
    .catch(err => ({
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ message: err.message })
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
    return Promise.reject(HTTPError(400, 'Password error. Password needs to be at least 8 characters.'));
  }

  if (
    !(eventBody.username &&
      eventBody.username.length > 5 &&
      typeof eventBody.username === 'string')
  ) return Promise.reject(HTTPError(400, 'Username error. Username needs to be longer than 5 characters'));

  if (
    !(eventBody.email &&
      typeof eventBody.email === 'string')
  ) return Promise.reject(HTTPError(400, 'Email error. Email must have valid characters.'));

  return Promise.resolve();
}

function register(eventBody) {
  return checkIfInputIsValid(eventBody) // validate input
    .then(() =>
      User.findByEmail(eventBody.email) // check if user exists
    )
    .then(user =>
      user
        ? Promise.reject(HTTPError(409, 'User with that email exists.'))
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
        ? Promise.reject(HTTPError(403, 'User with that email does not exist.'))
        : comparePassword(eventBody.password, user.password, user.user_id)
    )
    .then(token => ({ auth: true, token: token }));
}

function comparePassword(eventPassword, userPassword, userId) {
  return bcrypt.compare(eventPassword, userPassword)
    .then(passwordIsValid => {
      console.log(passwordIsValid)
      return !passwordIsValid
        ? Promise.reject(HTTPError(403, 'The credentials do not match.'))
        : signToken(userId)
    });
}

function getInfo(user_id) {
  return User.getUserDetails(user_id)
    .then(details => {
      console.log(details);
      return details;
    })
}
