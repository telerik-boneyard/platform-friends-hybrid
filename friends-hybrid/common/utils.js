(function () {
    app.utils = app.utils || {};

    app.utils.loading = function (load) {
        if (load) {
            return kendo.mobile.application.showLoading();
        }

        return kendo.mobile.application.hideLoading();
    };

    app.utils.isOwner = function (dataItem) {
        return app.user.Id === dataItem.CreatedBy;
    };

    app.utils.isInSimulator = function () {
        return !!window.navigator.simulator;
    };

    app.utils.imageUploader = function (chooseFileSelector, formSelector, fileInputSelector) {
        var that = this;

        var fileInputChangeSelector = fileInputSelector + ':file';
        var provider = app.data.defaultProvider;

        that.callback = function(){};
        that.uri = '';
        that.file = null;

        this._chooseFileClickCordova = function () {
            var destinationType;
            var callback = that.callback;
            if (app.utils.isInSimulator()) {
                destinationType = Camera.DestinationType.DATA_URL;
                callback = function (uri) {
                    if (uri.length > app.constants.simulatorFileSizeLimit) {
                        return app.notify.info('Please select smaller image, up to 2.5MB.');
                    }

                    uri = 'data:image/jpeg;base64,' + uri;
                    that.callback(uri);
                };
            } else {
                destinationType = Camera.DestinationType.FILE_URI;
                callback = function (uri) {
                    window.resolveLocalFileSystemURL(uri, function (fileEntry) {
                        fileEntry.file(function (file) {
                            if (file.size > app.constants.deviceFileSizeLimit) {
                                return app.notify.info('The upload file limit is 10mb, try taking a picture with the front camera.');
                            }

                            return that.callback(uri);
                        }, app.notify.error);
                    }, app.notify.error);
                }
            }

            navigator.camera.getPicture(callback, app.notify.error, {
                quality: 50,
                destinationType: destinationType,
                sourceType: navigator.camera.PictureSourceType.CAMERA
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
                return Everlive._utils.successfulPromise();
            }

            var filename = app.user.Id + '_' + new Date().valueOf();
            if (window.cordova && !app.utils.isInSimulator()) {
                uploadImagePromise = provider.files.upload(picture, {
                    fileName: filename,
                    mimeType: 'image/jpeg'
                });
            } else {
                var file = that.file || {
                        type: 'image/jpeg'
                    };

                var cleanBase64 = picture.split(',')[1];
                uploadImagePromise = provider.files.applyOffline(false).create({
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
                })
                .catch(app.notify.error);
        };

        $(formSelector).submit(that._formSubmit);
        if (window.cordova) {
            $(chooseFileSelector).click(that._chooseFileClickCordova);
        } else {
            $(chooseFileSelector).click(that._chooseFileClickDesktop);
            $(document).on('change', fileInputChangeSelector, that._fileChange);
        }
    };

    app.utils.autoSizeTextarea = function (element) {
        element.css({
            height: element[0].scrollHeight
        });
    };

    var processedElements = [];
    app.utils.processElement = function (el) {
        setTimeout(function () {
            el.each(function (index, image) {
                if (!image.dataset.src && image.src) {
                    return app.data.defaultProvider.helpers.html.process(image).catch(app.notify.error);
                }

                //when the image is local, e.g. the default image we do not need to optimize it
                if (image.dataset.src.indexOf('default.jpg') === -1) {
                    app.data.defaultProvider.helpers.html.process(image).catch(app.notify.error);
                    if (processedElements.indexOf(image) === -1) {
                        processedElements.push(image);
                    }
                } else {
                    image.src = image.dataset.src;
                }
            });
        }); //wait for the listview element to be rendered
    };

    $(window).resize(function () {
        processedElements.forEach(function (el) {
            app.utils.processElement($(el));
        });
    });

    app.utils.processImage = function (id) {
        setTimeout(function () {
            var img = $('img[data-id="' + id + '"]');
            if (!img || !img.length) {
                return console.warn('No image to optimize with id found: ', id);
            }

            app.utils.processElement(img);
        });
    }
}());