let Player = function() {

    let requestQueue = [];
    let minNoteInterval = 45; // play a note at most every x ms

    let settings;


    // load urls from blocklist files
    // thx to the block list project https://github.com/blocklistproject/Lists
    let blocklist = {
        trackers: loadBlocklist("blocklist/tracking.txt"),
        malware: loadBlocklist("blocklist/malware.txt")
    }

    // remove entries in malware that are in trackers (since malware contains tracker urls as well. too much honking with them)
    blocklist.malware = blocklist.malware.filter(url => !urlExists(url, blocklist.trackers));

    /*
    load urls from blocklist file, sort them alphabetically for faster search
    @param filePath: path to blocklist file, relative to extension
    @return array of urls
     */
    function loadBlocklist(filePath) {
        let urls = [];
        let xhr = new XMLHttpRequest();
        xhr.open('GET', chrome.runtime.getURL(filePath), false);
        xhr.send();
        let lines = xhr.responseText.split('\n');
        for (let line of lines) {
            let newLine = line.trim();

            // not empty and doesn't start with #?
            if (newLine.length > 0 && newLine[0] !== "#") {
                urls.push(newLine.replace("0.0.0.0 ", ""));
            }
        }

        urls.sort();

        return urls;
    }

    /*
    faster binary search, check if url exists in sorted array
    @param url string
    @param blocklist array of strings
    @return true/false
     */
    function urlExists(url, blocklist) {
        let low = 0;
        let high = blocklist.length - 1;
        while (low <= high) {
            let mid = Math.floor((low + high) / 2);
            if (blocklist[mid] === url) {
                return true;
            } else if (blocklist[mid] < url) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return false;
    }

    let masterGain = new Tone.Gain(0.8).toDestination();
    let distortion = new Tone.Distortion(0.8).connect(masterGain);
    let reverb = new Tone.Reverb(2).connect(masterGain);
    let vibrato = new Tone.Vibrato(8, 1).connect(masterGain);



    //////////////// Synths


    // nice sound 🟢
    let synth1 = (function () {
        let synth = new Tone.PolySynth({
            oscillator: {
                type: "sine"
            },
            envelope: {
                attack: 0.01,
                decay: 0,
                sustain: 0.05,
                release: 0.1
            }
        }).connect(masterGain);

        return {
            play: function (pitch, release, volume) {

                synth.set({
                    oscillator: {
                        type: "sine"
                    },
                    envelope: {
                        attack: 0.01,
                        release: release
                    }
                });

                synth.triggerAttackRelease(pitch, "0.01", Tone.now(), volume);

                console.log("triggered synth 1");
            }
        }

    })();

    //synth1.play(200, 0.1, 0.5);


    // harsher sound 🟠
    let synth2 = (function() {

        // rotate through a pool of synths for some polyphony
        let synthPoolSize = 2; // not too high, otherwise web audio api gets overwhelmed
        let synthPool = [];
        let synthPoolIndex = 0;
        for (let i = 0; i < synthPoolSize; i++) {
            let synth = new Tone.FMSynth({
                harmonicity: 3,
                modulationIndex: 10,
                detune: 0,
                oscillator: {
                    type: "square"
                },
                envelope: {
                    attack: 0,
                    decay: 0.01,
                    sustain: 1,
                    release: 0.5
                },
                modulation: {
                    type: "triangle"
                },
                modulationEnvelope: {
                    attack: 0.5,
                    decay: 0,
                    sustain: 1,
                    release: 0.5
                }
            }).connect(distortion).connect(reverb);

            synthPool.push(synth);
        }

        return {
            play: function (pitch, release, volume) {

                let synth = synthPool[synthPoolIndex];
                synthPoolIndex = (synthPoolIndex + 1) % synthPoolSize;

                synth.set({
                    envelope: {
                        release: release
                    }
                });

                synth.triggerAttackRelease(pitch, "0.01", Tone.now(), volume);
            }
        }

    })();


    // ugly sound 🔴
    let synth3 = (function() {

        // rotate through a pool of synths for some polyphony
        let synthPoolSize = 2;
        let synthPool = [];
        let synthPoolIndex = 0;
        for (let i = 0; i < synthPoolSize; i++) {
            let synth = new Tone.MetalSynth({
                frequency: 200,
                envelope: {
                    attack: 0,
                    decay: 0.4,
                    sustain: 0,
                    release: 0.1
                },
                harmonicity: 2,
                modulationIndex: 20,
                resonance: 10,
                octaves: 1
            }).connect(masterGain);


            synthPool.push(synth);
        }

        return {
            play: function (pitch, release, volume) {

                let synth = synthPool[synthPoolIndex];
                synthPoolIndex = (synthPoolIndex + 1) % synthPoolSize;

                synth.set({
                    envelope: {
                        release: release
                    }
                });

                synth.triggerAttackRelease(pitch, "0.01", Tone.now(), volume);
            }
        }

    })();


    // warning sound 💀
    let synth4 = (function() {

        // rotate through a pool of synths for some polyphony
        let synthPoolSize = 2;
        let synthPool = [];
        let synthPoolIndex = 0;
        for (let i = 0; i < synthPoolSize; i++) {
            let synth = new Tone.FMSynth({
                harmonicity: 3,
                modulationIndex: 10,
                detune: 0,
                oscillator: {
                    type: "square"
                },
                envelope: {
                    attack: 0,
                    decay: 0.01,
                    sustain: 1,
                    release: 0.5
                },
                modulation: {
                    type: "triangle"
                },
                modulationEnvelope: {
                    attack: 0,
                    decay: 0,
                    sustain: 1,
                    release: 0.1
                }
            }).connect(vibrato);


            synthPool.push(synth);
        }

        return {
            play: function (pitch, release, volume) {

                let synth = synthPool[synthPoolIndex];
                synthPoolIndex = (synthPoolIndex + 1) % synthPoolSize;

                synth.set({
                    envelope: {
                        release: release
                    }
                });

                synth.triggerAttackRelease(pitch, "0.5", Tone.now(), volume);

            }
        }

    })();





    /* play sound with tone.js depending on request parameters.
    request: {
        domain: {domain of request},
        tabDomain: {domain of current tab}, // to check if request is from same domain
        contentLength: contentLength, // in bytes
        contentType: contentType, // string
        headers: [{name: name, value: value}, ...], // array of headers
    }
    */
    async function playSound(request) {

        if (!settings || !settings.isEnabled) {
            return;
        }

        // Math.min(1, Math.max(0, contentLength / 100000)) * 2000 + 200

        // normalize contentLength from 0 to 1. 0 = 0kb, 1 = 100kb and above
        let normalizedContentLength = Math.min(1, Math.max(0, request.contentLength / 100000));

        let sameOrigin = settings.requestsSameOrigin && request.domain === request.tabDomain;
        let crossOrigin = settings.requestsCrossOrigin && !sameOrigin;
        let trackers = settings.requestsTrackers && urlExists(request.domain, blocklist.trackers);
        let malware = settings.requestsMalware && urlExists(request.domain, blocklist.malware);

        const baseVolumeModifier = 1.4;

        // nice sound 🟢
        if (sameOrigin) {

            let release = 0.1 + normalizedContentLength * 0.9;
            let pitch = normalizedContentLength * 2000 + 200;
            let volume = 0.2 + normalizedContentLength * 0.2;

            volume = Math.min(1, Math.pow(volume * settings.volume * baseVolumeModifier, 2));

            synth1.play(pitch, release, volume);
        }

        // harsher sound 🟠
        if (crossOrigin) {

            let release = 0.1 + normalizedContentLength * 0.9;
            let pitch = normalizedContentLength * 300 + 200;
            let volume = 0.1 + normalizedContentLength * 0.05;

            volume = Math.min(1, Math.pow(volume * settings.volume * baseVolumeModifier, 2));

            synth2.play(pitch, release, volume);
        }

        // ugly sound 🔴
        if (trackers) {

            let release = 0.3 + normalizedContentLength * 0.9;
            let pitch = normalizedContentLength * 100 + 50;
            let volume = 0.1 + normalizedContentLength * 0.25;

            volume = Math.min(1, Math.pow(volume * settings.volume * baseVolumeModifier, 2));

            synth3.play(pitch, release, volume);
        }

        // warning sound 💀
        if (malware) {

            let release = 0.1 + normalizedContentLength * 0.9;
            let pitch = normalizedContentLength * 100 + 400;
            let volume = 0.2 + normalizedContentLength * 0.4;

            volume = Math.min(1, Math.pow(volume * settings.volume * baseVolumeModifier, 2));

            synth4.play(pitch, release, volume);
        }

    }

    async function playDemoSound(type) {

        if (!settings) {
            return;
        }

        if (type === "sameOrigin") {
            let normalizedContentLength = 0.4 + Math.random()*0.2;
            let release = 0.1 + normalizedContentLength * 0.9;
            let pitch = normalizedContentLength * 2000 + 200;
            let volume = 0.1 + normalizedContentLength * 0.9;

            volume = Math.pow(volume * settings.volume, 2);

            synth1.play(pitch, release, volume);
        }

        if (type === "crossOrigin") {
            let normalizedContentLength = 0.5 + Math.random()*0.2;
            let release = 0.1 + normalizedContentLength * 0.9;
            let pitch = normalizedContentLength * 300 + 200;
            let volume = 0.1 + normalizedContentLength * 0.25;

            volume = Math.pow(volume * settings.volume, 2);

            synth2.play(pitch, release, volume);
        }

        if (type === "trackers") {
            let normalizedContentLength = 0.4 + Math.random()*0.2;
            let release = 0.1 + normalizedContentLength * 0.9;
            let pitch = normalizedContentLength * 160 + 5;
            let volume = 0.1 + normalizedContentLength * 0.6;

            volume = Math.pow(volume * settings.volume, 2);

            synth3.play(pitch, release, volume);
        }

        if (type === "malware") {
            let normalizedContentLength = 0.4 + Math.random()*0.2;
            let release = 0.1 + normalizedContentLength * 0.9;
            let pitch = normalizedContentLength * 100 + 400;
            let volume = 0.2 + normalizedContentLength * 0.6;

            volume = Math.pow(volume * settings.volume, 2);

            synth4.play(pitch, release, volume);
        }
    }




    // play notes in queue
    Tone.Transport.scheduleRepeat(function(time) {
        if (requestQueue.length > 0 && settings.isEnabled) {
            const request = requestQueue.shift();
            if (request) {
                playSound(request);
            }
        }
    }, minNoteInterval / 1000)

    Tone.Transport.start();


    return {
        addRequest: (request) => {
            requestQueue.push(request);
        },
        playDemoSound: (type) => {
            playDemoSound(type);
        },
        setSettings: (newSettings) => {
            settings = newSettings;
        },
        tabChanged: () => {
            requestQueue = [];
        },
        tabReloaded: () => {
            requestQueue = [];
        }
    }



};