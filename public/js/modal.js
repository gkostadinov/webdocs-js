function Modal(modalSelector, showCallback, hideCallback) {
    this.shown = false;
    this.showCallback = showCallback;
    this.hideCallback = hideCallback;

    this._modal = _(modalSelector);
    this._triggerBtn = _(this._modal.data('trigger'));
    this._closeBtn = _(this._modal.data('close'));

    this._triggerBtn.on('click', this.show.bind(this));
    this._closeBtn.on('click', this.hide.bind(this));
    window.on('resize', this.invalidatePosition.bind(this));
}

Modal.prototype.getDimensions = function() {
    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;
    var modalWidth = this._modal.width();
    var modalHeight = this._modal.height();

    return [windowWidth, windowHeight, modalWidth, modalHeight];
}

Modal.prototype.getPosition = function(dimensions) {
    var left = (dimensions[0] - dimensions[2]) / 2.0;
    var top = (dimensions[1] - dimensions[3]) / 2.0;

    return [top, left];
}

Modal.prototype.setPosition = function(position) {
    this._modal.style.top = position[0] + 'px';
    this._modal.style.left = position[1] + 'px';
}

Modal.prototype.invalidatePosition = function() {
    if (!this.shown)
        return;

    var dimensions = this.getDimensions();
    var position = this.getPosition(dimensions);
    this.setPosition(position);
}

Modal.prototype.show = function() {
    if (this.shown)
        return;

    this.shown = true;
    this._modal.style.display = "block";
    this.invalidatePosition();

    if (this.showCallback)
        this.showCallback();
}

Modal.prototype.hide = function() {
    if (!this.shown)
        return;

    this.shown = false;
    this._modal.style.display = "none";

    if (this.hideCallback)
        this.hideCallback();
}
