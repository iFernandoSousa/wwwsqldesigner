/* --------------------- table manager ------------ */

SQL.TableManager = function (owner) {
    this.owner = owner;
    this.dom = {
        container: OZ.$("table"),
        name: OZ.$("tablename"),
        comment: OZ.$("tablecomment"),
    };
    this.selection = [];
    this.adding = false;
    this.clipboard = null; // stores copied table data
    this.pendingTablePosition = null; // stores position for pending table creation

    var ids = [
        "addtable",
        "removetable",
        "aligntables",
        "aiorganize",
        "cleartables",
        "addrow",
        "edittable",
        "tablekeys",
    ];
    for (var i = 0; i < ids.length; i++) {
        var id = ids[i];
        var elm = OZ.$(id);
        this.dom[id] = elm;
        elm.value = _(id);
    }

    var ids = ["tablenamelabel", "tablecommentlabel"];
    for (var i = 0; i < ids.length; i++) {
        var id = ids[i];
        var elm = OZ.$(id);
        elm.innerHTML = _(id);
    }

    this.select(false);

    this.save = this.save.bind(this);

    OZ.Event.add("area", "click", this.click.bind(this));
    OZ.Event.add(this.dom.addtable, "click", this.preAdd.bind(this));
    OZ.Event.add(this.dom.removetable, "click", this.remove.bind(this));
    OZ.Event.add(this.dom.cleartables, "click", this.clear.bind(this));
    OZ.Event.add(this.dom.addrow, "click", this.addRow.bind(this));
    OZ.Event.add(
        this.dom.aligntables,
        "click",
        this.owner.alignTables.bind(this.owner)
    );
    OZ.Event.add(
        this.dom.aiorganize,
        "click",
        function() {
            this.owner.ai.organizeTables();
        }.bind(this)
    );
    OZ.Event.add(this.dom.edittable, "click", this.edit.bind(this));
    OZ.Event.add(this.dom.tablekeys, "click", this.keys.bind(this));
    OZ.Event.add(document, "keydown", this.press.bind(this));

    this.dom.container.parentNode.removeChild(this.dom.container);
};

SQL.TableManager.prototype.addRow = function (e) {
    var newrow = this.selection[0].addRow(_("newrow"));
    this.owner.rowManager.select(newrow);
    newrow.expand();
};

SQL.TableManager.prototype.select = function (table, multi) {
    /* activate table */
    if (table) {
        if (multi) {
            var i = this.selection.indexOf(table);
            if (i < 0) {
                this.selection.push(table);
            } else {
                this.selection.splice(i, 1);
            }
        } else {
            if (this.selection[0] === table) {
                return;
            }
            this.selection = [table];
        }
    } else {
        this.selection = [];
    }
    this.processSelection();
};

SQL.TableManager.prototype.processSelection = function () {
    var tables = this.owner.tables;
    for (var i = 0; i < tables.length; i++) {
        tables[i].deselect();
    }
    if (this.selection.length == 1) {
        this.dom.addrow.disabled = false;
        this.dom.edittable.disabled = false;
        this.dom.tablekeys.disabled = false;
        this.dom.removetable.value = _("removetable");
    } else {
        this.dom.addrow.disabled = true;
        this.dom.edittable.disabled = true;
        this.dom.tablekeys.disabled = true;
    }
    if (this.selection.length) {
        this.dom.removetable.disabled = false;
        if (this.selection.length > 1) {
            this.dom.removetable.value = _("removetables");
        }
    } else {
        this.dom.removetable.disabled = true;
        this.dom.removetable.value = _("removetable");
    }
    for (var i = 0; i < this.selection.length; i++) {
        var t = this.selection[i];
        t.owner.raise(t);
        t.select();
    }
};

SQL.TableManager.prototype.selectRect = function (x, y, width, height) {
    /* select all tables intersecting a rectangle */
    this.selection = [];
    var tables = this.owner.tables;
    var x1 = x + width;
    var y1 = y + height;
    for (var i = 0; i < tables.length; i++) {
        var t = tables[i];
        var tx = t.x;
        var tx1 = t.x + t.width;
        var ty = t.y;
        var ty1 = t.y + t.height;
        if (
            ((tx >= x && tx < x1) ||
                (tx1 >= x && tx1 < x1) ||
                (tx < x && tx1 > x1)) &&
            ((ty >= y && ty < y1) ||
                (ty1 >= y && ty1 < y1) ||
                (ty < y && ty1 > y1))
        ) {
            this.selection.push(t);
        }
    }
    this.processSelection();
};

