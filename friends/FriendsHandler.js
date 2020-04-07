const User = require('../db/User');
const VerifyToken = require('../auth/VerifyToken');
const HTTPError = require('../common/HTTPError');

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
      body: JSON.stringify({ message: err.message })
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
      body: JSON.stringify({ message: err.message })
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
      body: JSON.stringify({ message: err.message })
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
      body: JSON.stringify({ message: err.message })
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
      body: JSON.stringify({ message: err.message })
    }));
};

/*
 * GET /friends/search?prefix=...&limit=...
 * Search global users database for users with either username or firstname containing prefix
 */
module.exports.searchUsers = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const token = event.headers.Authorization;
  const decoded = VerifyToken.decodeJwt(token);
  if (!decoded) // token empty or invalid
  return { 
    statusCode: 403,
    body: JSON.stringify({ message: 'Forbidden: missing or invalid JWT.'  })
  };

  const prefix = event.queryStringParameters.prefix || null;
  const limit = parseInt(event.queryStringParameters.limit) || 25;

  return await searchUsers(prefix, limit)
    .then(resp => ({
      statusCode: 200,
      body: JSON.stringify(resp)
    }))
    .catch(err => ({
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ message: err.message })
    }));
}

/**
 * Helpers
 */

function getFriends(id) {
  return User.getFriends(id)
    .then(friends =>
      !friends
        ? Promise.reject(HTTPError(500, 'Error fetching friends.'))
        : ({ friends: friends })
    );
}

function getRequests(id) {
  return User.getRequests(id)
    .then(requests => 
      !requests
        ? Promise.reject(HTTPError(500, 'Error fetching friend requests.'))
        : ({ requests: requests })
    );
}

function sendRequest(id, eventBody) {
  return User.areFriends(id, eventBody.user_id) // check if somehow already friends
    .then(friended => {
      if (friended == null)
        return Promise.reject(HTTPError(500, 'Error checking if already friends.'));
      if (friended == true)
        return Promise.reject(HTTPError(409, 'Users are already friends.'));
    }).then(() => 
      User.createRequest(id, eventBody.user_id) // create 'REQUESTED' relationship
    ).then(success => 
      !success
        ? Promise.reject(HTTPError(500, 'Error fetching friend requests.'))
        : eventBody
    );
}

function acceptRequest(id, eventBody) {
  return User.hasRequested(id, eventBody.user_id) // check if request even exists
    .then(requested => {
      if (requested == null)
        return Promise.reject(HTTPError(500, 'Error checking if friend request exists.'));
      if (requested == false)
        return Promise.reject(HTTPError(409, 'User has not received friend request.'));
    }).then(() => 
      User.areFriends(id, eventBody.user_id) // check if somehow already friends
    ).then(friended => {
      if (friended == null)
        return Promise.reject(HTTPError(500, 'Error checking if already friends.'));
      if (friended == true)
        return Promise.reject(HTTPError(409, 'Users are already friends.'));
    }).then(() =>
      User.deleteRequest(id, eventBody.user_id) // delete 'REQUESTED' relationship
    ).then(success => 
      !success
        ? Promise.reject(HTTPError(500, 'Error deleting friend request.'))
        : eventBody
    ).then(() => 
      User.addFriend(id, eventBody.user_id) // replace with 'FRIENDS' relationship
    ).then(success =>
      !success
        ? Promise.reject(HTTPError(500, 'Error adding friend.'))
        : eventBody
    );
}

function declineRequest(id, eventBody) {
  return User.hasRequested(id, eventBody.user_id) // check if request even exists
    .then(requested => {
      if (requested == null)
        return Promise.reject(HTTPError(500, 'Error checking if friend request exists.'));
      if (requested == false)
        return Promise.reject(HTTPError(409, 'User has not received friend request.'));
    }).then(() => 
      User.areFriends(id, eventBody.user_id) // check if somehow already friends
    ).then(friended => {
      if (friended == null)
        return Promise.reject(HTTPError(500, 'Error checking if already friends.'));
      if (friended == true)
        return Promise.reject(HTTPError(409, 'Users are already friends.'));
    }).then(() => 
      User.deleteRequest(id, eventBody.user_id) // delete 'REQUESTED' relationship
    ).then(success => 
      !success
        ? Promise.reject(HTTPError(500, 'Error deleting friend request.'))
        : eventBody
    );
}

function searchUsers(prefix, limit) {
  return User.findUsersByPrefix(prefix, limit)
    .then(users =>
      !users
        ? Promise.reject(HTTPError(500, 'Error fetching users.'))
        : ({ users: users })
    );
}
