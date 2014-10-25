/* globals Snitch, chai, describe, sinon, after, it, beforeEach */
'use strict';
var expect = chai.expect;

describe('xhr', function() {
  var xhr, requests;

  beforeEach(function() {
    xhr = sinon.useFakeXMLHttpRequest();
    requests = [];
    xhr.onCreate = function(req) {
      requests.push(req);
    };
  });

  after(function() {
    // Like before we must clean up when tampering with globals.
    xhr.restore();
  });

  it('makes a POST to system/capture when called in a explicit way',
    function() {
      var snitch = new Snitch('/system/capture');
      snitch.clearAll();
      snitch.log('test');
      snitch.send();
      expect(requests.length).to.equal(1);
      expect(requests[0].url).to.equal('/system/capture');
      expect(requests[0].method).to.equal('POST');
      expect(requests[0].requestBody.userAgent).to.equal(navigator.userAgent);
      expect(JSON.parse(requests[0].requestBody.log)[0][1]).to.equal('test');
    });

  it('makes a POST when storage capacity overflows',
    function(done) {
      requests = [];
      var snitch = new Snitch({
        url: '/system/capture',
        interval: 1000 * 60 * 15,
        capacity: 10,
        solidMode: true
      });
      snitch.clearAll();
      for (var i = 0; i< 100; i++) {
        snitch.log(i, 'element of array');
      }
      expect(requests.length).to.not.equal(0);
      expect(requests[0].url).to.equal('/system/capture');
      expect(requests[0].method).to.equal('POST');
      expect(requests[0].requestBody.userAgent).to.equal(navigator.userAgent);
      expect(JSON.parse(requests[0].requestBody.log)[0][1]).to.equal('0 element of array');
      requests[0].respond(200, { 'Content-Type': 'application/json' },'[]');
      setTimeout(function() {
        for (var i = 100; i< 200; i++) {
          snitch.log(i, 'element of array');
        }
        expect(JSON.parse(requests[1].requestBody.log)[0][1]).to.equal('100 element of array');
        done();
      }, 10);

    });


});
