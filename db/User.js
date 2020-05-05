const db = require('../db');
const uuid = require('uuid');

module.exports.create = async (user) => {
  const client = db.connectMysql();
  user.user_id = uuid();
  await client.query('INSERT INTO User SET ?', user);
  client.quit();

  const driver = await db.connectNeo4j();
  const session = driver.session();

  try {
    await session.run('CREATE (n:User { user_id: $user_id })', { user_id: user.user_id });
  } catch (error) {
    console.error("Neo4j: " + error);
    // TODO: undo MySQL transaction and proper error handling in invoker (i.e. when this returns null)
    return null;
  } finally {
    await session.close();
    await driver.close();
  }

  return user;
};

module.exports.findByEmail = async (email) => {
  const client = db.connectMysql();
  let user = await client.query('SELECT * FROM User WHERE email = ?', [email]);
  client.quit();

  if (user.length == 0) {
    return null;
  }

  return user[0];
};

module.exports.findByUserID = async (user_id) => {
  const client = db.connectMysql();
  let user = await client.query('SELECT * FROM User WHERE user_id = ?', [user_id]);
  client.quit();

  if (user.length == 0) {
    return null;
  }
  return user[0];
};

module.exports.findByUsername = async (username) => {
  const client = db.connectMysql();
  let user = await client.query('SELECT * FROM User WHERE username = ?', [username]);
  client.quit();

  if (user.length == 0) {
    return null;
  }
  return user[0];
};

module.exports.findUsersByPrefix = async (prefix, limit) => {
  const client = db.connectMysql();
  const regex = prefix + "%";
  let users = await client.query(
    'SELECT user_id, username, firstname, lastname, email, location\
    FROM User WHERE username LIKE ? OR firstname LIKE ? LIMIT ?',
    [regex, regex, limit]
  );
  client.quit();
  return users;
}

module.exports.getFriendsIds = async (id) => {
  const driver = await db.connectNeo4j();
  const session = driver.session();

  try {
    const result = await session.run(
      'MATCH (a:User { user_id: $user_id })-[:FRIENDS]-(b:User) RETURN b.user_id',
      { user_id: id }
    );
    return result.records.map(x => x._fields[0]);;
  } catch (error) {
    console.error("Neo4j: " + error);
    return null;
  } finally {
    await session.close();
    await driver.close();
  }
}

module.exports.getUserDetails = async (user_id) => {
  const client = db.connectMysql();
  let details = await client.query('SELECT user_id, username, firstname, lastname, email, location FROM User WHERE user_id = ?', [user_id]);
  client.quit();
  return details[0];
}

module.exports.getUsersDetails = async (user_ids) => {
  const client = db.connectMysql();
  let details = await client.query(
    'SELECT user_id, username, firstname, lastname, email, location FROM User WHERE user_id IN (?)',
    [user_ids]
  );
  client.quit();
  return details;
}

module.exports.getFriends = async (id) => {
  const friend_ids = await this.getFriendsIds(id);
  if (friend_ids == null)
    return null;
  if (friend_ids.length == 0)
    return friend_ids;

  return await this.getUsersDetails(friend_ids);
}

module.exports.areFriends = async (id1, id2) => {
  const driver = await db.connectNeo4j();
  const session = driver.session();

  try {
    const result = await session.run(
      'MATCH (a:User)-[:FRIENDS]-(b:User) \
      WHERE a.user_id = $id1 AND b.user_id = $id2 \
      RETURN b.user_id',
      { id1: id1, id2: id2 }
    );
    return result.records.length == 1;
  } catch (error) {
    console.error("Neo4j: " + error);
    return null;
  } finally {
    await session.close();
    await driver.close();
  }
}

module.exports.addFriend = async (id1, id2) => {
  const driver = await db.connectNeo4j();
  const session = driver.session();

  try {
    await session.run(
      'MATCH (a:User), (b:User) \
      WHERE a.user_id = $id1 AND b.user_id = $id2 \
      CREATE (a)-[r:FRIENDS]->(b)',
      { id1: id1, id2: id2 }
    );
    return true;
  } catch (error) {
    console.error("Neo4j: " + error);
    return null;
  } finally {
    await session.close();
    await driver.close();
  }
}

module.exports.getRequestsIds = async (id) => {
  const driver = await db.connectNeo4j();
  const session = driver.session();

  try {
    const result = await session.run(
      'MATCH (a:User { user_id: $user_id })<-[:REQUESTED]-(b:User) \
      RETURN b.user_id',
      { user_id: id }
    );
    return result.records.map(x => x._fields[0]);
  } catch (error) {
    console.error("Neo4j: " + error);
    return null;
  } finally {
    await session.close();
    await driver.close();
  }
}

module.exports.getRequests = async (id) => {
  const request_ids = await this.getRequestsIds(id);
  if (request_ids == null)
    return null;
  if (request_ids.length == 0)
    return request_ids;
  return await this.getUsersDetails(request_ids);
}

module.exports.hasRequested = async (id1, id2) => {
  const driver = await db.connectNeo4j();
  const session = driver.session();

  try {
    const result = await session.run(
      'MATCH (a:User)-[:REQUESTED]-(b:User) \
      WHERE a.user_id = $id1 AND b.user_id = $id2 \
      RETURN b.user_id',
      { id1: id1, id2: id2 }
    );
    return result.records.length == 1;
  } catch (error) {
    console.error("Neo4j: " + error);
    return null;
  } finally {
    await session.close();
    await driver.close();
  }
}

