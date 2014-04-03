(function () {
  'use strict';

  // Date.now() polifyll for IE8-
  if (!Date.now) {
    Date.now = function now() {
      return new Date().getTime();
    };
  }

  var Snitch = function (options) {
    options = options || {};

    if (typeof options === 'string') {
      options = {
        url: options
      };
    } else {
      options.url = options.url || location.href;
    }

    this.KEY = options.key || 'snitch';
    this.url = options.url;
    this.ttl = options.ttl;
    this.interval = options.interval;
    this.capacity = options.capacity;
    if (!this.ttl) {
      this.checkTTL = function () {};
    }
    if (!this.capacity) {
      this.checkCapacity = function () {};
    }
    this._log = [];
    this.storage = Snitch.storage;
    this.load();

    if (this.interval) {
      var firstTimestamp = this._log[0] ? this._log[0][0] : Date.now(),
        timeout = firstTimestamp - Date.now() + this.interval,
        _this = this;
      setTimeout(function () {
        _this.send();
        setInterval(_this.send.bind(_this), _this.interval);
      }, timeout);
    }

  };

  Snitch.storage = {
    get: function (key) {
      return JSON.parse(localStorage.getItem(key));
    },

    set: function (key, value) {
      //console.log(key, 'value length', JSON.stringify(value));
      return localStorage.setItem(key, JSON.stringify(value));
    },

    clear: function (key) {
      return localStorage.removeItem(key);
    }
  };

  Snitch.message = function () {
    var message = '';
    for (var i in arguments) {
      var part = arguments[i];
      if (typeof part !== 'string') {
        part = JSON.stringify(arguments[i]);
      }
      message += part + ' ';
    }
    // cut last space
    return message.slice(0, -1);
  };

  Snitch.send = function (options) {
    options.method = options.method || 'POST';
    $.ajax(options);
  };

  Snitch.extend = $.extend;

  Snitch.filter = (typeof (_) !== 'undefined' && _.filter ? _.filter : lodash_filter);

  Snitch.prototype.serialize = function () {
    return JSON.stringify(this._log);
  };

  Snitch.prototype.log = function () {
    this.last = {
      message: Snitch.message.apply(this, arguments),
      date: Date.now()
    };

    this._log.push([
      this.last.date,
      this.last.message
    ]);

    this.checkTTL();
    this.checkCapacity();
    this.save();
  };

  Snitch.prototype.clear = function (hard) {
    this._log = [];
    if (hard) {
      this.save();
    }
  };

  Snitch.prototype.clearAll = function () {
    Snitch.storage.clear(this.KEY);
    this.clear();
  };

  Snitch.prototype.save = function () {
    var log = this.storage.get(this.KEY);
    log = log || {};
    log[this.url] = this._log;
    this.storage.set(this.KEY, log);
  };

  Snitch.prototype.load = function () {
    var stored = this.storage.get(this.KEY) || {};
    this._log = stored[this.url] || [];
  };

  Snitch.prototype.send = function (options) {
    if (this._log.length) {
      options = Snitch.extend({
        url: this.url,
        data: {
          userAgent: navigator.userAgent,
          log: this.serialize()
        },
        complete: this.clear.bind(this, true) // log will be cleared even if ajax error
      }, options);
      Snitch.send(options);
    }
  };

  Snitch.prototype.checkTTL = function () {
    var deadline = Date.now() - this.ttl;
    if (this._log[0][0] < deadline) {
      this._log = Snitch.filter(this._log, function (val) {
        return val[0] >= deadline;
      });
    }
  };

  Snitch.prototype.checkCapacity = function () {
    this._log = this._log.slice(-this.capacity);
  };

  function lodash_filter(collection, condition) {
    var result = [];
    //callback = lodash.createCallback(callback, thisArg, 3);

    var index = -1,
      length = collection ? collection.length : 0;

    if (typeof length == 'number') {
      while (++index < length) {
        var value = collection[index];
        if (condition(value, index, collection)) {
          result.push(value);
        }
      }
    }
    return result;
  }

  /** Used as a reference to the global object */
  var root = window || this;

  root.Snitch = Snitch; // TODO: more suitable for diffirent modules systems and builders
}.call(this));
