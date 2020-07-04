const assert = require('assert');
const rewire = require('rewire');
const character = rewire('../discord/character.js');
const db = character.__get__('db');
describe('Discord/character', () => {
  describe('main_change', () => {
    it('should be a function', () => {
      assert.equal(
        typeof character.main_change,
        'function'
      );
    });
    it('should throw an error if the command is invalid', async () => {
      try {
        await character.main_change({
          content: ''
        });
        throw new Error('Expected exception');
      } catch (err) {
        const msg = 'Invalid !character main_change format.  Please read !character help for an example';
        assert.equal(err.message, msg);
        assert.equal(err.discordReply, msg);
      }
    });
    it('should throw an error if the command is invalid', async () => {
      try {
        await character.main_change({
          content: 'C1 > C2'
        });
        throw new Error('Expected exception');
      } catch (err) {
        const msg = 'Invalid !character main_change format.  Please read !character help for an example';
        assert.equal(err.message, msg);
        assert.equal(err.discordReply, msg);
      }
    });
    it('should not throw an error with valid command format', async () => {
      db.User.findOne = function() { return true;};
      await character.main_change({
        content: 'C1 => C2',
        unitTesting: true
      });
    });
    it('should throw an error if the target character is the same as the source character', async () => {
      try {
        await character.main_change({
          content: 'C1 => C1'
        });
        throw new Error('Expected exception');
      } catch (err) {
        const msg = 'Can not main_change to the same character';
        assert.equal(err.message, msg);
        assert.equal(err.discordReply, msg);
      }
    });
    it('should throw an error if the source character is not in the database', async () => {
      db.User.findOne = function() {};
      try {
        await character.main_change({
          content: 'C1 => C2'
        });
        throw new Error('Expected exception');
      } catch (err) {
        const msg = 'Can not find source character.';
        assert.equal(err.message, msg);
        assert.equal(err.discordReply, msg);
      }
    });
    it('should throw an error if the source character is not in the database', async () => {
      db.User.findOne = function(args) {
        if(args.where.characterName === 'C1') {
          return true;
        }
      };
      try {
        await character.main_change({
          content: 'C1 => C2'
        });
        throw new Error('Expected exception');
      } catch (err) {
        const msg = 'Can not find source character.';
        assert.equal(err.message, msg);
        assert.equal(err.discordReply, msg);
      }
    });
  });
});