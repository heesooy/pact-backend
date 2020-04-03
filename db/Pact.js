const connectToDatabase = require('../db');
const uuid = require('uuid');

module.exports.createPact = async (pact) => {
  client = connectToDatabase();
  if (!pact.pact_id)
    pact.pact_id = uuid();
  await client.query('INSERT INTO Pact SET ?', pact);
  client.quit();
  console.log(pact);
  return pact;
};

module.exports.deletePact = async (pact) => {
  client = connectToDatabase();
  await client.query('DELETE FROM Pact WHERE pact_id = ?', pact.pact_id);
  client.quit();
  console.log(pact);
  return pact;
};

module.exports.addPartcipantsToPact = async (pact_info) => {
  client = connectToDatabase();
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
  client = connectToDatabase();
  let pact = await client.query('SELECT * FROM Pact WHERE pact_id = ?', pact_id);
  if (pact.length == 0) {
    return null;
  }
  return pact[0];
};
