/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Assertions and Stubbing
const chai = require('chai');
const sinon = require('sinon');
chai.use(require('sinon-chai'));

const { expect } = chai;

// Hubot classes
const Robot = require('../src/robot');
const { CatchAllMessage, EnterMessage, TextMessage } = require('../src/message');
const Adapter = require('../src/adapter');
const Response = require('../src/response');
const Middleware = require('../src/middleware');

// mock `hubot-mock-adapter` module from fixture
const mockery = require('mockery');

describe('Middleware', function() {
  describe('Unit Tests', function() {
    beforeEach(function() {
      this.robot =
        // Stub out event emitting
        {emit: sinon.spy()};

      return this.middleware = new Middleware(this.robot);
    });

    describe('#execute', function() {
      it('executes synchronous middleware', function(testDone) {
        const testMiddleware = sinon.spy((context, next, done) => {
          return next(done);
        });

        this.middleware.register(testMiddleware);

        const middlewareFinished = function() {
          expect(testMiddleware).to.have.been.called;
          return testDone();
        };

        return this.middleware.execute(
          {},
          (_, done) => done(),
          middlewareFinished
        );
      });

      it('executes asynchronous middleware', function(testDone) {
        const testMiddleware = sinon.spy((context, next, done) => // Yield to the event loop
        process.nextTick(() => next(done)));

        this.middleware.register(testMiddleware);

        const middlewareFinished = function(context, done) {
          expect(testMiddleware).to.have.been.called;
          return testDone();
        };

        return this.middleware.execute(
          {},
          (_, done) => done(),
          middlewareFinished
        );
      });

      it('passes the correct arguments to each middleware', function(testDone) {
        const testContext = {};
        // Pull the Robot in scope for simpler callbacks
        const testRobot = this.robot;

        const testMiddleware = (context, next, done) => // Break out of middleware error handling so assertion errors are
        // more visible
        process.nextTick(function() {
          // Check that variables were passed correctly
          expect(context).to.equal(testContext);
          return next(done);
        });

        this.middleware.register(testMiddleware);

        return this.middleware.execute(
          testContext,
          (_, done) => done(),
          () => testDone());
      });

      it('executes all registered middleware in definition order', function(testDone) {
        const middlewareExecution = [];

        const testMiddlewareA = (context, next, done) => {
          middlewareExecution.push('A');
          return next(done);
        };

        const testMiddlewareB = function(context, next, done) {
          middlewareExecution.push('B');
          return next(done);
        };

        this.middleware.register(testMiddlewareA);
        this.middleware.register(testMiddlewareB);

        const middlewareFinished = function() {
          expect(middlewareExecution).to.deep.equal(['A','B']);
          return testDone();
        };

        return this.middleware.execute(
          {},
          (_, done) => done(),
          middlewareFinished
        );
      });

      it('executes the next callback after the function returns when there is no middleware', function(testDone) {
        let finished = false;
        this.middleware.execute(
          {},
          function() {
            expect(finished).to.be.ok;
            return testDone();
          },
          function() {}
        );
        return finished = true;
      });

      it('always executes middleware after the function returns', function(testDone) {
        let finished = false;

        this.middleware.register(function(context, next, done) {
          expect(finished).to.be.ok;
          return testDone();
        });

        this.middleware.execute({}, (function() {}), (function() {}));
        return finished = true;
      });

      it('creates a default "done" function', function(testDone) {
        let finished = false;

        this.middleware.register(function(context, next, done) {
          expect(finished).to.be.ok;
          return testDone();
        });

        // we're testing the lack of a third argument here.
        this.middleware.execute({}, (function() {}));
        return finished = true;
      });

      it('does the right thing with done callbacks', function(testDone) {
        // we want to ensure that the 'done' callbacks are nested correctly
        // (executed in reverse order of definition)
        const execution = [];

        const testMiddlewareA = function(context, next, done) {
          execution.push('middlewareA');
          return next(function() {
            execution.push('doneA');
            return done();
          });
        };

        const testMiddlewareB = function(context, next, done) {
          execution.push('middlewareB');
          return next(function() {
            execution.push('doneB');
            return done();
          });
        };

        this.middleware.register(testMiddlewareA);
        this.middleware.register(testMiddlewareB);

        const allDone = function() {
          expect(execution).to.deep.equal(['middlewareA', 'middlewareB', 'doneB', 'doneA']);
          return testDone();
        };

        return this.middleware.execute(
          {},
          // Short circuit at the bottom of the middleware stack
          (_, done) => done(),
          allDone
        );
      });

      it('defaults to the latest done callback if none is provided', function(testDone) {
        // we want to ensure that the 'done' callbacks are nested correctly
        // (executed in reverse order of definition)
        const execution = [];

        const testMiddlewareA = function(context, next, done) {
          execution.push('middlewareA');
          return next(function() {
            execution.push('doneA');
            return done();
          });
        };

        const testMiddlewareB = function(context, next, done) {
          execution.push('middlewareB');
          return next();
        };

        this.middleware.register(testMiddlewareA);
        this.middleware.register(testMiddlewareB);

        const allDone = function() {
          expect(execution).to.deep.equal(['middlewareA', 'middlewareB', 'doneA']);
          return testDone();
        };

        return this.middleware.execute(
          {},
          // Short circuit at the bottom of the middleware stack
          (_, done) => done(),
          allDone
        );
      });

      return describe('error handling', function() {
        it('does not execute subsequent middleware after the error is thrown', function(testDone) {
          const middlewareExecution = [];

          const testMiddlewareA = function(context, next, done) {
            middlewareExecution.push('A');
            return next(done);
          };

          const testMiddlewareB = function(context, next, done) {
            middlewareExecution.push('B');
            throw new Error;
          };

          const testMiddlewareC = function(context, next, done) {
            middlewareExecution.push('C');
            return next(done);
          };

          this.middleware.register(testMiddlewareA);
          this.middleware.register(testMiddlewareB);
          this.middleware.register(testMiddlewareC);

          const middlewareFinished = sinon.spy();
          const middlewareFailed = () => {
            expect(middlewareFinished).to.not.have.been.called;
            expect(middlewareExecution).to.deep.equal(['A','B']);
            return testDone();
          };

          return this.middleware.execute(
            {},
            middlewareFinished,
            middlewareFailed
          );
        });

        it('emits an error event', function(testDone) {
          const testResponse = {};
          const theError = new Error;

          const testMiddleware = function(context, next, done) {
            throw theError;
          };

          this.middleware.register(testMiddleware);

          this.robot.emit = sinon.spy(function(name, err, response) {
            expect(name).to.equal('error');
            expect(err).to.equal(theError);
            return expect(response).to.equal(testResponse);
          });

          const middlewareFinished = sinon.spy();
          const middlewareFailed = () => {
            expect(this.robot.emit).to.have.been.called;
            return testDone();
          };

          return this.middleware.execute(
            {response: testResponse},
            middlewareFinished,
            middlewareFailed
          );
        });

        return it('unwinds the middleware stack (calling all done functions)', function(testDone) {
          let extraDoneFunc = null;

          const testMiddlewareA = function(context, next, done) {
            // Goal: make sure that the middleware stack is unwound correctly
            extraDoneFunc = sinon.spy(done);
            return next(extraDoneFunc);
          };

          const testMiddlewareB = function(context, next, done) {
            throw new Error;
          };

          this.middleware.register(testMiddlewareA);
          this.middleware.register(testMiddlewareB);

          const middlewareFinished = sinon.spy();
          const middlewareFailed = function() {
            // Sanity check that the error was actually thrown
            expect(middlewareFinished).to.not.have.been.called;

            expect(extraDoneFunc).to.have.been.called;
            return testDone();
          };

          return this.middleware.execute(
            {},
            middlewareFinished,
            middlewareFailed
          );
        });
      });
    });

    return describe('#register', function() {
      it('adds to the list of middleware', function() {
        const testMiddleware = function(context, next, done) {};

        this.middleware.register(testMiddleware);

        return expect(this.middleware.stack).to.include(testMiddleware);
      });

      return it('validates the arity of middleware', function() {
        const testMiddleware = function(context, next, done, extra) {};

        return expect(() => this.middleware.register(testMiddleware)).to.throw(/Incorrect number of arguments/);
      });
    });
  });

  // Per the documentation in docs/scripting.md
  // Any new fields that are exposed to middleware should be explicitly
  // tested for.
  return describe('Public Middleware APIs', function() {
    beforeEach(function() {
      mockery.enable({
        warnOnReplace: false,
        warnOnUnregistered: false
      });
      mockery.registerMock('hubot-mock-adapter', require('./fixtures/mock-adapter'));
      this.robot = new Robot(null, 'mock-adapter', true, 'TestHubot');
      this.robot.run;

      // Re-throw AssertionErrors for clearer test failures
      this.robot.on('error', function(name, err, response) {
        if (__guard__(err != null ? err.constructor : undefined, x => x.name) === "AssertionError") {
          return process.nextTick(function() {
            throw err;
          });
        }
      });

      this.user = this.robot.brain.userForId('1', {
        name: 'hubottester',
        room: '#mocha'
      });

      // Dummy middleware
      this.middleware = sinon.spy((context, next, done) => next(done));

      this.testMessage = new TextMessage(this.user, 'message123');
      this.robot.hear(/^message123$/, function(response) {});
      return this.testListener = this.robot.listeners[0];});

    afterEach(function() {
      mockery.disable();
      return this.robot.shutdown();
    });

    describe('listener middleware context', function() {
      beforeEach(function() {
        return this.robot.listenerMiddleware((context, next, done) => {
          return this.middleware.call(this, context, next, done);
        });
      });

      describe('listener', function() {
        it('is the listener object that matched', function(testDone) {
          return this.robot.receive(this.testMessage, () => {
            expect(this.middleware).to.have.been.calledWithMatch(
              sinon.match.has('listener',
                sinon.match.same(this.testListener)), // context
              sinon.match.any,                    // next
              sinon.match.any                    // done
            );
            return testDone();
          });
        });

        return it('has options.id (metadata)', function(testDone) {
          return this.robot.receive(this.testMessage, () => {
            expect(this.middleware).to.have.been.calledWithMatch(
              sinon.match.has('listener',
                sinon.match.has('options',
                  sinon.match.has('id'))),        // context
              sinon.match.any,                    // next
              sinon.match.any                    // done
            );
            return testDone();
          });
        });
      });

      return describe('response', () => it('is a Response that wraps the message', function(testDone) {
        return this.robot.receive(this.testMessage, () => {
          expect(this.middleware).to.have.been.calledWithMatch(
            sinon.match.has('response',
              sinon.match.instanceOf(Response).and(
                sinon.match.has('message',
                  sinon.match.same(this.testMessage)))), // context
            sinon.match.any,                         // next
            sinon.match.any                         // done
          );
          return testDone();
        });
      }));
    });

    describe('receive middleware context', function() {
      beforeEach(function() {
        return this.robot.receiveMiddleware((context, next, done) => {
          return this.middleware.call(this, context, next, done);
        });
      });

      return describe('response', () => it('is a match-less Response object', function(testDone) {
        return this.robot.receive(this.testMessage, () => {
          expect(this.middleware).to.have.been.calledWithMatch(
            sinon.match.has('response',
              sinon.match.instanceOf(Response).and(
                sinon.match.has('message',
                  sinon.match.same(this.testMessage)))), // context
            sinon.match.any,                         // next
            sinon.match.any                         // done
          );
          return testDone();
        });
      }));
    });

    describe('next', function() {
      beforeEach(function() {
        return this.robot.listenerMiddleware((context, next, done) => {
          return this.middleware.call(this, context, next, done);
        });
      });

      return it('is a function with arity one', function(testDone) {
        return this.robot.receive(this.testMessage, () => {
          expect(this.middleware).to.have.been.calledWithMatch(
            sinon.match.any,             // context
            sinon.match.func.and(
              sinon.match.has('length',
                sinon.match(1))),        // next
            sinon.match.any             // done
          );
          return testDone();
        });
      });
    });

    return describe('done', function() {
      beforeEach(function() {
        return this.robot.listenerMiddleware((context, next, done) => {
          return this.middleware.call(this, context, next, done);
        });
      });

      return it('is a function with arity zero', function(testDone) {
        return this.robot.receive(this.testMessage, () => {
          expect(this.middleware).to.have.been.calledWithMatch(
            sinon.match.any,             // context
            sinon.match.any,             // next
            sinon.match.func.and(
              sinon.match.has('length',
                sinon.match(0)))        // done
          );
          return testDone();
        });
      });
    });
  });
});

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}