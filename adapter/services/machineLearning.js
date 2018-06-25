exports.buildCharts = () => {
  // Builds Charts and Inputs Results into MongoDB for reading from other /chart endpoints
  const config = require("./../../config.json");
  const fetch = require('node-fetch');
  const serviceEndpoints = config.serviceEndpoints;
  return fetch(`${serviceEndpoints.root}${serviceEndpoints.linear.simple}`, { method: 'POST' }).then((result) => {
    return result;
  }).catch((err) => {
    return err
  });
};
