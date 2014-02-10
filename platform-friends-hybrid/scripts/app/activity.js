/**
 * Activity view model
 */

var app = app || {};

app.Activity = (function () {
    'use strict'
    
    var $commentsContainer,
        $commentsTemplate,
        listScroller;
    
    var commentsModel = (function () {
        
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
                
                listScroller.reset();

                if (e.items && e.items.length > 0) {
                    $commentsContainer.kendoMobileListView({
                        dataSource: e.items,
                        template: kendo.template($commentsTemplate.html())
                    });
                } else {
                    $commentsContainer.empty();
                }
            },
            sort: { field: 'CreatedAt', dir: 'desc' }
        });
        
        return {
            comments: commentsDataSource
        };
        
    }());
    
    var activityViewModel = (function () {
        
        var activityUid,
            activity,
            $activityPicture;
        
        var init = function () {
            $commentsContainer = $('#comments-listview');
            $commentsTemplate = $('#commentsTemplate');
            $activityPicture = $('#picture');
        };
        
        var show = function (e) {
            
            $commentsContainer.empty();
            
            listScroller = e.view.scroller;
            listScroller.reset();
            
            activityUid = e.view.params.uid;
            // Get current activity (based on item uid) from Activities model
            activity = app.Activities.activities.getByUid(activityUid);
            $activityPicture[0].style.display = activity.Picture ? 'block' : 'none';
            
            commentsModel.comments.filter({
                field: 'ActivityId',
                operator: 'eq',
                value: activity.Id
            });
            
            kendo.bind(e.view.element, activity, kendo.mobile.ui);
        };
        
        var removeActivity = function () {
            
            var activities = app.Activities.activities;
            var activity = activities.getByUid(activityUid);
            
            app.showConfirm(
                appSettings.messages.removeActivityConfirm,
                'Delete Activity',
                function (confirmed) {
                    if (confirmed === true || confirmed === 1) {
                        
                        activities.remove(activity);
                        activities.one('sync', function () {
                            app.mobileApp.navigate('#:back');
                        });
                        activities.sync();
                    }
                }
            );
        };
        
        return {
            init: init,
            show: show,
            remove: removeActivity,
            comments: commentsModel.comments,
            activity: function () {
                return activity;
            },
        };
        
    }());
    
    return activityViewModel;
    
}());
