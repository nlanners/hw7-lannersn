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


/* ------------------------------------------------- END MODEL FUNCTIONS ---------------------------------------- */



/* ------------------------------------------------- BEGIN CONTROLLER FUNCTIONS ---------------------------------------- */

/* 
GET all public boats for the specified owner_id, regardless of
    whether the request has a valid or invalid JWT or whether a
    JWT is missing
*/
router.get('/:owner_id/boats', (req, res) => {
    res.send();
});

/* ------------------------------------------------- BEGIN CONTROLLER FUNCTIONS ---------------------------------------- */

module.exports = router;