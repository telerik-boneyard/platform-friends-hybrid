'use strict';

(function () {
    app.settings = {
        appId: 'o4mw1ldrudo8maro',
        scheme: 'http',
        social: {
            facebook: {
                //check out .debug.abproject and .release.abproject
            },
            twitter: {
                accessToken: '3004026989-UzHGFbbxH9sDKEVPNUlBKtKoRqZ7q9Q3OCmRnLB', //Put your Twitter access token here
                accessTokenSecret: 'rLyPa4XRvQEkvfLjGPCBitqRsqqCJCkGDZRo2eu6A6wh1' //Put your Twitter token secret here
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
