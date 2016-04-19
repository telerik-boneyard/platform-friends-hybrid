(function () {
    $.noty.defaults = _.extend({}, $.noty.defaults, {
        layout: 'top',
        type: 'alert',
        timeout: 2000
    });

    app.notify = {
        error: function (error) {
            app.utils.loading(false);
            console.error(error);
            console.trace();
            var message = error.message || JSON.stringify(error);
            noty({text: message, type: 'error', layout: 'top'})
        },
        info: function (text) {
            noty({text: text});
        },
        success: function (text) {
            noty({text: text, type: 'success', layout: 'top'})
        },
        confirmation: function (text, title, callback) {
            text = text || 'Are you sure?';

            if (navigator && navigator.notification && navigator.notification.confirm) {
                navigator.notification.confirm(text, function(res) {
                    return callback(res === 1);
                }, title);
            } else {
                var confirmed = confirm(text);
                callback(confirmed);
            }
        }
    };
}());
