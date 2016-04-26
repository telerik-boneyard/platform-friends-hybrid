(function () {
    app.navigation = {
        back: function () {
            app.mobileApp.navigate('#:back');
            app.utils.loading(false);
        },

        navigateNoAppId: function () {
            return app.mobileApp.navigate('components/missingSettingsView/noappidView.html');
        },

        navigateActivities: function () {
            return app.mobileApp.navigate('components/activitiesView/view.html');
        },

        navigateAuthentication: function () {
            return app.mobileApp.navigate('components/authenticationView/view.html');
        },

        navigateProfile: function () {
            return app.mobileApp.navigate('components/profileView/view.html');
        },

        navigateActivitiesAdd: function () {
            return app.mobileApp.navigate('components/activitiesView/addEdit.html')
        },

        navigateActivitiesEdit: function (activityId) {
            return app.mobileApp.navigate('components/activitiesView/addEdit.html?id=' + activityId);
        },

        navigateActivitiesDetails: function (activityId) {
            app.mobileApp.navigate('#components/activitiesView/details.html?id=' + activityId);
        },

        navigateComments: function (activityId) {
            return app.mobileApp.navigate('components/commentsView/view.html?activityId=' + activityId);
        },

        navigateAddComment: function (activityId) {
            return app.mobileApp.navigate('components/commentsView/addEdit.html?activityId=' + activityId);
        },

        replaceAddComment: function (activityId) {
            return app.mobileApp.replace('components/commentsView/addEdit.html?activityId=' + activityId);
        },

        navigateEditComment: function (commentId) {
            return app.mobileApp.navigate('components/commentsView/addEdit.html?commentId=' + commentId);
        }
    };
}());