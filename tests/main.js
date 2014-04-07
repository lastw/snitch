/* globals Snitch, chai, describe, it */
'use strict';
var expect = chai.expect;

describe('common', function () {
  var snitch = new Snitch();

  it('snitch.clear() should clear log array', function () {
    snitch.clear();
    expect(snitch.serialize()).to.equal('[]');
  });

  it('snitch.log() increases log array length by one', function () {
    snitch.clear();
    snitch.log('First test log message');
    expect(snitch._log.length).to.equal(1);
    snitch.log('Second test log message');
    expect(snitch._log.length).to.equal(2);
  });

  it('pass url to constuctor as string variable', function () {
    var url = '/path/to/log/service',
        snitch = new Snitch(url);
    expect(snitch.url).to.equal(url);
  });

  it('pass url to constuctor as options.url', function () {
    var url = '/path/to/log/service',
        snitch = new Snitch({url: url});
    expect(snitch.url).to.equal(url);
  });
});

describe('logging', function () {
  var snitch = new Snitch();

  it('multiple strings logging', function () {
    snitch.clear();
    snitch.log('string1', 'string2', 'string3');
    expect(snitch.last.message).to.equal('string1 string2 string3');
  });

  it('strings and numbers logging', function () {
    snitch.clear();
    snitch.log(1, 'string', 2);
    expect(snitch.last.message).to.equal('1 string 2');
  });

  it('objects logging', function () {
    snitch.clear();
    snitch.log({x: 1});
    expect(snitch.last.message).to.equal('{"x":1}');
  });

  it('objects and numbers logging', function () {
    snitch.clear();
    snitch.log({x: 1}, 1);
    expect(snitch.last.message).to.equal('{"x":1} 1');
  });
});

describe('storage', function () {
  var snitch = new Snitch();

  it('log is the same after save/load', function () {
    snitch.clear();
    snitch.log('First test log message');
    snitch.log('Second test log message');

    var snitch2 = new Snitch();
    expect(snitch2.serialize()).to.equal(snitch.serialize());
  });

  it('log is the same after save/load (with options)', function () {
    snitch.clear();
    snitch.log('First test log message');
    snitch.log('Second test log message');

    var snitch2 = new Snitch({customOption: 1});
    expect(snitch2.serialize()).to.equal(snitch.serialize());
  });

  it('storages with different urls not affect each other', function () {
    snitch.clear();
    var snitch2 = new Snitch('/path/to/log/service');
    snitch2.clear();
    snitch2.save();

    snitch.log('Test message');
    snitch2.load();
    expect(snitch2._log.length).to.equal(0);
  });

  it('hard clearing clears storage', function () {
    snitch.clear();
    snitch.log('Test message');
    snitch.clear();
    snitch.load();
    expect(snitch._log.length).to.equal(1);
    snitch.clear(true);
    snitch.load();
    expect(snitch._log.length).to.equal(0);
  });
});

describe('log limits', function () {
  it('remove logs with expired TTL', function (done) {
    var snitch = new Snitch({
      ttl: 200
    });
    snitch.clear();
    snitch.log('Test message 1');
    snitch.log('Test message 2');
    expect(snitch._log.length).to.equal(2);
    setTimeout(function () {
      snitch.log('Test message 3');
      expect(snitch._log.length).to.equal(1);
      done();
    }, 400);
  });

  it('remove logs over capacity', function () {
    var snitch = new Snitch({
      capacity: 3
    });
    snitch.clear();
    snitch.log('Test message 1');
    snitch.log('Test message 2');
    snitch.log('Test message 3');
    snitch.log('Test message 4');
    expect(snitch._log.length).to.equal(3);
    expect(snitch._log[0][1]).to.equal('Test message 2');
  });
});

describe('log timer', function () {
  it('log sending every interval', function (done) {
    var snitch = new Snitch({
      interval: 300
    });
    snitch.clear();
    snitch.log('Test interval');
    expect(snitch._log.length).to.equal(1);
    expect(snitch._log[0][1]).to.equal('Test interval');
    setTimeout(function () {
      expect(snitch._log.length).to.equal(0);
      snitch.log('Test interval 2');
      expect(snitch._log.length).to.equal(1);
      expect(snitch._log[0][1]).to.equal('Test interval 2');
      setTimeout(function () {
        expect(snitch._log.length).to.equal(0);
        done();
      }, 400);
    }, 400);
  });

  it('log sending timer offset', function (done) {
    var snitch = new Snitch();
    snitch.clear();
    snitch.log('Test interval offset');
    setTimeout(function () { // TODO: use async
      var snitch2 = new Snitch({
        interval: 800
      });
      expect(snitch2._log.length).to.equal(1);
      expect(snitch2._log[0][1]).to.equal('Test interval offset');
      setTimeout(function () {
        expect(snitch2._log.length).to.equal(1);
        setTimeout(function () {
          expect(snitch2._log.length).to.equal(0);
          done();
        }, 300);
      }, 200);
    }, 400);
  });
});

describe('errors handling', function () {
  var snitch = new Snitch();
  it('circular structures serialization error catch', function () {
    snitch.clear();
    var a = {};
    a.b = a;
    snitch.log(a);
    expect(snitch._log[0][1]).to.have.string('snitch serialization error');
  });
});
