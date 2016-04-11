(function () {
    var app = {};

    var bootstrap = function () {
        $(function () {
            var initialViewPromise;

            app.mobileApp = new kendo.mobile.Application(document.body, {
                skin: 'flat',
                initial: 'components/emptyView/view.html',
                init: function () {
                    if (app.settings.appId.length !== 16) {
                        initialViewPromise = new Everlive._common.rsvp.Promise(function (resolve) {
                            return resolve('components/missingSettingsView/noappidView.html');
                        })
                    } else {
                        initialViewPromise = new Everlive._common.rsvp.Promise(function (resolve) {
                            app.authentication.loadCachedAccessToken()
                                .then(function () {
                                    if (app.authentication.getCachedAccessToken()) {
                                        //we are logged in
                                        return resolve('components/activitiesView/view.html');
                                    }

                                    throw 'not logged in';
                                })
                                .catch(function () {
                                    //we are not logged in
                                    return resolve('components/authenticationView/view.html');
                                });
                        });
                    }

                    initialViewPromise.then(function (view) {
                        app.mobileApp.navigate(view);
                    });
                }
            });
        });
    };

    app.isCordova = !!window.cordova;

    if (app.isCordova) {
        document.addEventListener('deviceready', function() {
            if (navigator && navigator.splashscreen) {
                navigator.splashscreen.hide();
            }

            var element = document.getElementById('appDrawer');
            if (typeof(element) != 'undefined' && element !== null) {
                if (window.navigator.msPointerEnabled) {
                    $('#navigation-container').on('MSPointerDown', 'a', function() {
                        app.keepActiveState($(this));
                    });
                } else {
                    $('#navigation-container').on('touchstart', 'a', function() {
                        app.keepActiveState($(this));
                    });
                }
            }

            bootstrap();
        }, false);
    } else {
        bootstrap();
    }

    app.keepActiveState = function _keepActiveState(item) {
        var currentItem = item;
        $('#navigation-container li a.active').removeClass('active');
        currentItem.addClass('active');
    };

    app.drawerModel = kendo.observable({
        logout: function () {
            app.activitiesView.shouldRefresh = true;
            app.data.defaultProvider.users.logout()
                .then(function () {
                    localStorage.clear();
                    app.mobileApp.navigate('components/authenticationView/view.html');
                })
                .catch(function (err) {
                    if (err.code === 301 || err.code === 302) {
                       app.mobileApp.navigate('components/authenticationView/view.html');
                    } else {
                        app.notify.error(err);
                    }
                });
        },
        goToProfile: function () {
            app.mobileApp.navigate('components/profileView/view.html');
        },
        showFeedback: function () {
            if (app.utils.isInSimulator() || !window.feedback) {
                return app.notify.info('The feedback feature is not available in simulator or browser environment. ' +
                    'Try deploying to device or emulator.');
            }

            window.feedback.showFeedback();
        }
    });

    window.app = app;
}());