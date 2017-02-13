function Socket(docId, onReceive) {
    this.docId = docId;
    this.onReceive = onReceive;

    this.ws = new WebSocket(WEBSOCKET_IP);
    this.ws.onmessage = this.receive.bind(this);

    this.send({'document_id': docId})
}

Socket.prototype.send = function(message, callback) {
    var that = this;
    this.waitForConnection(function () {
        that.ws.send(JSON.stringify(message));
        if (typeof callback !== 'undefined') {
            callback();
        }
    }, 1000);
};

Socket.prototype.receive = function(message) {
    if (!message.data) {
        return;
    }

    var data = JSON.parse(message.data);
    if (data.document_id && data.document_id == this.docId) {
        this.onReceive(data);
    }
}

Socket.prototype.waitForConnection = function(callback, interval) {
    if (this.ws.readyState === 1) {
        callback();
    } else {
        var that = this;
        setTimeout(function() {
            that.waitForConnection(callback, interval);
        }, interval);
    }
};
