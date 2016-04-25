'use strict';

(function() {
    app.data = app.data || {};

    var provider = app.data.defaultProvider = new Everlive({
        offlineStorage: true,
        appId: app.settings.appId,
        scheme: app.settings.scheme,
        authentication: {
            persist: true,
            onAuthenticationRequired: function () {
                app.notify.error('Your access token has expired, please log in.');
                app.navigation.navigateAuthentication();
            }
        },
        helpers: {
            html: {
                responsiveParams: {
                    fill: 'cover'
                }
            }
        }
    });

    document.addEventListener('online', function _appOnline() {
        provider.offline(false);
        provider.sync();
    });

    document.addEventListener('offline', function _appOffline() {
        provider.offline(true);
    });
}());