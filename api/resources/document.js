var shortid = require('shortid'),
    db = require('../db.js');

exports.addDocument = function(req, res) {
    var document = req.body;
    if (!('title' in document && 'content' in document)) {
        res.send({'status': 'fail', 'reason': 'incomplete body'});
        return;
    }

    var editId = shortid.generate(),
        viewId = shortid.generate();

    var dbObj = {
        'title': document.title,
        'content': document.content,
        'view_id': viewId,
        'edit_id': editId
    }

    db.documents.insert(dbObj, {safe: true}, function(err, objects) {
        if (err) {
            res.send({'status': 'fail', 'reason': err.message});
        } else {
            res.send({
                'status': 'success',
                'edit_id': editId,
                'view_id': viewId
            });
        }
    });
};

exports.getByViewId = function(req, res) {
    var viewId = req.params.id;
    if (!shortid.isValid(viewId)) {
        res.send({'status': 'fail', 'reason': 'the provided id is not valid'});
        return;
    }

    db.documents.findOne({'view_id': viewId}, function(err, item) {
        if (err) {
            res.send({'status': 'fail', 'reason': err.message});
        } else {
            if (!item) {
                res.send({
                    'status': 'fail',
                    'reason': 'no document found with this id'
                });
            } else {
                res.send({
                    'status': 'success',
                    'title': item.title,
                    'content': item.content
                });
            }
        }
    });
};

exports.getByEditId = function(req, res) {
    var editId = req.params.id;
    if (!shortid.isValid(editId)) {
        res.send({'status': 'fail', 'reason': 'the provided id is not valid'});
        return;
    }

    db.documents.findOne({'edit_id': editId}, function(err, item) {
        if (err) {
            res.send({'status': 'fail', 'reason': err.message});
        } else {
            if (!item) {
                res.send({
                    'status': 'fail',
                    'reason': 'no document found with this id'
                });
            } else {
                res.send({
                    'status': 'success',
                    'title': item.title,
                    'content': item.content,
                    'view_id': item.view_id
                });
            }
        }
    });
};
