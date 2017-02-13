var mongodb = require('mongodb'),
    config = require('./config.js');

exports.init = function(callback) {
    var server = new mongodb.Server(config.get('dbhost'), config.get('dbport'));

    new mongodb.Db(config.get('dbname'), server).open(function(error, client) {
        exports.client = client;
        exports.documents = client.collection('documents');
        callback(error);
    });
};
