/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
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
const { CatchAllMessage, EnterMessage, LeaveMessage, TextMessage, TopicMessage } = require('../src/message');
const Adapter = require('../src/adapter');

const ScopedHttpClient = require('scoped-http-client');

// mock `hubot-mock-adapter` module from fixture
const mockery = require('mockery');

describe('Robot', function() {
  beforeEach(function() {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false
    });
    mockery.registerMock('hubot-mock-adapter', require('./fixtures/mock-adapter'));
    this.robot = new Robot(null, 'mock-adapter', true, 'TestHubot');
    this.robot.alias = 'Hubot';
    this.robot.run;

    // Re-throw AssertionErrors for clearer test failures
    this.robot.on('error', function(name, err, response) {
      if ((err != null ? err.constructor : undefined) == null) { return; }
      if (err.constructor.name === "AssertionError") {
        return process.nextTick(function() {
          throw err;
        });
      }
    });

    return this.user = this.robot.brain.userForId('1', {
      name: 'hubottester',
      room: '#mocha'
    });});

  afterEach(function() {
    mockery.disable();
    return this.robot.shutdown();
  });

  describe('Unit Tests', function() {
    describe('#http', function() {
      beforeEach(function() {
        const url = 'http://localhost';
        return this.httpClient = this.robot.http(url);
      });

      it('creates a new ScopedHttpClient', function() {
        // 'instanceOf' check doesn't work here due to the design of
        // ScopedHttpClient
        expect(this.httpClient).to.have.property('get');
        return expect(this.httpClient).to.have.property('post');
      });

      it('passes options through to the ScopedHttpClient', function() {
        const agent = {};
        const httpClient = this.robot.http('http://localhost', {agent});
        return expect(httpClient.options.agent).to.equal(agent);
      });

      it('sets a sane user agent', function() {
        return expect(this.httpClient.options.headers['User-Agent']).to.contain('Hubot');
      });

      it('merges in any global http options', function() {
        const agent = {};
        this.robot.globalHttpOptions = {agent};
        const httpClient = this.robot.http('http://localhost');
        return expect(httpClient.options.agent).to.equal(agent);
      });

      return it('local options override global http options', function() {
        const agentA = {};
        const agentB = {};
        this.robot.globalHttpOptions = {agent: agentA};
        const httpClient = this.robot.http('http://localhost', {agent: agentB});
        return expect(httpClient.options.agent).to.equal(agentB);
      });
    });

    describe('#respondPattern', function() {
      it('matches messages starting with robot\'s name', function() {
        const testMessage = this.robot.name + 'message123';
        const testRegex   = /(.*)/;

        const pattern = this.robot.respondPattern(testRegex);
        expect(testMessage).to.match(pattern);
        const match = testMessage.match(pattern)[1];
        return expect(match).to.equal('message123');
      });

      it('matches messages starting with robot\'s alias', function() {
        const testMessage = this.robot.alias + 'message123';
        const testRegex   = /(.*)/;

        const pattern = this.robot.respondPattern(testRegex);
        expect(testMessage).to.match(pattern);
        const match = testMessage.match(pattern)[1];
        return expect(match).to.equal('message123');
      });

      it('does not match unaddressed messages', function() {
        const testMessage = 'message123';
        const testRegex   = /(.*)/;

        const pattern = this.robot.respondPattern(testRegex);
        return expect(testMessage).to.not.match(pattern);
      });

      it('matches properly when name is substring of alias', function() {
        this.robot.name  = 'Meg';
        this.robot.alias = 'Megan';
        const testMessage1 = this.robot.name  + ' message123';
        const testMessage2 = this.robot.alias + ' message123';
        const testRegex = /(.*)/;

        const pattern = this.robot.respondPattern(testRegex);

        expect(testMessage1).to.match(pattern);
        const match1 = testMessage1.match(pattern)[1];
        expect(match1).to.equal('message123');

        expect(testMessage2).to.match(pattern);
        const match2 = testMessage2.match(pattern)[1];
        return expect(match2).to.equal('message123');
      });

      return it('matches properly when alias is substring of name', function() {
        this.robot.name  = 'Megan';
        this.robot.alias = 'Meg';
        const testMessage1 = this.robot.name  + ' message123';
        const testMessage2 = this.robot.alias + ' message123';
        const testRegex = /(.*)/;

        const pattern = this.robot.respondPattern(testRegex);

        expect(testMessage1).to.match(pattern);
        const match1 = testMessage1.match(pattern)[1];
        expect(match1).to.equal('message123');

        expect(testMessage2).to.match(pattern);
        const match2 = testMessage2.match(pattern)[1];
        return expect(match2).to.equal('message123');
      });
    });

    describe('#listen', () => it('registers a new listener directly', function() {
      expect(this.robot.listeners).to.have.length(0);
      this.robot.listen((function() {}), function() {});
      return expect(this.robot.listeners).to.have.length(1);
    }));

    describe('#hear', () => it('registers a new listener directly', function() {
      expect(this.robot.listeners).to.have.length(0);
      this.robot.hear(/.*/, function() {});
      return expect(this.robot.listeners).to.have.length(1);
    }));

    describe('#respond', () => it('registers a new listener using hear', function() {
      sinon.spy(this.robot, 'hear');
      this.robot.respond(/.*/, function() {});
      return expect(this.robot.hear).to.have.been.called;
    }));

    describe('#enter', () => it('registers a new listener using listen', function() {
      sinon.spy(this.robot, 'listen');
      this.robot.enter(function() {});
      return expect(this.robot.listen).to.have.been.called;
    }));

    describe('#leave', () => it('registers a new listener using listen', function() {
      sinon.spy(this.robot, 'listen');
      this.robot.leave(function() {});
      return expect(this.robot.listen).to.have.been.called;
    }));

    describe('#topic', () => it('registers a new listener using listen', function() {
      sinon.spy(this.robot, 'listen');
      this.robot.topic(function() {});
      return expect(this.robot.listen).to.have.been.called;
    }));

    describe('#catchAll', () => it('registers a new listener using listen', function() {
      sinon.spy(this.robot, 'listen');
      this.robot.catchAll(function() {});
      return expect(this.robot.listen).to.have.been.called;
    }));

    describe('#receive', function() {
      it('calls all registered listeners', function(done) {
        // Need to use a real Message so that the CatchAllMessage constructor works
        const testMessage = new TextMessage(this.user, 'message123');

        const listener = {
          call(response, middleware, cb) {
            return cb();
          }
        };
        sinon.spy(listener, 'call');

        this.robot.listeners = [
          listener,
          listener,
          listener,
          listener
        ];

        return this.robot.receive(testMessage, function() {
          // When no listeners match, each listener is called twice: once with
          // the original message and once with a CatchAll message
          expect(listener.call).to.have.callCount(8);
          return done();
        });
      });

      it('sends a CatchAllMessage if no listener matches', function(done) {
        // Testing for recursion with a new CatchAllMessage that wraps the
        // original message

        const testMessage = new TextMessage(this.user, 'message123');
        this.robot.listeners = [];

        // Replace @robot.receive so we can catch when the functions recurses
        const oldReceive = this.robot.receive;
        this.robot.receive = function(message, cb) {
          expect(message).to.be.instanceof(CatchAllMessage);
          expect(message.message).to.be.equal(testMessage);
          return cb();
        };
        sinon.spy(this.robot, 'receive');

        // Call the original receive method that we want to test
        return oldReceive.call(this.robot, testMessage, () => {
          expect(this.robot.receive).to.have.been.called;
          return done();
        });
      });

      it('does not trigger a CatchAllMessage if a listener matches', function(done) {
        const testMessage = new TextMessage(this.user, 'message123');

        const matchingListener = {
          call(message, middleware, cb) {
            // indicate that the message matched the listener
            return cb(true);
          }
        };

        // Replace @robot.receive so we can catch if the functions recurses
        const oldReceive = this.robot.receive;
        this.robot.receive = sinon.spy();

        this.robot.listeners = [
          matchingListener
        ];

        // Call the original receive method that we want to test
        oldReceive.call(this.robot, testMessage, done);

        // Ensure the function did not recurse
        return expect(this.robot.receive).to.not.have.been.called;
      });

      it('stops processing if a listener marks the message as done', function(done) {
        const testMessage = new TextMessage(this.user, 'message123');

        const matchingListener = {
          call(message, middleware, cb) {
            message.done = true;
            // Listener must have matched
            return cb(true);
          }
        };

        const listenerSpy =
          {call: sinon.spy()};

        this.robot.listeners = [
          matchingListener,
          listenerSpy
        ];

        return this.robot.receive(testMessage, function() {
          expect(listenerSpy.call).to.not.have.been.called;
          return done();
        });
      });

      it('gracefully handles listener uncaughtExceptions (move on to next listener)', function(done) {
        const testMessage = {};
        const theError = new Error();

        const badListener = {
          call() {
            throw theError;
          }
        };

        let goodListenerCalled = false;
        const goodListener = {
          call(_, middleware, cb) {
            goodListenerCalled = true;
            return cb(true);
          }
        };

        this.robot.listeners = [
          badListener,
          goodListener
        ];

        this.robot.emit = function(name, err, response) {
          expect(name).to.equal('error');
          expect(err).to.equal(theError);
          return expect(response.message).to.equal(testMessage);
        };
        sinon.spy(this.robot, 'emit');

        return this.robot.receive(testMessage, () => {
          expect(this.robot.emit).to.have.been.called;
          expect(goodListenerCalled).to.be.ok;
          return done();
        });
      });

      return it('executes the callback after the function returns when there are no listeners', function(done) {
        const testMessage = new TextMessage(this.user, 'message123');
        let finished = false;
        this.robot.receive(testMessage, function() {
          expect(finished).to.be.ok;
          return done();
        });
        return finished = true;
      });
    });

    return describe('#loadFile', function() {
      beforeEach(function() {
        return this.sandbox = sinon.sandbox.create();
      });

      afterEach(function() {
        return this.sandbox.restore();
      });

      it('should require the specified file', function() {
        const module = require('module');

        const script = sinon.spy(function(robot) {});
        this.sandbox.stub(module, '_load').returns(script);
        this.sandbox.stub(this.robot, 'parseHelp');

        this.robot.loadFile('./scripts', 'test-script.coffee');
        return expect(module._load).to.have.been.calledWith('scripts/test-script');
      });

      describe('proper script', function() {
        beforeEach(function() {
          const module = require('module');

          this.script = sinon.spy(function(robot) {});
          this.sandbox.stub(module, '_load').returns(this.script);
          return this.sandbox.stub(this.robot, 'parseHelp');
        });

        it('should call the script with the Robot', function() {
          this.robot.loadFile('./scripts', 'test-script.coffee');
          return expect(this.script).to.have.been.calledWith(this.robot);
        });

        return it('should parse the script documentation', function() {
          this.robot.loadFile('./scripts', 'test-script.coffee');
          return expect(this.robot.parseHelp).to.have.been.calledWith('scripts/test-script.coffee');
        });
      });

      return describe('non-Function script', function() {
        beforeEach(function() {
          const module = require('module');

          this.script = {};
          this.sandbox.stub(module, '_load').returns(this.script);
          return this.sandbox.stub(this.robot, 'parseHelp');
        });

        return it('logs a warning', function() {
          sinon.stub(this.robot.logger, 'warning');
          this.robot.loadFile('./scripts', 'test-script.coffee');
          return expect(this.robot.logger.warning).to.have.been.called;
        });
      });
    });
  });

  describe('Listener Registration', function() {
    describe('#listen', () => it('forwards the matcher, options, and callback to Listener', function() {
      const callback = sinon.spy();
      const matcher = sinon.spy();
      const options = {};

      this.robot.listen(matcher, options, callback);
      const testListener = this.robot.listeners[0];

      expect(testListener.matcher).to.equal(matcher);
      expect(testListener.callback).to.equal(callback);
      return expect(testListener.options).to.equal(options);
    }));

    describe('#hear', function() {
      it('matches TextMessages', function() {
        const callback = sinon.spy();
        const testMessage = new TextMessage(this.user, 'message123');
        const testRegex = /^message123$/;

        this.robot.hear(testRegex, callback);
        const testListener = this.robot.listeners[0];
        const result = testListener.matcher(testMessage);

        return expect(result).to.be.ok;
      });

      return it('does not match EnterMessages', function() {
        const callback = sinon.spy();
        const testMessage = new EnterMessage(this.user);
        const testRegex = /.*/;

        this.robot.hear(testRegex, callback);
        const testListener = this.robot.listeners[0];
        const result = testListener.matcher(testMessage);

        return expect(result).to.not.be.ok;
      });
    });

    describe('#respond', function() {
      it('matches TextMessages addressed to the robot', function() {
        const callback = sinon.spy();
        const testMessage = new TextMessage(this.user, 'TestHubot message123');
        const testRegex = /message123$/;

        this.robot.respond(testRegex, callback);
        const testListener = this.robot.listeners[0];
        const result = testListener.matcher(testMessage);

        return expect(result).to.be.ok;
      });

      return it('does not match EnterMessages', function() {
        const callback = sinon.spy();
        const testMessage = new EnterMessage(this.user);
        const testRegex = /.*/;

        this.robot.respond(testRegex, callback);
        const testListener = this.robot.listeners[0];
        const result = testListener.matcher(testMessage);

        return expect(result).to.not.be.ok;
      });
    });

    describe('#enter', function() {
      it('matches EnterMessages', function() {
        const callback = sinon.spy();
        const testMessage = new EnterMessage(this.user);

        this.robot.enter(callback);
        const testListener = this.robot.listeners[0];
        const result = testListener.matcher(testMessage);

        return expect(result).to.be.ok;
      });

      return it('does not match TextMessages', function() {
        const callback = sinon.spy();
        const testMessage = new TextMessage(this.user, 'message123');

        this.robot.enter(callback);
        const testListener = this.robot.listeners[0];
        const result = testListener.matcher(testMessage);

        return expect(result).to.not.be.ok;
      });
    });

    describe('#leave', function() {
      it('matches LeaveMessages', function() {
        const callback = sinon.spy();
        const testMessage = new LeaveMessage(this.user);

        this.robot.leave(callback);
        const testListener = this.robot.listeners[0];
        const result = testListener.matcher(testMessage);

        return expect(result).to.be.ok;
      });

      return it('does not match TextMessages', function() {
        const callback = sinon.spy();
        const testMessage = new TextMessage(this.user, 'message123');

        this.robot.leave(callback);
        const testListener = this.robot.listeners[0];
        const result = testListener.matcher(testMessage);

        return expect(result).to.not.be.ok;
      });
    });

    describe('#topic', function() {
      it('matches TopicMessages', function() {
        const callback = sinon.spy();
        const testMessage = new TopicMessage(this.user);

        this.robot.topic(callback);
        const testListener = this.robot.listeners[0];
        const result = testListener.matcher(testMessage);

        return expect(result).to.be.ok;
      });

      return it('does not match TextMessages', function() {
        const callback = sinon.spy();
        const testMessage = new TextMessage(this.user, 'message123');

        this.robot.topic(callback);
        const testListener = this.robot.listeners[0];
        const result = testListener.matcher(testMessage);

        return expect(result).to.not.be.ok;
      });
    });

    return describe('#catchAll', function() {
      it('matches CatchAllMessages', function() {
        const callback = sinon.spy();
        const testMessage = new CatchAllMessage(new TextMessage(this.user, 'message123'));

        this.robot.catchAll(callback);
        const testListener = this.robot.listeners[0];
        const result = testListener.matcher(testMessage);

        return expect(result).to.be.ok;
      });

      return it('does not match TextMessages', function() {
        const callback = sinon.spy();
        const testMessage = new TextMessage(this.user, 'message123');

        this.robot.catchAll(callback);
        const testListener = this.robot.listeners[0];
        const result = testListener.matcher(testMessage);

        return expect(result).to.not.be.ok;
      });
    });
  });

  return describe('Message Processing', function() {
    it('calls a matching listener', function(done) {
      const testMessage = new TextMessage(this.user, 'message123');
      this.robot.hear(/^message123$/, function(response) {
        expect(response.message).to.equal(testMessage);
        return done();
      });
      return this.robot.receive(testMessage);
    });

    it('calls multiple matching listeners', function(done) {
      const testMessage = new TextMessage(this.user, 'message123');

      let listenersCalled = 0;
      const listenerCallback = function(response) {
        expect(response.message).to.equal(testMessage);
        return listenersCalled++;
      };

      this.robot.hear(/^message123$/, listenerCallback);
      this.robot.hear(/^message123$/, listenerCallback);

      return this.robot.receive(testMessage, function() {
        expect(listenersCalled).to.equal(2);
        return done();
      });
    });

    it('calls the catch-all listener if no listeners match', function(done) {
      const testMessage = new TextMessage(this.user, 'message123');

      const listenerCallback = sinon.spy();
      this.robot.hear(/^no-matches$/, listenerCallback);

      this.robot.catchAll(function(response) {
        expect(listenerCallback).to.not.have.been.called;
        expect(response.message).to.equal(testMessage);
        return done();
      });

      return this.robot.receive(testMessage);
    });

    it('does not call the catch-all listener if any listener matched', function(done) {
      const testMessage = new TextMessage(this.user, 'message123');

      const listenerCallback = sinon.spy();
      this.robot.hear(/^message123$/, listenerCallback);

      const catchAllCallback = sinon.spy();
      this.robot.catchAll(catchAllCallback);

      return this.robot.receive(testMessage, function() {
        expect(listenerCallback).to.have.been.called.once;
        expect(catchAllCallback).to.not.have.been.called;
        return done();
      });
    });

    it('stops processing if message.finish() is called synchronously', function(done) {
      const testMessage = new TextMessage(this.user, 'message123');

      this.robot.hear(/^message123$/, response => response.message.finish());

      const listenerCallback = sinon.spy();
      this.robot.hear(/^message123$/, listenerCallback);

      return this.robot.receive(testMessage, function() {
        expect(listenerCallback).to.not.have.been.called;
        return done();
      });
    });

    it('calls non-TextListener objects', function(done) {
      const testMessage = new EnterMessage(this.user);

      this.robot.enter(function(response) {
        expect(response.message).to.equal(testMessage);
        return done();
      });

      return this.robot.receive(testMessage);
    });

    it('gracefully handles listener uncaughtExceptions (move on to next listener)', function(done) {
      const testMessage = new TextMessage(this.user, 'message123');
      const theError = new Error();

      this.robot.hear(/^message123$/, function() {
        throw theError;
      });

      let goodListenerCalled = false;
      this.robot.hear(/^message123$/, () => goodListenerCalled = true);

      const [badListener,goodListener] = Array.from(this.robot.listeners);

      this.robot.emit = function(name, err, response) {
        expect(name).to.equal('error');
        expect(err).to.equal(theError);
        return expect(response.message).to.equal(testMessage);
      };
      sinon.spy(this.robot, 'emit');

      return this.robot.receive(testMessage, () => {
        expect(this.robot.emit).to.have.been.called;
        expect(goodListenerCalled).to.be.ok;
        return done();
      });
    });

    describe('Listener Middleware', function() {
      it('allows listener callback execution', function(testDone) {
        const listenerCallback = sinon.spy();
        this.robot.hear(/^message123$/, listenerCallback);
        this.robot.listenerMiddleware((context, next, done) => // Allow Listener callback execution
        next(done));

        const testMessage = new TextMessage(this.user, 'message123');
        return this.robot.receive(testMessage, function() {
          expect(listenerCallback).to.have.been.called;
          return testDone();
        });
      });

      it('can block listener callback execution', function(testDone) {
        const listenerCallback = sinon.spy();
        this.robot.hear(/^message123$/, listenerCallback);
        this.robot.listenerMiddleware((context, next, done) => // Block Listener callback execution
        done());

        const testMessage = new TextMessage(this.user, 'message123');
        return this.robot.receive(testMessage, function() {
          expect(listenerCallback).to.not.have.been.called;
          return testDone();
        });
      });

      it('receives the correct arguments', function(testDone) {
        this.robot.hear(/^message123$/, function() {});
        const testListener = this.robot.listeners[0];
        const testMessage = new TextMessage(this.user, 'message123');

        this.robot.listenerMiddleware((context, next, done) => {
          // Escape middleware error handling for clearer test failures
          return process.nextTick(() => {
            expect(context.listener).to.equal(testListener);
            expect(context.response.message).to.equal(testMessage);
            expect(next).to.be.a('function');
            expect(done).to.be.a('function');
            return testDone();
          });
        });

        return this.robot.receive(testMessage);
      });

      return it('executes middleware in order of definition', function(testDone) {
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

        this.robot.listenerMiddleware(testMiddlewareA);
        this.robot.listenerMiddleware(testMiddlewareB);

        this.robot.hear(/^message123$/, () => execution.push('listener'));

        const testMessage = new TextMessage(this.user, 'message123');
        return this.robot.receive(testMessage, function() {
          expect(execution).to.deep.equal([
            'middlewareA',
            'middlewareB',
            'listener',
            'doneB',
            'doneA'
          ]);
          return testDone();
        });
      });
    });

    describe('Receive Middleware', function() {
      it('fires for all messages, including non-matching ones', function(testDone) {
        const middlewareSpy = sinon.spy();
        const listenerCallback = sinon.spy();
        this.robot.hear(/^message123$/, listenerCallback);
        this.robot.receiveMiddleware(function(context, next, done) {
          middlewareSpy();
          return next(done);
        });

        const testMessage = new TextMessage(this.user, 'not message 123');

        return this.robot.receive(testMessage, function() {
          expect(listenerCallback).to.not.have.been.called;
          expect(middlewareSpy).to.have.been.called;
          return testDone();
        });
      });

      it('can block listener execution', function(testDone) {
        const middlewareSpy = sinon.spy();
        const listenerCallback = sinon.spy();
        this.robot.hear(/^message123$/, listenerCallback);
        this.robot.receiveMiddleware(function(context, next, done) {
          // Block Listener callback execution
          middlewareSpy();
          return done();
        });

        const testMessage = new TextMessage(this.user, 'message123');
        return this.robot.receive(testMessage, function() {
          expect(listenerCallback).to.not.have.been.called;
          expect(middlewareSpy).to.have.been.called;
          return testDone();
        });
      });

      it('receives the correct arguments', function(testDone) {
        this.robot.hear(/^message123$/, function() {});
        const testMessage = new TextMessage(this.user, 'message123');

        this.robot.receiveMiddleware(function(context, next, done) {
          // Escape middleware error handling for clearer test failures
          expect(context.response.message).to.equal(testMessage);
          expect(next).to.be.a('function');
          expect(done).to.be.a('function');
          testDone();
          return next(done);
        });

        return this.robot.receive(testMessage);
      });

      it('executes receive middleware in order of definition', function(testDone) {
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

        this.robot.receiveMiddleware(testMiddlewareA);
        this.robot.receiveMiddleware(testMiddlewareB);

        this.robot.hear(/^message123$/, () => execution.push('listener'));

        const testMessage = new TextMessage(this.user, 'message123');
        return this.robot.receive(testMessage, function() {
          expect(execution).to.deep.equal([
            'middlewareA',
            'middlewareB',
            'listener',
            'doneB',
            'doneA'
          ]);
          return testDone();
        });
      });

      return it('allows editing the message portion of the given response', function(testDone) {
        const execution = [];

        const testMiddlewareA = function(context, next, done) {
          context.response.message.text = 'foobar';
          return next();
        };

        const testMiddlewareB = function(context, next, done) {
          // Subsequent middleware should see the modified message
          expect(context.response.message.text).to.equal("foobar");
          return next();
        };

        this.robot.receiveMiddleware(testMiddlewareA);
        this.robot.receiveMiddleware(testMiddlewareB);

        const testCallback = sinon.spy();
        // We'll never get to this if testMiddlewareA has not modified the message.
        this.robot.hear(/^foobar$/, testCallback);

        const testMessage = new TextMessage(this.user, 'message123');
        return this.robot.receive(testMessage, function() {
          expect(testCallback).to.have.been.called;
          return testDone();
        });
      });
    });

    return describe('Response Middleware', function() {
      it('executes response middleware in order', function(testDone) {
        let sendSpy;
        this.robot.adapter.send = (sendSpy = sinon.spy());
        const listenerCallback = sinon.spy();
        this.robot.hear(/^message123$/, response => response.send("foobar, sir, foobar."));

        this.robot.responseMiddleware(function(context, next, done) {
          context.strings[0] = context.strings[0].replace(/foobar/g, "barfoo");
          return next();
        });

        this.robot.responseMiddleware(function(context, next, done) {
          context.strings[0] = context.strings[0].replace(/barfoo/g, "replaced bar-foo");
          return next();
        });

        const testMessage = new TextMessage(this.user, 'message123');
        return this.robot.receive(testMessage, function() {
          expect(sendSpy.getCall(0).args[1]).to.equal('replaced bar-foo, sir, replaced bar-foo.');
          return testDone();
        });
      });

      it('allows replacing outgoing strings', function(testDone) {
        let sendSpy;
        this.robot.adapter.send = (sendSpy = sinon.spy());
        const listenerCallback = sinon.spy();
        this.robot.hear(/^message123$/, response => response.send("foobar, sir, foobar."));

        this.robot.responseMiddleware(function(context, next, done) {
          context.strings = ["whatever I want."];
          return next();
        });

        const testMessage = new TextMessage(this.user, 'message123');
        return this.robot.receive(testMessage, function() {
          expect(sendSpy.getCall(0).args[1]).to.deep.equal("whatever I want.");
          return testDone();
        });
      });

      it('marks plaintext as plaintext', function(testDone) {
        let sendSpy;
        this.robot.adapter.send = (sendSpy = sinon.spy());
        const listenerCallback = sinon.spy();
        this.robot.hear(/^message123$/, response => response.send("foobar, sir, foobar."));
        this.robot.hear(/^message456$/, response => response.play("good luck with that"));

        let method = undefined;
        let plaintext = undefined;
        this.robot.responseMiddleware(function(context, next, done) {
          ({
            method
          } = context);
          ({
            plaintext
          } = context);
          return next(done);
        });

        const testMessage = new TextMessage(this.user, 'message123');

        return this.robot.receive(testMessage, () => {
          expect(plaintext).to.equal(true);
          expect(method).to.equal("send");
          const testMessage2 = new TextMessage(this.user, 'message456');
          return this.robot.receive(testMessage2, function() {
            expect(plaintext).to.equal(undefined);
            expect(method).to.equal("play");
            return testDone();
          });
        });
      });

      return it('does not send trailing functions to middleware', function(testDone) {
        let sendSpy;
        this.robot.adapter.send = (sendSpy = sinon.spy());
        let asserted = false;
        const postSendCallback = function() {};
        this.robot.hear(/^message123$/, response => response.send("foobar, sir, foobar.", postSendCallback));

        this.robot.responseMiddleware(function(context, next, done) {
          // We don't send the callback function to middleware, so it's not here.
          expect(context.strings).to.deep.equal(["foobar, sir, foobar."]);
          expect(context.method).to.equal("send");
          asserted = true;
          return next();
        });

        const testMessage = new TextMessage(this.user, 'message123');
        return this.robot.receive(testMessage, function() {
          expect(asserted).to.equal(true);
          expect(sendSpy.getCall(0).args[1]).to.equal('foobar, sir, foobar.');
          expect(sendSpy.getCall(0).args[2]).to.equal(postSendCallback);
          return testDone();
        });
      });
    });
  });
});
