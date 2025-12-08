/* --------------------- options ------------ */

SQL.Options = function (owner) {
    this.owner = owner;
    this.dom = {
        container: OZ.$("opts"),
        btn: OZ.$("options"),
    };
    this.dom.btn.value = _("options");
    this.save = this.save.bind(this);
    this.build();
};

SQL.Options.prototype.build = function () {
    this.dom.optionlocale = OZ.$("optionlocale");
    this.dom.optiondb = OZ.$("optiondb");
    this.dom.optionsnap = OZ.$("optionsnap");
    this.dom.optionpattern = OZ.$("optionpattern");
    this.dom.optionstyle = OZ.$("optionstyle");
    this.dom.optionhide = OZ.$("optionhide");
    this.dom.optionvector = OZ.$("optionvector");
    this.dom.optionshowsize = OZ.$("optionshowsize");
    this.dom.optionshowtype = OZ.$("optionshowtype");
    this.dom.optionshownull = OZ.$("optionshownull");
    this.dom.optionaiagent = OZ.$("optionaiagent");
    this.dom.optionaiprovider = OZ.$("optionaiprovider");
    this.dom.optionaiapikey = OZ.$("optionaiapikey");
    this.dom.optionautosave = OZ.$("optionautosave");
    this.dom.btnlistmodels = OZ.$("btnlistmodels");
    this.dom.btnlistmodels.value = _("listmodels");

    var ids = [
        "language",
        "db",
        "snap",
        "pattern",
        "style",
        "hide",
        "vector",
        "showsize",
        "showtype",
        "shownull",
        "optionsnapnotice",
        "optionpatternnotice",
        "optionsnotice",
        "aiagent",
        "aiprovider",
        "aiapikey",
        "autosave"
    ];
    for (var i = 0; i < ids.length; i++) {
        var id = ids[i];
        var elm = OZ.$(id);
        // Skip AI labels as they are set directly in HTML
        if (id !== "aiagent" && id !== "aiapikey" && id !== "aiprovider") {
            elm.innerHTML = _(id);
        }
    }

    var ls = CONFIG.AVAILABLE_LOCALES;
    OZ.DOM.clear(this.dom.optionlocale);
    for (var i = 0; i < ls.length; i++) {
        var o = OZ.DOM.elm("option");
        o.value = ls[i];
        o.innerHTML = ls[i];
        this.dom.optionlocale.appendChild(o);
        if (this.owner.getOption("locale") == ls[i]) {
            this.dom.optionlocale.selectedIndex = i;
        }
    }

    var dbs = CONFIG.AVAILABLE_DBS;
    OZ.DOM.clear(this.dom.optiondb);
    for (var i = 0; i < dbs.length; i++) {
        var o = OZ.DOM.elm("option");
        o.value = dbs[i];
        o.innerHTML = dbs[i];
        this.dom.optiondb.appendChild(o);
        if (this.owner.getOption("db") == dbs[i]) {
            this.dom.optiondb.selectedIndex = i;
        }
    }

    var styles = CONFIG.STYLES;
    OZ.DOM.clear(this.dom.optionstyle);
    for (var i = 0; i < styles.length; i++) {
        var o = OZ.DOM.elm("option");
        o.value = styles[i];
        o.innerHTML = styles[i];
        this.dom.optionstyle.appendChild(o);
        if (this.owner.getOption("style") == styles[i]) {
            this.dom.optionstyle.selectedIndex = i;
        }
    }

    var providers = CONFIG.AVAILABLE_AI_PROVIDERS;
    OZ.DOM.clear(this.dom.optionaiprovider);
    var o = OZ.DOM.elm("option");
    o.value = "";
    o.innerHTML = "";
    this.dom.optionaiprovider.appendChild(o);
    for (var i = 0; i < providers.length; i++) {
        var o = OZ.DOM.elm("option");
        o.value = providers[i];
        o.innerHTML = providers[i];
        this.dom.optionaiprovider.appendChild(o);
        if (this.owner.getOption("ai_provider") == providers[i]) {
            this.dom.optionaiprovider.selectedIndex = i + 1;
        }
    }

    // Populate models based on current provider or defaults
    this.updateModels();

    OZ.Event.add(this.dom.btn, "click", this.click.bind(this));
    OZ.Event.add(this.dom.btnlistmodels, "click", this.listModels.bind(this));
    OZ.Event.add(this.dom.optionaiprovider, "change", this.updateModels.bind(this));

    // Add change event listeners for auto-refresh
    OZ.Event.add(this.dom.optionlocale, "change", this.handleLocaleChange.bind(this));
    OZ.Event.add(this.dom.optiondb, "change", this.handleDBChange.bind(this));
    OZ.Event.add(this.dom.optionstyle, "change", this.handleStyleChange.bind(this));
    OZ.Event.add(this.dom.optionshowtype, "change", this.handleShowTypeChange.bind(this));
    OZ.Event.add(this.dom.optionshowsize, "change", this.handleShowSizeChange.bind(this));
    OZ.Event.add(this.dom.optionshownull, "change", this.handleShowNullChange.bind(this));
    
    // Add event listeners for AI configuration changes
    OZ.Event.add(this.dom.optionaiapikey, "input", this.handleAIConfigChange.bind(this));
    OZ.Event.add(this.dom.optionaiagent, "change", this.handleAIConfigChange.bind(this));

    this.dom.container.parentNode.removeChild(this.dom.container);
};

