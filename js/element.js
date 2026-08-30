function el_display(bool) { return bool ? "" : "none" }
function el_classes(data) { return Object.keys(data).filter(x => data[x]).join(" ") }

// Per-tick DOM writes (innerHTML/textContent/style/className) are what actually costs CPU via
// reflow, not the surrounding JS. These caches let hot render paths skip the write entirely
// when the value they'd set is identical to last time.
const RENDER_CACHE = { text: new Map(), html: new Map(), display: new Map(), cls: new Map(), style: new Map() }

// Map.get() returns undefined both for "never cached" and "cached as
// undefined", so a bare `=== value` check silently skips the very first
// write whenever the caller's computed value happens to be undefined
// (e.g. an unl() check built from `||`/`&&` over a not-yet-set player
// property) - the element is then stuck at its CSS-default state (often
// visible) until a later call happens to produce a different value.
// has() disambiguates the two cases so the first write always happens.
function setText(id, value) {
    if (RENDER_CACHE.text.has(id) && RENDER_CACHE.text.get(id) === value) return
    RENDER_CACHE.text.set(id, value)
    el(id).textContent = value
}
function setHTML(id, value) {
    if (RENDER_CACHE.html.has(id) && RENDER_CACHE.html.get(id) === value) return
    RENDER_CACHE.html.set(id, value)
    el(id).innerHTML = value
}
function setDisplay(id, visible) {
    if (RENDER_CACHE.display.has(id) && RENDER_CACHE.display.get(id) === visible) return
    RENDER_CACHE.display.set(id, visible)
    el(id).style.display = el_display(visible)
}
function setClass(id, value) {
    if (RENDER_CACHE.cls.has(id) && RENDER_CACHE.cls.get(id) === value) return
    RENDER_CACHE.cls.set(id, value)
    el(id).className = value
}
function setStyle(id, prop, value) {
    let key = id + '.' + prop
    if (RENDER_CACHE.style.has(key) && RENDER_CACHE.style.get(key) === value) return
    RENDER_CACHE.style.set(key, value)
    el(id).style[prop] = value
}

function updateHTML() {
    updateTabs()

    updateSharkUpgradesHTML()

    var f, ff = []

    setDisplay('fish-div', !player.omni.active)
    let speedDisplay = !player.omni.god && player.omni.active
    setDisplay('game-speed-div', speedDisplay)
    setDisplay('antimatter-div', speedDisplay)
    setDisplay('antimatter-god-div', speedDisplay)
    setDisplay('antimatter-equivalent-div', player.omni.active)
    setDisplay('god-fish-div', player.omni.god)

    if (player.omni.god) {
        f = CURRENCIES['omni-fish'].amount

        setText('god-fish-amount', f.format(0))
        setText('god-fish-gain', tmp.currency_gain['omni-fish'].gt(0) ? f.formatGain(tmp.currency_gain['omni-fish']) : "")
        setHTML('antimatter-equivalent', OMNI.god_equivalents[player.omni.overmodification] ?? "Ω")
    } else if (player.omni.active) {
        f = CURRENCIES['anti-fish'].amount, ff = []

        if (f.gte(tmp.omni.op_start)) ff.push(icon("warn"));

        setHTML('antimatter-amount', f.format(0) + (ff.length > 0 ? " " + ff.join("") : ""))
        setText('antimatter-gain', tmp.currency_gain['anti-fish'].gt(0) ? f.formatGain(tmp.currency_gain['anti-fish'].mul(tmp.speed)) : "")

        setHTML('antimatter-equivalent', OMNI.equivalents[player.omni.tier] ?? "∞")

        setText('omni-tier', player.omni.tier.format(0))

        setText('game-speed', formatMult(tmp.speed))

        let op = f.gte(tmp.omni.op_start)
        setDisplay('antimatter-god-div', op)
        if (op) setText('antimatter-god-penalty', format(tmp.omni.op_penalty,3));
    } else {
        f = CURRENCIES.fish.amount, ff = []

        if (f.gte(tmp.fish_cap)) ff.push(icon("benzene"));
        if (f.gte(tmp.shark_op_start)) ff.push(icon("biohazard"));
        if (tmp.cr_active) ff.push(icon("radioactive"));

        setHTML('fish-amount', f.format(0) + (ff.length > 0 ? " " + ff.join("") : ""))
        setText('fish-gain', tmp.currency_gain.fish.gt(0) ? CURRENCIES.fish.amount.formatGain(tmp.currency_gain.fish) : "")
    }

    updateTopCurrenciesHTML()
    updateProgressHTML()

    updateTooltips()
}

