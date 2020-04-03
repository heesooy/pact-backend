const Pact = require('../db/Pact');
const User = require('../db/User');

module.exports.createPact = (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  return createPact(JSON.parse(event.body))
    .then(session => ({
      statusCode: 200,
      body: JSON.stringify(session)
    }))
    .catch(err => ({
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ stack: err.stack, message: err.message })
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
      body: JSON.stringify({ stack: err.stack, message: err.message })
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
      body: JSON.stringify({ stack: err.stack, message: err.message })
    }));
};

function checkCreatePactInput(eventBody) {
  if (!(eventBody.title && typeof eventBody.title === 'string')) {
    return Promise.reject(new Error('Title error. Title must have valid characters.'));
  } else if (!(eventBody.description && typeof eventBody.description === 'string')) {
    return Promise.reject(new Error('Description error. Description must have valid characters.'));
  } else if (!(eventBody.streak && typeof eventBody.streak === 'number')) {
    return Promise.reject(new Error('Streak error. Streak must be a number.'));
  } else if (!(eventBody.period_length && typeof eventBody.period_length === 'number')) {
    return Promise.reject(new Error('Period Length error. Period Length must be a number.'));
  } else if (!(eventBody.period_target && typeof eventBody.period_target === 'number')) {
    return Promise.reject(new Error('Period Target error. Period Target must be a number.'));
  } else if (!(eventBody.privacy_level && typeof eventBody.privacy_level === 'string')) {
    return Promise.reject(new Error('Privacy Level error. Privacy Level must have valid characters.'));
  } else if (!(eventBody.participants && eventBody.participants.length > 1)) {
    return Promise.reject(new Error('Participants error. Must have atleast 2 participants.'));
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
async function addPactParticipants(res, users) {
  let user_ids = [];
  for (let i = 0; i < users.length; i++) {
      user_ids.push((await User.findByUsername(users[i])).user_id);
  }
  await Pact.addPartcipantsToPact( { pact_id: res.pact_id, users: user_ids } );
  return res;
}

function createPact(eventBody) {
  return checkCreatePactInput(eventBody)
    .then(() =>
      checkUsernameInput(eventBody)
    )
    .then((success) => {
      if (!success) {
        return Promise.reject(new Error('Participants error. Participant does not exist.'));
      }
      return Pact.createPact({ title: eventBody.title, description: eventBody.description, streak: eventBody.streak, period_length: eventBody.period_length, period_target: eventBody.period_target, privacy_level: eventBody.privacy_level });
    })
    .then((res) =>
      addPactParticipants(res, eventBody.participants)
    ).then((res) => {
      return res;
    })
}

function checkDeletePactInput(eventBody) {
  return Pact.findPact(eventBody.pact_id).then((pact) => {
    if (pact == null)
      return Promise.reject(new Error('Pact error. Pact does not exist.'));
    return Promise.resolve();
  })
}

function deletePact(eventBody) {
  return checkDeletePactInput(eventBody)
    .then(() =>
      Pact.deletePact({ pact_id: eventBody.pact_id })
    )
}

async function checkUpdatePactInput(eventBody) {
  if (!(eventBody.title && typeof eventBody.title === 'string')) {
    return Promise.reject(new Error('Title error. Title must have valid characters.'));
  } else if (!(eventBody.description && typeof eventBody.description === 'string')) {
    return Promise.reject(new Error('Description error. Description must have valid characters.'));
  } else if (!(eventBody.streak && typeof eventBody.streak === 'number')) {
    return Promise.reject(new Error('Streak error. Streak must be a number.'));
  } else if (!(eventBody.period_length && typeof eventBody.period_length === 'number')) {
    return Promise.reject(new Error('Period Length error. Period Length must be a number.'));
  } else if (!(eventBody.period_target && typeof eventBody.period_target === 'number')) {
    return Promise.reject(new Error('Period Target error. Period Target must be a number.'));
  } else if (!(eventBody.privacy_level && typeof eventBody.privacy_level === 'string')) {
    return Promise.reject(new Error('Privacy Level error. Privacy Level must have valid characters.'));
  } else if (!(eventBody.participants && eventBody.participants.length > 1)) {
    return Promise.reject(new Error('Participants error. Must have atleast 2 participants.'));
  }
  for (let i = 0; i < eventBody.participants.length; i++) {
      let user = await User.findByUsername(eventBody.participants[i])
      if (user == null)
        return Promise.reject(new Error('Participants error. Participant does not exist.'));
  }
  return Pact.findPact(eventBody.pact_id).then((pact) => {
    if (pact == null)
      return Promise.reject(new Error('Pact error. Pact does not exist.'));
    return Promise.resolve();
  })
}

function updatePact(eventBody) {
  return checkDeletePactInput(eventBody)
    .then(() =>
      checkCreatePactInput(eventBody)
    )
    .then(() =>
      checkUsernameInput(eventBody)
    )
    .then((success) => {
      if (!success) {
        return Promise.reject(new Error('Participants error. Participant does not exist.'));
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