SQL.TableManager.prototype.click = function (e) {
    /* finish adding new table */
    var target = OZ.Event.target(e);
    var area = OZ.$("area");
    
    // Only process if clicking directly on area or its direct children (like SVG)
    // Skip if clicking on a table or other interactive element
    var clickedOnTable = false;
    while (target && target !== area && target !== document.body) {
        if (target.className && target.className.indexOf && target.className.indexOf("table") !== -1) {
            clickedOnTable = true;
            break;
        }
        target = target.parentNode;
    }
    
    // If we clicked on a table, let the table handle it
    if (clickedOnTable && !this.adding) {
        return;
    }
    
    var newtable = false;
    if (this.adding) {
        // Store the click position for table creation
        var scroll = OZ.DOM.scroll();
        this.pendingTablePosition = {
            x: e.clientX + scroll[0],
            y: e.clientY + scroll[1]
        };
        
        // Show the popup first, don't create table yet
        this.showAddTableDialog();
        return;
    }
    
    this.select(newtable);
    this.owner.rowManager.select(false);
    if (this.selection.length == 1) {
        this.edit(e);
    }
};

SQL.TableManager.prototype.preAdd = function (e) {
    /* click add new table */
    if (this.adding) {
        // Cancel adding mode
        this.adding = false;
        this.pendingTablePosition = null;
        OZ.DOM.removeClass("area", "adding");
        this.dom.addtable.value = this.oldvalue;
        // Close window if open
        if (this.owner.window.state) {
            this.owner.window.close();
        }
    } else {
        this.adding = true;
        OZ.DOM.addClass("area", "adding");
        this.oldvalue = this.dom.addtable.value;
        this.dom.addtable.value = "[" + _("addpending") + "]";
    }
};

SQL.TableManager.prototype.clear = function (e) {
    /* remove all tables */
    if (!this.owner.tables.length) {
        return;
    }
    var result = confirm(_("confirmall") + " ?");
    if (!result) {
        return;
    }
    this.owner.clearTables();
};

SQL.TableManager.prototype.remove = function (e) {
    var titles = this.selection.slice(0);
    for (var i = 0; i < titles.length; i++) {
        titles[i] = "'" + titles[i].getTitle() + "'";
    }
    var result = confirm(_("confirmtable") + " " + titles.join(", ") + "?");
    if (!result) {
        return;
    }
    var sel = this.selection.slice(0);
    for (var i = 0; i < sel.length; i++) {
        this.owner.removeTable(sel[i]);
    }
};

SQL.TableManager.prototype.showAddTableDialog = function () {
    /* show dialog for creating new table */
    // Clear the form
    this.dom.name.value = _("newtable");
    this.dom.comment.value = "";
    
    // Store a flag to track if table was created
    this.tableCreatedFromDialog = false;
    
    // Store original close function to handle cancel
    var originalClose = this.owner.window.close;
    var self = this;
    
    // Wrap close to handle cancel
    this.owner.window.close = function() {
        // If canceling during add (window is closing but table wasn't created), clean up
        if (self.adding && self.pendingTablePosition && !self.tableCreatedFromDialog) {
            self.adding = false;
            self.pendingTablePosition = null;
            OZ.DOM.removeClass("area", "adding");
            self.dom.addtable.value = self.oldvalue;
        }
        // Restore original and call it
        self.owner.window.close = originalClose;
        originalClose.call(this);
    };
    
    // Open window with callback to create table
    this.owner.window.open(_("edittable"), this.dom.container, this.createPendingTable.bind(this));
    
    // Pre-select table name
    this.dom.name.focus();
    if (OZ.ie) {
        try {
            this.dom.name.select();
        } catch (e) {}
    } else {
        this.dom.name.setSelectionRange(0, this.dom.name.value.length);
    }
};

SQL.TableManager.prototype.createPendingTable = function () {
    /* create the pending table after user confirms */
    if (!this.pendingTablePosition) {
        return;
    }
    
    var name = this.dom.name.value.trim();
    if (!name) {
        name = _("newtable");
    }
    
    var comment = this.dom.comment.value;
    
    // Mark that we're creating (not canceling)
    this.tableCreatedFromDialog = true;
    
    // Create the table at the stored position
    var newtable = this.owner.addTable(name, this.pendingTablePosition.x, this.pendingTablePosition.y);
    newtable.setComment(comment);
    var r = newtable.addRow("id", { ai: true });
    var k = newtable.addKey("PRIMARY", "");
    k.addRow(r);
    
    // Clean up
    this.adding = false;
    this.pendingTablePosition = null;
    OZ.DOM.removeClass("area", "adding");
    this.dom.addtable.value = this.oldvalue;
    
    // Select the new table
    this.select(newtable);
    this.owner.rowManager.select(false);
};

