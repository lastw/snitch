# snitch

Periodically sends client-side logs to specified url.

## installation

```
bower install snitch
```

## usage

```
var snitch = new Snitch({
  url: '/path/to/log/service',
  interval: 1000 * 60 * 5 // send logs every 5 minutes
});

snitch.log('snitch enabled');
```

## license

MIT.
