/* eslint-disable
    guard-for-in,
    no-param-reassign,
    no-restricted-syntax,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
class User {
  // Represents a participating user in the chat.
  //
  // id      - A unique ID for the user.
  // options - An optional Hash of key, value pairs for this user.
  constructor(id, options) {
    this.id = id;
    if (options == null) { options = {}; }
    for (const k in (options || {})) {
      this[k] = options[k];
    }
    if (!this.name) { this.name = this.id.toString(); }
  }
}

module.exports = User;
