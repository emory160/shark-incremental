var radios = {}
var radios_config = {}

function createRadio(id, title, names=[], config={}) {
    var e = document.getElementById('radio-'+id)

    if (!e) return

    radios[id] = player.radios[id]??config.start_position??0
    if (player.radios[id] === undefined) player.radios[id] = radios[id]

    radios_config[id] = {
        length: names.length,
    }

    var width = config.width ?? 120
    var labelId = 'radio-'+id+'-label'

    // ARIA radiogroup pattern: the group is labelled by the visible title,
    // each option is a role="radio" with aria-checked reflecting selection
    // and a roving tabindex (only the selected option is Tab-reachable;
    // arrow keys move *and* select, per the standard radio-group behavior).
    e.setAttribute('role', 'radiogroup')
    e.setAttribute('aria-labelledby', labelId)

    e.innerHTML = `<span id="${labelId}">${title}</span><div class="input-radio-list">${names.map((x,i) => `<div class="input-radio-ctn" role="radio" aria-checked="${i==radios[id]}" tabindex="${i==radios[id]?0:-1}" id="radio-${id}-${i}" style="width: ${width}px" onclick="chooseRadio('${id}',${i})" onkeydown="radioKeydown(event,'${id}',${i})"><div>${x}</div></div>`).join('')}<div class='input-ratio-select' id="radio-${id}-select" style="width: ${width}px; left: ${radios[id]/names.length*100}%"></div></div>`
}

function updateRadio(id) {
    var e = document.getElementById('radio-'+id+'-select')

    if (!e) return

    e.style.left = (radios[id]/radios_config[id].length*100)+'%'

    for (let i = 0; i < radios_config[id].length; i++) {
        var opt = document.getElementById('radio-'+id+'-'+i)
        if (!opt) continue

        var checked = i == radios[id]
        opt.setAttribute('aria-checked', checked)
        opt.tabIndex = checked ? 0 : -1
    }
}

function chooseRadio(id,v) {
    player.radios[id] = radios[id] = v
    updateRadio(id)

    if (id == 'autosave-time') {
        clearInterval(autosave)
        autosave = setInterval(save, [15000,30000,60000,120000][player.radios[id]], true)
    } else if (id == 'animations') {
        applyAnimationsSetting()
    }
}

function radioKeydown(event,id,i) {
    var len = radios_config[id].length, next

    switch (event.key) {
        case 'ArrowRight': case 'ArrowDown': next = (i+1)%len; break
        case 'ArrowLeft': case 'ArrowUp': next = (i-1+len)%len; break
        case 'Home': next = 0; break
        case 'End': next = len-1; break
        case ' ': case 'Enter': next = i; break
        default: return
    }

    event.preventDefault()
    chooseRadio(id,next)
    document.getElementById('radio-'+id+'-'+next).focus()
}

// 0 = On, 1 = Reduced Motion (stop large panning background animations
// while keeping short local feedback like glows and fades), 2 = Off
// (freeze every animation/transition, see body.anim-* rules in main.css).
function applyAnimationsSetting() {
    let v = player.radios.animations ?? 0
    document.body.classList.toggle('anim-reduced', v == 1)
    document.body.classList.toggle('anim-off', v == 2)
}