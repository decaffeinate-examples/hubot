/* eslint-disable
    consistent-return,
    constructor-super,
    func-names,
    import/no-unresolved,
    max-classes-per-file,
    no-cond-assign,
    no-constant-condition,
    no-eval,
    no-param-reassign,
    no-this-before-super,
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const { inspect } = require('util');
const async = require('async');

const { TextMessage } = require('./message');
const Middleware = require('./middleware');

class Listener {
  // Listeners receive every message from the chat source and decide if they
  // want to act on it.
  // An identifier should be provided in the options parameter to uniquely
  // identify the listener (options.id).
  //
  // robot    - A Robot instance.
  // matcher  - A Function that determines if this listener should trigger the
  //            callback.
  // options  - An Object of additional parameters keyed on extension name
  //            (optional).
  // callback - A Function that is triggered if the incoming message matches.
  constructor(robot, matcher, options, callback) {
    this.robot = robot;
    this.matcher = matcher;
    this.options = options;
    this.callback = callback;
    if ((this.matcher == null)) {
      throw new Error('Missing a matcher for Listener');
    }

    if ((this.callback == null)) {
      this.callback = this.options;
      this.options = {};
    }

    if ((this.options.id == null)) {
      this.options.id = null;
    }

    if ((this.callback == null) || (typeof this.callback !== 'function')) {
      throw new Error('Missing a callback for Listener');
    }
  }

  // Public: Determines if the listener likes the content of the message. If
  // so, a Response built from the given Message is passed through all
  // registered middleware and potentially the Listener callback. Note that
  // middleware can intercept the message and prevent the callback from ever
  // being executed.
  //
  // message - A Message instance.
  // middleware - Optional Middleware object to execute before the Listener callback
  // callback - Optional Function called with a boolean of whether the matcher matched
  //
  // Returns a boolean of whether the matcher matched.
  // Returns before executing callback
  call(message, middleware, cb) {
    // middleware argument is optional
    let match;
    if ((cb == null) && (typeof middleware === 'function')) {
      cb = middleware;
      middleware = undefined;
    }

    // ensure we have a Middleware object
    if ((middleware == null)) {
      middleware = new Middleware(this.robot);
    }

    if (match = this.matcher(message)) {
      if (this.regex) {
        this.robot.logger.debug(
          `Message '${message}' matched regex /${inspect(this.regex)}/; listener.options = ${inspect(this.options)}`,
        );
      }

      // special middleware-like function that always executes the Listener's
      // callback and calls done (never calls 'next')
      const executeListener = (context, done) => {
        this.robot.logger.debug(`Executing listener callback for Message '${message}'`);
        try {
          this.callback(context.response);
        } catch (err) {
          this.robot.emit('error', err, context.response);
        }
        return done();
      };

      // When everything is finished (down the middleware stack and back up),
      // pass control back to the robot
      const allDone = function () {
        // Yes, we tried to execute the listener callback (middleware may
        // have intercepted before actually executing though)
        if (cb != null) {
          return Middleware.ticker(() => cb(true));
        }
      };

      const response = new this.robot.Response(this.robot, message, match);
      middleware.execute(
        { listener: this, response },
        executeListener,
        allDone,
      );
      return true;
    }
    if (cb != null) {
      // No, we didn't try to execute the listener callback
      process.nextTick(() => cb(false));
    }
    return false;
  }
}

class TextListener extends Listener {
  // TextListeners receive every message from the chat source and decide if they
  // want to act on it.
  //
  // robot    - A Robot instance.
  // regex    - A Regex that determines if this listener should trigger the
  //            callback.
  // options  - An Object of additional parameters keyed on extension name
  //            (optional).
  // callback - A Function that is triggered if the incoming message matches.
  constructor(robot, regex, options, callback) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      const thisFn = (() => this).toString();
      const thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
      eval(`${thisName} = this;`);
    }
    this.robot = robot;
    this.regex = regex;
    this.options = options;
    this.callback = callback;
    this.matcher = (message) => {
      if (message instanceof TextMessage) {
        return message.match(this.regex);
      }
    };
    super(this.robot, this.matcher, this.options, this.callback);
  }
}

module.exports = {
  Listener,
  TextListener,
};
