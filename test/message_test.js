/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Assertions and Stubbing
const chai = require('chai');
const sinon = require('sinon');
chai.use(require('sinon-chai'));

const { expect } = chai;

// Hubot classes
const User = require('../src/user');
const { CatchAllMessage, EnterMessage, Message, TextMessage } = require('../src/message');

describe('Message', function() {
  beforeEach(function() {
    return this.user = new User({
      id: 1,
      name: 'hubottester',
      room: '#mocha'
    });
  });

  return describe('Unit Tests', function() {
    describe('#finish', () => it('marks the message as done', function() {
      const testMessage = new Message(this.user);
      expect(testMessage.done).to.not.be.ok;
      testMessage.finish();
      return expect(testMessage.done).to.be.ok;
    }));

    return describe('TextMessage', () => describe('#match', () => it('should perform standard regex matching', function() {
      const testMessage = new TextMessage(this.user, 'message123');
      expect( testMessage.match(/^message123$/) ).to.be.ok;
      return expect( testMessage.match(/^does-not-match$/) ).to.not.be.ok;
    })));
  });
});
