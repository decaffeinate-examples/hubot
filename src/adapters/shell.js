/* eslint-disable
    class-methods-use-this,
    consistent-return,
    import/no-unresolved,
    max-len,
    new-cap,
    no-console,
    no-param-reassign,
    no-restricted-syntax,
    no-unused-vars,
    no-useless-escape,
    radix,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const fs = require('fs');
const readline = require('readline');
const stream = require('stream');
const cline = require('cline');
const chalk = require('chalk');

const Robot = require('../robot');
const Adapter = require('../adapter');
const { TextMessage } = require('../message');

const historySize = (process.env.HUBOT_SHELL_HISTSIZE != null)
  ? parseInt(process.env.HUBOT_SHELL_HISTSIZE)
  : 1024;

const historyPath = '.hubot_history';

class Shell extends Adapter {
  send(envelope, ...strings) {
    return Array.from(strings).map((str) => console.log(chalk.bold(`${str}`)));
  }

  emote(envelope, ...strings) {
    return Array.from(strings).map((str) => this.send(envelope, `* ${str}`));
  }

  reply(envelope, ...strings) {
    strings = strings.map((s) => `${envelope.user.name}: ${s}`);
    return this.send(envelope, ...Array.from(strings));
  }

  run() {
    this.buildCli();

    return this.loadHistory((history) => {
      this.cli.history(history);
      this.cli.interact(`${this.robot.name}> `);
      return this.emit('connected');
    });
  }

  shutdown() {
    this.robot.shutdown();
    return process.exit(0);
  }

  buildCli() {
    this.cli = cline();

    this.cli.command('*', (input) => {
      let userId = process.env.HUBOT_SHELL_USER_ID || '1';
      if (userId.match((/\A\d+\z/))) {
        userId = parseInt(userId);
      }

      const userName = process.env.HUBOT_SHELL_USER_NAME || 'Shell';
      const user = this.robot.brain.userForId(userId, { name: userName, room: 'Shell' });
      return this.receive(new TextMessage(user, input, 'messageId'));
    });

    this.cli.command('history', () => Array.from(this.cli.history()).map((item) => console.log(item)));

    this.cli.on('history', (item) => {
      if ((item.length > 0) && (item !== 'exit') && (item !== 'history')) {
        return fs.appendFile(historyPath, `${item}\n`, (err) => {
          if (err) { return this.robot.emit('error', err); }
        });
      }
    });

    return this.cli.on('close', () => {
      let history = this.cli.history();
      if (history.length > historySize) {
        const startIndex = history.length - historySize;
        history = history.reverse().splice(startIndex, historySize);

        const fileOpts = { mode: 0o600 };
        const outstream = fs.createWriteStream(historyPath, fileOpts);
        // >= node 0.10
        outstream.on('finish', () => this.shutdown());

        for (const item of Array.from(history)) {
          outstream.write(`${item}\n`);
        }

        // < node 0.10
        return outstream.end(() => this.shutdown());
      }
      return this.shutdown();
    });
  }

  // Private: load history from .hubot_history.
  //
  // callback - A Function that is called with the loaded history items (or an empty array if there is no history)
  loadHistory(callback) {
    return fs.exists(historyPath, (exists) => {
      if (exists) {
        const instream = fs.createReadStream(historyPath);
        const outstream = new stream();
        outstream.readable = true;
        outstream.writable = true;

        const items = [];
        const rl = readline.createInterface({ input: instream, output: outstream, terminal: false });
        rl.on('line', (line) => {
          line = line.trim();
          if (line.length > 0) {
            return items.push(line);
          }
        });
        return rl.on('close', () => callback(items));
      }
      return callback([]);
    });
  }
}

exports.use = (robot) => new Shell(robot);
