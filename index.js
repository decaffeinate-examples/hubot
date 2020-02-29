/* eslint-disable
    max-len,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const User = require('./src/user');
const Brain = require('./src/brain');
const Robot = require('./src/robot');
const Adapter = require('./src/adapter');
const Response = require('./src/response');
const { Listener, TextListener } = require('./src/listener');
const {
  Message, TextMessage, EnterMessage, LeaveMessage, TopicMessage, CatchAllMessage,
} = require('./src/message');

module.exports = {
  User,
  Brain,
  Robot,
  Adapter,
  Response,
  Listener,
  TextListener,
  Message,
  TextMessage,
  EnterMessage,
  LeaveMessage,
  TopicMessage,
  CatchAllMessage,
};

module.exports.loadBot = (adapterPath, adapterName, enableHttpd, botName, botAlias) => new Robot(adapterPath, adapterName, enableHttpd, botName, botAlias);
