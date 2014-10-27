[![Build Status](https://travis-ci.org/lastw/snitch.svg)](https://travis-ci.org/lastw/snitch)

# snitch

Periodically sends client-side logs to specified url.

- Zero-dependency;
- IE9+;
- Cordova/PhoneGap apps compatible;
- Easy integration with Segment.IO server HTTP API.

## installation

```
bower install snitch
```

## usage

```javascript
var snitch = new Snitch('/path/to/log/service');

snitch.log('snitch enabled');
```
Full config:

```javascript
var snitch = new Snitch({
  url: '/path/to/log/service', // do not forget about cross-origin policy
  interval: 1000 * 60 * 5, // send logs every 5 minutes
  ttl: 1000 * 60 * 24, // time to live
  solidMode: false, // weak consistency, do not try to send every single log
  capacity: 100 // how much log records could be stored before syncing to server
});
```
## contribute

```javascript
npm install
npm test
```

## license

MIT.