SQL.TableManager.prototype.edit = function (e) {
    this.owner.window.open(_("edittable"), this.dom.container, this.save);

    var title = this.selection[0].getTitle();
    this.dom.name.value = title;
    try {
        /* throws in ie6 */
        this.dom.comment.value = this.selection[0].getComment();
    } catch (e) {}

    /* pre-select table name */
    this.dom.name.focus();
    if (OZ.ie) {
        try {
            /* throws in ie6 */
            this.dom.name.select();
        } catch (e) {}
    } else {
        this.dom.name.setSelectionRange(0, title.length);
    }
};

SQL.TableManager.prototype.keys = function (e) {
    /* open keys dialog */
    this.owner.keyManager.open(this.selection[0]);
};

SQL.TableManager.prototype.save = function () {
    this.selection[0].setTitle(this.dom.name.value);
    this.selection[0].setComment(this.dom.comment.value);
    this.owner.flagModified();
};

SQL.TableManager.prototype.copy = function () {
    /* copy selected table to clipboard */
    if (this.selection.length != 1) {
        return;
    }
    var table = this.selection[0];
    var xmlString = table.toXML();
    // Parse XML to get a clean copy
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(xmlString, "text/xml");
    this.clipboard = {
        type: "table",
        xml: xmlDoc.documentElement,
        originalName: table.getTitle()
    };
};

SQL.TableManager.prototype.paste = function () {
    /* paste table from clipboard */
    if (!this.clipboard || this.clipboard.type != "table") {
        return;
    }
    
    // Clone the XML node to avoid modifying the original
    var table = this.clipboard.xml.cloneNode(true);
    var originalName = this.clipboard.originalName;
    var newName = originalName + "_copy";
    
    // Ensure unique name
    var nameCounter = 1;
    while (this.owner.tables.some(function(t) { return t.getTitle() == newName; })) {
        newName = originalName + "_copy" + (nameCounter > 1 ? nameCounter : "");
        nameCounter++;
    }
    
    // Update the name in the XML
    table.setAttribute("name", newName);
    
    // Calculate offset position (far enough to avoid overlap)
    var offsetX = 200;
    var offsetY = 200;
    var x = parseInt(table.getAttribute("x")) || 0;
    var y = parseInt(table.getAttribute("y")) || 0;
    
    // Update the position in the XML BEFORE calling fromXML
    // This ensures fromXML uses the offset position
    table.setAttribute("x", x + offsetX);
    table.setAttribute("y", y + offsetY);
    
    var maxZ = this.owner.getMaxZ();
    
    // Create new table (position will be set by fromXML)
    var newTable = this.owner.addTable(newName, 0, 0);
    newTable.setZ(maxZ + 1);
    
    // Load data from XML
    newTable.fromXML(table);
    
    // Select the new table
    this.select(newTable);
    this.owner.sync();
};

SQL.TableManager.prototype.press = function (e) {
    var target = OZ.Event.target(e).nodeName.toLowerCase();
    if (target == "textarea" || target == "input") {
        return;
    } /* not when in form field */

    if (this.owner.rowManager.selected) {
        return;
    } /* do not process keypresses if a row is selected */

    var ctrlKey = e.ctrlKey || e.metaKey;
    
    // Handle copy (Ctrl+C or Cmd+C)
    if (ctrlKey && e.keyCode == 67) {
        if (this.selection.length == 1) {
            this.copy();
            OZ.Event.prevent(e);
        }
        return;
    }
    
    // Handle paste (Ctrl+V or Cmd+V)
    if (ctrlKey && e.keyCode == 86) {
        if (this.clipboard && this.clipboard.type == "table") {
            this.paste();
            OZ.Event.prevent(e);
            return;
        }
        // Also check if row manager has a row in clipboard and a table is selected
        if (this.owner.rowManager.clipboard && 
            this.owner.rowManager.clipboard.type == "row" && 
            this.selection.length == 1) {
            this.owner.rowManager.paste();
            OZ.Event.prevent(e);
            return;
        }
    }

    if (!this.selection.length) {
        return;
    } /* nothing if selection is active */

    switch (e.keyCode) {
        case 46:
            this.remove();
            OZ.Event.prevent(e);
            break;
    }
};
