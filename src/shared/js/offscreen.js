const init = async () => {

    let player = Player();

    chrome.runtime.onMessage.addListener(async request => {

        if ('netbeepAddRequest' in request) {
            player.addRequest(request.netbeepAddRequest);
        }
        if ('netbeepPlayDemoSound' in request) {
            player.playDemoSound(request["netbeepPlayDemoSound"]);
        }

        if ('netbeepSettingsChanged' in request) {
            player.setSettings(request.netbeepSettingsChanged);
        }

        if ('netbeepTabChanged' in request) {
            player.tabChanged();
        }

        if ('netbeepTabReloaded' in request) {
            player.tabReloaded();
        }
    });


}
init();


