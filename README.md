
# Telerik Friends Sample App for PhoneGap/Cordova

<a href="https://platform.telerik.com/#appbuilder/clone/https://github.com/telerik/platform-friends-hybrid" target="_blank"><img src="http://docs.telerik.com/platform/samples/images/try-in-appbuilder.png" alt="Try in AppBuilder" title="Try in Telerik Platform" /></a>

<a id="top"></a>
* [Overview](#overview)
* [Screenshots](#screenshots)
* [Requirements](#requirements)
* [Configuration](#configuration)
* [Running the Sample](#running-the-sample)

# Overview

This repository contains the Telerik Friends app for PhoneGap/Cordova. It is a sample mobile app demonstrating how to integrate a wide range of Telerik Platform services into a hybrid mobile application.

The Telerik Friends sample app showcases these features and SDKs:

- [Cloud data](http://docs.telerik.com/platform/backend-services/javascript/data/introduction) access (Telerik Backend Services)
- Working with [files](http://docs.telerik.com/platform/backend-services/javascript/files/introduction) (Telerik Backend Services)
- User [registration](http://docs.telerik.com/platform/backend-services/javascript/users/users-register) and [authentication](http://docs.telerik.com/platform/backend-services/javascript/users/users-authenticate) (Telerik Backend Services)
- Authentication with [social login](http://docs.telerik.com/platform/backend-services/javascript/users/social-login/introduction) providers (Facebook) (Telerik Backend Services)
- Authentication with [AD FS](http://docs.telerik.com/platform/backend-services/javascript/users/adfs-login/introduction) (Telerik Backend Services)
- Using [data relations](http://docs.telerik.com/platform/backend-services/javascript/data/relations/introduction)
- Using [data aggregation and grouping](http://docs.telerik.com/platform/backend-services/javascript/queries/queries-aggregate)
- Using [Responsive Images](http://docs.telerik.com/platform/backend-services/javascript/responsive-images/introduction)
- Using custom user account fields (Telerik Backend Services)
- Basic [app analytics](http://docs.telerik.com/platform/analytics/getting-started/introduction) (Telerik Analytics)
- Tracking [feature use](http://docs.telerik.com/platform/analytics/client/reports/feature-use) (Telerik Analytics)
- Collecting feedback about the application using [Feedback](http://docs.telerik.com/platform/appfeedback/)

To implement all the features listed above, the sample app utilizes the following Telerik products and SDKs:

- [Telerik Backend Services JavaScript SDK](http://docs.telerik.com/platform/backend-services/javascript/getting-started-javascript-sdk)&mdash;to connect the app to Telerik Platform
- [Telerik Analytics JavaScript SDK](http://docs.telerik.com/platform/analytics/sdk/js/)&mdash;to connect the app to Telerik Platform
- [Telerik Analytics Cordova plugin](http://plugins.telerik.com/cordova/plugin/telerik-analytics)&mdash;to collect data needed for analyses
- [Telerik AppFeedback Cordova plugin](http://plugins.telerik.com/cordova/plugin/telerik-appfeedback)&mdash;to allow users to send feedback to the backend
- [Telerik KendoUI Mobile](http://www.telerik.com/kendo-ui)&mdash;provides the UI components used throughout the app

# Screenshots

Login Screen|Activity Stream|Activity Details
---|---|---
![Login Screen](https://raw.githubusercontent.com/telerik/platform-friends-hybrid/master/screenshots/ios-login-screen.png)|![Activities stream view](https://raw.githubusercontent.com/telerik/platform-friends-hybrid/master/screenshots/ios-activities-stream.png)|![Activity details view](https://raw.githubusercontent.com/telerik/platform-friends-hybrid/master/screenshots/ios-activitiy-details.png)

# Requirements

Before you begin, you need to ensure that you have the following:

- **An active Telerik Platform account**
Ensure that you can log in to a Telerik Platform account. This can be a free trial account. Depending on your license you may not be able to use all app features. For more information on what is included in the different editions, check out the pricing page. All features included in the sample app work during the free trial period.
- **Telerik AppBuilder** The sample app requires Telerik AppBuilder to run. This can be the in-browser client, the desktop client, or the extension for Visual Studio.

# Configuration

To set up Friends in your Telerik Platform account, click the **Run in Telerik Platform** button.

This creates a new Telerik Platform app for you and clones the repository in AppBuilder. All required content types with data, users, and files are also automatically created.

You can view the app's source code on the **Code** tab.

> If you happen to break the structure of the automatically generated Friends data, you can delete the app and start over.

## (Optional) Enable Telerik Analytics

If you want to collect analytics data from your Friends sample app, you need to enable the Analytics service.

1. In the Telerik Platform portal, go to your app.
2. Click the **Analytics** tab and then click **Enable**.
3. In the **Configure tracking settings** dialog box that appears, select these check-boxes before clicking **Done**:
	* **Automatic exceptions tracking**
	* **Automatic app feature tracking**

> * Analytics only works on physical devices or emulators. It does not work in the AppBuilder simulator.
> * If you are working in the Universal, Windows, or Visual Studio AppBuilder client, you need to restart it for the setting to be reflected.

## (Optional) Facebook App ID

To demonstrate social login, we have preinitialized the sample to use a purpose-built Facebook app by Telerik. However, you still need to enable Facebook integration in the Telerik Platform portal:

1. In the Telerik Platform portal, go to your app.
3. Navigate to **Users > Authentication**.
4. Ensure that the **Facebook** box is checked.

> Note that if you intend to use the sample app code for a production app you need to set up your own Facebook application and adjust the Facebook app ID as follows:

1. In the Telerik Platform portal, go to your app.
2. Click the **Code** tab.
3. In the **Project Navigator**, double-click **Plugins**.
5. Under **Other Plugins**, find the **Facebook** plugin.
7. Click the expand arrow in front of the plugin and then click **Configuration Variables**.
9. In the **APP_ID** text box, enter your Facebook app ID.
10. In the **APP_NAME** text box, enter you Facebook app name.
10. Click **Done**.

> * Facebook integration only works on physical devices or emulators. It does not work in the AppBuilder simulator.
> * The Facebook Cordova plugin is not supported on Windows Phone.

## (Optional) Active Directory Federation Services (AD FS)

The sample app allows users to [register using AD FS](http://docs.telerik.com/platform/backend-services/javascript/users/adfs-login/introduction). To try this integration, configure the following:

1. Replace the default setting in `friends-hybrid/common/settings.js`:

	```
	endpoint: '$ADFS_ENDPOINT$',
	realm: '$ADFS_REALM$'
	```
2. In the Telerik Platform portal, go to your app.
5. Navigate to **Users > Authentication**.
6. Ensure that the **Active Directory** box is checked.
7. Fill in **ADFS metadata URL** with your AD FS server's metadata URL.

> AD FS authentication can only be accomplished over HTTPS.

## (Optional) Enable Telerik Feedback

If you want to solicit app feedback from your users, you need to enable the Feedback service.

1. In the Telerik Platform portal, go to your app.
2. Click the **Feedback** tab and then click **Enable**.
3. Click the **Code** tab.
3. In the **Project Navigator**, double-click **Plugins**.
5. Under **Other Plugins**, find the **Telerik AppFeedback** plugin.
7. Click the expand arrow in front of the plugin and then click **Configuration Variables**.
9. In the **API_KEY** text box, enter the App ID of your Telerik Platform app.
10. Click **Done**.

> * Feedback only works on physical devices or emulators. It does not work in the AppBuilder simulator.
> * The Telerik AppFeedback plugin is not supported on Windows Phone.
> * If you are working in the Universal, Windows, or Visual Studio AppBuilder client, you need to restart it for the setting to be reflected.

## HTTPS Connections

By default the Friends Sample is configured to use HTTP. If you want to switch to HTTPS, update the `app.settings.scheme` setting in `friends-hybrid/common/settings.js` to `https`.

# Running the Sample

Once the app is configured, you can run it either on a real device or in the Telerik AppBuilder simulator.

To run it, follow the steps in the product's documentation: [Running Apps on Devices](http://docs.telerik.com/platform/appbuilder/testing-your-app/running-on-devices/working-with-devices).

> * Ensure that the emulator or the device that you are using has Internet connectivity when running the sample.
> * Image uploading only works on physical devices. It does not work in the AppBuilder simulator or in emulators.
