# Telerik Friends Sample App for PhoneGap/Cordova

* [Overview](#overview)
* [Requirements](#requirements)
* [Configuration](#configuration)
* [Running the Sample](#running-the-sample)

## Overview
This repository contains the [Telerik Friends sample app](http://docs.telerik.com/platform/backend-services/javascript/samples/friends/introduction) for PhoneGap/Cordova. It is a sample mobile app demonstrating how to integrate a large gamut of Telerik Platform services into a hybrid mobile application.

The Telerik Friends sample app showcases these features and SDKs:

- Cloud data access (Telerik Backend Services)
- Working with files (Telerik Backend Services)
- User registration and authentication (Telerik Backend Services)
- Authentication with external providers (Facebook, Google, etc.) (Telerik Backend Services)
- Basic app analytics (Telerik Analytics)
- Tracking custom events (Telerik Analytics)

To implement all the features listed above, the sample app utilizes the following Telerik products and SDKs:

- Telerik Backend Services JavaScript SDK - to connect the app to Telerik Backend Services
- Telerik Analytics Cordova plugin - to collect data needed for analyses

## Requirements

Before you begin, you need to ensure that you have the following:

- **Active Telerik Platform account**
Ensure that you can log in to a Telerik Platform account. This can be a free trial account. Depending on your license you may not be able to use all app features. For more information on what is included in the different editions, check out the pricing page. All features included in the sample app work during the free trial period.

- **Telerik AppBuilder** The sample app requires Telerik AppBuilder to run. This can be the in-browser Client, the Windows client or the Visual Studio extension.

## Configuration

The Friends sample app comes fully functional, but to see it in action you must link it to your own Telerik Platform account.

What you need to set:

### API Key for Telerik Backend Services

This is a unique string that links the sample mobile app to a project in Telerik Backend Services where all the data is read from/saved. When you activate Telerik Backend Services a Friends sample project is created for you automatically with the necessary data structure and sample data. You must use this project's API key. To set the API key:

1. Open the `/scripts/app/settings.js` file.
2. Replace `$EVERLIVE_API_KEY$` with the API Key of your Friends Backend Services project.

> If you happen to break the structure of the automatically generated Friends sample project, you can delete it and a fresh instance will be created again for you automatically. Alternatively, you could create a new project and choose to start from a Friends template, instead of starting from a blank project.

### (Optional) Project Key for Telerik Analytics

This is a unique string that links the sample mobile app to a Telerik Analytics project in your account. If you do not set this the sample will still work, but no analytics data will be collected.
	
1. Open the `/scripts/app/settings.js` file.
2. Replace `$EQATEC_PROJECT_KEY$` with the Project Key of your Friends  Analytics project.

### (Optional) Facebook app ID
To demonstrate social login, we've pre-initialized the sample to use a purpose-built Facebook app by Telerik. If you want to, you can set it to use your own Facebook application by adjusting the Facebook app ID.
	
1. Open the `/scripts/app/settings.js` file.
2. Find the `appId: '1408629486049918'` line.
3. Replace the number with your Facebook app ID.

### (Optional) Google

To demonstrate social login, we've pre-initialized the sample to use a Google Client ID owned by Telerik. If you want to, you can set it to use your own Google Client ID.

1. Open the `/scripts/app/settings.js` file.
2. Find the `clientId: '406987471724-q1sorfhhcbulk6r5r317l482u9f62ti8.apps.googleusercontent.com'` line.
3. Replace the number with your Google Client ID.
	
### (Optional) Windows Live

To demonstrate social login, we've pre-initialized the sample to use a  Microsoft Account Client ID owned by Telerik. If you want to, you can set it to use your own  Microsoft Account Client ID.

1. Open the `/scripts/app/settings.js` file.
2. Find the `clientId: '000000004C10D1AF'` line.
3. Replace the number with your  Microsoft Account Client ID.
	
### (Optional) Active Directory Federation Services (ADFS)

The sample app allows users to register using ADFS. To try this integration,  replace the default setting in `/scripts/app/settings.js`:

```
adfsRealm: '$ADFS_REALM$'
adfsEndpoint: '$ADFS_ENDPOINT$'
```
Note that ADFS authentication can only be accomplished over HTTPS.

### HTTPS Connections

By default the Friends Sample is configured to use HTTP. If you want to switch to HTTPS, update the `appSettings.everlive.scheme` setting in  `/scripts/app/settings.js` to `https`.

## Running the Sample

Once the app is configured, you can run it either on a real device or in the Telerik AppBuilder simulator.

> Make sure that the emulator or the device that you are using has Internet connectivity when running the sample.
