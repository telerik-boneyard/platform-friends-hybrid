spec(function() {
	/**
	 * Test Configuration
	 */
	var configuration = {
		// NOTE: Update this to an existing Telerik Backend Services username and password
		USERNAME: 'seth',
		PASSWORD: '333333',

		// NOTE: Update this to the iOS URL of the Friends App
		IOS_URL: 'friends://',

		// NOTE: Update this to the Android package name of the Friends App
		ANDROID_PACKAGE: 'com.telerik.friends',

		// NOTE: Update this to the wp8 URI of the Friends App
		WP8_URI: 'friends'
	};

	/**
	 * Queries
	 * These are reusable queries for elements in the user interface.
	 */
	var queries = {
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
			postButton: [{ id: 'share' }, { className: 'km-rightitem' }, { className: 'nav-button km-widget km-button' }]
		}
	};

	/**
	 * Step Repository
	 * These are reusable steps that perform actions in the application under test.
	 */
	var stepRepository = {
		'Given Friends is running': {
			'ios': [
				ios.launch(configuration.IOS_URL),
			],
			'android': [	
				android.launch(configuration.ANDROID_PACKAGE),
				android.wait(4000)
			],
			'wp8': [
				wp8.launch(configuration.WP8_URI)
			]
		},
		'And is logged in': {
			'default': [
				web.setValue(queries.login.usernameField, configuration.USERNAME),
				web.setValue(queries.login.passwordField, configuration.PASSWORD),
				web.tap(queries.login.loginButton),
				web.wait(2000),
			
			]
		},
		'When add is tapped': {
			'default': [
				web.tap(queries.activities.addButton),
			]
		},

		'And something on my mind is input': {
			'default': [
				web.setValue(queries.activity.textArea, "Hello World."),
				web.wait(2000)
			]
		},

		'And post is tapped': {
			'default': [
				web.tap(queries.activity.postButton),
				web.wait(3000)
			]
		},

		'And logout is tapped': {
			'default': [
				web.tap(queries.activities.logoutButton),
				web.wait(2000)
			]
		},
		'Then the Activities screen should be displayed' : {
			'default': [
				web.getHtml({ className: 'km-view-title'}, function(result) {
					assert(result.trim()).equals('Friends');
				}),
				web.wait(1000)
			]
		},
		'Then the activity should be posted': {
			'default': [
				web.getHtml({ className: 'user-share-txt' }, function(result) {
					assert(result.trim()).equals('Hello World.');
				}),
				web.wait(1000)
			]
		},
		'Then the login screen should be displayed': {
			'default': [
				web.getHtml(queries.login.loginButtonText, function(result) {
					assert(result.trim()).equals('Login');
				})
			]
		}
	};

	/**
	 * Tests
	 * These are the tests that will be performed against the application.
	 */
	describe("Verify activities user interface works as expected", function() {
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
