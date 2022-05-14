const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const ds = require('../lib/datastore');
const constants = require('../lib/constants');
const {OAuth2Client} = require('google-auth-library');
const credentials = require('../lib/oauth_creds');
const { Z_ASCII } = require('zlib');

const datastore = ds.datastore;

router.use(bodyParser.json());

const c = constants.constants;
const m = constants.messages;
const creds = credentials.creds;
const client = new OAuth2Client(creds.client_id);


/* ------------------------------------------------- BEGIN MODEL FUNCTIONS ---------------------------------------- */

// POST a boat
async function post_boat(name, type, length, public, sub) {
    let key = datastore.key(c.BOAT);

    try {
        const new_boat = {"name":name, "type":type, "length":length, "public": public, "owner": sub};
        await datastore.save({"key":key, "data":new_boat});
        const [boat] = await datastore.get(key);
        return [c.CREATED, ds.fromDatastore(boat)];

    } catch (err) {
        console.log('post_boat');
        console.log(err);
        return [c.ERROR, null];
    }
}

// GET all the boats in the database
async function get_all_boats(sub=null) {
    try {
        let q = datastore.createQuery(c.BOAT);
        const entities = await datastore.runQuery(q)
        let boats;
        if (sub) {
            boats = entities[0].filter( boat => boat.owner === sub);
        } else {
            boats = entities[0].filter( boat => boat.public);
        }

        return boats;

    } catch (err) {
        console.log('get_all_boats');
        console.log(err);
        return c.ERROR;
    }
}

// Delete a boat from database by id
async function delete_boat(id, sub) {
    try {
        const key = datastore.key([c.BOAT, parseInt(id, 10)]);
        
        const [boat] = await datastore.get(key);

        if (boat && boat.owner === sub) {
            const results = await datastore.delete(key);

            if (results[0]. indexUpdates === 0){
                return c.FORBIDDEN;

            } else {
                return c.NO_CONTENT;
            }
        } else {
            return c.FORBIDDEN;
        }
        

    } catch (err) {
        console.log('delete_boat');
        console.log(err);
        return c.ERROR;
    }
}

// verify JWT and send back sub
async function verify(token) {
    if (token) {
        try {
            const ticket = await client.verifyIdToken({
                idToken: getToken(token),
                audience: creds.client_id
            });
            const payload = ticket.getPayload();
            const user_id = payload['sub'];
            return user_id;
        } catch (err) {
            console.log('verify');
            console.log(err);
        }
    } else {
        return false;
    }
    
}

// parses Authorization header
function getToken(auth) {
    const token = auth.split(' ');
    return token[1];
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
            res.status(c.OK).send(extra);
            break;

        case c.SEE_OTHER:
            res.status(c.SEE_OTHER).location(extra).end();
            break;

        case c.UNSUPPORTED:
            res.status(c.UNSUPPORTED).send(m.UNSUPPORTED);
            break;

        case c.UNAUTHORIZED:
            res.status(c.UNAUTHORIZED).send(m.UNAUTHORIZED);
            break;
    }
}


/* --------------------------------------------- END MODEL FUNCTIONS ------------------------------------------------- */


/* ---------------------------------------- BEGIN CONTROLLER FUNCTIONS ----------------------------------------------- */

// CREATE boat
router.post('/', async (req, res) => {
    if (req.headers.authorization) {
        const sub = await verify(req.headers.authorization);    

        // validate attributes
        if (sub) {
            try {
                // create boat in database
                const boat = await post_boat(req.body.name, req.body.type, req.body.length, req.body.public, sub);

                // handle response
                handle_response(res, boat[0], boat[1]);

            } catch (err) {
                console.log('router.post');
                console.log(err);
                handle_response(res, c.ERROR);
            }
        }

    // authorization failed
    } else {
        handle_response(res, c.UNAUTHORIZED, m.UNAUTHORIZED);
    }
});

// DELETE boat
router.delete('/:boat_id', async (req, res) => {
    let sub = await verify(req.headers.authorization);
    if (sub){
        try {
            // remove boat from database
            const result = await delete_boat(req.params.boat_id, sub);
            handle_response(res, result);
    
        } catch (err) {
            console.log('router.delete');
            console.log(err);
            handle_response(res, c.ERROR);
        }
    } else {
        handle_response(res, c.UNAUTHORIZED);
    }
});

// GET all boats
router.get('/', async (req, res) => {
    let sub;

    if (req.headers.authorization) {
        sub = await verify(req.headers.authorization);
    } else {
        sub = null;
    }

    try {
        // get boats from database
        let boats = await get_all_boats(sub);
        boats = boats.map(ds.fromDatastore);
        handle_response(res, c.OK, boats);

    } catch (err) {
        console.log('router.get("/")');
        console.log(err);
        handle_response(res, c.ERROR);
    }
    
});

/* --------------------------------------------------- END CONTROLLER FUNCTIONS ----------------------------------------- */

module.exports = router;
module.exports.get_boats = get_all_boats;