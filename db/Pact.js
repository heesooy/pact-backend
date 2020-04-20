const db = require('../db');
const uuid = require('uuid');

module.exports.createPact = async (pact) => {
  const client = db.connectMysql();
  if (!pact.pact_id)
    pact.pact_id = uuid();
  await client.query('INSERT INTO Pact SET ?', [pact]);
  client.quit();
  console.log(pact);
  return pact;
};

module.exports.deletePact = async (pact) => {
  const client = db.connectMysql();
  await client.query('DELETE FROM Pact WHERE pact_id = ?', [pact.pact_id]);
  client.quit();
  console.log(pact);
  return pact;
};

module.exports.addPartcipantsToPact = async (pact_info) => {
  const client = db.connectMysql();
  let participant = {};
  participant.pact_id = pact_info.pact_id;
  for (let i = 0; i < pact_info.users.length; i++) {
    participant.user_id = pact_info.users[i];
    participant.status = "requested";
    if (i == 0){
      participant.status = "created";
    }
    await client.query('INSERT INTO PactParticipants SET ?', [participant]);
  }
  client.quit();
  console.log(pact_info);
  return pact_info;
};

module.exports.findPact = async (pact_id) => {
  const client = db.connectMysql();
  let pact = await client.query('SELECT * FROM Pact WHERE pact_id = ?', [pact_id]);
  client.quit();
  if (pact.length == 0) {
    return null;
  }
  return pact[0];
};

module.exports.getPactParticipants = async (pact_id) => {
  const client = db.connectMysql();
  let participants = await client.query('SELECT * FROM PactParticipants WHERE pact_id = ?', [pact_id]);
  client.quit();
  return participants;
};

module.exports.getUsersPactIDs = async (user_id) => {
  const client = db.connectMysql();
  let pacts = await client.query('SELECT pact_id FROM PactParticipants WHERE user_id = ?', [user_id]);
  client.quit();
  return pacts;
};

module.exports.getUserPactStatus = async (pact_id, user_id) => {
  const client = db.connectMysql();
  let status = await client.query('SELECT status FROM PactParticipants WHERE pact_id = ? AND user_id = ?', [pact_id, user_id]);
  client.quit();
  return status[0].status;
};

module.exports.setUserPactStatus = async (pact_id, user_id, status) => {
  const client = db.connectMysql();
  await client.query('UPDATE PactParticipants SET status = ? WHERE pact_id = ? AND user_id = ?', [status, pact_id, user_id]);
  client.quit();
  return status;
};

module.exports.getTagID = async (tag_name) => {
  const client = db.connectMysql();
  let tag = await client.query('SELECT tag_id FROM Tag WHERE tag_name = ?', [tag_name]);
  client.quit();
  if (tag.length == 0) {
    return null;
  }
  return tag[0].tag_id;
};

module.exports.addTag = async (tag_name) => {
  const client = db.connectMysql();
  let tag = {}
  tag.tag_id = uuid();
  tag.tag_name = tag_name;
  await client.query('INSERT INTO Tag SET ?', [tag]);
  client.quit();
  return tag.tag_id;
};

module.exports.addTagsToPact = async (tag_info) => {
  const client = db.connectMysql();
  let tag = {};
  tag.pact_id = tag_info.pact_id;
  for (let i = 0; i < tag_info.tags.length; i++) {
    tag.tag_id = tag_info.tags[i];
    await client.query('INSERT INTO PactTag SET ?', [tag]);
  }
  client.quit();
  return tag_info;
};

module.exports.getPactTags = async (pact_id) => {
  const client = db.connectMysql();
  let tags = await client.query('SELECT * FROM PactTag WHERE pact_id = ?', [pact_id]);
  client.quit();
  return tags;
};

module.exports.getTagInfo = async (tag_id) => {
  const client = db.connectMysql();
  let tag = await client.query('SELECT * FROM Tag WHERE tag_id = ?', [tag_id]);
  client.quit();
  if (tag.length == 0) {
    return null;
  }
  return tag[0];
};

// module.exports.getPactsWithTagID = async (tag_id) => {
//   const client = db.connectMysql();
//   let pacts = await client.query('SELECT pact_id FROM PactTag WHERE tag_id = ?', [tag_id]);
//   client.quit();
//   if (pacts.length == 0) {
//     return null;
//   }
//   return pacts;
// };
//
// module.exports.deleteTag = async (tag_id) => {
//   const client = db.connectMysql();
//   await client.query('DELETE FROM Tag WHERE tag_id = ?', [tag_id]);
//   client.quit();
//   return tag_id;
// };
