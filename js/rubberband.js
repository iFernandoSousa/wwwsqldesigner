/* --------------------- rubberband -------------------- */

SQL.Rubberband = function (owner) {
  this.owner = owner;
  SQL.Visual.apply(this);
  this.dom.container = OZ.$("rubberband");
  OZ.Event.add("area", "mousedown", this.down.bind(this));
};
SQL.Rubberband.prototype = Object.create(SQL.Visual.prototype);

SQL.Rubberband.prototype.down = function (e) {
  OZ.Event.prevent(e);
  var scroll = OZ.DOM.scroll();
  var zoomFactor = this.owner.zoom ? this.owner.zoom.getZoomFactor() : 1;
  this.x = this.x0 = (e.clientX + scroll[0]) / zoomFactor;
  this.y = this.y0 = (e.clientY + scroll[1]) / zoomFactor;
  this.width = 0;
  this.height = 0;
  this.redraw();
  this.documentMove = OZ.Event.add(document, "mousemove", this.move.bind(this));
  this.documentUp = OZ.Event.add(document, "mouseup", this.up.bind(this));
};

SQL.Rubberband.prototype.move = function (e) {
  var scroll = OZ.DOM.scroll();
  var zoomFactor = this.owner.zoom ? this.owner.zoom.getZoomFactor() : 1;
  var x = (e.clientX + scroll[0]) / zoomFactor;
  var y = (e.clientY + scroll[1]) / zoomFactor;
  this.width = Math.abs(x - this.x0);
  this.height = Math.abs(y - this.y0);
  if (x < this.x0) {
    this.x = x;
  } else {
    this.x = this.x0;
  }
  if (y < this.y0) {
    this.y = y;
  } else {
    this.y = this.y0;
  }
  this.redraw();
  this.dom.container.style.visibility = "visible";
};

SQL.Rubberband.prototype.up = function (e) {
  OZ.Event.prevent(e);
  this.dom.container.style.visibility = "hidden";
  OZ.Event.remove(this.documentMove);
  OZ.Event.remove(this.documentUp);

  // If we're in adding mode and this was a simple click (no drag), show dialog
  if (this.owner.tableManager.adding && this.width < 5 && this.height < 5) {
    // Store position and show dialog (don't create table yet)
    this.owner.tableManager.pendingTablePosition = {
      x: this.x0,
      y: this.y0,
    };
    this.owner.tableManager.showAddTableDialog();
  } else {
    this.owner.tableManager.selectRect(this.x, this.y, this.width, this.height);
  }
};

SQL.Rubberband.prototype.redraw = function () {
  var zoomFactor = this.owner.zoom ? this.owner.zoom.getZoomFactor() : 1;
  // Scale the visual position and size to match the zoomed area
  this.dom.container.style.left = this.x * zoomFactor + "px";
  this.dom.container.style.top = this.y * zoomFactor + "px";
  this.dom.container.style.width = this.width * zoomFactor + "px";
  this.dom.container.style.height = this.height * zoomFactor + "px";
};
