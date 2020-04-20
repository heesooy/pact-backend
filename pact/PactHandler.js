const Pact = require('../db/Pact');
const User = require('../db/User');
const CheckIn = require('../db/CheckIn');
const VerifyToken = require('../auth/VerifyToken');
const HTTPError = require('../common/HTTPError');

/**
 * Endpoints
 */

module.exports.getPactInfo = (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const pact_id = event.headers.pact_id;
  return getPactInfo(pact_id)
    .then(resp => ({
      statusCode: 200,
      body: JSON.stringify(resp)
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
    .then(resp => ({
      statusCode: 200,
      body: JSON.stringify(resp)
    }))
    .catch(err => ({
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ message: err.message })
    }));
};

module.exports.createPact = (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const token = event.headers.Authorization;
  const decoded = VerifyToken.decodeJwt(token);
  if (!decoded) // token empty or invalid
    return {
      statusCode: 403,
      body: JSON.stringify({ message: 'Forbidden: missing or invalid JWT.'  })
    };
  return createPact(JSON.parse(event.body), decoded.id)
    .then(resp => ({
      statusCode: 200,
      body: JSON.stringify(resp)
    }))
    .catch(err => ({
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ message: err.message })
    }));
};

module.exports.deletePact = (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const token = event.headers.Authorization;
  const decoded = VerifyToken.decodeJwt(token);
  if (!decoded) // token empty or invalid
    return {
      statusCode: 403,
      body: JSON.stringify({ message: 'Forbidden: missing or invalid JWT.'  })
    };
  return deletePact(JSON.parse(event.body), decoded.id)
    .then(resp => ({
      statusCode: 200,
      body: JSON.stringify(resp)
    }))
    .catch(err => ({
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ message: err.message })
    }));
};

module.exports.updatePact = (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const token = event.headers.Authorization;
  const decoded = VerifyToken.decodeJwt(token);
  if (!decoded) // token empty or invalid
    return {
      statusCode: 403,
      body: JSON.stringify({ message: 'Forbidden: missing or invalid JWT.'  })
    };
  return updatePact(JSON.parse(event.body), decoded.id)
    .then(resp => ({
      statusCode: 200,
      body: JSON.stringify(resp)
    }))
    .catch(err => ({
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ message: err.message })
    }));
};

module.exports.acceptPact = (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const token = event.headers.Authorization;
  const decoded = VerifyToken.decodeJwt(token);
  if (!decoded) // token empty or invalid
    return {
      statusCode: 403,
      body: JSON.stringify({ message: 'Forbidden: missing or invalid JWT.'  })
    };
  return acceptPact(JSON.parse(event.body), decoded.id)
    .then(resp => ({
      statusCode: 200,
      body: JSON.stringify(resp)
    }))
    .catch(err => ({
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ message: err.message })
    }));
};

