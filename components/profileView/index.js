'use strict';

(function () {
    var provider = app.data.defaultProvider;

    var view = app.profileView = kendo.observable();

    var validator;
    var profileViewModel = kendo.observable({
        profile: null,
        onShow: function () {
            var user = app.user;
            var profile = kendo.observable({
                DisplayName: user.DisplayName,
                Email: user.Email,
                BirthDate: user.BirthDate,
                Gender: user.Gender,
                About: user.About
            });

            this.set('profile', profile);
            validator = app.validate.getValidator('#edit-profile-form');
        },
        updateProfile: function () {
            if (!validator.validate()) {
                return;
            }

            var profile = this.profile;
            var user = app.user;
            var model = {
                Id: user.Id
            };

            if (profile.DisplayName !== user.DisplayName) {
                model.DisplayName = profile.DisplayName;
            }

            if (profile.Email !== user.Email) {
                model.Email = profile.Email;
            }

            if (profile.BirthDate !== user.BirthDate) {
                model.BirthDate = profile.BirthDate;
            }

            if (profile.Gender !== user.Gender) {
                model.Gender = profile.Gender;
            }

            if (profile.About !== user.About) {
                model.About = profile.About;
            }

            app.utils.loading(true);
            provider.users.updateSingle(model)
                .then(function () {
                    return app.authentication.loadCachedAccessToken();
                })
                .then(app.utils.goBack)
                .catch(app.notify.error);
        }
    });

    view.set('profileViewModel', profileViewModel);
}());