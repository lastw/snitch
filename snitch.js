'use strict';

var Snitch = function (options) {
  if (typeof options === 'string') {
    options = {
      url: options
    };
  }
  else if (options === undefined) {
    options = {
      url: location.href
    };
  }

  this.KEY = options.key || 'snitch';
  this.url = options.url;
  this.ttl = options.ttl;
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
};

Snitch.storage = {
  get: function (key) {
    return JSON.parse(localStorage.getItem(key));
  },

  set: function (key, value) {
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

Snitch.filter = _.filter;

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
  options = Snitch.extend({
    url: this.url,
    data: {
      userAgent: navigator.userAgent,
      log: this.serialize()
    }
  }, options);
  Snitch.send(options);
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
