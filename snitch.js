(function() {
  'use strict';

  // Date.now() polifyll for IE8-
  if (!Date.now) {
    Date.now = function now() {
      return new Date().getTime();
    };
  }

  var Snitch = function(options) {
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
      this.checkTTL = function() {};
    }
    if (!this.capacity) {
      this.checkCapacity = function() {};
    }
    this._log = [];
    this.storage = Snitch.storage;
    this.load();

    if (this.interval) {
      var firstTimestamp = this._log[0] ? this._log[0][0] : Date.now(),
        timeout = firstTimestamp - Date.now() + this.interval,
        _this = this;
      setTimeout(function() {
        _this.send();
        setInterval(_this.send.bind(_this), _this.interval);
      }, timeout);
    }

  };

  Snitch.storage = {
    get: function(key) {
      return Snitch.parse(localStorage.getItem(key));
    },

    set: function(key, value) {
      return localStorage.setItem(key, Snitch.serialize(value));
    },

    clear: function(key) {
      return localStorage.removeItem(key);
    }
  };

  Snitch.message = function() {
    var args = Array.prototype.slice.call(arguments);
    var message = '';
    for (var i in args) {
      var part = args[i];
      if (typeof part !== 'string') {
        part = Snitch.serialize(args[i]);
      }
      message += part + ' ';
    }
    // cut last space
    return message.slice(0, -1);
  };

  Snitch.send = function(options) {
    options.method = options.method || 'POST';
    $.ajax(options);
  };

  Snitch.serialize = function(struct) {
    var result;
    try {
      result = JSON.stringify(struct);
    } catch (e) {
      var cache = [];
      result = JSON.stringify(JSON.decycle(struct));
    }
    return result;
  };

  Snitch.parse = function(str) {
    var result;
    try {
      result = JSON.parse(str);
    } catch (e) {
      result = 'parse error: ' + e.message;
    }
    return result;
  };

  Snitch.extend = $.extend;

  Snitch.filter = (typeof(_) !== 'undefined' && _.filter ? _.filter :
    lodashFilter);

  Snitch.prototype.serialize = function() {
    return Snitch.serialize(this._log);
  };

  Snitch.prototype.log = function() {
    this.last = {
      message: Snitch.message.apply(this, Array.prototype.slice.call(
        arguments)),
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

  Snitch.prototype.clear = function(hard) {
    this._log = [];
    if (hard) {
      this.save();
    }
  };

  Snitch.prototype.clearAll = function() {
    Snitch.storage.clear(this.KEY);
    this.clear();
  };

  Snitch.prototype.save = function() {
    var log = this.storage.get(this.KEY);
    log = log || {};
    log[this.url] = this._log;
    this.storage.set(this.KEY, log);
  };

  Snitch.prototype.load = function() {
    var stored = this.storage.get(this.KEY) || {};
    this._log = stored[this.url] || [];
  };

  Snitch.prototype.send = function(options) {
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

  Snitch.prototype.checkTTL = function() {
    var deadline = Date.now() - this.ttl;
    if (this._log[0][0] < deadline) {
      this._log = Snitch.filter(this._log, function(val) {
        return val[0] >= deadline;
      });
    }
  };

  Snitch.prototype.checkCapacity = function() {
    this._log = this._log.slice(-this.capacity);
  };

  function lodashFilter(collection, condition) {
    var result = [],
      index = -1,
      length = collection ? collection.length : 0;

    if (typeof length === 'number') {
      while (++index < length) {
        var value = collection[index];
        if (condition(value, index, collection)) {
          result.push(value);
        }
      }
    }
    return result;
  }

  ///
  /// copyright https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
  ///
  JSON.decycle = function decycle(object) {
    'use strict';

    var objects = [], // Keep a reference to each unique object or array
      paths = []; // Keep the path to each unique object or array

    return (function derez(value, path) {

      var i, // The loop counter
        name, // Property name
        nu; // The new object or array

      if (typeof value === 'object' && value !== null &&
        !(value instanceof Boolean) &&
        !(value instanceof Date) &&
        !(value instanceof Number) &&
        !(value instanceof RegExp) &&
        !(value instanceof String)) {

        for (i = 0; i < objects.length; i += 1) {
          if (objects[i] === value) {
            return {
              $ref: paths[i]
            };
          }
        }

        objects.push(value);
        paths.push(path);

        if (Object.prototype.toString.apply(value) ===
          '[object Array]') {
          nu = [];
          for (i = 0; i < value.length; i += 1) {
            nu[i] = derez(value[i], path + '[' + i + ']');
          }
        } else {

          nu = {};
          for (name in value) {
            if (Object.prototype.hasOwnProperty.call(value, name)) {
              nu[name] = derez(value[name],
                path + '[' + JSON.stringify(name) + ']');
            }
          }
        }
        return nu;
      }
      return value;
    }(object, '$'));
  };

  /** Used as a reference to the global object */
  var root = window || this;

  root.Snitch = Snitch; // TODO: more suitable for diffirent modules systems and builders
}.call(this));
