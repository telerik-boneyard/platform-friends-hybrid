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
        signin: function () {
            var model = vm;
            var email = model.email.toLowerCase();
            var password = model.password;

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

            provider.users.register(email, password, attrs, successHandler, init);
        },
        toggleView: function () {
            mode = mode === 'signin' ? 'register' : 'signin';
            init();
        }
    });

    view.set('authenticationViewModel', vm);
}());