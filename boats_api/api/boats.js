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

// POST a boat
async function post_boat(name, type, length, public) {
    let key = datastore.key(c.BOAT);

    try {
        const new_boat = {"name":name, "type":type, "length":length, "public": public};
        await datastore.save({"key":key, "data":new_boat});

        return [c.CREATED, ds.fromDatastore(boat)];

    } catch (err) {
        console.log('post_boat');
        console.log(err);
        return [c.ERROR, null];
    }
}

// GET all the boats in the database
async function get_all_boats() {
    try {
        let q = datastore.createQuery(c.BOAT);
        const entities = await datastore.runQuery(q)
        return entities[0];

    } catch (err) {
        console.log('get_all_boats');
        console.log(err);
        return c.ERROR;
    }
}

// Delete a boat from database by id
async function delete_boat(id) {
    try {
        const key = datastore.key([c.BOAT, parseInt(id, 10)]);

        const results = await datastore.delete(key);

        if (results[0]. indexUpdates === 0){
            return c.NOT_FOUND;

        } else {
            return c.NO_CONTENT;
        }

    } catch (err) {
        console.log('delete_boat');
        console.log(err);
        return c.ERROR;
    }
}

// send appropriate response
function handle_response(res, result, extra=null) {
    switch (result) {
        case c.BAD_METHOD:
            res.set('Accept', 'GET, POST');
            res.status(c.BAD_METHOD).send(m.BAD_METHOD);
            break;

        case c.BAD_REQUEST:
            res.status(c.BAD_REQUEST).send(extra);
            break;

        case c.FORBIDDEN:
            res.status(c.FORBIDDEN).send(m.FORBIDDEN);
            break;

        case c.CREATED:
            res.status(c.CREATED).location(extra.self).json( extra );
            break;

        case c.ERROR:
            res.status(c.ERROR).send(extra);
            break;

        case c.NO_CONTENT:
            res.status(c.NO_CONTENT).end();
            break;

        case c.NOT_ACCEPTABLE:
            res.status(c.NOT_ACCEPTABLE).send(m.NOT_ACCEPTABLE + extra);
            break;

        case c.NOT_FOUND:
            res.status(c.NOT_FOUND).send(m.NOT_FOUND);
            break;

        case c.OK:
            // send HTML
            if (extra[1] === 'text/html'){
                res.status(c.OK).send(createHTML(extra[0]));

            // send JSON
            } else if (extra[1] === 'application/json') {
                res.status(c.OK).json(extra[0]);

            // error
            } else {
                res.status(c.ERROR).send(message);
            }
            break;

        case c.SEE_OTHER:
            res.status(c.SEE_OTHER).location(extra).end();
            break;

        case c.UNSUPPORTED:
            res.status(c.UNSUPPORTED).send(m.UNSUPPORTED);
            break;
    }
}


/* --------------------------------------------- END MODEL FUNCTIONS ------------------------------------------------- */


/* ---------------------------------------- BEGIN CONTROLLER FUNCTIONS ----------------------------------------------- */

// CREATE boat
router.post('/', async (req, res) => {
    const accepts = req.accepts(['application/json']);

    // check request content type is correct
    if (req.get('content-type') !== 'application/json') {
        handle_response(res, c.UNSUPPORTED);

    // check client response acceptable
    } else if (!accepts) {
        handle_response(res, c.NOT_ACCEPTABLE, 'application/json');

    // validate attributes
    } else if (req.body.name && req.body.type && req.body.length) {

        try {
            // create boat in database
            const boat = await post_boat(req.body.name, req.body.type, req.body.length, req.body.public);

            // handle response
            handle_response(res, boat[0], boat[1]);

        } catch (err) {
            console.log('router.post');
            console.log(err);
            handle_response(res, c.ERROR);
        }

    // attributes failed
    } else {
        handle_response(res, c.BAD_REQUEST, m.BAD_REQUEST_ATTR);
    }
});

// DELETE boat
router.delete('/:boat_id', async (req, res) => {
    try {
        // remove boat from database
        const result = await delete_boat(req.params.boat_id)
        handle_response(res, result);

    } catch (err) {
        console.log('router.delete');
        console.log(err);
        handle_response(res, c.ERROR);
    }
});

// GET all boats
router.get('/', async (req, res) => {
    // check accepts
    const accepts = req.accepts(['application/json']);
    if (!accepts) {
        handle_response(res, c.NOT_ACCEPTABLE, 'application/json');

    } else {
        try {
            // get boats from database
            let boats = await get_all_boats();
            boats = boats.map(ds.fromDatastore);
            handle_response(res, c.OK, [{"boats": boats}, accepts]);

        } catch (err) {
            console.log('router.get("/")');
            console.log(err);
            handle_response(res, c.ERROR);
        }
    }
});

/* --------------------------------------------------- END CONTROLLER FUNCTIONS ----------------------------------------- */

module.exports = router;