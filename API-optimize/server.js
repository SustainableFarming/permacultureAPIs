"use strict";
exports.__esModule = true;
// includes
var process = require("process");
var express = require("express");
var WelcomeController_1 = require("./lib/WelcomeController");
// define express
var app = express();
app.use('/welcome', WelcomeController_1.WelcomeController);
// listen
var port = Number(process.env.PORT) || 3000;
app.listen(port, function () {
    // Success callback
    console.log("Listening at http://localhost:" + port + "/");
});
