/* eslint-disable
    consistent-return,
    func-names,
    import/no-unresolved,
    max-len,
    no-return-assign,
    no-undef,
    no-unused-expressions,
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
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
const { CatchAllMessage, EnterMessage, TextMessage } = require('../src/message');
const { Listener, TextListener } = require('../src/listener');
const Response = require('../src/response');
const User = require('../src/user');

describe('Listener', () => {
  beforeEach(function () {
    // Dummy robot
    this.robot = {
      // Re-throw AssertionErrors for clearer test failures
      emit(name, err, response) {
        if (err.constructor.name === 'AssertionError') {
          return process.nextTick(() => {
            throw err;
          });
        }
      },
      // Ignore log messages
      logger: {
        debug() {},
      },
      // Why is this part of the Robot object??
      Response,
    };

    // Test user
    return this.user = new User({
      id: 1,
      name: 'hubottester',
      room: '#mocha',
    });
  });

  return describe('Unit Tests', () => {
    describe('#call', () => {
      it('calls the matcher', function (done) {
        const callback = sinon.spy();
        const testMatcher = sinon.spy();
        const testMessage = {};

        const testListener = new Listener(this.robot, testMatcher, callback);
        return testListener.call(testMessage, (_) => {
          expect(testMatcher).to.have.been.calledWith(testMessage);
          return done();
        });
      });

      it('passes the matcher result on to the listener callback', function (done) {
        const matcherResult = {};
        const testMatcher = sinon.stub().returns(matcherResult);
        const testMessage = {};
        const listenerCallback = (response) => expect(response.match).to.be.equal(matcherResult);

        // sanity check; matcherResult must be truthy
        expect(matcherResult).to.be.ok;

        const testListener = new Listener(this.robot, testMatcher, listenerCallback);
        return testListener.call(testMessage, (result) => {
          // sanity check; message should have been processed
          expect(testMatcher).to.have.been.called;
          expect(result).to.be.ok;

          return done();
        });
      });

      describe('if the matcher returns true', () => {
        beforeEach(function () {
          return this.createListener = function (cb) {
            return new Listener(this.robot, sinon.stub().returns(true), cb);
          };
        });

        it('executes the listener callback', function (done) {
          const listenerCallback = sinon.spy();
          const testMessage = {};

          const testListener = this.createListener(listenerCallback);
          return testListener.call(testMessage, (_) => {
            expect(listenerCallback).to.have.been.called;
            return done();
          });
        });


        it('returns true', function () {
          const testMessage = {};

          const testListener = this.createListener(() => {});
          const result = testListener.call(testMessage);
          return expect(result).to.be.ok;
        });

        it('calls the provided callback with true', function (done) {
          const testMessage = {};

          const testListener = this.createListener(() => {});
          return testListener.call(testMessage, (result) => {
            expect(result).to.be.ok;
            return done();
          });
        });

        it('calls the provided callback after the function returns', function (done) {
          const testMessage = {};

          const testListener = this.createListener(() => {});
          let finished = false;
          testListener.call(testMessage, (result) => {
            expect(finished).to.be.ok;
            return done();
          });
          return finished = true;
        });

        it('handles uncaught errors from the listener callback', function (done) {
          const testMessage = {};
          const theError = new Error();

          const listenerCallback = function (response) {
            throw theError;
          };

          this.robot.emit = function (name, err, response) {
            expect(name).to.equal('error');
            expect(err).to.equal(theError);
            expect(response.message).to.equal(testMessage);
            return done();
          };

          const testListener = this.createListener(listenerCallback);
          return testListener.call(testMessage, sinon.spy());
        });

        it('calls the provided callback with true if there is an error thrown by the listener callback', function (done) {
          const testMessage = {};
          const theError = new Error();

          const listenerCallback = function (response) {
            throw theError;
          };

          const testListener = this.createListener(listenerCallback);
          return testListener.call(testMessage, (result) => {
            expect(result).to.be.ok;
            return done();
          });
        });

        it('calls the listener callback with a Response that wraps the Message', function (done) {
          const testMessage = {};

          const listenerCallback = function (response) {
            expect(response.message).to.equal(testMessage);
            return done();
          };

          const testListener = this.createListener(listenerCallback);

          return testListener.call(testMessage, sinon.spy());
        });

        it('passes through the provided middleware stack', function (testDone) {
          const testMessage = {};

          const testListener = this.createListener(() => {});
          const testMiddleware = {
            execute(context, next, done) {
              expect(context.listener).to.be.equal(testListener);
              expect(context.response).to.be.instanceof(Response);
              expect(context.response.message).to.be.equal(testMessage);
              expect(next).to.be.a('function');
              expect(done).to.be.a('function');
              return testDone();
            },
          };

          return testListener.call(testMessage, testMiddleware, sinon.spy());
        });

        it('executes the listener callback if middleware succeeds', function (testDone) {
          const listenerCallback = sinon.spy();
          const testMessage = {};

          const testListener = this.createListener(listenerCallback);

          return testListener.call(testMessage, (result) => {
            expect(listenerCallback).to.have.been.called;
            // Matcher matched, so we return true
            expect(result).to.be.ok;
            return testDone();
          });
        });

        it('does not execute the listener callback if middleware fails', function (testDone) {
          const listenerCallback = sinon.spy();
          const testMessage = {};

          const testListener = this.createListener(listenerCallback);
          const testMiddleware = {
            execute(context, next, done) {
              // Middleware fails
              return done();
            },
          };

          return testListener.call(testMessage, testMiddleware, (result) => {
            expect(listenerCallback).to.not.have.been.called;
            // Matcher still matched, so we return true
            expect(result).to.be.ok;
            return testDone();
          });
        });

        return it('unwinds the middleware stack if there is an error in the listener callback', function (testDone) {
          const listenerCallback = sinon.stub().throws(new Error());
          const testMessage = {};
          let extraDoneFunc = null;

          const testListener = this.createListener(listenerCallback);
          const testMiddleware = {
            execute(context, next, done) {
              extraDoneFunc = sinon.spy(done);
              return next(context, extraDoneFunc);
            },
          };

          return testListener.call(testMessage, testMiddleware, (result) => {
            // Listener callback was called (and failed)
            expect(listenerCallback).to.have.been.called;
            // Middleware stack was unwound correctly
            expect(extraDoneFunc).to.have.been.called;
            // Matcher still matched, so we return true
            expect(result).to.be.ok;
            return testDone();
          });
        });
      });


      return describe('if the matcher returns false', () => {
        beforeEach(function () {
          return this.createListener = function (cb) {
            return new Listener(this.robot, sinon.stub().returns(false), cb);
          };
        });

        it('does not execute the listener callback', function (done) {
          const listenerCallback = sinon.spy();
          const testMessage = {};

          const testListener = this.createListener(listenerCallback);
          return testListener.call(testMessage, (_) => {
            expect(listenerCallback).to.not.have.been.called;
            return done();
          });
        });


        it('returns false', function () {
          const testMessage = {};

          const testListener = this.createListener(() => {});
          const result = testListener.call(testMessage);
          return expect(result).to.not.be.ok;
        });

        it('calls the provided callback with false', function (done) {
          const testMessage = {};

          const testListener = this.createListener(() => {});
          return testListener.call(testMessage, (result) => {
            expect(result).to.not.be.ok;
            return done();
          });
        });

        it('calls the provided callback after the function returns', function (done) {
          const testMessage = {};

          const testListener = this.createListener(() => {});
          let finished = false;
          testListener.call(testMessage, (result) => {
            expect(finished).to.be.ok;
            return done();
          });
          return finished = true;
        });

        return it('does not execute any middleware', function (done) {
          const testMessage = {};

          const testListener = this.createListener(() => {});
          const testMiddleware = { execute: sinon.spy() };

          return testListener.call(testMessage, (result) => {
            expect(testMiddleware.execute).to.not.have.been.called;
            return done();
          });
        });
      });
    });

    describe('#constructor', () => {
      it('requires a matcher', () => expect(function () { return new Listener(this.robot, undefined, {}, sinon.spy()); }).to.throw(Error));

      it('requires a callback', () => {
        // No options
        expect(function () { return new Listener(this.robot, sinon.spy()); }).to.throw(Error);
        // With options
        return expect(function () { return new Listener(this.robot, sinon.spy(), {}); }).to.throw(Error);
      });

      it('gracefully handles missing options', function () {
        const testMatcher = sinon.spy();
        const listenerCallback = sinon.spy();
        const testListener = new Listener(this.robot, testMatcher, listenerCallback);
        // slightly brittle because we are testing for the default options Object
        expect(testListener.options).to.deep.equal({ id: null });
        return expect(testListener.callback).to.be.equal(listenerCallback);
      });

      return it('gracefully handles a missing ID (set to null)', function () {
        const testMatcher = sinon.spy();
        const listenerCallback = sinon.spy();
        const testListener = new Listener(this.robot, testMatcher, {}, listenerCallback);
        return expect(testListener.options.id).to.be.null;
      });
    });

    return describe('TextListener', () => describe('#matcher', () => {
      it('matches TextMessages', function () {
        const callback = sinon.spy();
        const testMessage = new TextMessage(this.user, 'test');
        testMessage.match = sinon.stub().returns(true);
        const testRegex = /test/;

        const testListener = new TextListener(this.robot, testRegex, callback);
        const result = testListener.matcher(testMessage);

        expect(result).to.be.ok;
        return expect(testMessage.match).to.have.been.calledWith(testRegex);
      });

      return it('does not match EnterMessages', function () {
        const callback = sinon.spy();
        const testMessage = new EnterMessage(this.user);
        testMessage.match = sinon.stub().returns(true);
        const testRegex = /test/;

        const testListener = new TextListener(this.robot, testRegex, callback);
        const result = testListener.matcher(testMessage);

        expect(result).to.not.be.ok;
        return expect(testMessage.match).to.not.have.been.called;
      });
    }));
  });
});
