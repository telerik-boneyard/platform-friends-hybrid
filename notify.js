(function () {
    app.notify = {
        error: function (error) {
            console.error(error);
            console.trace();
            alert(error);
        },
        info: function (text) {
            alert(text);
        },
        confirmation: function (text) {
            return confirm(text || 'Are you sure?');
        }
    };
}());