'use strict';

(function () {
    app.settings = {
        appId: '${AppId}',
        scheme: 'http', // possible values: http, https
        social: {
            facebook: {
                //check README.md
            }
        },
        adfs: {
            endpoint: '$ADFS_ENDPOINT$', // Put your ADFS endpoint here
            realm: '$ADFS_REALM$' // Put your ADFS realm here
        },
        analytics: {
            //check README.md
        },
        feedback: {
            //check README.md
        }
    };
}());
