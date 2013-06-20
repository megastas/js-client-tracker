describe('Woopra', function() {
    var visitorProperties = {
            name: 'WoopraUser',
            email: 'test@woopra.com',
            company: 'Woopra'
        },
        tracker;

    describe('Client snippet test', function() {
        var woopra,
            b = ['config', 'track', 'identify', 'push'],
            i,
            spy = {};

            (function (instanceName) {
                var i,
                    s,
                    z,
                    q = 'script',
                    a = arguments,
                    f = ['config', 'track', 'identify', 'push'],
                    c = function () {
                        var self = this;
                        self._e = [];
                        for (i = 0; i < f.length; i++) {
                            (function (f) {
                                self[f] = function () {
                                    self._e.push([f].concat(Array.prototype.slice.call(arguments, 0)));
                                    return self;
                                };
                            })(f[i]);
                        }
                    };

                window._wpt = window._wpt || {};
                // check if instance of tracker exists
                window._wpt[instanceName] = window[instanceName] = window[instanceName] || new c();
            })('woopra');

        beforeEach(function() {
            // create spies for all of the public methods
            for (i = 0; i < b.length; i++) {
                spy[b[i]] = sinon.spy(Woopra.Tracker.prototype, b[i]);
            }
        });
        afterEach(function() {
            // restore spies
            for (i = 0; i < b.length; i++) {
                Woopra.Tracker.prototype[b[i]].restore();
            }
        });

        it('has the instance name of "woopra"', function() {
            expect(window.woopra).to.be.defined;
        });

        // lets queue up some events since woopra tracker isn't loaded yet
        // shouldn't need to test all of the public methods
        it('queues track() call', function() {
            expect(window.woopra._e.length).to.equal(0);
            window.woopra.track('testEvent', {title: 'testTitle'});
            expect(window.woopra._e.length).to.equal(1);
        });

        it('initializes the tracker and processes the queued up track() call', function() {
            var tSpy = sinon.spy(Woopra.Tracker.prototype, '_processQueue');

            woopra = new Woopra.Tracker('woopra');
            woopra.init();
            expect(tSpy).to.be.called;
            expect(spy.track).to.be.called;
            expect(spy.track).to.be.calledWith('testEvent', sinon.match({title: 'testTitle'}));
            tSpy.restore();
        });
    });

    describe('Tracker', function() {
        beforeEach(function() {
            tracker = new Woopra.Tracker();
            tracker.init();
            tracker.identify(visitorProperties);
        });

        it('should initialize properly', function() {
            var oSpy = sinon.spy(Woopra.Tracker.prototype, '_setOptions'),
                cSpy = sinon.spy(Woopra.Tracker.prototype, '_setupCookie'),
                qSpy = sinon.spy(Woopra.Tracker.prototype, '_processQueue'),
                newTracker = new Woopra.Tracker();

            expect(newTracker._loaded).to.be.false;
            newTracker.init();
            expect(newTracker._loaded).to.be.true;
            expect(oSpy).to.be.called;
            expect(cSpy).to.be.called;
            expect(qSpy).to.be.called;
            oSpy.restore();
            cSpy.restore();
            qSpy.restore();
        });

        it('retrieves all visitor properties when no parameters are passed', function() {
            var properties = tracker.identify();
            console.log(properties);

            expect(properties).to.match(visitorProperties);
        });

        it('sets visitor properties by passing the params as key, value', function() {
            var newEmail = 'newemail@woopra.com';

            tracker.identify('email', newEmail);

            expect(tracker.visitorData.name).to.equal(visitorProperties.name);
            expect(tracker.visitorData.company).to.equal(visitorProperties.company);
            expect(tracker.visitorData.email).to.equal(newEmail);
        });

        it('sets visitor properties by passing a new object as a param and extends existing properties', function() {
            var newVisitorProperties = {
                name: 'NewUser',
                email: 'newemail@woopra.com'
            };

            tracker.identify(newVisitorProperties);

            expect(tracker.visitorData.name).to.equal(newVisitorProperties.name);
            expect(tracker.visitorData.email).to.equal(newVisitorProperties.email);
            expect(tracker.visitorData.company).to.equal(visitorProperties.company);
        });

        it('should set tracker options', function() {
            var testOpt = 'testOption',
                newVal = 'optionValue';

            tracker.config('testOption', newVal);
            expect(tracker.options.testOption).to.equal(newVal);
        });

        it('should extend options if an object is passed in', function() {
            var testOpt = 'testOption',
                newVal = 'optionValue';

            tracker.config('testOption', newVal);
            expect(tracker.options.testOption).to.equal(newVal);

            tracker.config({
                test: 'option',
                another: 'option'
            });
            expect(tracker.options.testOption).to.equal(newVal);
            expect(tracker.options.test).to.equal('option');
            expect(tracker.options.another).to.equal('option');
        });

        it('should have option() act as a getter if only one param is passed', function() {
            var testOpt = 'testOption',
                newVal = 'optionValue';

            tracker.config(testOpt, newVal);
            expect(tracker.config(testOpt)).to.equal(newVal);
        });

        //it('setDomain() should be an alias to set "domain" and "cookie_domain" options', function() {
            //var newDomain = 'notwoopra.com';

            //tracker.setDomain(newDomain);

            //expect(tracker.option('domain')).to.be.equal(newDomain);
            //expect(tracker.option('cookie_domain')).to.be.equal(newDomain);
        //});

        //it('setIdleTimeout() should be an alias to set "idle_timeout" option', function() {
            //var newTimeout = '321405';

            //tracker.setIdleTimeout(newTimeout);

            //expect(tracker.option('idle_timeout')).to.be.equal(newTimeout);
        //});

        it('when moved() handler is called, should not be idle', function() {
            tracker.idle = 1000;
            //tracker.moved();
            //expect(tracker.idle).to.equal(0);
            //expect(tracker.last_activity.getTime()).to.be.at.least(oldLastActivity.getTime());
        });

        it('when user types, tracker.vs should be 2', function() {
            //tracker.typed();
            //expect(tracker.vs).to.equal(2);
        });

        describe('requests that sync to server', function() {
            var spy;

            beforeEach(function() {
                spy = sinon.spy(Woopra.Tracker.prototype, '_push');
            });

            afterEach(function() {
                spy.restore();
            });

            it('sync should create a new Woopra.Event and fire', function() {
                var eSpy = sinon.spy(Woopra, 'Event'),
                    fireSpy = sinon.spy(Woopra.Event.prototype, 'fire'),
                    _name = 'testSync';

                tracker._sync(_name, 'test', {});

                expect(eSpy).to.be.calledWith(_name, {name: _name}, tracker.cv, 'test');
                expect(fireSpy).to.be.calledWith(tracker);
                eSpy.restore();
                fireSpy.restore();
            });

            it('should not identify user if email param is empty', function() {
                tracker.identify();
                expect(spy).to.not.be.called;
                spy.restore();
            });

            it('should identify user if email is given', function() {
                var newVisitorProperties = {
                        name: 'notWoopraUser',
                        company: 'Not Woopra'
                    };

                expect(tracker.cv).to.equal(visitorProperties);
                tracker.identify('new@woopra.com', newVisitorProperties);
                expect(tracker.cv).to.deep.equal({
                    name: 'notWoopraUser',
                    company: 'Not Woopra',
                    email: 'new@woopra.com'
                });
                // XXX pass by reference side effect with options
                expect(spy).to.be.calledWith('identify', 'identify', {name: 'identify'});
            });

            it('pingServer() sends an "x" request', function() {
                var pSpy = sinon.spy(tracker, 'pingServer');

                tracker.pingServer();
                expect(pSpy).to.be.called;
                // XXX pass by reference side effect with options
                expect(spy).to.be.calledWith('x', 'ping', {name: 'x'});
            });

            //it('pageview() should send a "pv" event', function() {
                //var pSpy = sinon.spy(tracker, 'pageview');

                //tracker.pageview({});
                //// XXX pass by reference side effect with options
                //expect(pSpy).to.be.calledWith({name: 'pv'});
                //expect(spy).to.be.calledWith('pv', 'visit', {name: 'pv'});
                //pSpy.restore();
            //});

            it('track() should send a "ce" request, and should extract visitor object from options', function() {
                var newVisitorProperties = {
                        name: 'notWoopraUser',
                        email: 'new@woopra.com',
                        company: 'Not Woopra'
                    },
                    trSpy = sinon.spy(tracker, 'track'),
                    tSpy = sinon.spy(tracker, '_track'),
                    eSpy = sinon.spy(Woopra, 'Event'),
                    _name = 'testEvent';

                expect(tracker.cv).to.equal(visitorProperties);
                tracker.track(_name, {
                    visitor: newVisitorProperties
                });
                expect(trSpy).to.be.calledWith(_name, {name: _name});
                expect(tSpy).to.be.calledWith(_name, 'ce', {name: _name});
                expect(tracker.cv).to.equal(newVisitorProperties);
                expect(spy).to.be.calledWith(_name, 'ce', {name: _name});

                trSpy.restore();
                tSpy.restore();
                eSpy.restore();
            });

        });

    });
});
