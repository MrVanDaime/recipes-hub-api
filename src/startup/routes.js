const express = require("express");

const home = require("../routes/home");
const auth = require("../routes/auth");
const categories = require("../routes/categories");
const recipes = require("../routes/recipes");

module.exports = function(app) {
  app.use(express.json());

  app.use("/", home);
  app.use("/api/auth", auth);
  app.use("/api/categories", categories);
  app.use("/api/recipes", recipes);
}