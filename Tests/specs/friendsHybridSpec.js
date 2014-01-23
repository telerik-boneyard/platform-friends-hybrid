spec(function() {
	var queries = {
		ios: {
			login: {
				usernameField: { id: 'loginUsername' },
				passwordField: { id: 'loginPassword' },
				loginButton: { id: 'login' },
				loginButtonText: [{ id: 'login' }, { className: 'km-text' }]
			},
			activities: {
				addButton: [{ className: 'km-rightitem' }, { className: 'nav-button' }],
				logoutButton: [{ id: 'view-all-activities'}, { className: 'km-leftitem' }, { className: 'nav-button' }]
			},
			activity: {
				textArea: { id: 'newStatus' },
				postButton: [{ id: 'share' }, { className: 'km-rightitem' }, { className: 'nav-button-post' }]
			}
		}
	};

	var stepRepository = {
		'Given Friends is running': {
			'ios': [
				ios.launch('tsfriendsHybrid://'),
			],
			'android': [
				android.launch('com.telerik.friend'),
				android.wait(4000)
			]
		},
		'And is logged in': {
			'ios': [
				// NOTE: Update the following two lines to use an existing Telerik Backend Services account and password
				web.setValue(queries.ios.login.usernameField, "USERNAME"),
				web.setValue(queries.ios.login.passwordField, "PASSWORD"),
				web.executeScript('$(targetElement).data("kendoTouch").trigger("tap");', queries.ios.login.loginButton),
				web.wait(2000),
			
			],
			'android': [
				// NOTE: Update the following two lines to use an existing Telerik Backend Services account and password
				web.setValue(queries.ios.login.usernameField, "USERNAME"),
				web.setValue(queries.ios.login.passwordField, "PASSWORD"),
				web.executeScript('$(targetElement).data("kendoTouch").trigger("tap");', queries.ios.login.loginButton),
				web.wait(2000),
			
			]
		},
		'When add is tapped': {
			'ios': [
				web.executeScript('$(targetElement).trigger("touchstart").trigger("touchend");', queries.ios.activities.addButton),
			],
			'android': [
				web.executeScript('$(targetElement).trigger("touchstart").trigger("touchend");', queries.ios.activities.addButton),
			]
		},

		'And something on my mind is input': {
			'ios': [
				web.setValue(queries.ios.activity.textArea, "Hello World."),
				web.wait(2000)
			],
			'android': [
				web.setValue(queries.ios.activity.textArea, "Hello World."),
				web.wait(2000)
			]
		},

		'And post is tapped': {
			'ios': [
				web.executeScript('$(targetElement).data("kendoMobileButton").trigger("click");', queries.ios.activity.postButton),
				web.wait(3000)
			],
			'android': [
				web.executeScript('$(targetElement).data("kendoMobileButton").trigger("click");', queries.ios.activity.postButton),
				web.wait(3000)
			]
		},

		'And logout is tapped': {
			'ios': [
				web.executeScript('$(targetElement).trigger("touchstart").trigger("touchend");', queries.ios.activities.logoutButton),
				web.wait(2000)
			],
			'android': [
				web.executeScript('$(targetElement).trigger("touchstart").trigger("touchend");', queries.ios.activities.logoutButton),
				web.wait(2000)
			]
		},
		'Then the Activities screen should be displayed' : {
			'ios': [
				web.getHtml({ className: 'km-view-title'}, function(result) {
					assert(result.trim()).equals('Activities');
				}),
				web.wait(1000)
			],
			'android': [
				web.getHtml({ className: 'km-view-title'}, function(result) {
					assert(result.trim()).equals('Activities');
				}),
				web.wait(1000)
			]
		},
		'Then the activity should be posted': {
			'ios': [
				web.getHtml({ className: 'user-share-txt' }, function(result) {
					assert(result.trim()).equals('Hello World.');
				}),
				web.wait(1000)
			],
			'android': [
				web.getHtml({ className: 'user-share-txt' }, function(result) {
					assert(result.trim()).equals('Hello World.');
				}),
				web.wait(1000)
			]
		},
		'Then the login screen should be displayed': {
			'ios': [
				web.getHtml(queries.ios.login.loginButtonText, function(result) {
					assert(result.trim()).equals('Login');
				})
			],
			'android': [
				web.getHtml(queries.ios.login.loginButtonText, function(result) {
					assert(result.trim()).equals('Login');
				})
			]
		}
	};

	describe("Hybrid: Verify button automation functions correctly", function() {
		test("Activities screen should display on login", function() {
			step('Given Friends is running');
			step('And is logged in');
			step('Then the Activities screen should be displayed');
		});

		test("Activities should be posted", function() {
			step('Given Friends is running');
			step('And is logged in');
			step('When add is tapped');
			step('And something on my mind is input');
			step('And post is tapped');
			step('Then the activity should be posted');
		});

		test("Logout returns to login screen", function() {
			step("Given Friends is running");
			step('And is logged in');
			step('And logout is tapped');
			step('Then the login screen should be displayed');
		});
	}, stepRepository);

});

