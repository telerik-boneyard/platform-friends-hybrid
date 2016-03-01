(function () {
    var app = {
        data: {},
        utils: {}
    };

    app.utils.loading = function (load) {
        if (load) {
            return kendo.mobile.application.showLoading();
        }

        return kendo.mobile.application.hideLoading();
    };

    app.utils.goBack = function () {
        app.mobileApp.navigate('#:back');
        app.utils.loading(false);
    };

    app.utils.isOwner = function (dataItem) {
        return app.user.Id === dataItem.CreatedBy;
    };

    var bootstrap = function () {
        $(function () {
            app.mobileApp = new kendo.mobile.Application(document.body, {
                initial: 'components/authenticationView/view.html',
                transition: 'fade'
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
                    $('#navigation-container').on('MSPointerDown', 'a', function(event) {
                        app.keepActiveState($(this));
                    });
                } else {
                    $('#navigation-container').on('touchstart', 'a', function(event) {
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
            app.data.defaultProvider.users.logout()
                .then(function () {
                    app.mobileApp.navigate('components/authenticationView/view.html');
                })
                .catch(app.notify.error);
        },
        goToProfile: function () {
            app.mobileApp.navigate('components/profileView/view.html');
        }
    });

    window.app = app;
}());