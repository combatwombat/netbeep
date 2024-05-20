# netbeep
Chrome extension to play sounds on network requests depending on content type and domain. Higher pitch for bigger files.

[Install it from the Chrome Web Store](https://chromewebstore.google.com/detail/netbeep/hcgpboeddcgldkgimfmcnfloonkccfmi)

[![netbeep - Listen to network requests](https://robertgerlach.net/files/netbeep-thumbnail.png)](https://www.youtube.com/watch?v=NvHHbEnA8Tg "netbeep - Listen to network requests")

Thanks to the [blocklist project](https://github.com/blocklistproject/Lists) for the lists of malware and tracking domains.

## Development

Execute `build.sh` to build the chrome version in `dist/chrome`. Use `watch.sh` to auto-build on changed files. Needs `zip` and `fswatch` tools.
