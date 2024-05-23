function loadScript(url, callback) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = url;
    script.onload = callback;
    document.head.appendChild(script);
}

console.log("in netbeep content.js");

loadScript(chrome.runtime.getURL("js/tone.js"), function() {
    loadScript(chrome.runtime.getURL("js/offscreen.js"));
    console.log("loaded netbeep content scripts");
});