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
    this.dom.optionaiagent = OZ.$("optionaiagent");
    this.dom.optionaiprovider = OZ.$("optionaiprovider");
    this.dom.optionaiapikey = OZ.$("optionaiapikey");
    this.dom.optionautosave = OZ.$("optionautosave");
    this.dom.btnlistmodels = OZ.$("btnlistmodels");

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
    this.owner.setOption("ai_provider", this.dom.optionaiprovider.value);
    this.owner.setOption("ai_agent", this.dom.optionaiagent.value);
    this.owner.setOption("ai_apikey", this.dom.optionaiapikey.value);
    this.owner.setOption("autosave", this.dom.optionautosave.checked ? "1" : "");
};

SQL.Options.prototype.click = function () {
    this.owner.window.open(_("options"), this.dom.container, this.save);
    this.dom.optionsnap.value = this.owner.getOption("snap");
    this.dom.optionpattern.value = this.owner.getOption("pattern");
    this.dom.optionhide.checked = this.owner.getOption("hide");
    this.dom.optionvector.checked = this.owner.getOption("vector");
    this.dom.optionshowsize.checked = this.owner.getOption("showsize");
    this.dom.optionshowtype.checked = this.owner.getOption("showtype");
    this.dom.optionaiprovider.value = this.owner.getOption("ai_provider") || "";
    this.dom.optionaiagent.value = this.owner.getOption("ai_agent") || "";
    this.dom.optionaiapikey.value = this.owner.getOption("ai_apikey") || "";
    this.dom.optionautosave.checked = this.owner.getOption("autosave") == "1";
    
    // Trigger update to set correct model if provider is already set
    this.updateModels();
};
