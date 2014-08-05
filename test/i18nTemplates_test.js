'use strict';


var grunt = require("grunt");
var tm = require("../tasks/translatorManager")(grunt);
tm.setLocales(["es","en"]);
tm.parseFile("./test.html");
tm.parseFile("./other/test2.html");
tm.save();
