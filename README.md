# netbeep
Chrome and Firefox extension to play sounds on network requests depending on content type and domain. Higher pitch for bigger files.

[For Chrome](https://chromewebstore.google.com/detail/netbeep/hcgpboeddcgldkgimfmcnfloonkccfmi)  

[For Firefox](https://addons.mozilla.org/de/firefox/addon/netbeep/)

https://github.com/combatwombat/netbeep/assets/26400/2c47053e-acae-4f2d-b432-d2d2f72b0fb3

## Thanks to 
- The [blocklist project](https://github.com/blocklistproject/Lists) for the lists of malware and tracking domains.
- [Tone.js](https://github.com/Tonejs/Tone.js) for a nice Web Audio wrapper.
- [Remix Icons](https://remixicon.com/) for icons.
- [Daniel Brall](https://github.com/Bradan) for testing
- [Bert Huber](https://fosstodon.org/@bert_hubert), [Kim Harding](https://mastodon.scot/@kim_harding), [Geffrey van der Bos](https://pkm.social/@geffrey) et al for the [idea](https://hachyderm.io/@kim_harding@mastodon.scot/112319625457374955)

## Development

Execute `build.sh` to build the chrome version in `dist/chrome`. Use `watch.sh` to auto-build on changed files. Needs `zip` and `fswatch` tools.
