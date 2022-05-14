const {Datastore} = require('@google-cloud/datastore');

const projectId = 'hw7-lannersn';

module.exports.Datastore = Datastore;
module.exports.datastore = new Datastore({projectId: projectId});