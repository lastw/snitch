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
    var url = 'localhost:3333',
        snitch = new Snitch(url);
    expect(snitch.url).to.equal(url);
  });

  it('pass url to constuctor as options.url', function () {
    var url = 'localhost:3333',
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

  it('storages with different urls not affect each other', function () {
    snitch.clear();
    var snitch2 = new Snitch('localhost:1234');
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
