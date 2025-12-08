/* --------------------- zoom manager ------------ */

SQL.Zoom = function (owner) {
    this.owner = owner;
    this.minZoom = 25;
    this.maxZoom = 200;
    this.zoomLevel = parseInt(this.owner.getOption("zoom")) || 100;
    
    // Ensure zoom level is within bounds
    if (this.zoomLevel < this.minZoom) {
        this.zoomLevel = this.minZoom;
    }
    if (this.zoomLevel > this.maxZoom) {
        this.zoomLevel = this.maxZoom;
    }
    
    this.dom = {
        container: null,
        zoomOutBtn: null,
        zoomInBtn: null,
        zoomInput: null
    };
    
    this.build();
    this.applyZoom();
};

SQL.Zoom.prototype.build = function () {
    // Create container
    this.dom.container = OZ.DOM.elm("div", { id: "zoomcontrols", className: "zoom-controls" });
    
    // Create zoom out button
    this.dom.zoomOutBtn = OZ.DOM.elm("button", { className: "zoom-btn", title: "Zoom Out" });
    this.dom.zoomOutBtn.innerHTML = "−";
    
    // Create zoom input
    this.dom.zoomInput = OZ.DOM.elm("input", { 
        type: "text", 
        className: "zoom-input",
        value: this.zoomLevel + "%"
    });
    
    // Create zoom in button
    this.dom.zoomInBtn = OZ.DOM.elm("button", { className: "zoom-btn", title: "Zoom In" });
    this.dom.zoomInBtn.innerHTML = "+";
    
    // Append elements
    this.dom.container.appendChild(this.dom.zoomOutBtn);
    this.dom.container.appendChild(this.dom.zoomInput);
    this.dom.container.appendChild(this.dom.zoomInBtn);
    
    // Insert before minimap
    var minimap = OZ.$("minimap");
    minimap.parentNode.insertBefore(this.dom.container, minimap);
    
    // Wire up event handlers
    OZ.Event.add(this.dom.zoomOutBtn, "click", this.zoomOut.bind(this));
    OZ.Event.add(this.dom.zoomInBtn, "click", this.zoomIn.bind(this));
    OZ.Event.add(this.dom.zoomInput, "change", this.handleInputChange.bind(this));
    OZ.Event.add(this.dom.zoomInput, "keypress", this.handleInputKeypress.bind(this));
    OZ.Event.add(this.dom.zoomInput, "blur", this.handleInputBlur.bind(this));
};

SQL.Zoom.prototype.zoomIn = function () {
    var newZoom = Math.min(this.zoomLevel + 10, this.maxZoom);
    this.setZoom(newZoom);
};

SQL.Zoom.prototype.zoomOut = function () {
    var newZoom = Math.max(this.zoomLevel - 10, this.minZoom);
    this.setZoom(newZoom);
};

SQL.Zoom.prototype.setZoom = function (value) {
    // Validate and clamp value
    var zoom = parseInt(value);
    if (isNaN(zoom)) {
        zoom = this.zoomLevel;
    }
    zoom = Math.max(this.minZoom, Math.min(zoom, this.maxZoom));
    
    this.zoomLevel = zoom;
    this.updateInput();
    this.applyZoom();
    this.owner.setOption("zoom", this.zoomLevel);
};

SQL.Zoom.prototype.updateInput = function () {
    if (this.dom.zoomInput) {
        this.dom.zoomInput.value = this.zoomLevel + "%";
    }
};

SQL.Zoom.prototype.applyZoom = function () {
    var area = OZ.$("area");
    if (area) {
        var scale = this.zoomLevel / 100;
        area.style.transform = "scale(" + scale + ")";
        area.style.transformOrigin = "top left";
    }
};

SQL.Zoom.prototype.getZoomFactor = function () {
    return this.zoomLevel / 100;
};

SQL.Zoom.prototype.handleInputChange = function () {
    this.processInputValue();
};

SQL.Zoom.prototype.handleInputKeypress = function (e) {
    if (e.keyCode === 13) { // Enter key
        this.processInputValue();
        this.dom.zoomInput.blur();
    }
};

SQL.Zoom.prototype.handleInputBlur = function () {
    this.processInputValue();
};

SQL.Zoom.prototype.processInputValue = function () {
    var value = this.dom.zoomInput.value;
    // Remove % sign if present
    value = value.replace(/%/g, "").trim();
    var numValue = parseInt(value);
    
    if (!isNaN(numValue)) {
        this.setZoom(numValue);
    } else {
        // Restore current value if invalid
        this.updateInput();
    }
};

