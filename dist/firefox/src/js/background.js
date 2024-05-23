const isFirefox = typeof browser !== 'undefined';
if (isFirefox) {
    window.chrome = browser;
}

let defaultSettings = {
    isEnabled: true,
    requestsSameOrigin: true,
    requestsCrossOrigin: true,
    requestsTrackers: true,
    requestsMalware: true,
    volume: 0.6
};
let settings;
let player;

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


function loadScript(url, callback) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = url;
    script.onload = callback;
    document.head.appendChild(script);
}
loadScript(chrome.runtime.getURL("js/tone.js"), function() {
    loadScript(chrome.runtime.getURL("js/player.js"), async function() {
        backgroundInit();
    });
});

const backgroundInit = async () => {

    let savedSettings = await loadSettings();
    settings = defaultSettings;
    if (savedSettings) {
        settings = { ...defaultSettings, ...savedSettings };
    }
    await saveSettings(settings);

    player = Player();
    player.setSettings(settings);


    chrome.webRequest.onHeadersReceived.addListener(onHeadersReceived, { urls: ["<all_urls>"] }, ["responseHeaders"]);

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

        if ('netbeepPlayDemoSound' in request) {
            player.playDemoSound(request["netbeepPlayDemoSound"]);
        }

        if ('netbeepSettingsChanged' in request) {
            settings = request.netbeepSettingsChanged;
            player.setSettings(request.netbeepSettingsChanged);
        }

    });


    async function onHeadersReceived(details) {

        if (!settings.isEnabled) {
            return { cancel: false };
        }

        // get currently selected tab id
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

        // get current tab, if it exists
        if (tabs.length === 0) {
            return { cancel: false };
        }
        const tabId = tabs[0].id;

        // return if details.tabId is not the currently selected tab and also not a no-tab situation like with the Imagus extension (-1)
        if (details.tabId !== tabId && details.tabId !== -1) {
            return { cancel: false };
        }

        // get domain of current tab, remove subdomain part
        let tabDomain = "";
        try {
            tabDomain = new URL(tabs[0].url).hostname;
        } catch (e) {
            console.log("couldn't parse tabDomain: ", e);
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

        player.addRequest({
            domain: detailsDomain,
            tabDomain: tabDomain,
            contentLength: contentLength,
            contentType: contentType,
            headers: details.responseHeaders
        });

        return { cancel: false };
    }


    // on tab change, send netbeepTabChanged message
    chrome.tabs.onActivated.addListener((activeInfo) => {
        chrome.tabs.get(activeInfo.tabId, async (tab) => {
            player.tabChanged();
        });
    });

    // on tab reload, send netbeepTabReloaded message
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete') {
            player.tabReloaded();
        }
    });


}
