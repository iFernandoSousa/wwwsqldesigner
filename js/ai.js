/* --------------------- AI Agent ------------ */
SQL.AI = function(owner) {
    this.owner = owner;
    this.dom = {};
    this.build();
}

SQL.AI.prototype.build = function() {
    // Inject Styles
    var css = `
    #ai-btn {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: 50px;
        height: 50px;
        background-color: #2196F3;
        border-radius: 50%;
        cursor: pointer;
        z-index: 1000;
        display: flex;
        justify-content: center;
        align-items: center;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        transition: transform 0.2s, opacity 0.2s;
    }
    #ai-btn:hover {
        transform: translateX(-50%) scale(1.1);
    }
    #ai-btn.hidden {
        opacity: 0;
        pointer-events: none;
    }
    #ai-btn svg {
        fill: white;
        width: 24px;
        height: 24px;
    }
    #ai-dialog {
        display: none;
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        padding: 15px;
        border-radius: 12px;
        box-shadow: 0 5px 25px rgba(0,0,0,0.2);
        z-index: 1001;
        width: 600px;
        max-width: 90%;
        font-family: sans-serif;
        border: 1px solid #e0e0e0;
    }
    #ai-dialog.visible {
        display: block;
        animation: slideUp 0.3s ease-out;
    }
    @keyframes slideUp {
        from { transform: translate(-50%, 20px); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
    #ai-overlay {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.2);
        z-index: 1000;
        backdrop-filter: blur(2px);
    }
    #ai-overlay.visible {
        display: block;
    }
    #ai-prompt {
        width: 100%;
        height: 60px;
        margin-bottom: 10px;
        resize: none;
        padding: 10px;
        box-sizing: border-box;
        border: 1px solid #ccc;
        border-radius: 6px;
        font-family: inherit;
        font-size: 14px;
        line-height: 20px;
        overflow-y: auto;
    }
    #ai-mirror {
        position: absolute;
        visibility: hidden;
        pointer-events: none;
        background: transparent;
        white-space: pre-wrap;
        word-wrap: break-word;
        width: 100%;
        padding: 10px;
        box-sizing: border-box;
        font-family: inherit;
        font-size: 14px;
        line-height: 20px;
        border: 1px solid transparent;
        top: 45px; /* Adjust based on h3 height + padding */
        left: 0;
    }
    #ai-suggestions {
        display: none;
        position: absolute;
        background: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        z-index: 1002;
        max-height: 150px;
        overflow-y: auto;
        width: 200px;
    }
    #ai-suggestions.visible {
        display: block;
    }
    .ai-suggestion-item {
        padding: 8px 12px;
        cursor: pointer;
        font-size: 14px;
        color: #333;
    }
    .ai-suggestion-item:hover, .ai-suggestion-item.selected {
        background-color: #f0f0f0;
    }
    #ai-dialog h3 {
        margin: 0 0 10px 0;
        color: #333;
        font-size: 16px;
        font-weight: 600;
    }
    #ai-status {
        margin-top: 5px; 
        color: #666; 
        font-size: 0.85em;
        min-height: 1.2em;
        float: left;
    }
    .ai-actions {
        text-align: right;
    }
    .ai-actions button {
        padding: 8px 16px;
        margin-left: 8px;
        cursor: pointer;
        border: none;
        border-radius: 4px;
        font-weight: 500;
        transition: background-color 0.2s;
    }
    #ai-cancel {
        background-color: #f5f5f5;
        color: #333;
    }
    #ai-cancel:hover {
        background-color: #e0e0e0;
    }
    #ai-submit {
        background-color: #2196F3;
        color: white;
    }
    #ai-submit:hover {
        background-color: #1976D2;
    }
    `;
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    document.head.appendChild(style);

    // Build UI
    // Button
    this.dom.btn = document.createElement('div');
    this.dom.btn.id = 'ai-btn';
    // Sparkles Icon
    this.dom.btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 6 6.5 9.5 3 12l3.5 2.5L9 18l2.5-3.5L15 12l-3.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/></svg>';
    this.dom.btn.title = "Ask AI to create tables";
    document.body.appendChild(this.dom.btn);

    // Overlay
    this.dom.overlay = document.createElement('div');
    this.dom.overlay.id = 'ai-overlay';
    document.body.appendChild(this.dom.overlay);

    // Dialog
    this.dom.dialog = document.createElement('div');
    this.dom.dialog.id = 'ai-dialog';
    
    var h3 = document.createElement('h3');
    h3.innerText = 'AI Assistant';
    
    var prompt = document.createElement('textarea');
    prompt.id = 'ai-prompt';
    prompt.placeholder = 'Describe the tables you want to create... Use @ to reference existing tables.';
    
    var mirror = document.createElement('div');
    mirror.id = 'ai-mirror';

    var suggestions = document.createElement('div');
    suggestions.id = 'ai-suggestions';
    
    var status = document.createElement('div');
    status.id = 'ai-status';

    var actions = document.createElement('div');
    actions.className = 'ai-actions';

    var btnCancel = document.createElement('button');
    btnCancel.id = 'ai-cancel';
    btnCancel.innerText = 'Cancel';
    
    var btnSubmit = document.createElement('button');
    btnSubmit.id = 'ai-submit';
    btnSubmit.innerText = 'Generate';
    
    actions.appendChild(btnCancel);
    actions.appendChild(btnSubmit);
    
    this.dom.dialog.appendChild(h3);
    this.dom.dialog.appendChild(prompt);
    this.dom.dialog.appendChild(mirror);
    this.dom.dialog.appendChild(suggestions);
    this.dom.dialog.appendChild(status);
    this.dom.dialog.appendChild(actions);
    
    document.body.appendChild(this.dom.dialog);
    
    this.dom.prompt = prompt;
    this.dom.mirror = mirror;
    this.dom.suggestions = suggestions;
    
    var self = this;
    OZ.Event.add(this.dom.btn, "click", this.toggle.bind(this));
    OZ.Event.add(this.dom.overlay, "click", this.toggle.bind(this));
    OZ.Event.add(btnCancel, "click", this.toggle.bind(this));
    OZ.Event.add(btnSubmit, "click", this.submit.bind(this));
    
    // Autocomplete events
    OZ.Event.add(prompt, "input", this.handleInput.bind(this));
    OZ.Event.add(prompt, "keydown", this.handleKeydown.bind(this));
}