SQL.Options.prototype.updateModels = function() {
    var provider = this.dom.optionaiprovider.value;
    var currentModel = this.owner.getOption("ai_agent");
    
    // Try to load models from localStorage
    if (provider) {
        try {
            var stored = localStorage.getItem("sql_ai_models_" + provider);
            if (stored) {
                var models = JSON.parse(stored);
                if (Array.isArray(models) && models.length > 0) {
                     CONFIG.AI_MODELS[provider] = models;
                }
            }
        } catch(e) {}
    }

    OZ.DOM.clear(this.dom.optionaiagent);
    
    // Add empty option
    var o = OZ.DOM.elm("option");
    o.value = "";
    o.innerHTML = "";
    this.dom.optionaiagent.appendChild(o);

    if (provider && CONFIG.AI_MODELS[provider]) {
        var models = CONFIG.AI_MODELS[provider];
        for (var i = 0; i < models.length; i++) {
            var o = OZ.DOM.elm("option");
            o.value = models[i];
            o.innerHTML = models[i];
            this.dom.optionaiagent.appendChild(o);
            if (currentModel == models[i]) {
                this.dom.optionaiagent.selectedIndex = i + 1;
            }
        }
    }
}

SQL.Options.prototype.listModels = function() {
    var provider = this.dom.optionaiprovider.value;
    var key = this.dom.optionaiapikey.value;

    if (!provider || !key) {
        alert("Please select a provider and enter an API Key.");
        return;
    }

    var self = this;
    var btn = this.dom.btnlistmodels;
    var originalText = btn.value;
    btn.value = "Loading...";
    btn.disabled = true;

    if (provider === "Google Gemini") {
        var url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.models) {
                var models = data.models
                    .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
                    .filter(m => !m.name.includes("image")) // Exclude image models
                    .filter(m => !m.name.includes("video")) // Exclude video models
                    .filter(m => !m.name.includes("veo"))   // Exclude Veo models
                    .filter(m => !m.name.includes("imagen")) // Exclude Imagen models
                    .filter(m => !m.displayName.toLowerCase().includes("image")) // Check display name too
                    .filter(m => !m.name.includes("nano")) // Exclude Nano models
                    .filter(m => !m.displayName.toLowerCase().includes("banana")) // Exclude Banana models
                    .map(m => m.name.replace("models/", ""));
                
                // Update Config to cache (optional) or just UI
                CONFIG.AI_MODELS["Google Gemini"] = models;
                
                // Save to localStorage
                try {
                    localStorage.setItem("sql_ai_models_" + provider, JSON.stringify(models));
                } catch(e) {}

                self.updateModels();
                // alert("Models updated from Gemini API!");
            } else if (data.error) {
                throw new Error(data.error.message);
            }
        })
        .catch(err => {
            alert("Error fetching models: " + err.message);
        })
        .finally(() => {
            btn.value = originalText;
            btn.disabled = false;
        });
    } else {
        alert("Model listing not yet implemented for " + provider);
        btn.value = originalText;
        btn.disabled = false;
    }
}

