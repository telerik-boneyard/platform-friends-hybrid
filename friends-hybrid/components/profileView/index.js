'use strict';

(function () {
    var provider = app.data.defaultProvider;

    var view = app.profileView = kendo.observable();

    var validator;
    var profileViewModel = kendo.observable({
        profile: null,
        uploader: null,
        photoChanged: false,
        onShow: function (e) {
            var profileScroller = e.view.scroller;
            profileScroller.reset();
            var user = app.user;
            var textarea = $('#about');
            var profile = kendo.observable({
                DisplayName: user.DisplayName,
                Email: user.Email,
                BirthDate: user.BirthDate,
                Gender: user.Gender,
                About: user.About,
                Picture: user.Picture,
                Username: user.Username
            });
            this.set('profile', profile);

            $('#preview').show();
            $('#local-preview').hide();
            if (profile.Picture) {
                profile.PictureUrl = app.constants.whitePicture;
                provider.files.getDownloadUrlById(profile.Picture)
                    .then(function (res) {
                        this.set('profile.PictureUrl', res);
                        app.utils.processElement($('#preview'));
                    }.bind(this))
                    .catch(app.notify.error);
            } else {
                $('#preview').attr('src', app.constants.defaultPicture);
            }

            this.uploader = new app.utils.imageUploader('#profile-choose-file-button', '#edit-profile-form', '#profile-activity-photo');
            this.uploader.onImage(function (uri) {
                this.set('photoChanged', true);
                this.set('profile.PictureUrl', uri);
                $('#preview').hide();
                $('#local-preview').show();
            }.bind(this));

            app.utils.autoSizeTextarea(textarea);
            textarea.on('input keypress', function () {
                app.utils.autoSizeTextarea(textarea);
            });

            validator = app.validate.getValidator('#edit-profile-form');
        },
        onHide: function () {
            var textarea = $('#about');
            this.uploader.detach();
            app.utils.autoSizeTextarea(textarea);
            $('#preview').attr('src', app.constants.whitePicture);
            $('#local-preview').attr('src', app.constants.whitePicture);
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

            if (profile.Username !== user.Username) {
                model.Username = profile.Username;
            }

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
            var promise;
            if (this.photoChanged) {
                promise = this.uploader.upload()
                    .then(function (id) {
                        if (id) {
                            model.Picture = id;
                            app.activitiesView.activitiesViewModel.dataSource.read();
                        }
                    }, app.notify.error);
            } else {
                promise = Everlive._utils.successfulPromise();
            }

            promise.then(function () {
                provider.users.updateSingle(model)
                    .then(function () {
                        return app.data.defaultProvider.users.currentUser();
                    })
                    .then(function (res) {
                        app.user = res.result;
                        app.navigation.navigateActivities();
                        app.utils.loading(false);
                        app.activitiesView.shouldRefresh = true;
                    })
                    .catch(app.notify.error);
            });
        }
    });

    view.set('profileViewModel', profileViewModel);
}());
