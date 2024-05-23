(async () => {
    let defaultSettings = {
        isEnabled: true,
        requestsSameOrigin: true,
        requestsCrossOrigin: true,
        requestsTrackers: true,
        requestsMalware: true,
        volume: 0.6
    };
    let settings;

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

    // check if offscreen document for audio playback exists, if not, create it
    // because we can only play sound with DOM access and offscreen documents with
    // reason AUDIO_PLAYBACK might get killed after 30 seconds of not playing audio
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

    async function init() {
        await createOffscreenDocument();
        let savedSettings = await loadSettings();
        settings = defaultSettings;
        if (savedSettings) {
            settings = { ...defaultSettings, ...savedSettings };
        }
        await saveSettings(settings);
        chrome.runtime.sendMessage({ "netbeepSettingsChanged": settings });

        chrome.webRequest.onHeadersReceived.addListener(onHeadersReceived, { urls: ["<all_urls>"] }, ["responseHeaders"]);
    }
    await init();


    // add request to play-queue in offscreen.js
    async function addRequest(request) {
        await createOffscreenDocument();
        await chrome.runtime.sendMessage({ "netbeepAddRequest": request }).catch(error => { console.error("failed to send netbeepAddRequest message: ", error); });
    }


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

        addRequest({
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
            try {
                await createOffscreenDocument();
                chrome.runtime.sendMessage({ "netbeepTabChanged": tab }).catch(error => { console.error("failed to send netbeepTabChanged message: ", error); });
            } catch (e) {
                console.error("failed to send netbeepTabChanged message: ", e);
            }

        });
    });

    // on tab reload, send netbeepTabReloaded message
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete') {
            try {
                await createOffscreenDocument();
                chrome.runtime.sendMessage({ "netbeepTabReloaded": tab }).catch(error => { console.error("failed ot send netbeepTabReloaded message: ", error); });
            } catch (e) {
                console.error("failed to send netbeepTabReloaded message: ", e);

            }

        }
    });


    // on netbeepSettingsChanged message
    chrome.runtime.onMessage.addListener(async (request) => {
        if ('netbeepSettingsChanged' in request) {
            settings = request.netbeepSettingsChanged;
        }
    });

})();
