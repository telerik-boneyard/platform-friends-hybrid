/**
 * Activity view model
 */

var app = app || {};

app.Activity = (function () {
    'use strict'
    
    var activityViewModel = (function () {
        
        var activityUid;
        
        var show = function (e) {
            
            activityUid = e.view.params.uid;
            // Get current activity (based on item uid) from Activities model
            var activity = app.Activities.activities.getByUid(activityUid);
            kendo.bind(e.view.element, activity, kendo.mobile.ui);
        };
        
        var hide = function () {
            var picture = document.getElementById('picture');
            picture.src = '';
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
            show: show,
            hide: hide,
            remove: removeActivity
        };
        
    }());
    
    return activityViewModel;
    
}());
