var shortid = require('shortid'),
    db = require('../core/db.js');

var wss = null,
    users = {},
    rooms = {};

var getWsClient = function(userId) {
    var foundClient = null;
    wss.clients.forEach(function(client) {
        if (client.userId == userId) {
            foundClient = client;
        }
    });

    return foundClient;
};

var userConnected = function(ws, req) {
    if (!wss)
        return;

    var userId = shortid.generate();
    console.log('User connected: ' + userId);

    ws.userId = userId;
    users[userId] = '';

    ws.on('message', function(msg) {
        msg = JSON.parse(msg);
        if (!('document_id' in msg))
            return;

        var docId = msg.document_id;
        if (users[userId] === '') {
            if (!(docId in rooms)) {
                rooms[docId] = [];
            }
            rooms[docId].push(userId);

            users[userId] = docId;
        }

        if (!('delta' in msg)) {
            return;
        }

        var room = rooms[users[userId]];
        room.forEach(function(u) {
            if (u != userId) {
                var client = getWsClient(u);
                if (client !== null) {
                    client.send(JSON.stringify({'document_id': docId, 'delta': msg.delta}));
                } else {
                    delete room[room.indexOf(u)];
                }
            }
        });

        if ('content' in msg) {
            db.documents.update(
                {'edit_id': docId}, {$set: {'content': msg.content}}, {safe: true},
                function(err, result) {
                    if (err) {
                        console.log('Error updating document: ' + err);
                    }
                }
            );
        }
    });

    ws.on("close", function () {
        if (!(userId in users))
            return;

        delete users[userId];
        console.log('User disconnected: ' + userId);
    });
};

module.exports = function(expressWs) {
    wss = expressWs.getWss();

    return {
        'userConnected': userConnected
    };
}
