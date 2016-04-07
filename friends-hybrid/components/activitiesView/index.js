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
                            Fields: {
                                DisplayName: 1,
                                Username: 1,
                                Id: 1
                            }
                        },
                        CreatedBy: {
                            TargetTypeName: 'Users',
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
                activity.CreatedAt = kendo.toString(new Date(activity.CreatedAt), app.constants.dateFormat);
                activity.Likes = activity.Likes || [];
                activity.LikesCount = activity.Likes.length;
                activity.Liked = activity.Likes.indexOf(app.user.DisplayName) !== -1;
                var pictureUrl = activity.User.Picture;
                if (pictureUrl) {
                    activity.User.PictureUrl = app.data.defaultProvider.files.getDownloadUrl(pictureUrl);
                } else {
                    activity.User.PictureUrl = app.constants.defaultPicture;
                }

                if (activity.Comments.length) {
                    activity.CommentsCount = activity.Comments[0].Count;
                } else {
                    activity.CommentsCount = 0;
                }

                activity.Author = activity.User.DisplayName || activity.User.Username;

                activity.Meta = {
                    Permissions: {
                        CanUpdate: app.utils.isOwner(activity),
                        CanDelete: app.utils.isOwner(activity)
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
        uploader: null,

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
                this.uploader.upload()
                    .then(function (id) {
                        return this._handleActivityOperation(id)
                    }.bind(this)).catch(app.notify.error);
            } else {
                return this._handleActivityOperation();
            }
        },
        onHide: function () {
            var textarea = $('#activity-text');
            this.uploader.detach();
            app.utils.autoSizeTextarea(textarea);
        },
        onShow: function (e) {
            var id = e.view.params.id,
                textarea = $('#activity-text');
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

            this.uploader = new app.utils.imageUploader('#choose-file-button', '#activity-form', '#activityPhoto');
            this.uploader.onImage(function (uri) {
                addEditActivityViewModel.set('imageChanged', true);
                addEditActivityViewModel.set('activity.PictureUrl', uri);
            });
            
            app.utils.autoSizeTextarea(textarea);

            textarea.on('input keypress', function () {
                app.utils.autoSizeTextarea(textarea);
            });

            activityValidator = app.validate.getValidator('#activity-form');
        }
    });

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

            var template = kendo.template($('.likesButtonTemplate').html());
            var renderedTemplate = template(currentActivity);
            $('#likes-template-content').html(renderedTemplate);
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
            var activityId = e.data.Id;
            app.mobileApp.navigate('#components/activitiesView/details.html?id=' + activityId);
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