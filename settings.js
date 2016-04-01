'use strict';

(function () {
    app.settings = {
        appId: 'ghxgj28e48b8ligc',
        scheme: 'http',
        social: {
            facebook: {
                //check out .debug.abproject and .release.abproject
            },
            google: {
                clientId: '406987471724-q1sorfhhcbulk6r5r317l482u9f62ti8.apps.googleusercontent.com' // Put your Google Client ID here
            },
            adfs: {
                endpoint: '$ADFS_ENDPOINT$', // Put your ADFS Realm here
                realm: '$ADFS_REALM$' // Put your ADFS Endpoint here
            }
        }
    };
}());
