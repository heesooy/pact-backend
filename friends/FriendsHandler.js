const User = require('../db/User');
const VerifyToken = require('../auth/VerifyToken');

/**
 * Functions
 */

/*
 * GET /friends/
 */
module.exports.getFriends = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const token = event.headers.Authorization;
  const decoded = VerifyToken.decodeJwt(token);
  if (!decoded) // token empty or invalid
    return { 
      statusCode: 403,
      body: JSON.stringify({ message: 'Forbidden: missing or invalid JWT.'  })
    };

  return await getFriends(decoded.id)
    .then(resp => ({
      statusCode: 200,
      body: JSON.stringify(resp)
    }))
    .catch(err => ({
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ stack: err.stack, message: err.message })
    }));
};

/*
 * GET /friends/request/
 */
module.exports.getRequests = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const token = event.headers.Authorization;
  const decoded = VerifyToken.decodeJwt(token);
  if (!decoded) // token empty or invalid
    return { 
      statusCode: 403,
      body: JSON.stringify({ message: 'Forbidden: missing or invalid JWT.'  })
    };
  
  return await getRequests(decoded.id)
    .then(resp => ({
      statusCode: 200,
      body: JSON.stringify(resp)
    }))
    .catch(err => ({
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ stack: err.stack, message: err.message })
    }));
};

/*
 * POST /friends/request/send/
 */
module.exports.sendRequest = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const token = event.headers.Authorization;
  const decoded = VerifyToken.decodeJwt(token);
  if (!decoded) // token empty or invalid
    return { 
      statusCode: 403,
      body: JSON.stringify({ message: 'Forbidden: missing or invalid JWT.'  })
    };

  return await sendRequest(decoded.id, JSON.parse(event.body))
    .then(resp => ({
      statusCode: 200,
      body: JSON.stringify(resp)
    }))
    .catch(err => ({
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ stack: err.stack, message: err.message })
    }));
};

/*
 * POST /friends/request/accept/
 */
module.exports.acceptRequest = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const token = event.headers.Authorization;
  const decoded = VerifyToken.decodeJwt(token);
  if (!decoded) // token empty or invalid
    return { 
      statusCode: 403,
      body: JSON.stringify({ message: 'Forbidden: missing or invalid JWT.'  })
    };

  return await acceptRequest(decoded.id, JSON.parse(event.body))
    .then(resp => ({
      statusCode: 200,
      body: JSON.stringify(resp)
    }))
    .catch(err => ({
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ stack: err.stack, message: err.message })
    }));
};

/*
 * POST /friends/request/decline/
 */
module.exports.declineRequest = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const token = event.headers.Authorization;
  const decoded = VerifyToken.decodeJwt(token);
  if (!decoded) // token empty or invalid
  return { 
    statusCode: 403,
    body: JSON.stringify({ message: 'Forbidden: missing or invalid JWT.'  })
  };

  return await declineRequest(decoded.id, JSON.parse(event.body))
    .then(resp => ({
      statusCode: 200,
      body: JSON.stringify(resp)
    }))
    .catch(err => ({
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ stack: err.stack, message: err.message })
    }));
};

/**
 * Helpers
 */

function getFriends(id) {
  return User.getFriends(id)
    .then(friends =>
      !friends
        ? Promise.reject(new Error('Error fetching friends.'))
        : ({ friends: friends })
    );
}

function getRequests(id) {
  return User.getRequests(id)
    .then(requests => 
      !requests
        ? Promise.reject(new Error('Error fetching friend requests.'))
        : ({ requests: requests })
    );
}

function sendRequest(id, eventBody) {
  return User.areFriends(id, eventBody.user_id) // check if somehow already friends
    .then(friended => {
      if (friended == null)
        return Promise.reject(new Error('Error checking if already friends.'));
      if (friended == true)
        return Promise.reject(new Error('Users are already friends.'));
    }).then(() => 
      User.createRequest(id, eventBody.user_id) // create 'REQUESTED' relationship
    ).then(success => 
      !success
        ? Promise.reject(new Error('Error fetching friend requests.'))
        : eventBody
    );
}

function acceptRequest(id, eventBody) {
  return User.hasRequested(id, eventBody.user_id) // check if request even exists
    .then(requested => {
      if (requested == null)
        return Promise.reject(new Error('Error checking if friend request exists.'));
      if (requested == false)
        return Promise.reject(new Error('User has not received friend request.'));
    }).then(() => 
      User.areFriends(id, eventBody.user_id) // check if somehow already friends
    ).then(friended => {
      if (friended == null)
        return Promise.reject(new Error('Error checking if already friends.'));
      if (friended == true)
        return Promise.reject(new Error('Users are already friends.'));
    }).then(() =>
      User.deleteRequest(id, eventBody.user_id) // delete 'REQUESTED' relationship
    ).then(success => 
      !success
        ? Promise.reject(new Error('Error deleting friend request.'))
        : eventBody
    ).then(() => 
      User.addFriend(id, eventBody.user_id) // replace with 'FRIENDS' relationship
    ).then(success =>
      !success
        ? Promise.reject(new Error('Error adding friend.'))
        : eventBody
    );
}

function declineRequest(id, eventBody) {
  return User.hasRequested(id, eventBody.user_id) // check if request even exists
    .then(requested => {
      if (requested == null)
        return Promise.reject(new Error('Error checking if friend request exists.'));
      if (requested == false)
        return Promise.reject(new Error('User has not received friend request.'));
    }).then(() => 
      User.areFriends(id, eventBody.user_id) // check if somehow already friends
    ).then(friended => {
      if (friended == null)
        return Promise.reject(new Error('Error checking if already friends.'));
      if (friended == true)
        return Promise.reject(new Error('Users are already friends.'));
    }).then(() => 
      User.deleteRequest(id, eventBody.user_id) // delete 'REQUESTED' relationship
    ).then(success => 
      !success
        ? Promise.reject(new Error('Error deleting friend request.'))
        : eventBody
    );
}
