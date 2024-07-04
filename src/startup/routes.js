const express = require("express");

const home = require("../routes/home");
const auth = require("../routes/auth");

module.exports = function(app) {
  app.use(express.json());

  app.use("/", home);
  app.use("/api/auth", auth);
}