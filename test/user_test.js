/* eslint-disable
    import/no-unresolved,
    no-undef,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const { expect } = require('chai');
const User = require('../src/user');

describe('User', () => describe('new', () => {
  it('uses id as the default name', () => {
    const user = new User('hubot');

    return expect(user.name).to.equal('hubot');
  });

  it('sets attributes passed in', () => {
    const user = new User('hubot', { foo: 1, bar: 2 });

    expect(user.foo).to.equal(1);
    return expect(user.bar).to.equal(2);
  });

  return it('uses name attribute when passed in, not id', () => {
    const user = new User('hubot', { name: 'tobuh' });

    return expect(user.name).to.equal('tobuh');
  });
}));
