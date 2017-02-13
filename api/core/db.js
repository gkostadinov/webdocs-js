var mongodb = require('mongodb'),
    config = require('../config.js');

module.exports.init = function(callback) {
    var server = new mongodb.Server(config.get('dbhost'), config.get('dbport'));

    new mongodb.Db(config.get('dbname'), server).open(function(error, client) {
        module.exports.client = client;
        module.exports.documents = client.collection('documents');
        callback(error);
    });
};
