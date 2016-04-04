(function () {
    var app = {};

    var bootstrap = function () {
        $(function () {
            var initialView;
            if (app.settings.appId.length !== 16) {
                initialView = 'components/missingSettingsView/noappidView.html';
            } else {
                initialView = 'components/authenticationView/view.html';
            }

            app.mobileApp = new kendo.mobile.Application(document.body, {initial: initialView});
        });
    };

    app.isCordova = !!window.cordova;

    if (app.isCordova) {
        document.addEventListener('deviceready', function() {
            app.monitor = window.plugins.EqatecAnalytics.Monitor;

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
            app.monitor.TrackFeature('Authentication.Logout');

            app.data.defaultProvider.users.logout()
                .then(function () {
                    localStorage.clear();
                    app.mobileApp.navigate('components/authenticationView/view.html');
                })
                .catch(app.notify.error);
        },
        goToProfile: function () {
            app.mobileApp.navigate('components/profileView/view.html');
        },
        showFeedback: function () {
            window.feedback.showFeedback();
        }
    });

    window.app = app;
}());