SQL.AI.prototype.toggle = function() {
    var isVisible = this.dom.dialog.classList.contains('visible');
    if (isVisible) {
        this.dom.dialog.classList.remove('visible');
        this.dom.overlay.classList.remove('visible');
        this.dom.btn.classList.remove('hidden');
        this.dom.suggestions.classList.remove('visible');
    } else {
        this.dom.dialog.classList.add('visible');
        this.dom.overlay.classList.add('visible');
        this.dom.btn.classList.add('hidden');
        this.dom.prompt.focus();
    }
}

SQL.AI.prototype.handleInput = function(e) {
    var text = this.dom.prompt.value;
    var cursor = this.dom.prompt.selectionStart;
    var lastAt = text.lastIndexOf('@', cursor - 1);
    
    if (lastAt !== -1) {
        var query = text.substring(lastAt + 1, cursor);
        // Check if there's a space, which means we stopped typing the name
        if (query.indexOf(' ') === -1) {
            this.showSuggestions(query, lastAt);
            return;
        }
    }
    this.hideSuggestions();
}

SQL.AI.prototype.handleKeydown = function(e) {
    if (!this.dom.suggestions.classList.contains('visible')) {
        this.handlePromptKeydown(e);
        return;
    }
    
    var items = this.dom.suggestions.children;
    var selectedIndex = -1;
    for (var i = 0; i < items.length; i++) {
        if (items[i].classList.contains('selected')) {
            selectedIndex = i;
            break;
        }
    }
    
    if (e.keyCode === 40) { // Down
        e.preventDefault();
        var nextIndex = (selectedIndex + 1) % items.length;
        this.selectSuggestion(nextIndex);
    } else if (e.keyCode === 38) { // Up
        e.preventDefault();
        var prevIndex = (selectedIndex - 1 + items.length) % items.length;
        this.selectSuggestion(prevIndex);
    } else if (e.keyCode === 13 || e.keyCode === 9) { // Enter or Tab
        if (selectedIndex !== -1) {
            e.preventDefault();
            items[selectedIndex].click();
        } else if (e.keyCode === 13 && (e.ctrlKey || e.metaKey)) {
             // Submit on Ctrl+Enter / Cmd+Enter
             this.submit();
        }
    } else if (e.keyCode === 27) { // Escape
        this.hideSuggestions();
        if (!this.dom.suggestions.classList.contains('visible')) {
             // If suggestions were already hidden (or we just hid them), close dialog? 
             // Actually if they were visible, we just hid them. 
             // Logic: If visible -> hide. If hidden -> close dialog.
             // But here we are inside "if visible" block (check top of function)
             // So this block ONLY runs if suggestions are visible.
        }
    }
}

