(function () {
    var app = {};

    var bootstrap = function () {
        $(function () {
            app.mobileApp = new kendo.mobile.Application(document.body, {
                skin: 'flat',
                initial: 'components/emptyView/view.html',
                init: function () {
                    if (app.settings.appId.length !== 16) {
                        app.navigation.navigateNoAppId();
                    } else {
                        app.data.defaultProvider.users.currentUser()
                            .then(function (res) {
                                if (res.result) {
                                    app.user = res.result;
                                    //we are logged in
                                    app.navigation.navigateActivities();
                                } else {
                                    throw new Error('not authenticated');
                                }
                            })
                            .catch(function () {
                                //we are not logged in
                                app.navigation.navigateAuthentication();
                            });
                    }
                }
            });
        });
    };

    app.isCordova = !!window.cordova;

    app.keepActiveState = function _keepActiveState(item) {
        var currentItem = item;
        $('#navigation-container li a.active').removeClass('active');
        currentItem.addClass('active');
    };

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

    app.drawerModel = kendo.observable({
        logout: function () {
            app.activitiesView.shouldRefresh = true;
            app.data.defaultProvider.users.logout()
                .then(function () {
                    localStorage.clear();
                    app.navigation.navigateAuthentication();
                })
                .catch(function (err) {
                    if (err.code === 301 || err.code === 302) {
                        app.navigation.navigateAuthentication();
                    } else {
                        app.notify.error(err);
                    }
                });
        },
        goToProfile: function () {
            app.navigation.navigateProfile();
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