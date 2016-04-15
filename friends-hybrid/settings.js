'use strict';

(function () {
    app.settings = {
        appId: '$YOUR_TELERIK_APP_ID$',
        scheme: 'http', // possible values: http, https
        social: {
            facebook: {
                // set up through the Cordova Facebook plugin
                // or check out .debug.abproject and .release.abproject
            },
            adfs: {
                endpoint: '$ADFS_ENDPOINT$', // Put your ADFS endpoint here
                realm: '$ADFS_REALM$' // Put your ADFS realm here
            }
        },
        analytics: {
            //check out .debug.abproject and .release.abproject
        },
        feedback: {
            //check out .debug.abproject and .release.abproject
        }
    };
}());
