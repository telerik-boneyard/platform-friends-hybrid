'use strict';


(function () {
    var provider = app.data.defaultProvider;
    var activitiesData = provider.data('Activities');
    var commentsData = provider.data('Comments');

    var likeActivity = function (e) {
        return new Everlive._common.rsvp.Promise(function (resolve, reject) {
            e.stopPropagation();
            var activityId = this.activityId;
            app.utils.loading(true);
            provider.request({
                endpoint: 'Functions/likeActivity?activityId=' + activityId,
                method: 'GET',
                success: resolve,
                error: reject
            }).send();
        }.bind(this)).catch(app.notify.error);
    };

    var view = app.activitiesView = kendo.observable();

    var activitiesDataSource = new kendo.data.DataSource({
        type: 'everlive',
        transport: {
            typeName: 'Activities',
            read: {
                headers: {
                    'X-Everlive-Expand': JSON.stringify({
                        Picture: {
                            TargetTypeName: 'System.Files',
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
                            ReturnAs: 'User',
                            TargetTypeName: 'Users',
                            Expand: {
                                Picture: {
                                    TargetTypeName: 'System.Files',
                                    ReturnAs: 'PictureUrl',
                                    SingleField: 'Uri'
                                }
                            }
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
                activity.Liked = !!_.find(activity.Likes, function (user) {
                    return user.Id === app.user.Id;
                });

                activity.User = activity.User || {DisplayName: 'Anonymous'};
                var pictureUrl = activity.User.PictureUrl;
                if (!pictureUrl) {
                    activity.User.PictureUrl = app.constants.defaultPicture;
                }

                activity.Author = activity.User.DisplayName || activity.User.Username;

                if (activity.Comments.length) {
                    activity.CommentsCount = activity.Comments[0].Count;
                } else {
                    activity.CommentsCount = 0;
                }
            });

            app.utils.loading(false);
        },
        error: app.notify.error,
        serverFiltering: true,
        serverPaging: true,
        serverSorting: true,
        sort: [
            { field: 'CreatedAt', dir: 'desc' },
            { field: 'Text', dir: 'desc' }
        ],
        pageSize: 10
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
            }).then(app.navigation.back).catch(app.notify.error);
        },

        applyActivity: function () {
            if (!activityValidator.validate()) {
                return;
            }

            app.utils.loading(true);

            if (this.imageChanged && this.activity.PictureUrl && this.activity.PictureUrl !== app.constants.defaultPicture) {
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
            $('#preview-create').css('display', 'none').attr('src', app.constants.whitePicture);
            $('#preview-edit').css('display', 'none').attr('src', app.constants.whitePicture);
        },
        onShow: function (e) {
            this.imageChanged = false;

            var id = e.view.params.id;
            var textarea = $('#activity-text');

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
                $('#preview-edit').css('display', 'none');
                $('#preview-create').css('display', '');
                addEditActivityViewModel.set('imageChanged', true);
                addEditActivityViewModel.set('activity.PictureUrl', uri);
            });

            app.utils.autoSizeTextarea(textarea);

            textarea.on('input keypress', function () {
                app.utils.autoSizeTextarea(textarea);
            });

            activityValidator = app.validate.getValidator('#activity-form');

            if (this.isEdit) {
                var $previewEdit = $('#preview-edit');
                $previewEdit.css('display', '');
                app.utils.processElement($previewEdit);
            } else {
                $('#preview-create').css('display', '');
            }
        }
    });

    var activityDetailsViewModel = kendo.observable({
        currentActivity: null,
        commentsCount: 0,
        canEdit: false,
        canDelete: false,
        onShow: function (e) {
            app.utils.loading(true);
            var currentActivity = activitiesDataSource.get(e.view.params.id);
            this.set('currentActivity', currentActivity);

            this.set('canEdit', currentActivity.Meta.Permissions.CanUpdate);
            this.set('canDelete', currentActivity.Meta.Permissions.CanDelete);

            var $likesIcon = $('#likes-icon');
            $likesIcon.removeClass('icon-like').removeClass('icon-like-o');
            if (this.currentActivity.Liked) {
                $likesIcon.addClass('icon-like');
            } else {
                $likesIcon.addClass('icon-like-o');
            }

            var $commentsIcon = $('#comments-icon');
            $commentsIcon.removeClass('icon-comments-o').removeClass('icon-comments');
            commentsData.count({ActivityId: this.currentActivity.Id})
                .then(function (res) {
                    var count = res.result;
                    if (count) {
                        $commentsIcon.addClass('icon-comments');
                    } else {
                        $commentsIcon.addClass('icon-comments-o');
                    }

                    $('#comments-count').text(count);
                    app.utils.loading(false);
                }.bind(this))
                .catch(function (err) {
                    app.notify.error(err);
                    $commentsIcon.addClass('icon-comments-o');
                });

            var $activityPhoto = $('#current-activity-photo');
            var $authorPhoto = $('#current-activity-author-photo');

            $activityPhoto.prop('src', '');
            $authorPhoto.prop('src', '');

            app.utils.processElement($activityPhoto);
            app.utils.processElement($authorPhoto);
        },
        editActivity: function () {
            app.navigation.navigateActivitiesEdit(this.currentActivity.Id);
        },
        removeActivity: function () {
            app.notify.confirmation(null, 'Delete activity', function (confirmed) {
                if (!confirmed) {
                    return;
                }

                app.activitiesView.shouldRefresh = true;
                var activities = activitiesDataSource.data();
                var activity = _.find(activities, {Id: this.currentActivity.Id});
                activitiesDataSource.remove(activity);
                activitiesDataSource.sync();
                return this.goBack();
            }.bind(this));
        },
        openComments: function () {
            var activityId = this.currentActivity.Id;
            app.navigation.navigateComments(activityId);
        },
        likeActivity: function (e) {
            return likeActivity.call({activityId: this.currentActivity.Id}, e)
                .then(function () {
                    app.activitiesView.shouldRefresh = true;
                    $('#likes-icon').toggleClass('icon-like').toggleClass('icon-like-o');
                    var predicate = {Id: app.user.Id};
                    if (_.find(this.currentActivity.Likes, predicate)) {
                        _.remove(this.currentActivity.Likes, predicate);
                    } else {
                        this.currentActivity.Likes.push(_.pick(app.user, 'DisplayName', 'Id', 'Username'));
                    }

                    $('#count-icon').html(this.currentActivity.Likes.length);
                    app.utils.loading(false);
                }.bind(this));
        },
        goBack: app.navigation.back
    });

    var activitiesViewModel = kendo.observable({
        dataSource: activitiesDataSource,
        refreshOnShow: false,
        onShow: function () {
            if (app.activitiesView.shouldRefresh) {
                app.utils.loading(true);
                activitiesDataSource.read();
                app.activitiesView.shouldRefresh = false;
            } else if (!activitiesDataSource.data().length) {
                app.utils.loading(true);
            }
        },
        activityClick: function (e) {
            var activityId = e.data.Id;
            app.navigation.navigateActivitiesDetails(activityId);
        },
        addActivityClick: function () {
            app.navigation.navigateActivitiesAdd();
        },
        likeActivity: function (e) {
            return likeActivity.call({activityId: e.data.Id}, e).then(function () {
                activitiesDataSource.read();
            });
        },
        openComments: function (e) {
            e.stopPropagation();
            var activityId = e.data.Id;
            app.navigation.navigateComments(activityId);
        }
    });

    view.set('activitiesViewModel', activitiesViewModel);
    view.set('activityDetailsViewModel', activityDetailsViewModel);
    view.set('addEditActivityViewModel', addEditActivityViewModel);
}());
