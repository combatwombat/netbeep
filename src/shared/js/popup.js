// on document load
document.addEventListener('DOMContentLoaded', async () => {
    let state;
    const isFirefox = typeof browser !== 'undefined';

    async function loadSettings() {
        return new Promise((resolve) => {
            chrome.storage.local.get(null, resolve);
        });
    }
    async function saveSettings(newSettings) {
        return new Promise((resolve) => {
            chrome.storage.local.set(newSettings, resolve);
        });
    }

    // update ui, save state. should be called after every event for manual reactivity
    const onChange = async () => {
        updateUI();
        await saveSettings(state);
        chrome.runtime.sendMessage({ "netbeepSettingsChanged": state });
    }


    // update ui depending on state
    const updateUI = () => {
        ui.isEnabled.checkbox.checked = state.isEnabled;
        ui.requestsSameOrigin.checkbox.checked = state.requestsSameOrigin;
        ui.requestsCrossOrigin.checkbox.checked = state.requestsCrossOrigin;
        ui.requestsTrackers.checkbox.checked = state.requestsTrackers;
        ui.requestsMalware.checkbox.checked = state.requestsMalware;

        ui.volume.range.value = state.volume;
        ui.volume.el.style.setProperty('--value', state.volume);
        let volumeClass = 'off';
        if (state.volume > 0) {
            volumeClass = 'half';
        }
        if (state.volume > 0.6) {
            volumeClass = 'full';
        }
        ui.volume.el.setAttribute('data-volume-class', volumeClass);

        if (state.isEnabled) {
            ui.settingsGroupRequests.classList.remove('disabled');
            ui.volume.el.classList.remove('disabled');
        } else {
            ui.settingsGroupRequests.classList.add('disabled');
            ui.volume.el.classList.add('disabled');
        }
        setIcon(state.isEnabled);
    }


    const setIcon = (enabled) => {
        const iconPath = enabled ? 'img/icon-enabled-128.png' : 'img/icon-disabled-128.png';
        const iconDetails = { path: { "128": iconPath } };

        if (isFirefox) {
            browser.browserAction.setIcon(iconDetails);
        } else {
            chrome.action.setIcon(iconDetails);
        }
    };


    const playDemoSound = (type) => {
        chrome.runtime.sendMessage({"netbeepPlayDemoSound": type});
    }


    let ui = {};

    ui.body = document.querySelector('body');

    // isEnabled checkbox
    ui.isEnabled = {};
    ui.isEnabled.el = document.querySelector('[data-state="isEnabled"]');
    ui.isEnabled.checkbox = ui.isEnabled.el.querySelector('input[type="checkbox"]');

    ui.settingsGroupRequests = document.querySelector('.settings-group-requests');

    // same origin requests
    ui.requestsSameOrigin = {};
    ui.requestsSameOrigin.el = document.querySelector('[data-state="requestsSameOrigin"]');
    ui.requestsSameOrigin.checkbox = ui.requestsSameOrigin.el.querySelector('input[type="checkbox"]');

    // cross origin requests
    ui.requestsCrossOrigin = {};
    ui.requestsCrossOrigin.el = document.querySelector('[data-state="requestsCrossOrigin"]');
    ui.requestsCrossOrigin.checkbox = ui.requestsCrossOrigin.el.querySelector('input[type="checkbox"]');

    // tracker requests
    ui.requestsTrackers = {};
    ui.requestsTrackers.el = document.querySelector('[data-state="requestsTrackers"]');
    ui.requestsTrackers.checkbox = ui.requestsTrackers.el.querySelector('input[type="checkbox"]');

    // malware requests
    ui.requestsMalware = {};
    ui.requestsMalware.el = document.querySelector('[data-state="requestsMalware"]');
    ui.requestsMalware.checkbox = ui.requestsMalware.el.querySelector('input[type="checkbox"]');

    // volume
    ui.volume = {};
    ui.volume.el = document.querySelector('[data-state="volume"]');
    ui.volume.range = ui.volume.el.querySelector('input[type="range"]');



    // init
    // load state
    state = await loadSettings();

    updateUI();

    setTimeout(function() {
        ui.body.classList.add("initialized"); // enables animations
    }, 200); // otherwise runs too fast and we see animations when popup opens


    // Events
    // isEnabled
    ui.isEnabled.checkbox.addEventListener('change', async (e) => {
        state.isEnabled = e.target.checked;
        onChange();
    });
    ui.isEnabled.el.addEventListener('click', (e) => {
        e.preventDefault();
        state.isEnabled = !state.isEnabled;
        onChange();
    });

    // requestsSameOrigin
    ui.requestsSameOrigin.checkbox.addEventListener('change', async (e) => {
        state.requestsSameOrigin = e.target.checked;
        if (state.requestsSameOrigin) playDemoSound("sameOrigin");
        onChange();
    });
    ui.requestsSameOrigin.el.addEventListener('click', (e) => {
        e.preventDefault();
        state.requestsSameOrigin = !state.requestsSameOrigin;
        if (state.requestsSameOrigin) playDemoSound("sameOrigin");
        onChange();
    });

    // requestsCrossOrigin
    ui.requestsCrossOrigin.checkbox.addEventListener('change', async (e) => {
        state.requestsCrossOrigin = e.target.checked;
        if (state.requestsCrossOrigin) playDemoSound("crossOrigin");
        onChange();
    });
    ui.requestsCrossOrigin.el.addEventListener('click', (e) => {
        e.preventDefault();
        state.requestsCrossOrigin = !state.requestsCrossOrigin;
        if (state.requestsCrossOrigin) playDemoSound("crossOrigin");
        onChange();
    });

    // requestsTrackers
    ui.requestsTrackers.checkbox.addEventListener('change', async (e) => {
        state.requestsTrackers = e.target.checked;
        if (state.requestsTrackers) playDemoSound("trackers");
        onChange();
    });
    ui.requestsTrackers.el.addEventListener('click', (e) => {
        e.preventDefault();
        state.requestsTrackers = !state.requestsTrackers;
        if (state.requestsTrackers) playDemoSound("trackers");
        onChange();
    });

    // requestsMalware
    ui.requestsMalware.checkbox.addEventListener('change', async (e) => {
        state.requestsMalware = e.target.checked;
        if (state.requestsMalware) playDemoSound("malware");
        onChange();
    });
    ui.requestsMalware.el.addEventListener('click', (e) => {
        e.preventDefault();
        state.requestsMalware = !state.requestsMalware;
        if (state.requestsMalware) playDemoSound("malware");
        onChange();
    });

    // volume
    ui.volume.range.addEventListener('input', (e) => {
        state.volume = e.target.value;
        onChange();
    });
    




});