module.exports.declinePact = (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const token = event.headers.Authorization;
  const decoded = VerifyToken.decodeJwt(token);
  if (!decoded) // token empty or invalid
    return {
      statusCode: 403,
      body: JSON.stringify({ message: 'Forbidden: missing or invalid JWT.'  })
    };
  return declinePact(JSON.parse(event.body), decoded.id)
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
 * Get all checkins for given pact_id
 */
module.exports.getCheckIns = (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const token = event.headers.Authorization;
  const decoded = VerifyToken.decodeJwt(token);
  if (!decoded) // token empty or invalid
    return {
      statusCode: 403,
      body: JSON.stringify({ message: 'Forbidden: missing or invalid JWT.'  })
    };

  const pact_id = JSON.parse(event.body).pact_id;

  return getCheckIns(pact_id, decoded.id)
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
 * Add a new check-in to the pact for provided user
 */
module.exports.checkIn = (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const token = event.headers.Authorization;
  const decoded = VerifyToken.decodeJwt(token);
  if (!decoded) // token empty or invalid
    return {
      statusCode: 403,
      body: JSON.stringify({ message: 'Forbidden: missing or invalid JWT.'  })
    };

  return checkIn(JSON.parse(event.body), decoded.id)
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

function checkPactInput(eventBody) {
  if (!(eventBody.title && typeof eventBody.title === 'string')) {
    return Promise.reject(HTTPError(400, 'Title error. Title must have valid characters.'));
  } else if (!(eventBody.description && typeof eventBody.description === 'string')) {
    return Promise.reject(HTTPError(400, 'Description error. Description must have valid characters.'));
  } else if (!(eventBody.period_length && typeof eventBody.period_length === 'number')) {
    return Promise.reject(HTTPError(400, 'Period Length error. Period Length must be a number.'));
  } else if (!(eventBody.period_target && typeof eventBody.period_target === 'number')) {
    return Promise.reject(HTTPError(400, 'Period Target error. Period Target must be a number.'));
  } else if (!(eventBody.privacy_level && typeof eventBody.privacy_level === 'string')) {
    return Promise.reject(HTTPError(400, 'Privacy Level error. Privacy Level must have valid characters.'));
  } else if (!(eventBody.participants)) {
    return Promise.reject(HTTPError(400, 'Participants error. Participants field does not exist.'));
  } else if (!(eventBody.tags)) {
    return Promise.reject(HTTPError(400, 'Tags error. Tags field does not exist.'));
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
      return Promise.reject(HTTPError(404, 'Pact error. Pact does not exist.'));
    return Promise.resolve();
  })
}

function checkUserExists(user_id) {
  return User.findByUserID(user_id).then((user) => {
    if (user == null)
      return Promise.reject(HTTPError(404, 'User error. User does not exist.'));
    return Promise.resolve();
  })
}

function checkUserInPact(user_id, pact_id) {
  return Pact.getPactParticipants(pact_id)
    .then(list => {
      for (let i = 0; i < list.length; i++) {
        const row = list[i];
        if (row.user_id == user_id && (row.status == 'accepted' || row.status == 'created'))
          return Promise.resolve();
      }
      return Promise.reject(HTTPError(403, 'User is not part of the specified pact.'));
    });
}

async function addPactParticipants(res, users, user_id) {
  let user_ids = [];
  user_ids.push(user_id);
  for (let i = 0; i < users.length; i++) {
      user_ids.push((await User.findByUsername(users[i])).user_id);
  }
  await Pact.addPartcipantsToPact( { pact_id: res.pact_id, users: user_ids } );
  res.participants = users;
  res.participants.unshift((await User.findByUserID(user_id)).username);
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

async function addPactInfo(pact_ids, user_id) {
  for (let i = 0; i < pact_ids.length; i++) {
    pact_ids[i] = await Pact.findPact(pact_ids[i].pact_id);
    pact_ids[i] = await addPactParticipantInfo(pact_ids[i]);
    pact_ids[i] = await addPactTagInfo(pact_ids[i]);
    pact_ids[i].status = await Pact.getUserPactStatus(pact_ids[i].pact_id, user_id);
  }
  return pact_ids;
}

function checkUserPactRequest(pact_id, user_id) {
  return Pact.getUserPactStatus(pact_id, user_id).then((res) => {
    if (res != "requested")
      return Promise.reject(HTTPError(404, 'Status error. User not in Pact or Status is not Requested.'));
    return Promise.resolve();
  })
}

async function addPactTags(res, tags) {
  let tag_ids = [];
  for (let i = 0; i < tags.length; i++) {
      let tag_id = await Pact.getTagID(tags[i]);
      if (!tag_id)
        tag_id = await Pact.addTag(tags[i]);
      tag_ids.push(tag_id);
  }
  if (tags.length > 0)
    await Pact.addTagsToPact( { pact_id: res.pact_id, tags: tag_ids } );
  res.tags = tags;
  return res;
}

async function addPactTagInfo(pact_info) {
  let res = await Pact.getPactTags(pact_info.pact_id);
  let tag_names = [];
  for (let i = 0; i < res.length; i++) {
    tag_names.push((await Pact.getTagInfo(res[i].tag_id)).tag_name);
  }
  pact_info.tags = tag_names;
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
    .then((res) =>
      addPactTagInfo(res)
    )
}

function getUserPacts(user_id) {
  return checkUserExists(user_id)
    .then(() =>
      Pact.getUsersPactIDs(user_id)
    )
    .then((pact_ids) =>
      addPactInfo(pact_ids, user_id)
    )
}

function createPact(eventBody, user_id) {
  return checkPactInput(eventBody)
    .then(() =>
      checkUserExists(user_id)
    )
    .then(() =>
      checkUsernameInput(eventBody)
    )
    .then((success) => {
      if (!success) {
        return Promise.reject(HTTPError(404, 'Participants error. Participant does not exist.'));
      }
      return Pact.createPact({ title: eventBody.title, description: eventBody.description, streak: 0, period_length: eventBody.period_length, period_target: eventBody.period_target, privacy_level: eventBody.privacy_level });
    })
    .then((res) =>
      addPactParticipants(res, eventBody.participants, user_id)
    )
    .then((res) =>
      addPactTags(res, eventBody.tags)
    )
}

function deletePact(eventBody, user_id) {
  return checkPactExists(eventBody.pact_id)
    .then(() =>
      checkUserExists(user_id)
    )
    .then(() =>
      Pact.deletePact({ pact_id: eventBody.pact_id })
    )
}

function updatePact(eventBody, user_id) {
  return checkPactExists(eventBody.pact_id)
    .then(() =>
      checkPactInput(eventBody)
    )
    .then(() =>
      checkUserExists(user_id)
    )
    .then(() =>
      checkUsernameInput(eventBody)
    )
    .then((success) => {
      if (!success) {
        return Promise.reject(HTTPError(404, 'Participants error. Participant does not exist.'));
      }
      return Pact.findPact(eventBody.pact_id);
    })
    .then((res) => {
      Pact.deletePact({ pact_id: eventBody.pact_id });
      return res;
    })
    .then((res) =>
      Pact.createPact({ pact_id: res.pact_id, title: eventBody.title, description: eventBody.description, streak: res.streak, period_length: eventBody.period_length, period_target: eventBody.period_target, privacy_level: eventBody.privacy_level })
    )
    .then((res) =>
      addPactParticipants(res, eventBody.participants, user_id)
    )
    .then((res) =>
      addPactTags(res, eventBody.tags)
    )
}

function acceptPact(eventBody, user_id) {
  return checkPactExists(eventBody.pact_id)
    .then(() =>
      checkUserExists(user_id)
    )
    .then(() =>
      checkUserPactRequest(eventBody.pact_id, user_id)
    )
    .then(() =>
      Pact.setUserPactStatus(eventBody.pact_id, user_id, "accepted")
    )
}

function declinePact(eventBody, user_id) {
  return checkPactExists(eventBody.pact_id)
    .then(() =>
      checkUserExists(user_id)
    )
    .then(() =>
      checkUserPactRequest(eventBody.pact_id, user_id)
    )
    .then(() =>
      Pact.setUserPactStatus(eventBody.pact_id, user_id, "declined")
    )
}

function getCheckIns(pact_id, user_id) {
  return checkPactExists(pact_id)
    .then(() => 
      checkUserInPact(user_id, pact_id)
    )
    .then(() =>
      CheckIn.getCheckIns(pact_id)
    )
    .then((checkIns) => 
      !checkIns
          ? Promise.reject(HTTPError(500, 'Error fetching check-ins.'))
          : ({ checkIns: checkIns })
    );
}

function checkIn(body, user_id) {
  const optional = {
    proof_id: body.proof_id,
    comments: body.comments
  }

  const pact_id = body.pact_id;

  return checkPactExists(pact_id)
    .then(() => 
      checkUserInPact(user_id, pact_id)
    )
    .then(() =>
      CheckIn.addCheckIn(body.pact_id, user_id, optional)
    )
    .then((row) => 
      !row
          ? Promise.reject(HTTPError(500, 'Error checking in.'))
          : (row)
    );
}
