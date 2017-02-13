var express = require('express')
    bodyParser = require('body-parser'),
    expressWs = require('express-ws'),

    db = require('./core/db.js'),
    ws = require('./core/ws.js')
    documentResource = require('./resources/document');

var app = express(),
    eWs = expressWs(app);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.post('/document', documentResource.addDocument);
app.get('/document/v/:id', documentResource.getByViewId);
app.get('/document/e/:id', documentResource.getByEditId);

app.ws('/', ws(eWs).userConnected);


db.init(function(error) {
    if (error)
        throw error;

    console.log('Listening on port 5000...');
    app.listen(5000);
});
