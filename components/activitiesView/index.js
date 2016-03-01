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
                        UserId: {
                            TargetTypeName: 'Users',
                            SingleField: 'DisplayName',
                            ReturnAs: 'User'
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

                //TODO: remove this hack
                activity.Meta = {
                    Permissions: {
                        CanEdit: activity.CreatedBy === app.user.Id,
                        CanDelete: activity.CreatedBy === app.user.Id
                    }
                }
            });
        },
        error: app.notify.error,
        serverFiltering: true,
        serverPaging: true,
        pageSize: 50
    });

    var commentsData = provider.data('Comments');

    var activityValidator;
    var addEditActivityViewModel = kendo.observable({
        isEdit: false,
        activity: null,
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
                    uploadImagePromise = provider.files.create({
                        Filename: app.user.Id + '_' + file.name,
                        ContentType: file.type,
                        base64: picture
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

            if (window.cordova) {
                $('#choose-file-button').click(function () {
                    navigator.camera.getPicture(function (uri) {
                        this.set('imageChanged', true);
                        this.set('activity.PictureUrl', uri);
                    }.bind(this), app.notify.error, {
                        quality: 50,
                        destinationType: navigator.camera.DestinationType.FILE_URI,
                        sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY
                    });
                }.bind(this));
            } else {
                $('#choose-file-button').click(function () {
                    $('#activityPhoto').click();
                });

                $('#activityPhoto:file').change(function () {
                    this.set('imageChanged', true);
                    var files = $('#activityPhoto')[0].files;
                    if (!files.length) {
                        return cb();
                    }

                    var file = files[0];
                    var reader = new FileReader();

                    reader.readAsDataURL(file);
                    reader.onload = function (e) {
                        var base64 = e.target.result;
                        if (base64) {
                            var cleanBase64 = uri.split(',')[1];
                            this.set('activity.PictureUrl', cleanBase64);
                        }
                    }.bind(this);
                }.bind(this));
            }

            activityValidator = app.validate.getValidator('#activity-form');
        }
    });

    var activityDetailsViewModel = kendo.observable({
        currentActivity: null,
        canEdit: false,
        canDelete: false,
        commentsDataSource: [],
        showComments: false,

        _getCommentsDataSource: function (filter) {
            return new kendo.data.DataSource({
                type: 'everlive',
                transport: {
                    typeName: 'Comments',
                    read: {
                        headers: {
                            'X-Everlive-Expand': JSON.stringify({
                                UserId: {
                                    TargetTypeName: 'Users',
                                    Fields: {
                                        'DisplayName': 1
                                    },
                                    ReturnAs: 'User'
                                }
                            })
                        }
                    }
                },
                filter: filter || {},
                serverFiltering: true,
                error: app.notify.error
            });
        },
        _renderCommentsCountTemplate: function (data) {
            var template = kendo.template($('#comments-count-template').html());
            var renderedTemplate = template(data || '');
            $('#view-comments-button').html(renderedTemplate);
        },
        _aggregateComments: function () {
            var query = new Everlive.AggregateQuery;

            query.where().equal('ActivityId', this.currentActivity.Id);
            query.count();

            commentsData.aggregate(query)
                .then(function (data) {
                    var templateData = data.result.length ? data.result[0].Count : 0;
                    this._renderCommentsCountTemplate(templateData);
                }.bind(this))
                .catch(app.notify.error);
        },

        onShow: function (e) {
            this._renderCommentsCountTemplate();
            var currentActivity = activitiesDataSource.get(e.view.params.id);
            this.set('currentActivity', null);
            this.set('currentActivity', currentActivity);
            this._aggregateComments();

            if (this.showComments) {
                this.loadComments();
            }

            this.set('canEdit', currentActivity.Meta.Permissions.CanEdit);
            this.set('canDelete', currentActivity.Meta.Permissions.CanDelete);
        },
        onHide: function () {
            this.set('showComments', false);
        },
        loadComments: function () {
            var commentsDataSource = this._getCommentsDataSource({
                field: 'ActivityId',
                operator: 'eq',
                value: this.currentActivity.Id
            });

            this.set('commentsDataSource', commentsDataSource);

            commentsDataSource.read()
                .then(function () {
                    this.set('showComments', true);
                }.bind(this), app.notify.error);
        },
        editComment: function (e) {
            var commentId = e.data.Id;
            app.mobileApp.navigate('#components/addEditCommentsView/view.html?commentId=' + commentId);
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
        removeComment: function (e) {
            var commentId = e.data.Id;
            var comment = this.commentsDataSource.getByUid(commentId);
            this.commentsDataSource.remove(comment);
            this.commentsDataSource.sync().then(this._aggregateComments.bind(this), app.notify.error);
        },
        addComment: function () {
            app.mobileApp.navigate('#components/addEditCommentsView/view.html?activityId=' + this.currentActivity.Id);
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
        }
    });

    view.set('activitiesViewModel', activitiesViewModel);
    view.set('activityDetailsViewModel', activityDetailsViewModel);
    view.set('addEditActivityViewModel', addEditActivityViewModel);
}());