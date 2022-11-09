import Config from './config.js';
import DB from './db.js';
import Framework7 from 'framework7/framework7.esm.bundle.js';

const self = {
	Cache: {},

	dbg: function(a,b,c) {
		if(process.env.NODE_ENV === 'production') return;
		console.log(a);
	  if(b) {
	    if( typeof b != "string" ) {
	      b = JSON.stringify(b);
	    }
	    console.log(b);
	  }
	  if(c) {
	    if( typeof b != "string" ) {
	      c = JSON.stringify(b);
	    }
	    console.log(c);
	  }
	},

	can: function(role) {
		var userData = DB.get("user");
		const user = JSON.parse(userData);
		
		if(user.roles.indexOf(role) !== -1) { return true; }

		return false;
	},

	/*translate: function(txt, toLang = 'ur') {
		// const fs = require('fs');
		const apiKey = 'AXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXY';
		const options = {
			concurrentLimit: 2,
			requestOptions: {
				proxy: 'http://123.123.123.123:8080',
				ca: fs.readFileSync('/usr/share/ca-certificates/company/company.crt'),
			},
		};
		const googleTranslate = require('google-translate')(apiKey, options);
		googleTranslate.translate(txt, toLang, function(err, translation) {
			console.log(err);
			console.log(translation.translatedText);
		});
	},*/

	handlePushNotificationReceived: function(jsonData) {
		self.dbg('notification received: ' + JSON.stringify(jsonData));

		if(!app.data.ready) { return; }

		var notification = jsonData.notification || {};
		var data = notification.payload.additionalData || {};
		var type = data.type ? data.type.toLowerCase() : '';
	
		// directory can be refreshed by people manually when needed
		let view = 0;
		if(type == 'complaint') view = 1;
		else if(type == 'expense') view = 3;
		app.views[view].router.refreshPage();
	},

	handlePushNotificationOpened: function(jsonData) {
		self.dbg('notification opened: ' + JSON.stringify(jsonData));

		const notification = jsonData.notification || {};
		const data = notification.payload.additionalData || {};
		const type = data.type ? data.type.toLowerCase() : '';
		const id = data.id || '';

		let notificationPageToOpen = '/notices/';

		let view = 0; // notices
		if(type == 'complaint' || type == 'resolution') {
			view = 1;
			notificationPageToOpen = '/complaint/' + id;
		} else if(type == 'vote') {
			notificationPageToOpen = '/vote/' + id;
		}

		if(app.data.ready) {
			app.views[view].router.navigate(notificationPageToOpen, {});
		} else {
			app.methods.handleLinks = function() {
				Util.dbg('handling deep link');
				setTimeout(function() {
					app.views[view].router.navigate(notificationPageToOpen, {});
				}, 300);
			};
		}
	},

	initPushNotifications: function() {
		if(!Config.oneSignalID || !window.plugins || !window.plugins.OneSignal) {
			self.dbg("Not initizalizing onesignal due to missing plugin or onesignal id")
			return false;
		}

		//START ONESIGNAL CODE
		const logLevel = process.env.NODE_ENV == 'development' ? 6 : 2;
		window.plugins.OneSignal.setLogLevel({logLevel: logLevel, visualLevel: 0});

		// Set your iOS Settings
		var iosSettings = {};
		iosSettings["kOSSettingsKeyAutoPrompt"] = true;
		iosSettings["kOSSettingsKeyInAppLaunchURL"] = false;

		window.plugins.OneSignal
			.startInit(Config.oneSignalID)
			.handleNotificationReceived(self.handlePushNotificationReceived)
			.handleNotificationOpened(self.handlePushNotificationOpened)
			.iOSSettings(iosSettings)
			.inFocusDisplaying(window.plugins.OneSignal.OSInFocusDisplayOption.Notification)
			.endInit();

		self.dbg('OneSignal init called');

		if(Framework7.device.ios) {
			window.plugins.OneSignal.promptForPushNotificationsWithUserResponse(function(accepted) {
				self.dbg("User accepted notifications: " + accepted);
			});
		}
		//END ONESIGNAL CODE
	},

	getMimeType: function(name) {
		var exts = name.split('.');
		var ext = exts[exts.length-1];
		self.dbg("getMimeType [" + name + "]: [" + ext + "]");
		switch (ext) {
			case 'aac': return 'audio/aac';
			case 'abw': return 'application/x-abiword';
			case 'arc': return 'application/octet-stream';
			case 'avi': return 'video/x-msvideo';
			case 'azw': return 'application/vnd.amazon.ebook';
			case 'bin': return 'application/octet-stream';
			case 'bz': return 'application/x-bzip';
			case 'bz2': return 'application/x-bzip2';
			case 'csh': return 'application/x-csh';
			case 'css': return 'text/css';
			case 'csv': return 'text/csv';
			case 'doc': return 'application/msword';
			case 'epub': return 'application/epub+zip';
			case 'gif': return 'image/gif';
			case 'htm': return 'text/html';
			case 'html': return 'text/html';
			case 'ico': return 'image/x-icon';
			case 'ics': return 'text/calendar';
			case 'jar': return 'application/java-archive';
			case 'jpeg': return 'image/jpeg';
			case 'jpg': return 'image/jpeg';
			case 'js': return 'application/javascript';
			case 'json': return 'application/json';
			case 'midi': return 'audio/midi';
			case 'mpeg': return 'video/mpeg';
			case 'mpkg': return 'application/vnd.apple.installer+xml';
			case 'odp': return 'application/vnd.oasis.opendocument.presentation';
			case 'ods': return 'application/vnd.oasis.opendocument.spreadsheet';
			case 'odt': return 'application/vnd.oasis.opendocument.text';
			case 'oga': return 'audio/ogg';
			case 'ogv': return 'video/ogg';
			case 'ogx': return 'application/ogg';
			case 'pdf': return 'application/pdf';
			case 'png': return 'image/png';
			case 'ppt': return 'application/vnd.ms-powerpoint';
			case 'rar': return 'application/x-rar-compressed';
			case 'rtf': return 'application/rtf';
			case 'sh': return 'application/x-sh';
			case 'svg': return 'image/svg+xml';
			case 'txt': return 'text/plain';
			case 'tar': return 'application/x-tar';
			case 'tif': return 'image/tiff';
			case 'tiff': return 'image/tiff';
			case 'ttf': return 'font/ttf';
			case 'vsd': return 'application/vnd.visio';
			case 'wav': return 'audio/x-wav';
			case 'weba': return 'audio/webm';
			case 'webm': return 'video/webm';
			case 'webp': return 'image/webp';
			case 'woff': return 'font/woff';
			case 'woff2': return 'font/woff2';
			case 'xhtml': return 'application/xhtml+xml';
			case 'xls': return 'application/vnd.ms-excel';
			case 'xml': return 'application/xml';
			case 'xul': return 'application/vnd.mozilla.xul+xml';
			case 'zip': return 'application/zip';
			case '3gp': return 'video/3gpp';
			case '3g2': return 'video/3gpp2';
			case '7z': return 'application/x-7z-compressed';
			default:
				return name;
		}
	},
	
	fileNameFromPath: function(path) {
		var slash = path.lastIndexOf('/');
		if(!slash || slash < 0) {
			slash = path.lastIndexOf('\\');
		}
		return path.substr(slash+1);
	}


};

export default self;
