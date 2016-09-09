Everlive.CloudFunction.onRequest(function(request, response, done) {
    var activityId = request.queryString.activityId;
    if (!activityId) {
        response.statusCode = 500;
        response.result = 'Invalid activity id';
        return done();
    }

    var principal = request.principal;
    var principalId;
    if (principal && principal.type === 'user' && principal.data) {
        principalId = principal.data._id;
    }

    if (!principalId) {
        response.statusCode = 403;
        response.result = 'Invalid authentication';
        return done();
    }

    var sdk = Everlive.Sdk.withMasterKey();

    var activitiesData = sdk.data('Activities');

    activitiesData.getById(activityId).then(function (res) {
        var activity = res.result;
        var likes = activity.Likes || [];
        var index = likes.indexOf(principalId);
        var model = {
            Likes: principalId
        };

        var promise;

        if (index === -1) {
            promise = activitiesData.rawUpdate({
                '$push': model
            }, activityId);
        } else {
            promise = activitiesData.rawUpdate({
                '$pull': model
            }, activityId);
        }

        promise.then(done, done);
    });
});
