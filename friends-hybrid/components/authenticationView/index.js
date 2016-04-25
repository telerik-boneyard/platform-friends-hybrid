'use strict';

(function () {
    var view = app.authenticationView = kendo.observable({
        onShow: function () {
            var shouldDisableAdfsButton = app.settings.adfs.endpoint === '$ADFS_ENDPOINT$' && app.settings.adfs.realm === '$ADFS_REALM$';
            if (shouldDisableAdfsButton) {
                $('#adfs-btn').prop('disabled', shouldDisableAdfsButton);
            }

            mode = app.constants.authenticationModeSignin; //reset the view mode
            init();
        },
        afterShow: function () {
            provider.users.currentUser().then(successHandler, init)
        }
    });

    var provider = app.data.defaultProvider;
    var mode = app.constants.authenticationModeSignin;
    var registerRedirect = 'activitiesView';
    var signinRedirect = 'activitiesView';

    function init(error) {
        app.utils.loading(false);
        if (error) {
            app.notify.error(error);
            return false;
        }

        var activeView = mode === app.constants.authenticationModeSignin ? '.signin-view' : '.signup-view';

        if (provider.setup && provider.setup.offlineStorage && !app.data.defaultProvider.isOnline()) {
            $('.offline').show().siblings().hide();
        } else {
            $(activeView).show().siblings().hide();
        }
    }

    function successHandler(data) {
        var redirect = mode === app.constants.authenticationModeSignin ? signinRedirect : registerRedirect;

        if (data && data.result) {
            app.data.defaultProvider.users.currentUser()
                .then(function (res) {
                    app.user = res.result;
                    app.mobileApp.navigate('components/' + redirect + '/view.html');
                    app.utils.loading(false);
                });
        } else {
            init();
        }
    }

    var vm = kendo.observable({
        user: {
            displayName: '',
            username: '',
            password: '',
            email: ''
        },
        loginValidator: null,
        registerValidator: null,
        signin: function (username, password) {
            var model = vm.user;
            if (typeof username !== 'string') {
                username = model.username;
            }

            if (typeof password !== 'string') {
                password = model.password;
            }

            this.loginValidator = app.validate.getValidator('#login-form');
            if (!this.loginValidator.validate()) {
                return;
            }

            app.utils.loading(true);
            provider.users.login(username, password, function (data) {
                vm.set('user.username', '');
                vm.set('user.password', '');

                successHandler(data);
            }, init);
        },
        register: function () {
            this.registerValidator = app.validate.getValidator('#authentication-form');
            if (!this.registerValidator.validate()) {
                return;
            }

            var model = vm.user;
            var username = model.username;
            var password = model.password;
            var displayName = model.displayName;
            var email = model.email;

            var attrs = {
                DisplayName: displayName,
                Email: email
            };

            app.utils.loading(true);
            provider.users.register(username, password, attrs, function () {
                vm.set('user.displayName', '');
                vm.set('user.email', '');

                app.notify.success('Registration successful');
                vm.signin(username, password);
            }, init);
        },
        toggleView: function () {
            mode = mode === app.constants.authenticationModeSignin ?
                app.constants.authenticationModeRegister : app.constants.authenticationModeSignin;
            vm.set('user.username', '');
            vm.set('user.password', '');
            vm.set('user.displayName', '');
            vm.set('user.email', '');
            if (this.loginValidator) {
                this.loginValidator.hideMessages();
            }

            if (this.registerValidator) {
                this.registerValidator.hideMessages();
            }

            init();
        },
        facebookLogin: function () {
            if (app.utils.isInSimulator() || !app.isCordova) {
                return app.notify.info('Facebook login is only available on a device.');
            }

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
                                app.notify.success('You are not logged in');
                            }
                        }, function (err) {
                            var message = (err && err.message) || err;
                            if (message === 'User Cancelled dialog') {
                                return;
                            }

                            app.notify.error(err);
                        });
                }
            });
        },
        adfsLogin: function (e) {
            if (e.target.prop('disabled')) {
                return;
            }

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
                endpoint: app.settings.adfs.endpoint,
                wa: 'wsignin1.0',
                wtrealm: app.settings.adfs.realm
            };

            var authorize_url = adfsConfig.endpoint
                + '?wa=' + adfsConfig.wa
                + '&wreply=' + adfsConfig.wtrealm + '/adfs/token'
                + '&wtrealm=' + adfsConfig.wtrealm;

            var ref = window.open(authorize_url, '_blank', 'location=no');

            ref.addEventListener('loadstop', function(event) {
                onLocationChanged(event.url, onResponse);
            });

            ref.addEventListener('loaderror', function(event) {
                app.notify.error('Load error: ' + event.message);
            });

            ref.addEventListener('loadstart', function(event) {
                onLocationChanged(event.url, onResponse);
            });
        }
    });

    view.set('authenticationViewModel', vm);
}());
