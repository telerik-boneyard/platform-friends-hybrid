(function () {
    var provider = app.data.defaultProvider;
    var commentsData = provider.data('Comments');

    var view = app.addEditCommentsView = new kendo.observable();

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
                        this.set('fields.comment', res.result.Id);
                    }.bind(this))
                    .catch(app.notify.error);
            }
        },
        submit: function() {
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
                app.activitiesView.activitiesViewModel.set('showComments', true);
                this.cancel();
            }.bind(this), app.notify.error);
        },
        cancel: function() {
            app.utils.goBack();
        }
    });

    view.set('addEditCommentsViewModel', addEditCommentsViewModel);
}());