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
        
        var removeActivity = function () {
            
            var activities = app.Activities.activities;
            var activity = activities.getByUid(activityUid);
            var answer = confirm(appSettings.messages.removeActivityConfirm);
            
            if (answer) {
                // Remove current activity from Activities
                activities.remove(activity);
                activities.one('sync', function () {
                    app.mobileApp.navigate('#:back');
                });
                activities.sync();
            }
        };
        
        return {
            show: show,
            remove: removeActivity
        };
        
    }());
    
    return activityViewModel;
    
}());
