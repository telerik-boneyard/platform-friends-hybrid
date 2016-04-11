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
                endpoint: 'https://bs-wintest-1.everlive.rocks/adfs/ls', // Put your ADFS endpoint here
                realm: 'https://sit-tap-bs.telerik.rocks/v1/9tadbe1v3afo3nit' // Put your ADFS realm here
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
