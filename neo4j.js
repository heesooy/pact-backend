const neo4j = require('neo4j-driver')

module.exports.connectDriver = async () => {
  const driver = neo4j.driver(
    process.env.NEO4J_HOST,
    neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
  );

  try {
    await driver.verifyConnectivity();
    console.log('Neo4j: Driver connected.');
  } catch (error) {
    console.log(`Neo4j: Failed to verify driver connection - ${error}`);
  }

  return driver;
}