// Create request from id1 to id2
module.exports.createRequest = async (id1, id2) => {
  const driver = await db.connectNeo4j();
  const session = driver.session();

  try {
    await session.run(
      'MATCH (a:User), (b:User) \
      WHERE a.user_id = $id1 AND b.user_id = $id2 \
      CREATE (a)-[r:REQUESTED]->(b)',
      { id1: id1, id2: id2 }
    );
    return true;
  } catch (error) {
    console.error("Neo4j: " + error);
    return null;
  } finally {
    await session.close();
    await driver.close();
  }
}

// Delete request BETWEEN (directionless) id1 and i2
module.exports.deleteRequest = async (id1, id2) => {
  const driver = await db.connectNeo4j();
  const session = driver.session();

  try {
    await session.run(
      'MATCH (a:User)-[r:REQUESTED]-(b:User) \
      WHERE a.user_id = $id1 AND b.user_id = $id2 \
      DELETE r',
      { id1: id1, id2: id2 }
    );
    return true;
  } catch (error) {
    console.error("Neo4j: " + error);
    return null;
  } finally {
    await session.close();
    await driver.close();
  }
}

// Friends suggestion (id = user_id of current user, limit = limit)
module.exports.getFriendsSuggestions = async (id, limit) => {
  // get top $limit people who have mutual friends
  // mutual = map user_id to number of mutual friends
  const driver = await db.connectNeo4j();
  const session = driver.session();
  let mutual = {};
  try {
    const result = await session.run(
      'MATCH (p:User {user_id: $user_id})-[:FRIENDS*2]-(f:User)\
      WHERE NOT (p)-[:FRIENDS]-(f) AND f.user_id <> $user_id\
      WITH p, f\
      MATCH (p)-[:FRIENDS]-(mutual)-[:FRIENDS*1]-(f)\
      RETURN f.user_id as user_id, COUNT(DISTINCT mutual.user_id) as mutual\
      ORDER BY mutual DESC\
      LIMIT $limit',
      { user_id: id, limit: limit }
    );

    result.records.forEach(record => { 
      mutual[record.get('user_id')] = record.get('mutual').toNumber();
    });
  } catch (error) {
    console.error("Neo4j: " + error);
    return null;
  } finally {
    await session.close();
    await driver.close();
  }

  console.log("Mutual: ");
  console.log(mutual);

  // get my top 5 tags
  const client = db.connectMysql();
  const myTags = await client.query(
    'select c.tag_name, count(a.tag_id) as count from pact.PactTag a\
    join pact.PactParticipants b\
    on a.pact_id = b.pact_id\
    join pact.Tag c\
    on a.tag_id = c.tag_id\
    where user_id = ?\
    group by tag_name\
    order by count desc\
    limit 5',
    [id]
  );
  const myHist = {};
  for (let i = 0; i < myTags.length; i++) {
    const row = myTags[i];
    myHist[row.tag_name] = row.count;
  }

  console.log("myHist: ");
  console.log(myHist);

  // TODO: maybe return random users if there are not
  // enough users to suggest.
  if (Object.keys(mutual).length == 0) {
    return [];
  }

  // get tags of the suggested users
  const potentialTags = await client.query(
    'select b.user_id, c.tag_name, count(a.tag_id) as count from pact.PactTag a\
    join pact.PactParticipants b\
    on a.pact_id = b.pact_id\
    join pact.Tag c\
    on a.tag_id = c.tag_id\
    where b.user_id in (?)\
    and (b.status = \'accepted\' OR b.status = \'created\')\
    group by tag_name',
    [Object.keys(mutual)]
  );
  client.quit();

  console.log("potentialTags: ");
  console.log(potentialTags);

  // compute tag similarity score for each suggested user
  const score = {};
  const max = {};
  const maxTag = {};
  for (let i = 0; i < potentialTags.length; i++) {
    const row = potentialTags[i];
    const cur_user = row.user_id;
    const tag = row.tag_name;
    const frequency = row.count;

    if (!(cur_user in score)) {
      score[cur_user] = 0;
      max[cur_user] = 0;
      maxTag[cur_user] = '';
    }

    if (tag in myHist) {
      score[cur_user] += 1;

      if (frequency > max[cur_user]) {
        max[cur_user] = frequency;
        maxTag[cur_user] = tag;
      }
    }
  }

  // get user details
  let details = await this.getUsersDetails(Object.keys(mutual));

  console.log("Details pre-process: ");
  console.log(details);

  // sort user details list desc using metric
  // metric = # mutual friends + # common tags
  for (let i = 0; i < details.length; i++) {
    const user_id = details[i].user_id;
    details[i].mutual = mutual[user_id] || 0;
    details[i].common = maxTag[user_id] || '';

    details[i].metric = details[i].mutual + (score[user_id] || 0);
  }

  details = details.sort(function(a, b) {
    return b.metric - a.metric;
  });

  console.log("Details post-sort: ");
  console.log(details);

  return details;
}