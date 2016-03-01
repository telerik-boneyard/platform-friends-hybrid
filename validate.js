(function () {
    app.validate = {
        getValidator: function (selector, params) {
            return $(selector).kendoValidator(_.merge({
                validateOnBlur: true,
                rules: {
                    validateBirthDateRule: function (input) {
                        if (input.is('input[type=date]')) {
                            var selectedDate = new Date(input.val());
                            var today = new Date();

                            var selectedDateAfterToday = selectedDate > today;
                            return !selectedDateAfterToday;
                        }

                        return true;
                    }
                },
                messages: {
                    validateBirthDateRule: 'Please set a birth date in the past.',
                    required: 'This field is required.'
                }
            }, params)).data('kendoValidator');
        }
    }
}());