SQL.Options.prototype.save = function () {
    this.owner.setOption("locale", this.dom.optionlocale.value);
    this.owner.setOption("db", this.dom.optiondb.value);
    this.owner.setOption("snap", this.dom.optionsnap.value);
    this.owner.setOption("pattern", this.dom.optionpattern.value);
    this.owner.setOption("style", this.dom.optionstyle.value);
    this.owner.setOption("hide", this.dom.optionhide.checked ? "1" : "");
    this.owner.setOption("vector", this.dom.optionvector.checked ? "1" : "");
    this.owner.setOption(
        "showsize",
        this.dom.optionshowsize.checked ? "1" : ""
    );
    this.owner.setOption(
        "showtype",
        this.dom.optionshowtype.checked ? "1" : ""
    );
    this.owner.setOption(
        "shownull",
        this.dom.optionshownull.checked ? "1" : ""
    );
    this.owner.setOption("ai_provider", this.dom.optionaiprovider.value);
    this.owner.setOption("ai_agent", this.dom.optionaiagent.value);
    this.owner.setOption("ai_apikey", this.dom.optionaiapikey.value);
    this.owner.setOption("autosave", this.dom.optionautosave.checked ? "1" : "");
    
    // Update AI button visibility when options are saved
    if (this.owner.ai && this.owner.ai.updateButtonVisibility) {
        this.owner.ai.updateButtonVisibility();
    }
};

SQL.Options.prototype.handleStyleChange = function () {
    var newStyle = this.dom.optionstyle.value;
    this.owner.setOption("style", newStyle);
    this.owner.applyStyle();
};

SQL.Options.prototype.handleLocaleChange = function () {
    var newLocale = this.dom.optionlocale.value;
    this.owner.setOption("locale", newLocale);
    // Request new locale and update UI when loaded
    this.owner.requestLanguage(function() {
        this.owner.updateLocaleUI();
    }.bind(this));
};

SQL.Options.prototype.handleDBChange = function () {
    var newDB = this.dom.optiondb.value;
    this.owner.setOption("db", newDB);
    // Request new datatypes and update UI when loaded
    this.owner.requestDB(function() {
        this.owner.updateDatatypesUI();
    }.bind(this));
};

SQL.Options.prototype.handleShowTypeChange = function () {
    var showType = this.dom.optionshowtype.checked ? "1" : "";
    this.owner.setOption("showtype", showType);
    // Redraw all rows to reflect the change
    this.owner.updateRowDisplayOptions();
};

SQL.Options.prototype.handleShowSizeChange = function () {
    var showSize = this.dom.optionshowsize.checked ? "1" : "";
    this.owner.setOption("showsize", showSize);
    // Redraw all rows to reflect the change
    this.owner.updateRowDisplayOptions();
};

SQL.Options.prototype.handleShowNullChange = function () {
    var showNull = this.dom.optionshownull.checked ? "1" : "";
    this.owner.setOption("shownull", showNull);
    // Redraw all rows to reflect the change
    this.owner.updateRowDisplayOptions();
};

SQL.Options.prototype.handleAIConfigChange = function () {
    // Update AI button visibility when API key or model changes
    if (this.owner.ai && this.owner.ai.updateButtonVisibility) {
        // Temporarily update the options to check visibility
        var oldKey = this.owner.getOption("ai_apikey");
        var oldModel = this.owner.getOption("ai_agent");
        this.owner.setOption("ai_apikey", this.dom.optionaiapikey.value);
        this.owner.setOption("ai_agent", this.dom.optionaiagent.value);
        this.owner.ai.updateButtonVisibility();
        // Restore old values (they'll be saved when user clicks OK)
        this.owner.setOption("ai_apikey", oldKey);
        this.owner.setOption("ai_agent", oldModel);
    }
};

SQL.Options.prototype.click = function () {
    this.owner.window.open(_("options"), this.dom.container, this.save);
    this.dom.optionsnap.value = this.owner.getOption("snap");
    this.dom.optionpattern.value = this.owner.getOption("pattern");
    this.dom.optionhide.checked = this.owner.getOption("hide");
    this.dom.optionvector.checked = this.owner.getOption("vector");
    this.dom.optionshowsize.checked = this.owner.getOption("showsize");
    this.dom.optionshowtype.checked = this.owner.getOption("showtype");
    this.dom.optionshownull.checked = this.owner.getOption("shownull");
    this.dom.optionaiprovider.value = this.owner.getOption("ai_provider") || "";
    this.dom.optionaiagent.value = this.owner.getOption("ai_agent") || "";
    this.dom.optionaiapikey.value = this.owner.getOption("ai_apikey") || "";
    this.dom.optionautosave.checked = this.owner.getOption("autosave") == "1";
    
    // Trigger update to set correct model if provider is already set
    this.updateModels();
    
    // Update AI button visibility when options dialog opens
    if (this.owner.ai && this.owner.ai.updateButtonVisibility) {
        this.owner.ai.updateButtonVisibility();
    }
};