// Global Keydown for prompt (when suggestions NOT visible)
SQL.AI.prototype.handlePromptKeydown = function(e) {
    if (this.dom.suggestions.classList.contains('visible')) return; // handled by handleKeydown

    if (e.keyCode === 27) { // Escape
        this.toggle();
    } else if (e.keyCode === 13 && (e.ctrlKey || e.metaKey)) { // Ctrl+Enter / Cmd+Enter
        this.submit();
    }
}

SQL.AI.prototype.showSuggestions = function(query, atIndex) {
    var tables = this.owner.tables;
    var matches = tables.filter(function(t) {
        return t.getTitle().toLowerCase().indexOf(query.toLowerCase()) !== -1;
    });
    
    if (matches.length === 0) {
        this.hideSuggestions();
        return;
    }
    
    this.dom.suggestions.innerHTML = '';
    var self = this;
    
    matches.forEach(function(t, index) {
        var div = document.createElement('div');
        div.className = 'ai-suggestion-item' + (index === 0 ? ' selected' : '');
        div.innerText = t.getTitle();
        div.onclick = function() {
            var text = self.dom.prompt.value;
            var before = text.substring(0, atIndex);
            var after = text.substring(self.dom.prompt.selectionStart);
            self.dom.prompt.value = before + '@' + t.getTitle() + ' ' + after;
            self.dom.prompt.focus();
            // Set cursor after the inserted text
            var newCursorPos = (before + '@' + t.getTitle() + ' ').length;
            self.dom.prompt.setSelectionRange(newCursorPos, newCursorPos);
            self.hideSuggestions();
        };
        self.dom.suggestions.appendChild(div);
    });
    
    // Position suggestions
    var text = this.dom.prompt.value.substring(0, this.dom.prompt.selectionStart);
    this.dom.mirror.textContent = text;
    var span = document.createElement('span');
    span.textContent = '.';
    this.dom.mirror.appendChild(span);
    
    // Calculate position
    // We need offset relative to the prompt box
    var promptRect = this.dom.prompt.getBoundingClientRect();
    var dialogRect = this.dom.dialog.getBoundingClientRect();
    
    // Offset of the span within the mirror
    // Mirror is positioned at the same place as prompt inside dialog?
    // We set mirror top: 45px. Prompt is likely similar. 
    // Actually we should align mirror exactly with prompt.
    // Let's rely on offsetLeft/Top of span relative to mirror.
    
    var mirrorRect = this.dom.mirror.getBoundingClientRect();
    var spanRect = span.getBoundingClientRect();
    
    var relativeTop = spanRect.top - mirrorRect.top;
    var relativeLeft = spanRect.left - mirrorRect.left;
    
    // Adjust for scroll
    relativeTop -= this.dom.prompt.scrollTop;
    
    // Final coordinates relative to Dialog
    // Prompt top relative to dialog:
    var promptTop = promptRect.top - dialogRect.top;
    var promptLeft = promptRect.left - dialogRect.left;
    
    var top = promptTop + relativeTop + 20; // + line-height
    var left = promptLeft + relativeLeft;

    this.dom.suggestions.style.top = top + 'px';
    this.dom.suggestions.style.left = left + 'px';
    this.dom.suggestions.classList.add('visible');
}

SQL.AI.prototype.selectSuggestion = function(index) {
    var items = this.dom.suggestions.children;
    for (var i = 0; i < items.length; i++) {
        items[i].classList.remove('selected');
    }
    if (index >= 0 && index < items.length) {
        items[index].classList.add('selected');
        items[index].scrollIntoView({ block: 'nearest' });
    }
}

SQL.AI.prototype.hideSuggestions = function() {
    this.dom.suggestions.classList.remove('visible');
}

SQL.AI.prototype.submit = function() {
    var prompt = this.dom.prompt.value;
    if (!prompt.trim()) return;

    var provider = this.owner.getOption("ai_provider");
    var agent = this.owner.getOption("ai_agent");
    var key = this.owner.getOption("ai_apikey");

    if (!key) {
        alert("Please configure the AI API Key in Options.");
        return;
    }

    this.setStatus("Generating...");
    
    // Call API
    if (provider === "Google Gemini") {
        this.callGemini(prompt, key, agent);
    } else {
        alert("Provider " + provider + " not implemented yet.");
        this.setStatus("Error: Provider not supported");
    }
}

