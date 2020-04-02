const db = require('../db');
const uuid = require('uuid');

module.exports.create = async (user) => {
  client = db.connectMysql();
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
    // return null;
  } finally {
    await session.close();
    await driver.close();
  }

  console.log(user);
  return user;
};

module.exports.findByEmail = async (email) => {
  client = db.connectMysql();
  let user = await client.query('SELECT * FROM User WHERE email = ?', email);
  if (user.length == 0) {
    return null;
  } 

  console.log(user[0]);
  return user[0];
};

module.exports.getFriends = async (id) => {
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

module.exports.getRequests = async (id) => {
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
