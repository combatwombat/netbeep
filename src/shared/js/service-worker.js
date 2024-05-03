let browser;
let isManifestV3 = false;
if (typeof browser === 'undefined') {
    isManifestV3 = true;
    browser = chrome;
}

let defaultSettings = {
    isEnabled: true,
    requestsSameOrigin: true,
    requestsCrossOrigin: true,
    requestsTrackers: true,
    requestsMalware: true,
    volume: 0.6
};
let settings = defaultSettings;


(async () => {

    refreshSettings();
    await createOffscreenDocument();
    chrome.webRequest.onHeadersReceived.addListener(onHeadersReceived, { urls: ["<all_urls>"] }, ["responseHeaders"]);

})();

function refreshSettings() {

    // load settings from chrome storage
    chrome.storage.local.get(null, (result) => {

        // combine saved settings with default settings
        settings = {...defaultSettings, ...result};

        saveSettings();
    });
}

function saveSettings() {
    chrome.storage.local.set(settings, function() {
        chrome.runtime.sendMessage({ "netbeepSettingsSaved": settings });
    });
}

chrome.runtime.onStartup.addListener(() => {
    refreshSettings();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.hasOwnProperty('netbeepSettingsChanged')) {
        refreshSettings();
    }
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.hasOwnProperty('netbeepGetDefaultSettings')) {
        sendResponse(defaultSettings);
    }
    if (message.hasOwnProperty('netbeepGetSettings')) {
        refreshSettings();
        sendResponse(settings);
    }
});

// on tab change, send netbeepTabChanged message
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        chrome.runtime.sendMessage({ "netbeepTabChanged": tab });
    });
});


// change icon on sound. todo: monkey with drums, or something else
/*
let c = 0;
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.hasOwnProperty('netbeepSoundPlayed')) {

        console.log("sound playing ", message.netbeepSoundPlayed.type);

        setIcon(c % 2 === 0);
        c++;

    }
});
const setIcon = (enabled) => {
    const iconPath = enabled ? '../img/icon-enabled-128.png' : '../img/icon-disabled-128.png';
    chrome.action.setIcon({path: {"128": iconPath}});
}*/




chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === "install") {
        chrome.storage.local.set(defaultSettings, function() {
            console.log('extension installed, setting default settings.');
        });
    }
});

// check if offscreen document for audio playback exists, if not, create it
// because we can only play sound with DOM access and offscreen documents with
// reason AUDIO_PLAYBACK get killed after 30 seconds of not playing audio
let creatingOffsetDocument;
async function createOffscreenDocument(path = 'offscreen.html') {
    const offscreenUrl = chrome.runtime.getURL(path);
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [offscreenUrl]
    });

    if (existingContexts.length > 0) {
        return;
    }

    if (creatingOffsetDocument) {
        await creatingOffsetDocument;
    } else {
        creatingOffsetDocument = chrome.offscreen.createDocument({
            url: path,
            reasons: ['AUDIO_PLAYBACK'],
            justification: 'playing sound in response to network activity',
        });
        await creatingOffsetDocument;
        creatingOffsetDocument = null;
    }
}

// add request to play-queue in offscreen.js
async function addRequest(request) {
    await createOffscreenDocument();
    await chrome.runtime.sendMessage({ "netbeepAddRequest": request });
}



async function onHeadersReceived(details) {

    refreshSettings();

    if (!settings.isEnabled) {
        return { cancel: false };
    }

    // get currently selected tab id
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });

    // get current tab, if it exists
    if (tabs.length === 0) {
        return { cancel: false };
    }
    const tabId = tabs[0].id;

    // return if details.tabId is not the currently selected tab
    if (details.tabId !== tabId) {
        return { cancel: false };
    }

    // get domain of current tab, remove subdomain part
    let tabDomain = "";
    try {
        tabDomain = new URL(tabs[0].url).hostname;
    } catch (e) {
        console.error(e.message);
        console.error(tabs);
        return { cancel: false };
    }

    const tabDomainParts = tabDomain.split('.');
    if (tabDomainParts.length > 2) {
        tabDomain = tabDomainParts.slice(-2).join('.');
    }

    let detailsDomain = new URL(details.url).hostname;
    const detailsDomainParts = detailsDomain.split('.');
    if (detailsDomainParts.length > 2) {
        detailsDomain = detailsDomainParts.slice(-2).join('.');
    }


    let contentType = '';
    let contentLength = 0;

    // Extract content type and content length from response headers
    details.responseHeaders.forEach(header => {
        if (header.name.toLowerCase() === 'content-type') {
            contentType = header.value;
        } else if (header.name.toLowerCase() === 'content-length') {
            const parsedLength = parseInt(header.value, 10);
            if (!isNaN(parsedLength)) {
                contentLength = parsedLength;
            }
        }
    });

    addRequest({
        domain: detailsDomain,
        tabDomain: tabDomain,
        contentLength: contentLength,
        contentType: contentType,
        headers: details.responseHeaders
    });

    return { cancel: false };
}




