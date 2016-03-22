import assert from 'assert';
import { queryWithCurrentUser } from '../../../src/hooks';

describe('queryWithCurrentUser', () => {
  describe('when not called as a before hook', () => {
    it('throws an error', () => {
      let hook = {
        type: 'after'
      };

      try {
        queryWithCurrentUser()(hook);
      }
      catch(error) {
        assert.ok(error);
      }
    });
  });

  describe('when user does not exist', () => {
    it('throws an error', () => {
      let hook = {
        type: 'before',
        params: {}
      };

      try {
        queryWithCurrentUser()(hook);
      }
      catch(error) {
        assert.ok(error);
      }
    });
  });

  describe('when user exists', () => {
    let hook;

    beforeEach(() => {
      hook = {
        type: 'before',
        params: {
          user: { _id: '1' },
          query: { text: 'Hi' }
        },
        app: {
          get: function() { return {}; }
        }
      };
    });

    describe('when user is missing idField', () => {
      it('throws an error', () => {
        let hook = {
          type: 'before',
          params: {
            user: {}
          }
        };

        try {
          queryWithCurrentUser()(hook);
        }
        catch(error) {
          assert.ok(error);
        }
      });
    });

    it('adds user id to query using default options', () => {
      queryWithCurrentUser()(hook);

      assert.equal(hook.params.query.userId, '1');
    });

    it('adds user id to query using options from global auth config', () => {
      hook.params.user.id = '2';
      hook.app.get = function() {
        return { idField: 'id', as: 'customId' };
      };

      queryWithCurrentUser()(hook);

      assert.equal(hook.params.query.customId, '2');
    });

    it('adds user id to query using custom options', () => {
      hook.params.user.id = '2';

      queryWithCurrentUser({ idField: 'id', as: 'customId' })(hook);

      assert.equal(hook.params.query.customId, '2');
    });
  });
});