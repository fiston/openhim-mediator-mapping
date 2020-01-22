'use strict'

const sinon = require('sinon')
const tap = require('tap')

const externalRequests = require('../../src/middleware/externalRequests')

tap.test('External Requests Middleware', {autoend: true}, t => {
  t.test('prepareLookupRequests', {autoend: true}, t => {
    let performRequestsStub
    t.beforeEach(done => {
      performRequestsStub = sinon.stub(externalRequests, 'performRequests')
      done()
    })

    t.afterEach(done => {
      performRequestsStub.restore()
      done()
    })

    t.test('should throw an error if any promise in the array fails', t => {
      t.plan(2)
      performRequestsStub
        .onFirstCall()
        .returns([Promise.resolve('Success'), Promise.reject('Fail')])

      const ctx = {
        state: {
          uuid: 'randomUidForRequest',
          metaData: {
            name: 'Testing endpoint',
            requests: {
              lookup: [
                {
                  // first lookup request config - responds with success
                },
                {
                  // second lookup request config - responds with fail
                }
              ]
            }
          }
        }
      }

      externalRequests
        .prepareLookupRequests(ctx)
        .then(() => {
          t.error('Should not reach here')
        })
        .catch(err => {
          t.throws(err, 'Error should be thrown when a promise rejects')
          t.same(err.message, 'Rejected Promise: Fail')
        })
    })

    t.test(
      'should add response data to the ctx when all promises resolve',
      t => {
        t.plan(1)
        performRequestsStub
          .onFirstCall()
          .returns([
            Promise.resolve({id: 'test1', data: 'testA'}),
            Promise.resolve({id: 'test2', data: 'testB'})
          ])

        const ctx = {
          state: {
            uuid: 'randomUidForRequest',
            metaData: {
              name: 'Testing endpoint',
              requests: {
                lookup: [
                  {
                    // first lookup request config - responds with success
                  },
                  {
                    // second lookup request config - responds with success
                  }
                ]
              }
            }
          }
        }

        externalRequests
          .prepareLookupRequests(ctx)
          .then(() => {
            t.same({test1: 'testA', test2: 'testB'}, ctx.lookupRequests)
          })
          .catch(() => {
            t.error('Should not reach here')
          })
      }
    )

    t.test(
      'should not reach the request making function is there is no lookup config',
      t => {
        performRequestsStub
          .onFirstCall()
          .returns(new Error('Should not get here'))

        const ctx = {
          state: {
            uuid: 'randomUidForRequest',
            metaData: {
              name: 'Testing endpoint',
              requests: {
                // no lookup config
              }
            }
          }
        }

        externalRequests.prepareLookupRequests(ctx)
        t.end()
      }
    )
  })
})
