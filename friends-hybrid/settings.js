'use strict';

(function () {
    app.settings = {
        appId: 'joh3zc3b6w4mb8pr',
        scheme: 'http',
        social: {
            facebook: {
                //check out .debug.abproject and .release.abproject
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
