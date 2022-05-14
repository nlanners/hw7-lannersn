const {Datastore} = require('@google-cloud/datastore');

const projectId = 'hw6-lannersn';

module.exports.Datastore = Datastore;
module.exports.datastore = new Datastore({projectId: projectId});