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
                app.notify.info('Your access token has expired, please log in.');
                app.mobileApp.navigate('components/authenticationView/view.html');
            }
        }
    });

    var accessTokenCacheKey = 'platformFriendsHybrid_access_token';
    var providerAuthentication = provider.authentication;
    var providerLogin = provider.users.login;
    var authentication = app.authentication = {
        setCachedAccessToken: function setCachedAccessToken(token) {
            if (localStorage) {
                localStorage.setItem(accessTokenCacheKey, JSON.stringify(token));
            } else {
                app[accessTokenCacheKey] = token;
            }
        },
        getCachedAccessToken: function getCachedAccessToken() {
            if (localStorage) {
                return JSON.parse(localStorage.getItem(accessTokenCacheKey));
            } else {
                return app[accessTokenCacheKey];
            }
        },
        getCacheAccessTokenFn: function getCacheAccessTokenFn(callback) {
            return function cacheAccessToken(data) {
                if (data && data.result) {
                    authentication.setCachedAccessToken(data.result);
                }

                callback(data);
            };
        },
        loadCachedAccessToken: function loadCachedAccessToken() {
            return new Everlive._common.rsvp.Promise(function (resolve, reject) {
                var token = authentication.getCachedAccessToken();

                if (token) {
                    providerAuthentication.setAuthorization(
                        token.access_token,
                        token.token_type,
                        token.principal_id);
                }

                provider.users.currentUser(function _currentUserSuccess(data) {
                    if (data.result) {
                        app.user = data.result;
                    } else {
                        authentication.setCachedAccessToken(null);
                        providerAuthentication.clearAuthorization();
                    }

                    return resolve();
                }, function _currentUserFailure(err) {
                    authentication.setCachedAccessToken(null);
                    providerAuthentication.clearAuthorization();
                    return reject(err);
                });
            });
        }
    };

    authentication.loadCachedAccessToken();
    provider.users.login = function cacheAccessTokenLogin(email, password, success, error) {
        providerLogin.call(this, email, password,
            authentication.getCacheAccessTokenFn(success), error);
    };

    document.addEventListener('online', function _appOnline() {
        provider.offline(false);
        provider.sync();
    });

    document.addEventListener('offline', function _appOffline() {
        provider.offline(true);
    });
}());