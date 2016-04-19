(function () {
    var app = {};

    var bootstrap = function () {
        $(function () {
            app.mobileApp = new kendo.mobile.Application(document.body, {
                skin: 'flat',
                initial: 'components/emptyView/view.html',
                init: function () {
                    if (app.settings.appId.length !== 16) {
                        app.mobileApp.navigate('components/missingSettingsView/noappidView.html');
                    } else {
                        app.data.defaultProvider.authentication.getAuthenticationStatus()
                            .then(function (res) {
                                var status = res.status;
                                if (status === Everlive.Constants.AuthStatus.unauthenticated) {
                                    throw 'not logged in';
                                }

                                return app.data.defaultProvider.users.currentUser()
                                    .then(function (res) {
                                        app.user = res.result;

                                        //we are logged in
                                        app.mobileApp.navigate('components/activitiesView/view.html');
                                    });
                            })
                            .catch(function () {
                                //we are not logged in
                                app.mobileApp.navigate('components/authenticationView/view.html');
                            });
                    }
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