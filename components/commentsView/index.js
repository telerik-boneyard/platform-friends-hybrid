'use strict';

(function () {
    var view = app.commentsView = kendo.observable();
    var provider = app.data.defaultProvider;
    var commentsData = provider.data('Comments');

    var commentsViewModel = kendo.observable({
        commentsDataSource: [],
        currentActivityId: null,

        _getCommentsDataSource: function (filter) {
            return new kendo.data.DataSource({
                type: 'everlive',
                transport: {
                    typeName: 'Comments',
                    read: {
                        headers: {
                            'X-Everlive-Expand': JSON.stringify({
                                CreatedBy: {
                                    TargetTypeName: 'Users',
                                    ReturnAs: 'User'
                                }
                            })
                        }
                    }
                },
                change: function () {
                    var data = this.data();

                    data.forEach(function (comment) {
                        comment.CreatedAt = kendo.toString(new Date(comment.CreatedAt), app.constants.dateFormat);
                        var picture = comment.User.Picture;
                        if (picture) {
                            comment.User.PictureUrl = app.data.defaultProvider.files.getDownloadUrl(picture);
                        } else {
                            comment.User.PictureUrl = app.constants.defaultPicture;
                        }

                    });
                },
                filter: filter || {},
                serverFiltering: true,
                error: app.notify.error
            });
        },
        onShow: function (e) {
            var activityId = e.view.params.activityId;
            this.set('currentActivityId', activityId);

            var commentsDataSource = this._getCommentsDataSource({
                field: 'ActivityId',
                operator: 'eq',
                value: this.currentActivityId
            });

            this.set('commentsDataSource', commentsDataSource);
        },
        editComment: function (e) {
            var commentId = e.data.Id;
            app.mobileApp.navigate('#components/commentsView/addEdit.html?commentId=' + commentId);
        },
        removeComment: function (e) {
            var confirmed = app.notify.confirmation();
            if (!confirmed) {
                return;
            }

            app.activitiesView.activitiesViewModel.dataSource.read();
            var commentId = e.data.Id;
            var comment = this.commentsDataSource.get(commentId);
            this.commentsDataSource.remove(comment);
            this.commentsDataSource.sync().then(null, app.notify.error);
        },
        addComment: function () {
            app.mobileApp.navigate('#components/commentsView/addEdit.html?activityId=' + this.currentActivityId);
        }
    });

    var addEditCommentsViewModel = kendo.observable({
        activityId: null,
        commentId: null,
        comment: null,
        isEdit: false,
        fields: {
            comment: ''
        },
        onShow: function (e) {
            var params = e.view.params;

            if (params.activityId) {
                this.set('activityId', params.activityId);
                this.set('isEdit', false);
                this.set('fields.comment', '');
            } else {
                this.set('commentId', params.commentId);
                this.set('isEdit', true);
                commentsData.getById(this.commentId)
                    .then(function (res) {
                        this.set('fields.comment', res.result.Comment);
                    }.bind(this))
                    .catch(app.notify.error);
            }
        },
        onHide: function () {
            this.set('fields.comment', '');
        },
        submit: function() {
            var commentValidator = app.validate.getValidator('#comment-form');
            if (!commentValidator.validate()) {
                return;
            }

            var promise = null;
            var comment = {
                Comment: this.fields.comment
            };

            if (this.isEdit) {
                comment.Id = this.commentId;
                promise = commentsData.updateSingle(comment);
            } else {
                comment.ActivityId = this.activityId;
                promise = commentsData.create(comment);
            }

            promise.then(function () {
                app.activitiesView.activitiesViewModel.dataSource.read();
                this.cancel();
            }.bind(this), app.notify.error);
        },
        cancel: function() {
            app.utils.goBack();
        }
    });

    view.set('addEditCommentsViewModel', addEditCommentsViewModel);
    view.set('commentsViewModel', commentsViewModel);
}());