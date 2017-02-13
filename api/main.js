var express = require('express')
    bodyParser = require('body-parser'),

    db = require('./db.js'),
    documentResource = require('./resources/document');

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/document', documentResource.addDocument);
app.get('/document/v/:id', documentResource.getByViewId);
app.get('/document/e/:id', documentResource.getByEditId);

db.init(function(error) {
    if (error)
        throw error;

    console.log('Listening on port 5000...');
    app.listen(5000);
});
