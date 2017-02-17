var shortid = require('shortid'),
    db = require('../core/db.js');

var wss = null,
    users = {},
    rooms = {},
    readOnlyUsers = {},
    readOnlyRooms = {};

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
    readOnlyUsers[userId] = '';

    ws.on('message', function(msg) {
        msg = JSON.parse(msg);
        if (!('document_id' in msg))
            return;

        var docId = msg.document_id;
        var readOnly = ('read_only' in msg) ? msg.read_only : false;
        if (readOnly) {
             db.documents.findOne({'view_id': docId}, function(err, item) {
                if (err) {
                    return;
                } else {
                    var editId = item.edit_id;
                    if (readOnlyUsers[userId] === '') {
                        if (!(editId in readOnlyRooms)) {
                            readOnlyRooms[editId] = [];
                        }
                        readOnlyRooms[editId].push(userId);

                        readOnlyUsers[userId] = editId;
                    }
                }
            });

            return;
        }

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

        var sendToUser = function(u) {
            if (u != userId) {
                var client = getWsClient(u);
                if (client !== null) {
                    client.send(JSON.stringify({'delta': msg.delta}));
                } else {
                    delete room[room.indexOf(u)];
                }
            }
        };

        var userDoc = users[userId];
        if (userDoc in rooms) {
            var room = rooms[users[userId]];
            room.forEach(sendToUser);
        }
        if (userDoc in readOnlyRooms) {
            var readOnlyRoom = readOnlyRooms[users[userId]];
            readOnlyRoom.forEach(sendToUser);
        }

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

    ws.on('close', function () {
        if (userId in users)
            delete users[userId];

        if (userId in readOnlyUsers)
            delete readOnlyUsers[userId];

        console.log('User disconnected: ' + userId);
    });
};

module.exports = function(expressWs) {
    wss = expressWs.getWss();

    return {
        'userConnected': userConnected
    };
}
