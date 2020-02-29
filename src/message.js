/* eslint-disable
    constructor-super,
    max-classes-per-file,
    no-constant-condition,
    no-eval,
    no-param-reassign,
    no-return-assign,
    no-this-before-super,
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
class Message {
  // Represents an incoming message from the chat.
  //
  // user - A User instance that sent the message.
  constructor(user, done) {
    this.user = user;
    if (done == null) { done = false; }
    this.done = done;
    this.room = this.user.room;
  }

  // Indicates that no other Listener should be called on this object
  //
  // Returns nothing.
  finish() {
    return this.done = true;
  }
}

class TextMessage extends Message {
  // Represents an incoming message from the chat.
  //
  // user - A User instance that sent the message.
  // text - A String message.
  // id   - A String of the message ID.
  constructor(user, text, id) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      const thisFn = (() => this).toString();
      const thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
      eval(`${thisName} = this;`);
    }
    this.user = user;
    this.text = text;
    this.id = id;
    super(this.user);
  }

  // Determines if the message matches the given regex.
  //
  // regex - A Regex to check.
  //
  // Returns a Match object or null.
  match(regex) {
    return this.text.match(regex);
  }

  // String representation of a TextMessage
  //
  // Returns the message text
  toString() {
    return this.text;
  }
}

// Represents an incoming user entrance notification.
//
// user - A User instance for the user who entered.
// text - Always null.
// id   - A String of the message ID.
class EnterMessage extends Message {}

// Represents an incoming user exit notification.
//
// user - A User instance for the user who left.
// text - Always null.
// id   - A String of the message ID.
class LeaveMessage extends Message {}

// Represents an incoming topic change notification.
//
// user - A User instance for the user who changed the topic.
// text - A String of the new topic
// id   - A String of the message ID.
class TopicMessage extends TextMessage {}

class CatchAllMessage extends Message {
  // Represents a message that no matchers matched.
  //
  // message - The original message.
  constructor(message) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      const thisFn = (() => this).toString();
      const thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
      eval(`${thisName} = this;`);
    }
    this.message = message;
    super(this.message.user);
  }
}

module.exports = {
  Message,
  TextMessage,
  EnterMessage,
  LeaveMessage,
  TopicMessage,
  CatchAllMessage,
};