SQL.AI.prototype.setStatus = function(msg) {
    document.getElementById('ai-status').innerText = msg;
}

SQL.AI.prototype.callGemini = function(userPrompt, key, agent) {
    // Construct system prompt
    var datatypes = [];
    if (window.DATATYPES) {
        var types = window.DATATYPES.getElementsByTagName("type");
        for (var i = 0; i < types.length; i++) {
            datatypes.push(types[i].getAttribute("label"));
        }
    }

    var compressedSchema = this.getCompressedSchema();
    
    // Model Selection - Use agent directly or fallback
    var model = agent || "gemini-1.5-flash"; 
    
    // Endpoint for Gemini
    // Using v1beta for newer models, but some stable models might need v1
    var apiVersion = "v1beta";
    
    var url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${key}`;

    var systemPrompt = `You are an expert SQL database designer using wwwsqldesigner.
    The user wants to modify the database schema (create tables, add columns/relations).
    
    Context:
    - Existing Datatypes (use these): ${datatypes.join(", ")}.
    - Current Database Schema (Compressed):
    ${compressedSchema}
    
    - Output must be valid XML for wwwsqldesigner.
    
    XML Structure for a table:
    <sql>
    <table name="table_name" x="100" y="100">
        <row name="id" null="0" autoincrement="1">
            <datatype>INTEGER</datatype>
            <default>NULL</default>
        </row>
        <row name="other_col" null="1" autoincrement="0">
            <datatype>VARCHAR(255)</datatype>
            <default>NULL</default>
        </row>
        <key type="PRIMARY" name="PRIMARY">
            <part>id</part>
        </key>
        <!-- Add other keys if needed -->
    </table>
    <!-- Add more tables if needed -->
    </sql>

    Relationships:
    To create a relationship (Foreign Key), add a <relation> tag INSIDE the <row> that is the foreign key.
    Example:
    <row name="user_id" null="1" autoincrement="0">
        <datatype>INTEGER</datatype>
        <default>NULL</default>
        <relation table="users" row="id" />
    </row>
    
    Instructions:
    1. Parse the User Request.
    2. Analyze the 'Current Database Schema' to understand existing tables and columns.
    3. If modifying an existing table (e.g. adding a column to @Users), return a <table> block with the EXACT name, containing ONLY the NEW <row> elements. Do NOT repeat existing columns.
    4. If creating a new table, return the full schema.
    5. Position new tables intelligently.
    6. Return ONLY the XML string. Do NOT use markdown code blocks.
    
    User Request: ${userPrompt}`;

    var payload = {
        contents: [{
            parts: [{
                text: systemPrompt
            }]
        }]
    };
    
    var self = this;
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(function(response) { 
        return response.json(); 
    })
    .then(function(data) {
        if (data.error) {
            throw new Error(data.error.message);
        }
        if (!data.candidates || data.candidates.length === 0) {
             throw new Error("No response from AI");
        }
        var text = data.candidates[0].content.parts[0].text;
        // Clean up markdown if present
        text = text.replace(/```xml/g, '').replace(/```/g, '').trim();
        
        self.handleResponse(text);
    })
    .catch(function(err) {
        alert("AI Error: " + err.message);
        self.setStatus("Error: " + err.message);
    });
}

SQL.AI.prototype.handleResponse = function(xmlText) {
    try {
        var parser = new DOMParser();
        var xmlDoc = parser.parseFromString(xmlText, "text/xml");
        
        if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
            throw new Error("Invalid XML returned by AI");
        }
        
        this.updateSchema(xmlDoc.documentElement);
        this.toggle(); // Close dialog
        this.setStatus("");
        this.dom.prompt.value = "";
    } catch (e) {
        alert("Error parsing AI response: " + e.message);
        this.setStatus("Parsing Error");
    }
}

SQL.AI.prototype.updateSchema = function(xmlRoot) {
    var tables = xmlRoot.getElementsByTagName("table");
    for (var i = 0; i < tables.length; i++) {
        var tableNode = tables[i];
        var name = tableNode.getAttribute("name");
        var x = parseInt(tableNode.getAttribute("x")) || 0;
        var y = parseInt(tableNode.getAttribute("y")) || 0;
        
        var table = this.owner.findNamedTable(name);
        if (!table) {
            table = this.owner.addTable(name, x, y);
        } else {
            // Preserve existing position for existing tables
            // The AI context doesn't include coordinates, so it can't preserve them.
            // We must force the current coordinates back into the XML node before processing.
            tableNode.setAttribute("x", table.x);
            tableNode.setAttribute("y", table.y);
        }
        
        // Append new rows/keys from the node
        table.fromXML(tableNode);
    }
    
    // Process relations (copied logic from updateFromXML to ensure relations are linked)
    var rs = xmlRoot.getElementsByTagName("relation");
    for (var i = 0; i < rs.length; i++) {
        var rel = rs[i];
        var tname = rel.getAttribute("table");
        var rname = rel.getAttribute("row");

        var t1 = this.owner.findNamedTable(tname);
        if (!t1) continue;
        
        var r1 = t1.findNamedRow(rname);
        if (!r1) continue;

        var sourceTName = rel.parentNode.parentNode.getAttribute("name");
        var sourceRName = rel.parentNode.getAttribute("name");
        var t2 = this.owner.findNamedTable(sourceTName);
        if (!t2) continue;
        
        var r2 = t2.findNamedRow(sourceRName);
        if (!r2) continue;

        this.owner.addRelation(r1, r2);
    }
    
    this.owner.sync();
}

SQL.AI.prototype.organizeTables = function() {
    var key = this.owner.getOption("ai_apikey");
    if (!key) {
        alert("Please configure the AI API Key in Options.");
        return;
    }
    
    document.body.style.cursor = "wait";
    
    var schema = this.getCompressedSchema();
    var prompt = `Analyze the following database schema and provide optimal X, Y coordinates for each table to create a clear, readable diagram.
The canvas is infinite but try to keep them within 0,0 to 2000,2000.
Group related tables together. Minimize crossing lines.

Schema:
${schema}

Return STRICT JSON format only:
{
  "tableName1": { "x": 100, "y": 100 },
  "tableName2": { "x": 300, "y": 100 }
}`;

    this.callGeminiForOrganization(prompt, key);
}

SQL.AI.prototype.callGeminiForOrganization = function(prompt, key) {
    var agent = this.owner.getOption("ai_agent");
    var model = agent || "gemini-1.5-flash"; 
    var apiVersion = "v1beta";
    var url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${key}`;

    var payload = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }],
        generationConfig: {
            responseMimeType: "application/json"
        }
    };
    
    var self = this;
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        document.body.style.cursor = "default";
        if (data.error) throw new Error(data.error.message);
        
        var text = data.candidates[0].content.parts[0].text;
        // Clean markdown
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        var positions = JSON.parse(text);
        self.applyOrganization(positions);
    })
    .catch(function(err) {
        document.body.style.cursor = "default";
        alert("AI Organization Error: " + err.message);
    });
}

