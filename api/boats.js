const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const ds = require('../lib/datastore');
const constants = require('../lib/constants');

const datastore = ds.datastore;

router.use(bodyParser.json());

const c = constants.constants;
const m = constants.messages;


/* ------------------------------------------------- BEGIN MODEL FUNCTIONS ---------------------------------------- */



/* --------------------------------------------- END MODEL FUNCTIONS ------------------------------------------------- */


/* ---------------------------------------- BEGIN CONTROLLER FUNCTIONS ----------------------------------------------- */



/* --------------------------------------------------- END CONTROLLER FUNCTIONS ----------------------------------------- */

module.exports = router;