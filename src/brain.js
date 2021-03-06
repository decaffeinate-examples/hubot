/* eslint-disable
    consistent-return,
    constructor-super,
    func-names,
    guard-for-in,
    no-constant-condition,
    no-eval,
    no-param-reassign,
    no-restricted-syntax,
    no-return-assign,
    no-this-before-super,
    no-underscore-dangle,
    no-use-before-define,
    no-var,
    vars-on-top,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS203: Remove `|| {}` from converted for-own loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const { EventEmitter } = require('events');

const User = require('./user');

class Brain extends EventEmitter {
  // Represents somewhat persistent storage for the robot. Extend this.
  //
  // Returns a new Brain with no external storage.
  constructor(robot) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      const thisFn = (() => this).toString();
      const thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
      eval(`${thisName} = this;`);
    }
    this.data = {
      users: { },
      _private: { },
    };

    this.autoSave = true;

    robot.on('running', () => this.resetSaveInterval(5));
  }

  // Public: Store key-value pair under the private namespace and extend
  // existing @data before emitting the 'loaded' event.
  //
  // Returns the instance for chaining.
  set(key, value) {
    let pair;
    if (key === Object(key)) {
      pair = key;
    } else {
      pair = {};
      pair[key] = value;
    }

    extend(this.data._private, pair);
    this.emit('loaded', this.data);
    return this;
  }

  // Public: Get value by key from the private namespace in @data
  // or return null if not found.
  //
  // Returns the value.
  get(key) {
    return this.data._private[key] != null ? this.data._private[key] : null;
  }

  // Public: Remove value by key from the private namespace in @data
  // if it exists
  //
  // Returns the instance for chaining.
  remove(key) {
    if (this.data._private[key] != null) { delete this.data._private[key]; }
    return this;
  }

  // Public: Emits the 'save' event so that 'brain' scripts can handle
  // persisting.
  //
  // Returns nothing.
  save() {
    return this.emit('save', this.data);
  }

  // Public: Emits the 'close' event so that 'brain' scripts can handle closing.
  //
  // Returns nothing.
  close() {
    clearInterval(this.saveInterval);
    this.save();
    return this.emit('close');
  }

  // Public: Enable or disable the automatic saving
  //
  // enabled - A boolean whether to autosave or not
  //
  // Returns nothing
  setAutoSave(enabled) {
    return this.autoSave = enabled;
  }

  // Public: Reset the interval between save function calls.
  //
  // seconds - An Integer of seconds between saves.
  //
  // Returns nothing.
  resetSaveInterval(seconds) {
    if (this.saveInterval) { clearInterval(this.saveInterval); }
    return this.saveInterval = setInterval(() => {
      if (this.autoSave) { return this.save(); }
    },
    seconds * 1000);
  }

  // Public: Merge keys loaded from a DB against the in memory representation.
  //
  // Returns nothing.
  //
  // Caveats: Deeply nested structures don't merge well.
  mergeData(data) {
    for (const k in (data || { })) {
      this.data[k] = data[k];
    }

    return this.emit('loaded', this.data);
  }

  // Public: Get an Array of User objects stored in the brain.
  //
  // Returns an Array of User objects.
  users() {
    return this.data.users;
  }

  // Public: Get a User object given a unique identifier.
  //
  // Returns a User instance of the specified user.
  userForId(id, options) {
    let user = this.data.users[id];
    if (!user) {
      user = new User(id, options);
      this.data.users[id] = user;
    }

    if (options && options.room && (!user.room || (user.room !== options.room))) {
      user = new User(id, options);
      this.data.users[id] = user;
    }

    return user;
  }

  // Public: Get a User object given a name.
  //
  // Returns a User instance for the user with the specified name.
  userForName(name) {
    let result = null;
    const lowerName = name.toLowerCase();
    for (const k in (this.data.users || { })) {
      const userName = this.data.users[k].name;
      if ((userName != null) && (userName.toString().toLowerCase() === lowerName)) {
        result = this.data.users[k];
      }
    }
    return result;
  }

  // Public: Get all users whose names match fuzzyName. Currently, match
  // means 'starts with', but this could be extended to match initials,
  // nicknames, etc.
  //
  // Returns an Array of User instances matching the fuzzy name.
  usersForRawFuzzyName(fuzzyName) {
    const lowerFuzzyName = fuzzyName.toLowerCase();
    return (() => {
      const result = [];
      const object = this.data.users || {};
      for (const key in object) {
        const user = object[key];
        if (user.name.toLowerCase().lastIndexOf(lowerFuzzyName, 0) === 0) {
          result.push(user);
        }
      }
      return result;
    })();
  }

  // Public: If fuzzyName is an exact match for a user, returns an array with
  // just that user. Otherwise, returns an array of all users for which
  // fuzzyName is a raw fuzzy match (see usersForRawFuzzyName).
  //
  // Returns an Array of User instances matching the fuzzy name.
  usersForFuzzyName(fuzzyName) {
    const matchedUsers = this.usersForRawFuzzyName(fuzzyName);
    const lowerFuzzyName = fuzzyName.toLowerCase();
    for (const user of Array.from(matchedUsers)) {
      if (user.name.toLowerCase() === lowerFuzzyName) { return [user]; }
    }

    return matchedUsers;
  }
}

// Private: Extend obj with objects passed as additional args.
//
// Returns the original object with updated changes.
var extend = function (obj, ...sources) {
  for (const source of Array.from(sources)) {
    for (const key of Object.keys(source || {})) { const value = source[key]; obj[key] = value; }
  }
  return obj;
};

module.exports = Brain;
