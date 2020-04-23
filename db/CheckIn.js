const db = require('../db');
const uuid = require('uuid');

module.exports.getCheckIns = async (pact_id) => {
  const client = db.connectMysql();
  const res = await client.query(
    'SELECT PactEvent.*, User.username FROM PactEvent\
    JOIN User ON User.user_id = PactEvent.user_id\
    WHERE pact_id = ?\
    ORDER BY timestamp DESC',
    [pact_id]);
  client.quit();

  console.log(res);

  return res;
};

module.exports.addCheckIn = async (pact_id, user_id, optional) => {
  const row = {
    event_id: uuid(),
    pact_id: pact_id,
    user_id: user_id,
    timestamp: Date.now(),
    proof_id: optional.proof_id || null,
    comments: optional.comments || null
  };

  console.log(row);

  const client = db.connectMysql();
  const res = await client.query('INSERT INTO PactEvent SET ?', [row]);
  client.quit();

  if (res.affectedRows < 1)
    return null;
  return row;
};