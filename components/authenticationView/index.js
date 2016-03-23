'use strict';

(function () {
    var validator;
    var view = app.authenticationView = kendo.observable({
        afterShow: function () {
            provider.users.currentUser().then(successHandler, init)
        },
        onShow: function () {
            validator = app.validate.getValidator('#authentication-form');
        }
    });

    var provider = app.data.defaultProvider;
    var mode = 'signin';
    var registerRedirect = 'activitiesView';
    var signinRedirect = 'activitiesView';

    var init = function (error) {
        if (error) {
            app.notify.error(error);
            return false;
        }

        var activeView = mode === 'signin' ? '.signin-view' : '.signup-view';

        if (provider.setup && provider.setup.offlineStorage && !app.data.defaultProvider.isOnline()) {
            $('.offline').show().siblings().hide();
        } else {
            $(activeView).show().siblings().hide();
        }
    };

    var successHandler = function (data) {
        var redirect = mode === 'signin' ? signinRedirect : registerRedirect;

        if (data && data.result) {
            app.authentication.loadCachedAccessToken()
                .then(function () {
                    app.mobileApp.navigate('components/' + redirect + '/view.html');
                });
        } else {
            init();
        }
    };

    var vm = kendo.observable({
        displayName: '',
        email: '',
        password: '',
        validateData: function (data) {
            if (!data.email) {
                app.notify.info('Missing email');
                return false;
            }

            if (!data.password) {
                app.notify.info('Missing password');
                return false;
            }

            return true;
        },
        signin: function (email, password) {
            var model = vm;
            email = email || model.email.toLowerCase();
            password = password || model.password;

            if (!model.validateData(model)) {
                return false;
            }

            provider.users.login(email, password, successHandler, init);
        },
        register: function () {
            if (!validator.validate()) {
                return;
            }

            var model = vm;
            var email = model.email.toLowerCase();
            var password = model.password;
            var displayName = model.displayName;
            var birthDate = model.birthDate;
            var gender = model.gender;

            var attrs = {
                Email: email,
                DisplayName: displayName,
                BirthDate: birthDate,
                Gender: gender
            };

            if (!model.validateData(model)) {
                return false;
            }

            provider.users.register(email, password, attrs, function () {
                vm.signin(email, password);
            }, init);
        },
        toggleView: function () {
            mode = mode === 'signin' ? 'register' : 'signin';
            init();
        },
        facebookLogin: function () {
            var login = function (response) {
                provider.authentication.loginWithFacebook(response.authResponse.accessToken, successHandler, init);
            };

            FB.getLoginStatus(function (response) {
                if (response.status === 'connected') {
                    login(response);
                } else {
                    FB.login(function (response) {
                        if (response.status === 'connected') {
                            login(response);
                        }
                    });
                }
            });
        },
        twitterLogin: function () {
            provider.authentication.loginWithTwitter(
                app.settings.social.twitter.acessToken,
                app.settings.social.twitter.accessTokenSecret,
                successHandler,
                init
            );
        },
        googleLogin: function () {
            var auth = gapi.auth2.getAuthInstance();
            gapi.auth2.getAuthInstance().signIn()
                .then(function () {
                    var user = auth.currentUser.get();
                    var authResponse = user.getAuthResponse();
                    var accessToken = authResponse.access_token;
                    provider.authentication.loginWithGoogle(accessToken, successHandler, init);
                }, app.notify.error);
        },
        windowsLogin: function () {
            var onWindowsLogin = function () {
                if (session.error) {
                    app.notify.error(session.error);
                }
                else {
                    provider.authentication.loginWithLiveID(session.access_token, successHandler, init);
                }
            };

            return function () {
                WL.Event.unsubscribe('auth.login', onWindowsLogin);
                WL.Event.subscribe('auth.login', onWindowsLogin);

                WL.login();
            }
        }(),
        adfsLogin: function () {
            var getParameterByName = function (name, url) {
                name = name.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
                var regexS = name + '=([^&#]*)';

                var regex = new RegExp(regexS);
                var results = regex.exec(url);

                if (results === null) {
                    return false;
                } else {
                    return decodeURIComponent(results[1].replace(/\+/g, ' '));
                }
            };

            var onLocationChanged = function(loc, callback) {
                if (loc.indexOf('access_token=') !== -1) {
                    ref.close();
                    var token = getParameterByName('access_token', loc);
                    callback(token);
                }
            };

            var onResponse = function (accessToken) {
                provider.authentication.loginWithADFS(accessToken, successHandler, init);
            };

            var adfsConfig = {
                name: 'ADFS',
                loginMethodName: 'loginWithADFS',
                endpoint: app.settings.social.adfs.endpoint,
                wa: 'wsignin1.0',
                wtrealm: app.settings.social.adfs.realm
            };

            var authorize_url = adfsConfig.endpoint
                + '?wa=' + adfsConfig.wa
                + '&wreply=' + adfsConfig.wtrealm + '/adfs/token'
                + '&wtrealm=' + adfsConfig.wtrealm;

            // open the InAppBrowser with the link
            var ref = window.open(authorize_url, '_blank', 'location=no');

            ref.addEventListener('loadstop', function(event) {
                onLocationChanged(event.url, onResponse);
            });

            ref.addEventListener('loaderror', function(event) {
                app.notify.error('Load error: ' + event.message);
            });

            // The following is required in iPhone as the loadstop event is never fired.
            // The check for Google is required to parse the access token of the redirect Uri
            ref.addEventListener('loadstart', function(event) {
                that.onLocationChanged(event.url, onResponse);
            });
        }
    });

    view.set('authenticationViewModel', vm);
}());
