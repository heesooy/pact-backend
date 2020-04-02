const UserH = require('./AuthHandler');
const User = require('../db/User');

// User.findByUsername("charans2")
//   .then((res) => console.log(res.user_id));

UserH.register({body: "{\"firstname\": \"Ethan\",\"lastname\": \"Lord\",\"username\": \"ejlord2\",\"email\": \"ejlord2@illinois.edu\",\"password\": \"password3\",\"location\": \"Minneapolis, MN\"}"}, {})
  .then((res) => console.log(res));
