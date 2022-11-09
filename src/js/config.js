export default {
	apiTimeout: 30 * 1000,
	version: process.env.APP_RELEASE_VERSION,
	api: process.env.API_URL,
	tokenExpiryTime: 48, /* in hours */
	oneSignalID: process.env.ONESIGNAL_ID
};
