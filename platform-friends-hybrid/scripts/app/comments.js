/**
 * Comments view model
 */

var app = app || {};

app.Comments = (function () {
    'use strict'

    var commentsViewModel = (function () {
        
        var commentModel = {
            id: 'Id',
            fields: {
                Comment: {
                    field: 'Comment',
                    defaultValue: ''
                },
                CreatedAt: {
                    field: 'CreatedAt',
                    defaultValue: new Date()
                },
                ActivityId: {
                    field: 'ActivityId',
                    defaultValue: null
                },
                UserId: {
                    field: 'UserId',
                    defaultValue: null
                }
            },
            CreatedAtFormatted: function () {

                return app.helper.formatDate(this.get('CreatedAt'));
            },
            User: function () {

                var userId = this.get('UserId');

                var user = $.grep(app.Users.users(), function (e) {
                    return e.Id === userId;
                })[0];

                return user ? user.DisplayName : 'Anonymous';
            }
        };
        
        var commentsDataSource = new kendo.data.DataSource({
            type: 'everlive',
            schema: {
                model: commentModel
            },
            transport: {
                typeName: 'Comments'
            },
            serverFiltering: true,
            change: function (e) {

                if (e.items && e.items.length > 0) {
                    $('#comments-listview').kendoMobileListView({
                        dataSource: e.items,
                        template: kendo.template($('#commentsTemplate').html())
                    });
                } else {
                    $('#comments-listview').empty();
                }
            },
            sort: { field: 'CreatedAt', dir: 'desc' }
        });
        
        return {
            comments: commentsDataSource
        };
        
    }());
    
    return commentsViewModel;

}());
