'use strict';

(function () {
    app.settings = {
        appId: '6ajtaiknltr0lsgr',
        scheme: 'http',
        social: {
            facebook: {
                //check out .debug.abproject and .release.abproject
            },
            adfs: {
                endpoint: '$ADFS_ENDPOINT$', // Put your ADFS Realm here
                realm: '$ADFS_REALM$' // Put your ADFS Endpoint here
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