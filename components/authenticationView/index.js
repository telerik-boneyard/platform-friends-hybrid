'use strict';

(function () {
    var view = app.authenticationView = kendo.observable({
        afterShow: function () {
            provider.users.currentUser().then(successHandler, init)
        }
    });

    var provider = app.data.defaultProvider;
    var mode = 'signin';
    var registerRedirect = 'activitiesView';
    var signinRedirect = 'activitiesView';

    var init = function (error) {
        app.utils.loading(false);
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
                    app.utils.loading(false);
                });
        } else {
            init();
        }
    };

    var vm = kendo.observable({
        displayName: '',
        username: '',
        password: '',
        email: '',
        onShow: function () {
            mode = 'signin'; //reset the view mode
        },
        signin: function (username, password) {
            var model = vm;
            if (typeof username !== 'string') {
                username = model.username.toLowerCase();
            }

            if (typeof password !== 'string') {
                password = model.password;
            }

            var loginValidator = app.validate.getValidator('#login-form');
            if (!loginValidator.validate()) {
                return;
            }

            app.utils.loading(true);
            provider.users.login(username, password, function (data) {
                vm.set('username', '');
                vm.set('password', '');

                successHandler(data);
            }, init);
        },
        register: function () {
            var registerValidator = app.validate.getValidator('#authentication-form');
            if (!registerValidator.validate()) {
                return;
            }

            var username = vm.username;
            var password = vm.password;
            var displayName = vm.displayName;
            var email = vm.email;

            var attrs = {
                DisplayName: displayName,
                Email: email
            };

            app.utils.loading(true);
            provider.users.register(username, password, attrs, function () {
                vm.set('displayName', '');
                vm.set('email', '');

                app.notify.info('Registration successful');
                vm.signin(username, password);
            }, init);
        },
        toggleView: function () {
            mode = mode === 'signin' ? 'register' : 'signin';
            init();
        },
        facebookLogin: function () {
            var fbLogin = function (response) {
                provider.authentication.loginWithFacebook(response.authResponse.accessToken)
                    .then(successHandler, init);
            };

            facebookConnectPlugin.getLoginStatus(function(response) {
                if (response.status === 'connected') {
                    fbLogin(response);
                } else {
                    facebookConnectPlugin.login(['email'],
                        function(response) {
                            if (response.status === 'connected') {
                                fbLogin(response);
                            } else {
                                app.notify.info('You are not logged in');
                            }
                        }, function (err) {
                            app.notify.error(err);
                        });
                }
            });
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
