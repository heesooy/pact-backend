const Pact = require('./PactHandler');

Pact.getPactInfo({headers: "{pact_id: \"7d920e7f-8a13-470e-ab17-92c6610b7cda\"}"}, {})
  .then((res) => console.log(res));

// Pact.deletePact({body: "{\"pact_id\": \"a2db2381-bcde-4245-ae8c-5c020db216b4\"}"}, {})
//   .then((res) => console.log(res));

// Pact.updatePact({body: "{\"pact_id\": \"a2db2381-bcde-4245-ae8c-5c020db216b4\",\"title\": \"Workout Pact 2\",\"description\": \"Workout 6 times a Week\",\"streak\": 20,\"period_length\": 7,\"period_target\": 6,\"privacy_level\": \"public\",\"participants\": [\"ejlord2\", \"asdale2\"]}"}, {})
//   .then((res) => console.log(res));
