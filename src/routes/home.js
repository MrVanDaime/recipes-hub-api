const express = require("express");
const router = express.Router()

// Homepage
router.get("/", (req, res) => {
  res.send( "Hello World!" )
});

module.exports = router;