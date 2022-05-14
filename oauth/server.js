const express = require('express');

const app = express();
const bodyParser = require('body-parser');
const ejs = require('express-ejs-layouts');
const axios = require('axios');
const cors = require('cors');
const c = require('./lib/oauth_creds');
const ds = require('./lib/datastore');
const { response } = require('express');

const datastore = ds.datastore;

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json({extended:false}));
app.use(ejs);
app.use(express.static('public'));
app.use(cors());

app.set('view engine', 'ejs')

const POSSIBLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const creds = c.creds;
const redirect = 'https://oauth-dot-hw7-lannersn.wl.r.appspot.com/oauth';

/******************************* START MODEL FUNCITONS ********************************/

function getRandomState() {
    let randomState = "";

    // source: https://gist.githubusercontent.com/darrenmothersele/87869b6b1862b4e8cbb57d13051a3cd0/raw/9ec356100cec0fbaae322d823208244646f531db/random1.js
    for (let i = 0; i < 40; i++){
        randomState += POSSIBLE.charAt(Math.floor(Math.random() * POSSIBLE.length));
    }
    
    return randomState;
}

async function saveState(state) {
    
    try {
        let key = await datastore.key('States');
        await datastore.save({'key': key, 'data': {'state': state}});
    } catch (err) {
        console.log('saveState', err);
    }
}

async function checkState(state) {
    try {
        let q = datastore.createQuery('States');
        const entities = await datastore.runQuery(q);
        for (let e of entities[0]) {
            if (e.state === state) {
                return true;
            }
        }
        return false;
    } catch (err) {
        console.log('checkState', err);
    }
}

async function getToken(auth_code) {
    try {
        const response = await axios.post('https://oauth2.googleapis.com/token', {
                code: auth_code,
                client_id: creds.client_id,
                client_secret: creds.client_secret,
                redirect_uri: redirect,
                grant_type: 'authorization_code'
            }
        );

        return response.data;
    } catch (err) {
        console.log('getToken', err);
    }
}

async function getProfile(token) {
    try {
        const profile = await axios.get('https://people.googleapis.com/v1/people/me?personFields=names', {
            headers: {
                'Authorization': token.token_type + ' ' + token.access_token
            }
        });
        return {
            firstName: profile.data.names[0].givenName,
            lastName: profile.data.names[0].familyName
        }

    } catch (err) {
        console.log('getProfile', err);
        // console.log('error: ', err.response.data.error);
    }
}

/****************************** END MODEL FUNCTIONS ************************************/

/********************************** START CONTROLLER FUNCTIONS *****************************/


app.get('/', (req, res) => {
    res.render('welcome.ejs');
})

app.get('/randomState', async (req, res) => {
    // get a randome state
    const randState = getRandomState();
    // save state in datastore
    try {
        await saveState(randState);
    } catch (err) {
        console.log('create creds', err);
    }

    const url = 'https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=' + creds.client_id + '&redirect_uri=' + redirect + '&scope=profile&state=' + randState;
    res.send({oauth_url: url});
})

app.get('/oauth', async (req, res) => {
    
    try{
        const state_exists = await checkState(req.query.state);

        if (state_exists) {
            const auth_code = req.query.code;
            const token = await getToken(auth_code);
            const profile = await getProfile(token);
            const context = {
                firstName: profile.firstName,
                lastName: profile.lastName,
                token: token.id_token
            }
            res.render('oauth.ejs', context);
        }
    } catch (err) {
        console.log('get auth', err);
    }

})


/***************************************** END CONTROLLER FUNCTIONS *******************************/

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});
