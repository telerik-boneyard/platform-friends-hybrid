'use strict';


(function () {
    var provider = app.data.defaultProvider;
    var activitiesData = provider.data('Activities');

    var view = app.activitiesView = kendo.observable();

    var activitiesDataSource = new kendo.data.DataSource({
        type: 'everlive',
        transport: {
            typeName: 'Activities',
            read: {
                headers: {
                    'X-Everlive-Expand': JSON.stringify({
                        Picture: {
                            TargetTypeName: 'Files',
                            ReturnAs: 'PictureUrl',
                            SingleField: 'Uri'
                        },
                        Likes: {
                            TargetTypeName: 'Users',
                            SingleField: 'DisplayName'
                        },
                        CreatedBy: {
                            TargetTypeName: 'Users',
                            SingleField: 'DisplayName',
                            ReturnAs: 'User'
                        },
                        'Comments.ActivityId': {
                            Aggregate: {
                                Aggregate: {
                                    Count: {
                                        count: null
                                    }
                                }
                            },
                            ReturnAs: 'Comments'
                        }
                    })
                }
            }
        },
        change: function () {
            var data = this.data();

            data.forEach(function (activity) {
                activity.PictureUrl = activity.PictureUrl || app.constants.defaultPicture;
                activity.CreatedAt = kendo.toString(new Date(activity.CreatedAt), 'd');
                activity.Likes = activity.Likes || [];
                activity.LikesCount = activity.Likes.length;
                activity.Liked = activity.Likes.indexOf(app.user.DisplayName) !== -1;

                if (activity.Comments.length) {
                    activity.CommentsCount = activity.Comments[0].Count;
                } else {
                    activity.CommentsCount = 0;
                }

                activity.Meta = {
                    Permissions: {
                        CanUpdate: activity.CreatedBy === app.user.Id,
                        CanDelete: activity.CreatedBy === app.user.Id
                    }
                }
            });
        },
        error: app.notify.error,
        serverFiltering: true,
        serverPaging: true,
        serverSorting: true,
        sort: {
            field: 'CreatedAt',
            dir: 'desc'
        },
        pageSize: 50
    });

    var activityValidator;
    var addEditActivityViewModel = kendo.observable({
        isEdit: false,
        activity: null,
        file: null,
        imageChanged: false,

        _handleActivityOperation: function (pictureId) {
            var model = {};
            model.Text = this.activity.Text;
            if (pictureId) {
                model.Picture = pictureId;
            }

            var promise;
            if (this.isEdit) {
                model.Id = this.activity.Id;
                promise = activitiesData.updateSingle(model);
            } else {
                promise = activitiesData.create(model);
            }

            return promise.then(function () {
                return activitiesDataSource.read();
            }).then(app.utils.goBack).catch(app.notify.error);
        },

        applyActivity: function () {
            if (!activityValidator.validate()) {
                return;
            }

            app.utils.loading(true);

            if (this.imageChanged && this.activity.PictureUrl) {
                var picture = this.activity.PictureUrl;
                var uploadImagePromise;

                if (window.cordova) {
                    uploadImagePromise = provider.files.upload(picture);
                } else {
                    var file = this.file;
                    var cleanBase64 = picture.split(',')[1];
                    uploadImagePromise = provider.files.create({
                        Filename: app.user.Id + '_' + file.name,
                        ContentType: file.type,
                        base64: cleanBase64
                    });
                }

                uploadImagePromise.then(function (res) {
                    var id;
                    if (res.response) {
                        var responseObject = JSON.parse(res.response);
                        id = responseObject.Result[0].Id
                    } else {
                        id = res.result.Id;
                    }

                    return this._handleActivityOperation(id);
                }.bind(this)).catch(app.notify.error);
            } else {
                return this._handleActivityOperation()
            }
        },
        onShow: function (e) {
            var id = e.view.params.id;
            if (!id) {
                this.set('isEdit', false);
                this.set('activity', {
                    Text: '',
                    PictureUrl: app.constants.defaultPicture
                });
            } else {
                this.set('isEdit', true);
                var activity = activitiesDataSource.get(id);
                this.set('activity', {
                    Id: activity.Id,
                    Text: activity.Text,
                    PictureUrl: activity.PictureUrl || app.constants.defaultPicture
                });
            }

            initActivityEvents();
            activityValidator = app.validate.getValidator('#activity-form');
        }
    });

    var initialized;
    function initActivityEvents() {
        if (initialized) {
            return;
        }

        if (window.cordova) {
            $('#choose-file-button').click(function () {
                navigator.camera.getPicture(function (uri) {
                    addEditActivityViewModel.set('imageChanged', true);
                    addEditActivityViewModel.set('activity.PictureUrl', uri);
                }, app.notify.error, {
                    quality: 50,
                    destinationType: navigator.camera.DestinationType.FILE_URI,
                    sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY
                });
            });
        } else {
            $('#choose-file-button').click(function () {
                $('#activityPhoto').click();
            });

            $('#activity-form').submit(function () {
                return false;
            });

            $('#activityPhoto:file').change(function () {
                addEditActivityViewModel.set('imageChanged', true);
                var files = $('#activityPhoto')[0].files;
                if (!files.length) {
                    return;
                }

                var file = files[0];
                addEditActivityViewModel.set('file', file);
                var reader = new FileReader();

                reader.readAsDataURL(file);
                reader.onload = function (e) {
                    var base64 = e.target.result;
                    if (base64) {
                        addEditActivityViewModel.set('activity.PictureUrl', base64);
                    }
                };
            });
        }

        initialized = true;
    }

    var activityDetailsViewModel = kendo.observable({
        currentActivity: null,
        canEdit: false,
        canDelete: false,
        commentsDataSource: [],
        onShow: function (e) {
            var currentActivity = activitiesDataSource.get(e.view.params.id);
            this.set('currentActivity', null);
            this.set('currentActivity', currentActivity);

            this.set('canEdit', currentActivity.Meta.Permissions.CanUpdate);
            this.set('canDelete', currentActivity.Meta.Permissions.CanDelete);
        },
        editActivity: function () {
            app.mobileApp.navigate('#components/activitiesView/addEdit.html?id=' + this.currentActivity.Id);
        },
        removeActivity: function () {
            var confirmed = app.notify.confirmation();

            if (!confirmed) {
                return;
            }

            var activities = activitiesDataSource.data();
            for (var i = 0; i < activities.length; i++) {
                var activity = activities[i];
                if (activity.Id === this.currentActivity.Id) {
                    activitiesDataSource.remove(activity);
                    activitiesDataSource.sync();
                    return this.goBack();
                }
            }
        },
        openComments: function () {
            var activityId = this.currentActivity.Id;
            app.mobileApp.navigate('#components/commentsView/view.html?activityId=' + activityId);
        },
        goBack: app.utils.goBack
    });

    var activitiesViewModel = kendo.observable({
        dataSource: activitiesDataSource,
        activityClick: function (e) {
            var itemId = e.data.Id;
            app.mobileApp.navigate('#components/activitiesView/details.html?id=' + itemId);
        },
        addActivityClick: function () {
            app.mobileApp.navigate('#components/activitiesView/addEdit.html');
        },
        likeActivity: function (e) {
            e.stopPropagation();
            var activityId = e.data.Id;

            provider.request({
                endpoint: 'Functions/likeActivity?activityId=' + activityId,
                method: 'GET',
                success: function () {
                    activitiesDataSource.read();
                },
                error: app.notify.error
            }).send();
        },

        logout: function () {
            provider.users.logout()
                .then(function () {
                    app.mobileApp.navigate('#components/authenticationView/view.html');
                }, app.notify.error);
        },
        openComments: function (e) {
            e.stopPropagation();
            var activityId = e.data.Id;
            app.mobileApp.navigate('#components/commentsView/view.html?activityId=' + activityId);
        }
    });

    view.set('activitiesViewModel', activitiesViewModel);
    view.set('activityDetailsViewModel', activityDetailsViewModel);
    view.set('addEditActivityViewModel', addEditActivityViewModel);
}());