function setupHTML() {
    setupTabs()

    setupScalingsTable()
    setupSharkHTML()
    setupTopCurrenciesHTML()
    setupAutomationHTML()
    setupResearchHTML()
    setupExplorationHTML()
    setupCoreHTML()
    setupEvolutionHTML()
    setupForgeHTML()
    setupPAHtml()
    setupSingularityHTML()
    setupSpaceBaseHTML()
    setupHadronHTML()

    setupOmniHTML()
    setupUndeadHTML()
    setupRuneHTML()
    REBIRTH.setupHTML()

    setupTooltips()

    setupLanguageHTML()
    
    let text = lang_text("option-buttons-text")
    el('option-buttons').innerHTML = `
    <button class="big-btn" onclick="save()">${text[0]}</button>
    <button class="big-btn" onclick="export_copy()">${text[1]}</button>
    <button class="big-btn" onclick="exporty()">${text[2]}</button>
    <button class="big-btn" onclick="importy()">${text[3]}</button>
    <button class="big-btn" onclick="importy_file()">${text[4]}</button>
    <button class="big-btn" id="wipe" onclick="wipeConfirm()">${text[5]}</button>
    <button class="big-btn" onclick="window.open('https://discord.gg/mrredshark77-club-710184682620190731')">${text[6]}</button>
    <button class="big-btn" onclick="window.open('https://boosty.to/mrredshark77/donate')">${text[7]}</button>
    `

    for (let x of document.getElementsByTagName('*')) if (x.id in lang_data && ALLOWED_LANG_KEY_TO_ELEMENT_ID.includes(x.id)) x.innerHTML = lang_text(x.id);

    REBIRTH.postSetupHTML()

    text = lang_text("endings")
    for (let i = 0; i < 2; i++) el('ending-'+i).innerHTML = text[i];

    text = lang_text("ending-options")
    for (let i = 0; i < 4; i++) el('ending-button-'+i).innerHTML = text[i];
}

function setupTopCurrenciesHTML() {
    let h = ""

    for (let [i,x] of Object.entries(TOP_CURR)) {
        h += `
        <div class="curr-top" id="curr-top-${i}-div">
            <div id="curr-top-${i}-amt1"><span id="curr-top-${i}-amt2">???</span> ${CURRENCIES[x.curr].costName}</div><button onclick="doReset('${x.reset ?? x.curr}')" id="curr-top-${i}-btn">Reset</button>
        </div>
        `
    }

    el('currs-top').innerHTML = h
}
function updateTopCurrenciesHTML() {
    for (let [i,x] of Object.entries(TOP_CURR)) {
        i = parseInt(i)

        var unl = !x.unl || x.unl()
        setDisplay(`curr-top-${i}-div`, unl)

        if (!unl) continue

        var c = CURRENCIES[x.curr]
        setText(`curr-top-${i}-amt2`, c.amount.format(0) + ((c.passive??1)>0?" "+c.amount.formatGain(tmp.currency_gain[x.curr].mul(c.passive)):""))

        let req = !x.req || x.req()
        setHTML(`curr-top-${i}-btn`, req ? lang_text('curr-top-'+i+'-reset',tmp.currency_gain[x.curr],...c.moreArg??[]) : lang_text('curr-top-'+i+'-req',c.require))
        setClass(`curr-top-${i}-btn`, el_classes({locked: !req, omni: i > 6}))
    }
}

function updateProgressHTML() {
    let f = player.feature
    let p = PROGRESS[f]

    setClass('fp-bar', tmp.ss_difficulty ? "observ" : "")

    if (p || tmp.ss_difficulty) {
        let l = 0, m = Decimal.pow(10,l-1), amount, req, auto = false, cond_text = "???", progress_text = "???";

        if (tmp.ss_difficulty) {
            let ss = SOLAR_SYSTEM[player.solar_system.active]

            amount = CURRENCIES.observ.total, req = ss.goal, l = 1, cond_text = lang_text('observ-cond'), progress_text = lang_text('observ-progress',format(req,0));
        } else {
            amount = p.amount, req = p.require, auto = p.auto, l = p.logHeight??0, cond_text = lang_text('progress-'+f+'-cond-text'), progress_text = lang_text('progress-'+f+'-text',req);
        }

        let percent = ( l > 0 ? amount.max(m).iteratedlog(10,l).div(Decimal.max(req,m).iteratedlog(10,l)) : amount.div(req) ).max(0).min(1).toNumber()
        if (isNaN(percent)) percent = 0;
        let cond = !auto && amount.gte(req)

        setHTML('fp-text', cond && (tmp.ss_difficulty || p.cond_text) ? cond_text : progress_text + " ("+formatPercent(percent,3)+")")
        setStyle('fp-bar', 'width', percent*100+"%")
        setStyle('fp-bar', 'animation', cond ? "cond-bar 1s infinite" : "none")
    } else {
        setHTML('fp-text', lang_text('maxed-progress'))
        setStyle('fp-bar', 'width', "100%")
        setStyle('fp-bar', 'animation', "none")
    }
}