/* eslint-disable
    func-names,
    import/no-unresolved,
    no-return-assign,
    no-undef,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const chai = require('chai');
const sinon = require('sinon');
chai.use(require('sinon-chai'));

const {
  expect,
} = chai;

const Adapter = require('../src/adapter');

describe('Adapter', () => {
  beforeEach(function () {
    return this.robot = { receive: sinon.spy() };
  });

  // this one is hard, as it requires files
  it('can load adapter by name');

  describe('Public API', () => {
    beforeEach(function () {
      return this.adapter = new Adapter(this.robot);
    });

    it('assigns robot', function () {
      return expect(this.adapter.robot).to.equal(this.robot);
    });

    describe('send', () => {
      it('is a function', function () {
        return expect(this.adapter.send).to.be.a('function');
      });

      return it('does nothing', function () {
        return this.adapter.send({}, 'nothing');
      });
    });

    describe('reply', () => {
      it('is a function', function () {
        return expect(this.adapter.reply).to.be.a('function');
      });

      return it('does nothing', function () {
        return this.adapter.reply({}, 'nothing');
      });
    });

    describe('topic', () => {
      it('is a function', function () {
        return expect(this.adapter.topic).to.be.a('function');
      });

      return it('does nothing', function () {
        return this.adapter.topic({}, 'nothing');
      });
    });

    describe('play', () => {
      it('is a function', function () {
        return expect(this.adapter.play).to.be.a('function');
      });

      return it('does nothing', function () {
        return this.adapter.play({}, 'nothing');
      });
    });

    describe('run', () => {
      it('is a function', function () {
        return expect(this.adapter.run).to.be.a('function');
      });

      return it('does nothing', function () {
        return this.adapter.run();
      });
    });

    return describe('close', () => {
      it('is a function', function () {
        return expect(this.adapter.close).to.be.a('function');
      });

      return it('does nothing', function () {
        return this.adapter.close();
      });
    });
  });


  return it('dispatches received messages to the robot', function () {
    this.robot.receive = sinon.spy();
    this.adapter = new Adapter(this.robot);
    this.message = sinon.spy();

    this.adapter.receive(this.message);

    return expect(this.robot.receive).to.have.been.calledWith(this.message);
  });
});
