[![Build Status](https://travis-ci.org/lastw/snitch.svg)](https://travis-ci.org/lastw/snitch)

# snitch

Periodically sends client-side logs to specified url.

## installation

```
bower install snitch
```

## usage

```javascript
var snitch = new Snitch({
  url: '/path/to/log/service',
  interval: 1000 * 60 * 5 // send logs every 5 minutes
});

snitch.log('snitch enabled');
```

## contribute

```javascript
npm install
node server.js
npm test
```

## license

MIT.
