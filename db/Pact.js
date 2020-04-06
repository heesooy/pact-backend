const db = require('../db');
const uuid = require('uuid');

module.exports.createPact = async (pact) => {
  const client = db.connectMysql();
  if (!pact.pact_id)
    pact.pact_id = uuid();
  await client.query('INSERT INTO Pact SET ?', pact);
  client.quit();
  console.log(pact);
  return pact;
};

module.exports.deletePact = async (pact) => {
  const client = db.connectMysql();
  await client.query('DELETE FROM Pact WHERE pact_id = ?', pact.pact_id);
  client.quit();
  console.log(pact);
  return pact;
};

module.exports.addPartcipantsToPact = async (pact_info) => {
  const client = db.connectMysql();
  let participant = {};
  participant.pact_id = pact_info.pact_id;
  console.log(pact_info.users);
  for (let i = 0; i < pact_info.users.length; i++) {
    participant.user_id = pact_info.users[i];
    await client.query('INSERT INTO PactParticipants SET ?', participant);
  }
  client.quit();
  console.log(pact_info);
  return pact_info;
};

module.exports.findPact = async (pact_id) => {
  const client = db.connectMysql();
  let pact = await client.query('SELECT * FROM Pact WHERE pact_id = ?', pact_id);
  if (pact.length == 0) {
    return null;
  }
  return pact[0];
};

module.exports.getPactParticipants = async (pact_id) => {
  const client = db.connectMysql();
  let participants = await client.query('SELECT * FROM PactParticipants WHERE pact_id = ?', pact_id);
  if (participants.length == 0) {
    return null;
  }
  return participants;
};

module.exports.getUsersPactIDs = async (user_id) => {
  const client = db.connectMysql();
  let pacts = await client.query('SELECT pact_id FROM PactParticipants WHERE user_id = ?', user_id);
  if (pacts.length == 0) {
    return null;
  }
  return pacts;
};
