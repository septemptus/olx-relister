/* global Q, ApiWrapper, settings, gapi */
(function () {
    'use strict';

    function mockLabels() {
        spyOn(gapi.client.gmail.users.labels, 'list').and.callFake(function () {
            return Q.when({
                result: {
                    labels: [
                        {id: 'id1', name: 'name1'},
                        {id: 'id2', name: 'name2'}
                    ]
                }
            });
        });
    }

    describe('api-wrapper', function () {
        var api;

        beforeEach(function () {
            api = new ApiWrapper();
            window.settings = {
                settings: {},
                load: function () {
                    return Q.when(this.settings);
                },
                save: function () {
                    return Q.when();
                }
            };
        });

        describe('getMessages', function () {
            it('should load api if it was not loaded before', function (done) {
                var spy = spyOn(gapi.client, 'load').and.callThrough(),
                    gmail = gapi.client.gmail;

                gapi.reset();

                api.getMessages()
                    .then(function () {
                        gapi.client.gmail = gmail;
                        expect(spy).toHaveBeenCalled();
                        done();
                    });
            });

            it('should not load api if it was loaded before', function (done) {
                gapi.client.load()
                    .then(function () {
                        var spy = spyOn(gapi.client, 'load').and.callThrough();

                        api.getMessages()
                            .then(function () {
                                expect(spy).not.toHaveBeenCalled();
                                done();
                            });
                    });
            });

            it('should authorize', function (done) {
                var spy = spyOn(gapi.auth, 'authorize').and.callThrough();

                api.getMessages()
                    .then(function () {
                        expect(spy).toHaveBeenCalled();
                        done();
                    });
            });

            it('should ask for permissions if authorizing for the first time', function (done) {
                var spy = spyOn(gapi.auth, 'authorize').and.callFake(function (p, cb) {
                    if (p.immediate) {
                        cb({error: 'immediate_failed'});
                        return;
                    }

                    cb({});
                });

                api.getMessages()
                    .then(function () {
                        expect(spy.calls.first().args[0].immediate).toBe(true);
                        expect(spy.calls.mostRecent().args[0].immediate).toBe(false);
                        done();
                    });
            });

            it('should get labels', function (done) {
                var spy = spyOn(gapi.client.gmail.users.labels, 'list').and.callThrough();

                api.getMessages()
                    .then(function () {
                        expect(spy).toHaveBeenCalled();
                        done();
                    });
            });

            describe('loadMessages', function () {
                it('should load settings', function (done) {
                    var spy = spyOn(settings, 'load').and.callThrough();

                    api.getMessages()
                        .then(function () {
                            expect(spy).toHaveBeenCalled();
                            done();
                        });
                });

                it('should throw an exception if a source label is in settings is set but does not exist', function (done) {
                    spyOn(settings, 'load').and.callFake(function () {
                        return Q.when({
                            labelFrom: 'name3'
                        });
                    });

                    mockLabels();

                    api.getMessages()
                        .fail(function (e) {
                            expect(e).toBe('Source label does not exist');
                            done();
                        });
                });

                it('should throw an exception if a target label is in settings is set but does not exist', function (done) {
                    spyOn(settings, 'load').and.callFake(function () {
                        return Q.when({
                            labelTo: 'name3'
                        });
                    });

                    mockLabels();

                    api.getMessages()
                        .fail(function (e) {
                            expect(e).toBe('Target label does not exist');
                            done();
                        });
                });

                it('should covert a source label to its id', function (done) {
                    var spy = spyOn(gapi.client.gmail.users.messages, 'list').and.callThrough();

                    spyOn(settings, 'load').and.callFake(function () {
                        return Q.when({
                            labelFrom: 'name2'
                        });
                    });

                    mockLabels();

                    api.getMessages()
                        .then(function () {
                            expect(spy.calls.first().args[0].labelIds).toBe('id2');
                            done();
                        });
                });
            });

            describe('parseMessages', function () {
                it('should fail if there are no messages to parse', function (done) {
                    spyOn(gapi.client.gmail.users.messages, 'list').and.callFake(function () {
                        return Q.when({
                            result: {}
                        });
                    });

                    api.getMessages()
                        .fail(function (e) {
                            expect(e).toBe('No messages received');
                            done();
                        });
                });

                it('should get each individual message', function (done) {
                    spyOn(gapi.client.gmail.users.messages, 'list').and.callFake(function () {
                        return Q.when({
                            result: {
                                messages: [{}, {}, {}]
                            }
                        });
                    });

                    spyOn(gapi.client.gmail.users.messages, 'get').and.callFake(function () {
                        return Q.when({body: '{"raw": ""}'});
                    });

                    api.getMessages()
                        .then(function (messages) {
                            expect(messages.length).toBe(3);
                            done();
                        });
                });

                it('should parse messages in a proper format', function (done) {
                    spyOn(gapi.client.gmail.users.messages, 'list').and.callFake(function () {
                        return Q.when({
                            result: {
                                messages: [{id: 1}]
                            }
                        });
                    });

                    spyOn(gapi.client.gmail.users.messages, 'get').and.callFake(function () {
                        return Q.when({body: '{"raw": "dGVzdA=="}'});
                    });

                    api.getMessages()
                        .then(function (messages) {
                            expect(messages[0]).toEqual({id: 1, msg: 'test'});
                            done();
                        });
                });
            });
        });

        describe('switchLabels', function () {
            it('should load api if it was not loaded before', function (done) {
                var spy = spyOn(gapi.client, 'load').and.callThrough(),
                    gmail = gapi.client.gmail;

                gapi.reset();

                api.switchLabels([])
                    .then(function () {
                        gapi.client.gmail = gmail;
                        expect(spy).toHaveBeenCalled();
                        done();
                    });
            });

            it('should not load api if it was loaded before', function (done) {
                gapi.client.load()
                    .then(function () {
                        var spy = spyOn(gapi.client, 'load').and.callThrough();

                        api.switchLabels([])
                            .then(function () {
                                expect(spy).not.toHaveBeenCalled();
                                done();
                            });
                    });
            });

            it('should authorize', function (done) {
                var spy = spyOn(gapi.auth, 'authorize').and.callThrough();

                api.switchLabels([])
                    .then(function () {
                        expect(spy).toHaveBeenCalled();
                        done();
                    });
            });

            it('should switch labels for each individual message', function (done) {
                var spy;

                spyOn(settings, 'load').and.callFake(function () {
                    return Q.when({
                        labelFrom: 'name2',
                        labelTo: 'name1'
                    });
                });

                spy = spyOn(gapi.client.gmail.users.messages, 'modify').and.callThrough();

                mockLabels();

                api.switchLabels([{id: 1, msg: ''}, {id: 2, msg: ''}])
                    .then(function () {
                        expect(spy.calls.count()).toBe(2);
                        done();
                    });
            });

            it('should succeed if there is no label action to do', function (done) {
                api.switchLabels([{id: 1, msg: ''}, {id: 2, msg: ''}])
                    .then(done);
            });

            describe('given source label is set', function () {
                var spy;

                beforeEach(function () {
                    spyOn(settings, 'load').and.callFake(function () {
                        return Q.when({
                            labelFrom: 'name2',
                            labelTo: null,
                            markAsRead: false,
                            removeFromInbox: false
                        });
                    });

                    spy = spyOn(gapi.client.gmail.users.messages, 'modify').and.callThrough();

                    mockLabels();
                });

                it('should convert the label to its id', function (done) {
                    api.switchLabels([{id: 1, msg: ''}])
                        .then(function () {
                            expect(spy.calls.first().args[0].removeLabelIds).toEqual(['id2']);
                            done();
                        });
                });

                it('should not include target label', function (done) {
                    api.switchLabels([{id: 1, msg: ''}])
                        .then(function () {
                            expect(spy.calls.first().args[0].addLabelIds).toEqual([]);
                            done();
                        });
                });

                it('should not include mark as read flag', function (done) {
                    api.switchLabels([{id: 1, msg: ''}])
                        .then(function () {
                            expect(spy.calls.first().args[0].removeLabelIds.indexOf('INBOX')).toBe(-1);
                            done();
                        });
                });

                it('should not include remove from inbox flag', function (done) {
                    api.switchLabels([{id: 1, msg: ''}])
                        .then(function () {
                            expect(spy.calls.first().args[0].removeLabelIds.indexOf('UNREAD')).toBe(-1);
                            done();
                        });
                });
            });

            describe('given target label is set', function () {
                var spy;

                beforeEach(function () {
                    spyOn(settings, 'load').and.callFake(function () {
                        return Q.when({
                            labelFrom: null,
                            labelTo: 'name2',
                            markAsRead: false,
                            removeFromInbox: false
                        });
                    });

                    spy = spyOn(gapi.client.gmail.users.messages, 'modify').and.callThrough();

                    mockLabels();
                });

                it('should convert the label to its id', function (done) {
                    api.switchLabels([{id: 1, msg: ''}])
                        .then(function () {
                            expect(spy.calls.first().args[0].addLabelIds).toEqual(['id2']);
                            done();
                        });
                });

                it('should not include source label', function (done) {
                    api.switchLabels([{id: 1, msg: ''}])
                        .then(function () {
                            expect(spy.calls.first().args[0].removeLabelIds).toEqual([]);
                            done();
                        });
                });

                it('should not include mark as read flag', function (done) {
                    api.switchLabels([{id: 1, msg: ''}])
                        .then(function () {
                            expect(spy.calls.first().args[0].removeLabelIds.indexOf('INBOX')).toBe(-1);
                            done();
                        });
                });

                it('should not include remove from inbox flag', function (done) {
                    api.switchLabels([{id: 1, msg: ''}])
                        .then(function () {
                            expect(spy.calls.first().args[0].removeLabelIds.indexOf('INBOX')).toBe(-1);
                            done();
                        });
                });
            });

            describe('given mark as read flag is set', function () {
                var spy;

                beforeEach(function () {
                    spyOn(settings, 'load').and.callFake(function () {
                        return Q.when({
                            labelFrom: null,
                            labelTo: null,
                            markAsRead: true,
                            removeFromInbox: false
                        });
                    });

                    spy = spyOn(gapi.client.gmail.users.messages, 'modify').and.callThrough();

                    mockLabels();
                });

                it('should include only UNREAD label', function (done) {
                    api.switchLabels([{id: 1, msg: ''}])
                        .then(function () {
                            expect(spy.calls.first().args[0].removeLabelIds.indexOf('UNREAD')).toBe(0);
                            expect(spy.calls.first().args[0].removeLabelIds.length).toBe(1);
                            done();
                        });
                });
            });

            describe('given remove from inbox flag is set', function () {
                var spy;

                beforeEach(function () {
                    spyOn(settings, 'load').and.callFake(function () {
                        return Q.when({
                            labelFrom: null,
                            labelTo: null,
                            markAsRead: false,
                            removeFromInbox: true
                        });
                    });

                    spy = spyOn(gapi.client.gmail.users.messages, 'modify').and.callThrough();

                    mockLabels();
                });

                it('should include only INBOX label', function (done) {
                    api.switchLabels([{id: 1, msg: ''}])
                        .then(function () {
                            expect(spy.calls.first().args[0].removeLabelIds.indexOf('INBOX')).toBe(0);
                            expect(spy.calls.first().args[0].removeLabelIds.length).toBe(1);
                            done();
                        });
                });
            });
        });
    });
}());