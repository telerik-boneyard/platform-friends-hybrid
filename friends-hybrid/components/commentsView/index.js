'use strict';

(function () {
    var view = app.commentsView = kendo.observable();
    var provider = app.data.defaultProvider;
    var commentsData = provider.data('Comments');
    var commentsListScroller;

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
                                    ReturnAs: 'User',
                                    Expand: {
                                        Picture: {
                                            TargetTypeName: 'System.Files',
                                            ReturnAs: 'PictureUrl',
                                            SingleField: 'Uri'
                                        }
                                    }
                                }
                            })
                        }
                    }
                },
                change: function () {
                    var data = this.data();

                    data.forEach(function (comment) {
                        comment.CreatedAt = kendo.toString(new Date(comment.CreatedAt), app.constants.dateFormat);
                        comment.User = comment.User || {DisplayName: 'Anonymous'};
                        comment.User.PictureUrl = comment.User.PictureUrl || app.constants.defaultPicture;
                    });
                },
                filter: filter || {},
                serverFiltering: true,
                serverPaging: true,
                error: app.notify.error,
                pageSize: 20
            });
        },
        onShow: function (e) {
            app.utils.loading(true);

            var activityId = e.view.params.activityId;

            commentsListScroller = e.view.scroller;
            commentsListScroller.reset();

            this.set('currentActivityId', activityId);

            var commentsDataSource = this._getCommentsDataSource({
                field: 'ActivityId',
                operator: 'eq',
                value: this.currentActivityId
            });

            this.set('commentsDataSource', commentsDataSource);

            commentsDataSource.one('change', function () {
                if (!commentsDataSource.data().length) {
                    this.addComment(true);
                }

                app.utils.loading(false);
            }.bind(this));
        },
        editComment: function (e) {
            var commentId = e.data.Id;
            app.mobileApp.navigate('#components/commentsView/addEdit.html?commentId=' + commentId);
        },
        removeComment: function (e) {
            app.activitiesView.shouldRefresh = true;
            var commentId = e.data.Id;
            app.notify.confirmation(null, 'Remove comment', function (confirmed) {
                if (!confirmed) {
                    return;
                }

                var comment = this.commentsDataSource.get(commentId);
                this.commentsDataSource.remove(comment);
                this.commentsDataSource.sync().then(null, app.notify.error);
            }.bind(this));
        },
        addComment: function (replace) {
            app.activitiesView.shouldRefresh = true;
            var view = '#components/commentsView/addEdit.html?activityId=' + this.currentActivityId;
            if (replace) {
                app.mobileApp.replace(view);
            } else {
                app.mobileApp.navigate(view);
            }
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
            var textarea = $('#comment-text');

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
                        app.utils.autoSizeTextarea(textarea);
                    }.bind(this))
                    .catch(app.notify.error);
            }

            textarea.on('input keypress', function () {
                app.utils.autoSizeTextarea(textarea);
            });
        },
        onHide: function () {
            var textarea = $('#comment-text');
            this.set('fields.comment', '');
            app.utils.autoSizeTextarea(textarea);
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
                app.mobileApp.replace('components/commentsView/view.html?activityId=' + this.activityId);
            }.bind(this), app.notify.error);
        }
    });

    view.set('addEditCommentsViewModel', addEditCommentsViewModel);
    view.set('commentsViewModel', commentsViewModel);
}());
