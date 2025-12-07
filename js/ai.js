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
    this.dom.dialog.innerHTML = `
        <h3>AI Assistant</h3>
        <textarea id="ai-prompt" placeholder="Describe the tables you want to create (e.g., 'Create a table for Users with email and password, and a generic Orders table linked to Users')."></textarea>
        <div class="ai-actions">
            <button id="ai-cancel">Cancel</button>
            <button id="ai-submit">Generate</button>
        </div>
        <div id="ai-status"></div>
    `;
    document.body.appendChild(this.dom.dialog);

    // Events
    OZ.Event.add(this.dom.btn, "click", this.toggle.bind(this));
    OZ.Event.add(this.dom.overlay, "click", this.toggle.bind(this));
    OZ.Event.add(document.getElementById('ai-cancel'), "click", this.toggle.bind(this));
    OZ.Event.add(document.getElementById('ai-submit'), "click", this.submit.bind(this));
}

SQL.AI.prototype.toggle = function() {
    var isVisible = this.dom.dialog.classList.contains('visible');
    if (isVisible) {
        this.dom.dialog.classList.remove('visible');
        this.dom.overlay.classList.remove('visible');
        this.dom.btn.classList.remove('hidden');
    } else {
        this.dom.dialog.classList.add('visible');
        this.dom.overlay.classList.add('visible');
        this.dom.btn.classList.add('hidden');
        document.getElementById('ai-prompt').focus();
    }
}

SQL.AI.prototype.submit = function() {
    var prompt = document.getElementById('ai-prompt').value;
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
    
    // Model Selection - Use agent directly or fallback
    var model = agent || "gemini-1.5-flash"; 
    
    // Endpoint for Gemini
    // Using v1beta for newer models, but some stable models might need v1
    var apiVersion = "v1beta";
    
    var url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${key}`;

    var systemPrompt = `You are an expert SQL database designer using wwwsqldesigner.
    The user wants to add tables to a database diagram.
    
    Context:
    - Existing Datatypes (use these): ${datatypes.join(", ")}.
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
    2. Create schemas for requested tables.
    3. Position them intelligently (avoid 0,0 if possible, spread them out e.g. x="100", x="300").
    4. Return ONLY the XML string. Do NOT use markdown code blocks.
    
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
        
        this.owner.updateFromXML(xmlDoc.documentElement);
        this.toggle(); // Close dialog
        this.setStatus("");
        document.getElementById('ai-prompt').value = "";
    } catch (e) {
        alert("Error parsing AI response: " + e.message);
        this.setStatus("Parsing Error");
    }
}
