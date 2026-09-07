var popups = []
var popupVisibled = false
var popupPrevFocus = null

/*
Popup Types:
- Normal
- Confirmation
- Prompt
*/

function createPopup(text, type="normal", options={}) {

    popups.push({
        type,
        html: text,
        ...options,
    })
    
    updatePopup()
}

function createNormalPopup(text,buttonName=lang_text('popup-buttons')[1][0],buttonFunction) {
    createPopup(text, "normal", {
        buttonName: [buttonName],
        buttonFunction: [buttonFunction],
    })
}

function createConfirmationPopup(text,acceptFunc,rejectFunc) {
    createPopup(text, "normal", {
        buttonName: lang_text('popup-buttons')[0],
        buttonFunction: [acceptFunc,rejectFunc],
    })
}

function createPromptPopup(text,acceptFunc,rejectFunc) {
    createPopup(text, "prompt", {
        buttonName: lang_text('popup-buttons')[1],
        buttonFunction: [acceptFunc,rejectFunc],
    })
}

var closePopup;

function updatePopup() {
    var popup_el = el('popup')

    if (popups.length > 0 && !popupVisibled) {
        var p = popups[0]

        popupVisibled = true
        popup_el.style.pointerEvents = 'all'
        popup_el.style.opacity = 1
        popup_el.style.transform = 'scale(1)'
        popup_el.setAttribute('aria-hidden','false')

        el('popup-html').innerHTML = p.html + (p.type == 'prompt' ? '<br><textarea id="popup-input" placeholder="'+lang_text('prompt-placeholder')+'" rows="5"></textarea>' : '')
        el('popup-btns').innerHTML = p.buttonName.map((b,i) => `<button id="popup-btn${i}">${b}</button>`).join('')

        // Move focus into the dialog (announcing its content) and remember
        // what had focus so it can be restored on close, per the WAI-ARIA
        // modal dialog pattern.
        popupPrevFocus = document.activeElement
        el('popup-ctn').focus()

        closePopup = () => {
            popups.splice(0,1)

            popupVisibled = false
            popup_el.style.pointerEvents = 'none'
            popup_el.style.opacity = 0
            popup_el.style.transform = 'scale(1.1)'
            popup_el.setAttribute('aria-hidden','true')

            popupPrevFocus?.focus?.()

            setTimeout(updatePopup,500)
        }

        p.buttonName.forEach((b,i) => {
            el(`popup-btn${i}`).addEventListener('click', () => {
                p.buttonFunction?.[i]?.(el("popup-input")?.value)
                closePopup()
            })
        })
    }
}

// Keeps Tab/Shift+Tab cycling within the open dialog instead of letting
// focus escape to the (visually covered, but not otherwise unreachable)
// page behind it, and lets Escape dismiss it. Escape always acts like
// the last button (No/Cancel for a confirmation or prompt, the only
// button for a plain info popup) rather than the first, so it never
// accepts something the user meant to back out of.
function popupKeydown(event) {
    if (event.key == 'Escape') {
        event.preventDefault()

        var p = popups[0], last = p.buttonName.length-1
        p.buttonFunction?.[last]?.(el("popup-input")?.value)
        closePopup()
        return
    }

    if (event.key !== 'Tab') return

    var focusable = [...el('popup-ctn').querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])')].filter(x => !x.disabled && x.offsetParent !== null)

    if (focusable.length == 0) return

    var first = focusable[0], last = focusable[focusable.length-1]

    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
    }
}