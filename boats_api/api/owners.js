const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const ds = require('../lib/datastore');
const constants = require('../lib/constants');
const b = require('./boats');

const datastore = ds.datastore;

router.use(bodyParser.json());

const c = constants.constants;
const m = constants.messages;

/* ------------------------------------------------- BEGIN MODEL FUNCTIONS ---------------------------------------- */

async function get_owner_boats(user_id) {
    const public_boats = await b.get_boats();
    const owner_boats = await public_boats.filter( boat => boat.owner === user_id);

    return owner_boats;
}

/* ------------------------------------------------- END MODEL FUNCTIONS ---------------------------------------- */



/* ------------------------------------------------- BEGIN CONTROLLER FUNCTIONS ---------------------------------------- */

/* 
GET all public boats for the specified owner_id, regardless of
    whether the request has a valid or invalid JWT or whether a
    JWT is missing
*/
router.get('/:owner_id/boats', async (req, res) => {
    try {
        const boats = await get_owner_boats(req.params.owner_id);
        res.status(c.OK).send(boats);

    } catch (err) {
        console.log('router.get/:owner_id/boats');
        console.log(err);
    }
});

/* ------------------------------------------------- BEGIN CONTROLLER FUNCTIONS ---------------------------------------- */

module.exports = router;