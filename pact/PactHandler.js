const Pact = require('../db/Pact');
const User = require('../db/User');
const VerifyToken = require('../auth/VerifyToken');
const HTTPError = require('../common/HTTPError');

module.exports.getPactInfo = (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const pact_id = event.headers.pact_id;
  return getPactInfo(pact_id)
    .then(session => ({
      statusCode: 200,
      body: JSON.stringify(session)
    }))
    .catch(err => ({
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ message: err.message })
    }));
};

module.exports.getUserPacts = (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const token = event.headers.Authorization;
  const decoded = VerifyToken.decodeJwt(token);
  if (!decoded) // token empty or invalid
    return {
      statusCode: 403,
      body: JSON.stringify({ message: 'Forbidden: missing or invalid JWT.'  })
    };
  return getUserPacts(decoded.id)
    .then(session => ({
      statusCode: 200,
      body: JSON.stringify(session)
    }))
    .catch(err => ({
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ message: err.message })
    }));
};

module.exports.createPact = (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  return createPact(JSON.parse(event.body))
    .then(session => ({
      statusCode: 200,
      body: JSON.stringify(session)
    }))
    .catch(err => ({
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ message: err.message })
    }));
};

module.exports.deletePact = (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  return deletePact(JSON.parse(event.body))
    .then(session => ({
      statusCode: 200,
      body: JSON.stringify(session)
    }))
    .catch(err => ({
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ message: err.message })
    }));
};

module.exports.updatePact = (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  return updatePact(JSON.parse(event.body))
    .then(session => ({
      statusCode: 200,
      body: JSON.stringify(session)
    }))
    .catch(err => ({
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ message: err.message })
    }));
};

function checkPactInput(eventBody) {
  if (!(eventBody.title && typeof eventBody.title === 'string')) {
    return Promise.reject(HTTPError(400, 'Title error. Title must have valid characters.'));
  } else if (!(eventBody.description && typeof eventBody.description === 'string')) {
    return Promise.reject(HTTPError(400, 'Description error. Description must have valid characters.'));
  } else if (!(eventBody.streak && typeof eventBody.streak === 'number')) {
    return Promise.reject(HTTPError(400, 'Streak error. Streak must be a number.'));
  } else if (!(eventBody.period_length && typeof eventBody.period_length === 'number')) {
    return Promise.reject(HTTPError(400, 'Period Length error. Period Length must be a number.'));
  } else if (!(eventBody.period_target && typeof eventBody.period_target === 'number')) {
    return Promise.reject(HTTPError(400, 'Period Target error. Period Target must be a number.'));
  } else if (!(eventBody.privacy_level && typeof eventBody.privacy_level === 'string')) {
    return Promise.reject(HTTPError(400, 'Privacy Level error. Privacy Level must have valid characters.'));
  } else if (!(eventBody.participants && eventBody.participants.length > 1)) {
    return Promise.reject(HTTPError(400, 'Participants error. Must have atleast 2 participants.'));
  }
  return Promise.resolve();
}

async function checkUsernameInput(eventBody) {
  for (let i = 0; i < eventBody.participants.length; i++) {
      let user = await User.findByUsername(eventBody.participants[i]);
      if (user == null)
        return false;
  }
  return true;
}

function checkPactExists(pact_id) {
  return Pact.findPact(pact_id).then((pact) => {
    if (pact == null)
      return Promise.reject(new Error('Pact error. Pact does not exist.'));
    return Promise.resolve();
  })
}

function checkUserExists(user_id) {
  return User.findByUserID(user_id).then((user) => {
    if (user == null)
      return Promise.reject(new Error('User error. User does not exist.'));
    return Promise.resolve();
  })
}

async function addPactParticipants(res, users) {
  let user_ids = [];
  for (let i = 0; i < users.length; i++) {
      user_ids.push((await User.findByUsername(users[i])).user_id);
  }
  await Pact.addPartcipantsToPact( { pact_id: res.pact_id, users: user_ids } );
  return res;
}

async function addPactParticipantInfo(pact_info) {
  let res = await Pact.getPactParticipants(pact_info.pact_id);
  let usernames = [];
  for (let i = 0; i < res.length; i++) {
    usernames.push((await User.findByUserID(res[i].user_id)).username);
  }
  pact_info.participants = usernames;
  return pact_info;
}

function getPactInfo(pact_id) {
  return checkPactExists(pact_id)
    .then(() =>
      Pact.findPact(pact_id)
    )
    .then((res) =>
      addPactParticipantInfo(res)
    )
}

async function addPactTitles(pact_ids) {
  for (let i = 0; i < pact_ids.length; i++) {
    pact_ids[i].title = (await Pact.findPact(pact_ids[i].pact_id)).title;
  }
  return pact_ids;
}

function getUserPacts(user_id) {
  return checkUserExists(user_id)
    .then(() =>
      Pact.getUsersPactIDs(user_id)
    )
    .then((pact_ids) =>
      addPactTitles(pact_ids)
    )
}

function createPact(eventBody) {
  return checkPactInput(eventBody)
    .then(() =>
      checkUsernameInput(eventBody)
    )
    .then((success) => {
      if (!success) {
        return Promise.reject(HTTPError(404, 'Participants error. Participant does not exist.'));
      }
      return Pact.createPact({ title: eventBody.title, description: eventBody.description, streak: eventBody.streak, period_length: eventBody.period_length, period_target: eventBody.period_target, privacy_level: eventBody.privacy_level });
    })
    .then((res) =>
      addPactParticipants(res, eventBody.participants)
    ).then((res) => {
      return res;
    })
}

function deletePact(eventBody) {
  return checkPactExists(eventBody.pact_id)
    .then(() =>
      Pact.deletePact({ pact_id: eventBody.pact_id })
    )
}

function updatePact(eventBody) {
  return checkPactExists(eventBody.pact_id)
    .then(() =>
      checkPactInput(eventBody)
    )
    .then(() =>
      checkUsernameInput(eventBody)
    )
    .then((success) => {
      if (!success) {
        return Promise.reject(HTTPError(404, 'Participants error. Participant does not exist.'));
      }
      return Pact.deletePact({ pact_id: eventBody.pact_id });
    })
    .then((res) =>
      Pact.createPact({ pact_id: res.pact_id, title: eventBody.title, description: eventBody.description, streak: eventBody.streak, period_length: eventBody.period_length, period_target: eventBody.period_target, privacy_level: eventBody.privacy_level })
    )
    .then((res) =>
      addPactParticipants(res, eventBody.participants)
    ).then((res) => {
      return res;
    })
}