SQL.AI.prototype.applyOrganization = function(positions) {
    for (var name in positions) {
        var table = this.owner.findNamedTable(name);
        if (table) {
            var pos = positions[name];
            table.moveTo(pos.x, pos.y);
        }
    }
    this.owner.sync();
}

SQL.AI.prototype.getCompressedSchema = function() {
    var schema = "";
    var tables = this.owner.tables;
    
    for (var i = 0; i < tables.length; i++) {
        var table = tables[i];
        schema += "Table: " + table.getTitle() + "\n";
        
        for (var j = 0; j < table.rows.length; j++) {
            var row = table.rows[j];
            var typeStr = "";
            
            // Get data type name
            var typeIndex = row.data.type;
            if (window.DATATYPES) {
                var typeEl = window.DATATYPES.getElementsByTagName("type")[typeIndex];
                if (typeEl) {
                    typeStr = typeEl.getAttribute("label");
                    // Add size if applicable
                    if (row.data.size) {
                        typeStr += "(" + row.data.size + ")";
                    }
                }
            }
            
            // Flags
            var flags = [];
            if (row.isPrimary()) flags.push("PK");
            if (row.data.ai) flags.push("AI");
            if (!row.data.nll) flags.push("NOT NULL");
            
            // Relations
            for (var k = 0; k < row.relations.length; k++) {
                var rel = row.relations[k];
                if (rel.row1 === row) { // If this row is the source of the relation (FK)
                    flags.push("FK -> " + rel.row2.owner.getTitle() + "." + rel.row2.getTitle());
                }
            }
            
            schema += "  " + row.getTitle() + ": " + typeStr;
            if (flags.length > 0) {
                schema += " (" + flags.join(", ") + ")";
            }
            schema += "\n";
        }
        schema += "\n";
    }
    return schema;
}
