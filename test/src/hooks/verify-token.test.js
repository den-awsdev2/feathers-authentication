import jwt from 'jsonwebtoken';
import assert from 'assert';
import { verifyToken } from '../../../src/hooks';

describe('verifyToken', () => {
  describe('when not called as a before hook', () => {
    it('throws an error', () => {
      let hook = {
        type: 'after'
      };

      try {
        verifyToken()(hook);
      }
      catch(error) {
        assert.ok(error);
      }
    });
  });

  describe('when provider does not exist', () => {
    it('does not do anything', () => {
      let hook = {
        type: 'before',
        params: {}
      };

      try {
        var returnedHook = verifyToken()(hook);
        assert.deepEqual(hook, returnedHook);
      }
      catch(error) {
        // It should never get here
        assert.ok(false);
      }
    });
  });

  describe('when token does not exist', () => {
    it('throws a not authenticated error', () => {
      let hook = {
        type: 'before',
        params: {
          provider: 'rest'
        }
      };

      try {
        hook = verifyToken()(hook);
      }
      catch (error) {
        assert.equal(error.code, 401);
      }
    });
  });

  describe('when token exists', () => {
    let hook;

    beforeEach(() => {
      hook = {
        type: 'before',
        params: {
          provider: 'rest',
          token: 'valid_token'
        },
        app: {
          get: function() { return {}; }
        }
      };
    });

    describe('when secret is missing', () => {
      it('throws an error', () => {
        try {
          verifyToken()(hook);
        }
        catch(error) {
          assert.ok(error);
        }
      });
    });

    describe('when secret is present', () => {
      beforeEach(() => {
        hook.app.get = function() {
          return {
            token: {
              secret: 'secret'
            }
          };
        };
      });

      describe('when token is invalid', () => {
        it('returns a not authenticated error', done => {
          hook.params.token = 'invalid';
          
          verifyToken()(hook).then(done).catch(error => {
            assert.equal(error.code, 401);
            done();  
          });
        });
      });

      describe('when token is valid', () => {
        it('returns an error when options are not consistent', done => {
          let jwtOptions = {
            algorithm: 'HS512'
          };

          hook.app.get = function() {
            return {
              token: {
                secret: 'secret',
                algorithm: 'HS384'
              }
            };
          };

          hook.params.token = jwt.sign({ id: 1 }, 'secret', jwtOptions);

          verifyToken()(hook).then(() => {
            // should never get here
            assert.ok(false);
            done();
          }).catch(error => {
            assert.equal(error.code, 401);
            done();
          });
        });

        it('adds token payload to params using options from global auth config', done => {
          let jwtOptions = {
            issuer: 'custom',
            audience: 'urn:feathers',
            algorithm: 'HS512',
            expiresIn: '1h' // 1 hour
          };

          hook.app.get = function() {
            return {
              token: {
                secret: 'secret',
                issuer: 'custom',
                audience: 'urn:feathers',
                algorithm: 'HS512'
              }
            };
          };

          hook.params.token = jwt.sign({ id: 1 }, 'secret', jwtOptions);

          verifyToken()(hook).then(hook => {
            assert.equal(hook.params.payload.id, 1);
            done();
          }).catch(done);
        });

        it('adds token payload to params using custom options', done => {
          let jwtOptions = {
            issuer: 'feathers',
            expiresIn: '1h' // 1 hour
          };

          hook.params.token = jwt.sign({ id: 1 }, 'custom secret', jwtOptions);

          verifyToken({ secret: 'custom secret' })(hook).then(hook => {
            assert.equal(hook.params.payload.id, 1);
            done();
          }).catch(done);
        });
      });
    });
  });
});