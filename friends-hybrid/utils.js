(function () {
    app.utils = app.utils || {};

    app.utils.loading = function (load) {
        if (load) {
            return kendo.mobile.application.showLoading();
        }

        return kendo.mobile.application.hideLoading();
    };

    app.utils.goBack = function () {
        app.mobileApp.navigate('#:back');
        app.utils.loading(false);
    };

    app.utils.isOwner = function (dataItem) {
        return app.user.Id === dataItem.CreatedBy;
    };

    app.utils.isInSimulator = function () {
        return location.href.indexOf('local://simulator') !== -1 || location.href.indexOf('icenium') !== -1;
    };

    app.utils.imageUploader = function (chooseFileSelector, formSelector, fileInputSelector) {
        var that = this;

        var fileInputChangeSelector = fileInputSelector + ':file';
        var provider = app.data.defaultProvider;

        that.callback = function(){};
        that.uri = '';
        that.file = null;

        this._chooseFileClickCordova = function () {
            if (app.utils.isInSimulator()) {
                return app.notify.info('Activity photos can only be uploaded from a device or a browser supporting FileReader');
            }

            navigator.camera.getPicture(that.callback, app.notify.error, {
                quality: 50,
                destinationType: navigator.camera.DestinationType.FILE_URI,
                sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY
            });
        };

        this._chooseFileClickDesktop = function () {
            if (app.utils.isInSimulator()) {
                return app.notify.info('Activity photos can only be uploaded from a device or a browser supporting FileReader');
            }

            $(fileInputSelector).click();
        };

        this._formSubmit = function () {
            return false;
        };

        this._fileChange = function () {
            var files = $(fileInputSelector)[0].files;
            if (!files.length) {
                return;
            }

            var file = files[0];
            var reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function (e) {
                var base64 = e.target.result;
                if (base64) {
                    that.callback(base64, file);
                }
            };
        };

        this.detach = function () {
            $(formSelector).off('submit', that._formSubmit);

            if (window.cordova) {
                $(chooseFileSelector).off('click', that._chooseFileClickCordova);
            } else {
                $(chooseFileSelector).off('click', that._chooseFileClickDesktop);
                $(fileInputChangeSelector).off('change', that._fileChange);
            }
        };

        this.onImage = function (cb) {
            that.callback = function (uri, file) {
                that.uri = uri;
                that.file = file;
                return cb(uri, file);
            };
        };

        this.upload = function () {
            var picture = that.uri;
            var uploadImagePromise;

            if (!picture) {
                return Everlive._utils.rejectedPromise();
            }

            var filename = app.user.Id + '_' + new Date().valueOf();
            if (window.cordova) {
                uploadImagePromise = provider.files.upload(picture, {
                    fileName: filename,
                    mimeType: 'image/png'
                });
            } else {
                var file = that.file;
                var cleanBase64 = picture.split(',')[1];
                uploadImagePromise = provider.files.create({
                    Filename: filename,
                    ContentType: file.type,
                    base64: cleanBase64
                });
            }

            return uploadImagePromise.then(function (res) {
                var id;
                if (res.response) {
                    var responseObject = JSON.parse(res.response);
                    id = responseObject.Result[0].Id
                } else {
                    id = res.result.Id;
                }

                return id;
            });
        };

        $(formSelector).submit(that._formSubmit);
        if (window.cordova) {
            $(chooseFileSelector).click(that._chooseFileClickCordova);
        } else {
            $(chooseFileSelector).click(that._chooseFileClickDesktop);
            $(fileInputChangeSelector).change(that._fileChange);
        }
    };

    app.utils.autoSizeTextarea = function (element) {
        element.css({
            'height': 'auto',
            'height': element[0].scrollHeight
        });
    };
}());
