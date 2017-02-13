function App(docId=null, editId=null, viewId=null,
             readOnly=false, documentShared=false,
             docTitle='Untitled', docContent='',
             editorSelector='#editor', modalSelector='#modal') {
    this.docId = docId;
    this.readOnly = readOnly;
    this.docTitle = docTitle;
    this.docContent = docContent;
    this.editorChanges = [];

    this.documentShared = documentShared;
    this.editId = editId;
    this.viewId = viewId;

    this.editor = this.initEditor(editorSelector, {
        modules: {
            toolbar: (!this.readOnly) ? [
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],

                [{ 'header': 1 }, { 'header': 2 }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'script': 'sub'}, { 'script': 'super' }],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                [{ 'direction': 'rtl' }],

                [{ 'size': ['small', false, 'large', 'huge'] }],
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

                [{ 'color': [] }, { 'background': [] }],
                [{ 'font': [] }],
                [{ 'align': [] }],

                ['clean']
            ] : null
        },
        placeholder: 'Start writing something...',
        theme: 'snow',
        readOnly: this.readOnly
    })
    this.modal = this.initModal(modalSelector);

    this.ws = null;
    this.initSocket();
    this.initEditorChangeObserver();
    this.setTitle();
}

App.prototype.initSocket = function() {
    this.ws = (this.ws === null && this.docId !== null && !this.readOnly) ? new Socket(this.docId, this.wsReceiveMessage.bind(this)) : null;
}

App.prototype.initEditor = function(selector, editorOptions) {
    var quill = new Quill(selector, editorOptions);
    quill.on('text-change', this.editorTextChanged.bind(this));
    quill.focus();
    quill.setContents(this.docContent);

    return quill;
}

App.prototype.initModal = function(modalSelector) {
    var that = this;
    _('#share_confirm').on('click', function() {
        if (that.documentShared)
            return true;

        var docTitle = _('#title_input').value.trim();
        _.post(API_HOST + '/document',
            {
                'title': docTitle,
                'content': that.getEditorContents()
            },
            function(err, data) {
                if (err)
                    return;

                that.docTitle = docTitle;
                that.docId = data.edit_id;
                that.editId = data.edit_id;
                that.viewId = data.view_id;
                that.documentShared = true;
                that.setLinks();
                that.setTitle();
                that.initSocket();
                _('#share_confirm').style.display = 'none';
                _('#next_step').style.display = 'block';
            }
        );
    })

    return new Modal(modalSelector, this.onModalOpen.bind(this));
}

App.prototype.onModalOpen = function() {
    if (this.documentShared) {
        _('#share_confirm').style.display = 'none';
        _('#next_step').style.display = 'block';
        this.setLinks();
    }
}

App.prototype.getEditorContents = function() {
    return JSON.stringify(this.editor.getContents());
}

App.prototype.setLinks = function() {
    if (this.editId === null || this.viewId === null) {
        _('#edit_link').value = 'Loading...';
        _('#view_link').value = 'Loading...';
    } else {
        var baseLink = 'http://' + window.location.host + window.location.pathname;
        _('#edit_link').value = baseLink + '#e/' + this.editId;
        _('#view_link').value = baseLink + '#v/' + this.viewId;
        window.location.href = _('#edit_link').value;
    }
}

App.prototype.setTitle = function() {
    _('#title').innerText = this.docTitle;

    _('#title_input').value = this.docTitle;
    if (this.documentShared) {
        _('#title_input').setAttribute('disabled', 'true');
    }
}

App.prototype.editorTextChanged = function(delta, oldDelta, source) {
    if (source == 'user') {
        if (!this.readOnly)
            _('#share_btn').style.display = 'block';
        this.editorChanges.push(delta.ops);
    }
}

App.prototype.wsReceiveMessage = function(data){
    if (data.delta) {
        var delta = JSON.parse(data.delta);
        var that = this;
        delta.forEach(function(ops) {
            that.editor.updateContents({'ops': ops});
        });
    }
}

App.prototype.initEditorChangeObserver = function() {
    var func = function() {
        if (this.editorChanges.length > 0) {
            if (this.ws !== null) {
                this.ws.send(
                    {
                        'delta': JSON.stringify(this.editorChanges),
                        'document_id': this.docId,
                        'content': this.getEditorContents()
                    }
                );
            }
            this.editorChanges = [];
        }

        setTimeout(_.proxy(func, this), 500);
    }

    _.proxy(func, this)();
}

window.on('load', function() {
    var editIdentifier = '#e/';
    var viewIdentifier = '#v/';
    var urlHash = window.location.hash;

    var pageId = null;
    var docId = null;
    var editId = null;
    var viewId = null;
    var readOnly = false;
    var documentShared = false;
    var title = 'Untitled';
    var content = '';

    var done = function() {
        _.app = new App(docId, editId, viewId, readOnly, documentShared, title, content);
    }

    if (urlHash.startsWith(editIdentifier)) {
        pageId = urlHash.replace(editIdentifier, '');
        _.get(API_HOST + '/document/e/' + pageId,
            function(err, data) {
                if (err) {
                    done();
                    return;
                }

                docId = pageId;
                editId = pageId;
                documentShared = true;
                title = data.title;
                content = JSON.parse(data.content);
                viewId = data.view_id;
                done();
                _('#share_btn').style.display = 'block';
            }
        );
    } else if (urlHash.startsWith(viewIdentifier)) {
        pageId = urlHash.replace(viewIdentifier, '');
        _.get(API_HOST + '/document/v/' + pageId,
            function(err, data) {
                if (err) {
                    done();
                    return;
                }

                docId = pageId;
                viewId = pageId;
                readOnly = true;
                documentShared = true;
                title = data.title;
                content = JSON.parse(data.content);
                done();
            }
        );
    } else {
        done();
    }
});
