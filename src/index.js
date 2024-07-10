const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());

require('./startup/db')();
require("./startup/cors")(app);
require("./startup/routes")(app);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log( `Listening on port ${PORT}` );
});

module.exports = server;