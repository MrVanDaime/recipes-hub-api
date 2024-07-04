const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

dotenv.config();

const app = express();

// Connect to DB
connectDB();

app.use(bodyParser.json());

require("./startup/cors")(app);
require("./startup/routes")(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log( `Listening on port ${PORT}` );
});