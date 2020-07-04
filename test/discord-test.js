const assert = require('assert');
const rewire = require('rewire');
const discordBot = rewire('../discord/index.js');

describe('Discord', () => {
  describe('pickWinningBidders', () => {
    const pickWinningBidders = discordBot.__get__('pickWinningBidders');
    it('should be a function', () => {
      assert.equal(typeof pickWinningBidders, 'function');
    });
    it('should throw an error if no item name is provided', () => {
      assert.throws(
        pickWinningBidders,
        'item name required'
      );
    });
    // TODO: Stub channel.get().send() to be able to turn these back on
    /*
    it('should pick the highest bidder', async () => {
      // fake user object
      const user1 = {unique: 1};
      const openBids = {
        test_item: {
          bids: {
            test_char: {
              bid: 10,
              characterName: 'test1',
              discordName: 'disco1',
              ra30day: 100,
              ra60day: 100,
              ra90day: 100,
              UserId: 1,
              bidMultiplyer: 1,
              user: user1
            }
          }
        }
      };
      discordBot.__set__('openBids', openBids);
      let winners = pickWinningBidders('test_item');
      assert.deepEqual(
        winners,
        [
          {
            user: user1,
            bid: 10,
            price: 10,
            characterName: 'test1',
            discordName: 'disco1'
          }
        ]
      );
    });
    it('should pick the highest bidders (2)', async () => {
      // fake user object
      const user1 = {unique: 1};
      const user2 = {unique: 2};
      const openBids = {
        test_item: {
          qty: 2,
          bids: {
            test_char: {
              bid: 10,
              characterName: 'test1',
              discordName: 'disco1',
              ra30day: 100,
              ra60day: 100,
              ra90day: 100,
              UserId: 1,
              bidMultiplyer: 1,
              user: user1
            },
            test_char2: {
              bid: 10,
              characterName: 'test2',
              discordName: 'disco2',
              ra30day: 100,
              ra60day: 100,
              ra90day: 100,
              UserId: 1,
              bidMultiplyer: 1,
              user: user2
            }
          }
        }
      };
      discordBot.__set__('openBids', openBids);
      let winners = pickWinningBidders('test_item');
      assert.deepEqual(
        winners,
        [
          {
            user: user1,
            bid: 10,
            price: 10,
            characterName: 'test1',
            discordName: 'disco1'
          },
          {
            user: user2,
            bid: 10,
            price: 10,
            characterName: 'test2',
            discordName: 'disco2'
          }
        ]
      );
    });
    it('should pick the highest bidder and set the price to 1 higher than the second bidder', async () => {
      // fake user object
      const user1 = {unique: 1};
      const user2 = {unique: 2};
      const openBids = {
        test_item: {
          bids: {
            test_char: {
              bid: 1000,
              characterName: 'test1',
              discordName: 'disco1',
              ra30day: 100,
              ra60day: 100,
              ra90day: 100,
              UserId: 1,
              bidMultiplyer: 1,
              user: user1
            },
            test_char2: {
              bid: 799,
              characterName: 'test2',
              discordName: 'disco2',
              ra30day: 100,
              ra60day: 100,
              ra90day: 100,
              UserId: 1,
              bidMultiplyer: 1,
              user: user2
            }
          }
        }
      };
      discordBot.__set__('openBids', openBids);
      let winners = pickWinningBidders('test_item');
      assert.deepEqual(
        winners,
        [
          {
            user: user1,
            bid: 1000,
            price: 800,
            characterName: 'test1',
            discordName: 'disco1'
          }
        ]
      );
    });*/
  });
});

