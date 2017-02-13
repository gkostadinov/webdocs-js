NodeList.prototype.forEach = []['forEach']

Node.prototype.on = window.on = function(eventName, func) {
    this.addEventListener(eventName, func, false);

    return this;
}

NodeList.prototype.on = function(eventName, func) {
    this.forEach(function(el) {
        el.on(eventName, func);
    });

    return this;
}

Node.prototype.trigger = function(eventName, data) {
    var event = new CustomEvent(eventName, {detail: data} || {});
    this.dispatchEvent(event);

    return this;
}

NodeList.prototype.trigger = function(eventName, data) {
    this.forEach(function(el) {
        el.trigger(eventName, data);
    });

    return this;
}

Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
}

NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
    for(var i = this.length - 1; i >= 0; i--) {
        if(this[i] && this[i].parentElement) {
            this[i].parentElement.removeChild(this[i]);
        }
    }
}

Node.prototype.data = function(dataAttr) {
    return this.getAttribute('data-' + dataAttr);
}

Node.prototype.attr = function(attr) {
    return this.getAttribute(attr);
}

Node.prototype.width = function() {
    return this.getBoundingClientRect().width;
}

Node.prototype.height = function() {
    return this.getBoundingClientRect().height;
}

function _(selector) {
    var el = document.querySelectorAll(selector || '_');

    return el.length == 1 ? el[0] : el;
}

_._ = document.createElement('_');
_.on = Node.prototype.on.bind(_._);
_.trigger = Node.prototype.trigger.bind(_._);

_.ajax = function(type, url, options, callback) {
    var xhr = new XMLHttpRequest();

    if (typeof options === 'function') {
        callback = options
        options = null
    }

    xhr.onload = function () {
        callback.call(xhr, null, JSON.parse(xhr.response));
    };

    xhr.onerror = function () {
        callback.call(xhr, true);
    };

    xhr.open(type, url);
    if (type === 'POST') {
        xhr.setRequestHeader('Content-Type', 'application/json');
    }
    xhr.send(options ? JSON.stringify(options) : null);
}
_.get = _.ajax.bind(this, 'GET')
_.post = _.ajax.bind(this, 'POST')

_.proxy = function(func, context) {
    return function() {
        return func.apply(context || this);
    }
}
