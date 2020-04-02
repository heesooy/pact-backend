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
      headers: { 'Content-Type': 'text/plain' },
      body: { stack: err.stack, message: err.message }
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
      headers: { 'Content-Type': 'text/plain' },
      body: { stack: err.stack, message: err.message }
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
      headers: { 'Content-Type': 'text/plain' },
      body: { stack: err.stack, message: err.message }
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
  // for (let i = 0; i < eventBody.participants.length; i++) {
  //     let user = await User.findByUsername(eventBody.participants[i])
  //     if (user == null)
  //       return Promise.reject(new Error('Participants error. Participant does not exist.'));
  // }
  return Promise.resolve();
}

function createPact(eventBody) {
  return checkCreatePactInput(eventBody)
    .then(() =>
      Pact.createPact({ title: eventBody.title, description: eventBody.description, streak: eventBody.streak, period_length: eventBody.period_length, period_target: eventBody.period_target, privacy_level: eventBody.privacy_level })
    )
    .then((res) => {
      for (let i = 0; i < eventBody.participants.length; i++) {
          User.findByUsername(eventBody.participants[i]).then((user) =>
            Pact.addPartcipantToPact( { pact_id: res.pact_id, user_id: user.user_id } )
          )
      }
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

function checkUpdatePactInput(eventBody) {
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
  // for (let i = 0; i < eventBody.participants.length; i++) {
  //     let user = await User.findByUsername(eventBody.participants[i])
  //     if (user == null)
  //       return Promise.reject(new Error('Participants error. Participant does not exist.'));
  // }
  return Pact.findPact(eventBody.pact_id).then((pact) => {
    if (pact == null)
      return Promise.reject(new Error('Pact error. Pact does not exist.'));
    return Promise.resolve();
  })
}

function updatePact(eventBody) {
  return checkUpdatePactInput(eventBody)
    .then(() =>
      Pact.deletePact({ pact_id: eventBody.pact_id })
    )
    .then((res) =>
      Pact.createPact({ pact_id: res.pact_id, title: eventBody.title, description: eventBody.description, streak: eventBody.streak, period_length: eventBody.period_length, period_target: eventBody.period_target, privacy_level: eventBody.privacy_level })
    )
    .then((res) => {
      for (let i = 0; i < eventBody.participants.length; i++) {
          User.findByUsername(eventBody.participants[i]).then((user) =>
            Pact.addPartcipantToPact( { pact_id: res.pact_id, user_id: user.user_id } )
          )
      }
      return res;
    })
}
