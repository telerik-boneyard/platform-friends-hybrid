(function () {
    app.notify = {
        error: function (error) {
            console.error(error);
            console.trace();
            alert(JSON.stringify(error));
        },
        info: function (text) {
            alert(text);
        },
        confirmation: function (text) {
            return confirm(text || 'Are you sure?');
        }
    };
}());