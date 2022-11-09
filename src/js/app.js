import $$ from 'dom7';
import Template7 from 'template7';
import Framework7 from 'framework7/framework7.esm.bundle.js';
import Config from '../js/config.js';
import DB from '../js/db.js';
import Cache from '../js/cache.js';
import LANG from '../js/lang.js';
import Api from '../js/api.js';
import Util from '../js/util.js';
import Alerts from '../js/alerts.js';
import Slides from '../js/intro.js';
// import WelcomeScreen from 'f7-welcomescreen';
import { parse, format, formatDistance } from 'date-fns';
// import { ur } from 'date-fns/locale';

// Import F7 Styles
import 'framework7/css/framework7.bundle.css';

// Import Icons and App Custom Styles
import '../css/icons.css';
import '../css/app.less';
import '../css/common.less';
import '../css/pages.less';
import '../css/language.less';

// Import Cordova APIs
import cordovaApp from './cordova-app.js';
// Import Routes
import routes from './routes.js';

// Framework7.use(WelcomeScreen);
var options = {
	'bgcolor': '#369FFD',
	'fontcolor': '#ffffff',
	'open': false
}


// Import main app component
import App from '../app.f7.html';

var app = new Framework7({
	root: '#app', // App root element
	component: App, // App main component
	id: process.env.APP_BUNDLE_ID, // App bundle ID
	name: 'Home Society', // App name
	theme: process.env.F7THEME || 'auto', // Automatic theme detection
	init: false,
	view: {
		stackPages: true
	},

	/*welcomescreen: {
	slides: Slides,
		options: options
	},*/

	dialog: {
		closeByBackdropClick: true
	},

	touch: {
		tapHold: true
	},

	// App routes
	routes: routes,

	// Input settings
	input: {
		scrollIntoViewOnFocus: Framework7.device.cordova && !Framework7.device.electron,
		scrollIntoViewCentered: Framework7.device.cordova && !Framework7.device.electron,
	},
	// Cordova Statusbar settings
	statusbar: {
		overlay: Framework7.device.cordova && Framework7.device.ios || 'auto',
		iosOverlaysWebView: true,
		androidOverlaysWebView: false,
	},
	on: {
		init: function () {
			var f7 = this;
			Util.dbg("App init", Config);
			// let cordova init first of all, so that its ready by the time we do other stuff
			if (f7.device.cordova) {
				Util.dbg("Device is cordova");
				// screen object is available only in realtime application
				if (window.screen && window.screen.orientation) {
					Util.dbg("Locking screen orientation");
					screen.orientation.lock('portrait');
				}
				cordovaApp.init(f7);
			}

			window.onerror = function () { };

			DB.init();
			Api.init(f7);

			setTimeout(function () {
				if (window.navigator.splashscreen) {
					Util.dbg("hiding splash screen");
					window.navigator.splashscreen.hide();
				}
			}, 0);

			setTimeout(f7.methods.startUp, 200);
		},
	},

	data: {
		navbar: null,
		ready: false,
		society: {}
	},

	methods: {
		handleLinks: function () { },
		// this method can be overridden by power admin app to do something else if needed
		startUp: function () {
			this.methods.checkAppLanguage();
			this.methods.checkIfLoggedIn();
		},
		go: function (page, param) {
			this.views.main.router.navigate(page, param);
		},
		goBack: function (reload) {
			this.views.current.router.back();
		},
		clearHistory: function () {
			this.views.main.history = ['/dashboard/'];
		},
		pageData: function (obj) {
			var lang = DB.get('lang');
			var coreData = {
				lang: lang,
				_l: LANG[lang] || LANG.en,
				_ll: window._ll,
				rtl: lang == 'ur' ? true : false,
				navbar_title: obj.navbar_title
			};
			return this.utils.extend(coreData, obj);
		},
		isLoggedIn: function () {
			var userData = DB.get("user");
			if (userData) {
				var res = JSON.parse(userData);
				if (res.house_number && res.name) {
					return true;
				}
			}

			return false;
		},
		checkIfLoggedIn: function () {
			Util.dbg("app.checkIfLoggedIn");
			const token = DB.get('token');
			const deviceid = window.device && device.uuid ? device.uuid : 'xxxxxxxxxxx';
			const userData = DB.get("user");
			if (token && userData) {
				const res = JSON.parse(userData);
				if (res.house_number && res.name) {
					Util.dbg("auto login successful, loading dashboard");
					app.methods.goToDashboard(true);
					app.data.ready = true;
					app.data.society.houses = Cache.get('houses', []);
					return true;
				}
			}
			Util.dbg("not logged in");
			app.methods.go("/", { clearPreviousHistory: true });
			$$("body").removeClass("splash");
			return false;
		},
		goToDashboard: function () {
			// initDashboard is specific to app functionality, overridden by power admin
			app.methods.initDashboard();

			$$('.panel .item-link').on('click', function (e) {
				app.tab.show("#view-home", ".tab-view-home");
				app.panel.close();
			});

			$$(".logout").on('click', function (e) {
				e.preventDefault();
				app.dialog.confirm(_ll('LogoutConfirmation'), app.dialog.title, function () {
					app.preloader.show();
					if (window.navigator.splashscreen) {
						window.navigator.splashscreen.show();
					}
					Cache.purge();
					DB.del("token");
					DB.del("tokenExpiry");
					DB.del("user");
					if (Config.oneSignalID && window.plugins && window.plugins.OneSignal) {
						try {
							window.plugins.OneSignal.removeExternalUserId();
						} catch (e) { }
						setTimeout(function () { window.location.reload(); }, 1200);
					} else {
						window.location.reload();
					}
				});
			});

			$$(".switch-language").on('click', function (e) {
				e.preventDefault();
				const language = $$(this).attr("data-language");
				app.methods.switchLanguage(language);
			});
		},
		initDashboard: function () {
			const userData = DB.get("user");
			const user = JSON.parse(userData);
			const sid = DB.get('sid', sid);

			$$("#panel-society-name").html(app.data.society.name);

			const panelTemplate = Template7.compile($$('script#panel-left-template').html());
			$$(".panel.panel-left").html(panelTemplate(app.methods.pageData({
				user: user,
				roles: user.roles,
				votingPoll: Util.can('poll'),
				workers: Util.can('workers'),
				manager: Util.can('manager')
			})));

			const toolbarTemplate = Template7.compile($$('script#toolbar-template').html());
			$$(".toolbar").html(toolbarTemplate(app.methods.pageData({})));
			$$(".toolbar").removeClass("hidden");
			app.toolbar.show(".toolbar");

			$$("body").removeClass("splash");

			app.methods.go("/notices/", { clearPreviousHistory: true });
			if (Config.oneSignalID && window.plugins && window.plugins.OneSignal) {
				window.plugins.OneSignal.setExternalUserId(user.pushid);
			}
			app.data.ready = true;
			app.views[1].router.navigate("/complaints/", { animate: false });
			app.views[2].router.navigate("/information/", { animate: false });
			app.views[3].router.navigate("/expenses/", { animate: false });

			Util.initPushNotifications();

			setTimeout(app.methods.handleLinks, 1000);

			app.data.society = Cache.get('society', {});
			// if we are online, get society and profile info,
			// otherwise queue it up for whenever internet connection restores
			if (Framework7.device.cordova) {
				document.addEventListener("deviceready", function () {
					if (navigator.connection && navigator.connection.type == Connection.NONE) {
						document.addEventListener("online", app.methods.onAppOnline, false);
					} else {
						setTimeout(app.methods.onAppOnline, 500);
					}
				}, false);
			} else {
				setTimeout(app.methods.onAppOnline, 500);
			}
		},
		checkAppLanguage: function () {
			var lang = DB.get('lang');
			var langSet = lang && lang.length > 0;
			if (lang == "ur") {
				$$("html").attr("dir", "rtl");
				$$("body").addClass("rtl");
				//$$("#css-english").attr("rel", "stylesheet/disable");
				//$$("#css-arabic").attr("rel", "stylesheet");
			} else if (window.navigator && navigator.language.slice(0, 2) == 'ur' && !langSet) {
				DB.set('lang', 'ur');
				$$("html").attr("dir", "rtl");
				$$("body").addClass("rtl");
			} else {
				$$("body").addClass("ltr");
				//$$("#css-arabic").attr("rel", "stylesheet/disable");
				//$$("#css-english").attr("rel", "stylesheet");
			}
		},
		downloadFile: function (url, name) {
			Util.dbg("app downloading file: " + url + ", " + name);
			Alerts.notify(_ll("Downloading"));
			app.preloader.show();
			var fileTransfer = new FileTransfer();
			var uri = encodeURI(url);
			var filePath = cordova.file.cacheDirectory + name;

			fileTransfer.download(
				uri,
				filePath,
				function (entry) {
					Util.dbg("download complete");
					app.preloader.hide();
					Alerts.success(_ll("DownloadComplete"));
					/*cordova.plugins.fileOpener2.open(filePath, getMimeType(name), {
						success: function() {
					Util.dbg('file opened successfully');
				},
				error: function () {
							Alerts.notify("File downloaded but failed to open");
				}
					});*/
				},
				function (error) {
					Util.dbg("download error code: " + error.code);
					Util.dbg("download error source: " + error.source);
					Util.dbg("download error target: " + error.target);
					app.preloader.hide();
					Alerts.error(_ll("DownloadFailed"));
				},
				false,
				{
					headers: {
						"Authorization": "Bearer " + DB.get("token")
					}
				}
			);
		},
		/* preloader is to be handled by callee */
		multipartRequest: function (url, file, params, onSuccess, onError) {
			//var popupUploadFileTemplate = Template7.compile($$('script#popup-uploadfile-template').html());
			//$$("#popup-uploadfile").html(popupUploadFileTemplate(app.methods.pageData({})));
			//app.popup.open("#popup-uploadfile");

			var headers = {
				"Authorization": "Bearer " + DB.get("token")
			};
			var options = new FileUploadOptions();
			options.fileKey = file.key || "name";
			options.fileName = file.name;
			options.mimeType = file.mimeType;
			options.headers = headers;
			options.params = params;
			options.chunked = false;

			Util.dbg("upload", params);
			Util.dbg("upload", options);
			var ft = new FileTransfer();
			ft.onprogress = function (progressEvent) {
				if (progressEvent.lengthComputable) {
					// Alerts.notify(Math.round((progressEvent.loaded / progressEvent.total) * 100) + "%");
					//app.progressbar.set("#upload-progressbar", percent);
					//$$("#upload-progress-text").html(percent + "%");
				}
			};
			ft.upload(file.uri,
				encodeURI(url),
				function () { app.popup.close(); onSuccess.call(this); },
				function () { app.popup.close(); onError.call(this, {}); },
				options
			);
		},
		SetNotificationBadge: function (txt) {
			var tab = $$('[href="#view-notifications"]');
			var badge = tab.find(".badge");
			if (!txt) {
				badge.hide();
			} else {
				badge.html(txt).show();
			}
		},
		switchLanguage: function (l) {
			DB.set('lang', l);
			window.location.reload();
		},
		onAppOnline: function () {
			// remove the online listener, only needed once after app is loaded
			document.removeEventListener("online", app.methods.onAppOnline);
			// @@TODO: instead of two apis, just call one and reload modified data
			const sid = DB.get('sid');
			Api.set_society(sid).then(function (res) {
				const data = JSON.parse(res.data);
				if (data && data.success) {
					Cache.set('society', data.data);
					app.data.society = data.data;
					$$("#panel-society-name").html(app.data.society.name);
					Api.get_profile().then(function (res) {
						DB.set("user", JSON.stringify(res.data.data.user));
					}).catch(function (error) { });
				}
			}).catch(function (error) {
				Alerts.error(error);
			});
		}
	},
});

window.app = app;

window._ll = function (t) {
	var l = DB.get('lang');
	if (!l || !l.length) l = 'en';
	// log unavailable constants to console in development mode
	if (LANG[l] && LANG[l][t]) {
	} else if (process.env.NODE_ENV == 'development') {
		Util.dbg(t + ': "' + t + '",');
	}
	var ret = LANG[l] && LANG[l][t] ? LANG[l][t] : t;
	return ret;
};

Template7.registerHelper('dateOnly', function (dt, options) {
	try {
		const date = parse(dt, options.hash.parseFormat || 'yyyy-MM-dd HH:mm:ss', new Date());
		return format(date, options.hash.format || 'yyyy-MM-dd');
	} catch (e) {
		return dt;
	}
});

Template7.registerHelper('formatDate', function (dt, options) {
	try {
		const date = parse(dt, options.hash.parseFormat || 'yyyy-MM-dd', new Date());
		return format(date, options.hash.format || 'MM/dd/yyyy');
	} catch (e) {
		return dt;
	}
});

Template7.registerHelper('timeOnly', function (dt, options) {
	try {
		const date = parse(dt, options.hash.parseFormat || 'yyyy-MM-dd HH:mm:ss', new Date());
		return format(date, options.hash.format || 'HH:mm:ss');
	} catch (e) {
		return dt;
	}
});

Template7.registerHelper('timeAgo', function (dt, options) {
	try {
		const utc = new Date();
		utc.setMinutes(utc.getMinutes() + utc.getTimezoneOffset());
		const date = parse(dt, 'yyyy-MM-dd HH:mm:ss', utc);
		const options = {}; // DB.get('lang') == 'ur' ? { locale: ur } : {};
		return (`${formatDistance(date, utc, options)} ago`).replace('about ', '');

		//const date = parse(dt, 'yyyy-MM-dd HH:mm:ss', new Date());
		//return `${formatDistance(date, new Date(), {})} ago`;
	} catch (e) {
		return dt;
	}
});

Template7.registerHelper('nl2br', function (txt, options) {
	var str = txt ? txt.replace(/(?:\r\n|\r|\n)/g, '<br />') : '';
	return str;
});

Template7.registerHelper('trim', function (txt, options) {
	var str = txt ? txt.trim() : '';
	// var str = txt ? txt.replace(/\s/g, '') : '';
	return str;
});

Template7.registerHelper('space2br', function (txt, options) {
	var str = txt ? txt.replace(' ', '<br />') : '';
	return str;
});

Template7.registerHelper('allspace2br', function (txt, options) {
	var str = txt ? txt.replace(/\s/g, '<br />') : '';
	return str;
});

Template7.registerHelper('comma2space', function (txt, options) {
	var str = txt ? txt.replace(/,/g, ' ') : '';
	return str;
});

Template7.registerHelper('str2color', function (txt, options) {
	var hash = 0;
	for (var i = 0; i < txt.length; i++) {
		hash = txt.charCodeAt(i) + ((hash << 5) - hash);
	}

	var h = hash % 360;
	return 'hsl(' + h + ', ' + options.hash.s + '%, ' + options.hash.l + '%)';
});

Template7.registerHelper('encodeString', function (txt, options) {
	return txt ? encodeURIComponent(txt) : '';
});

Template7.registerHelper('ordinalNumber', function (i, options) {
	if (!i) return '';
	var j = i % 10, k = i % 100;
	if (j == 1 && k != 11) {
		return i + "st";
	}
	if (j == 2 && k != 12) {
		return i + "nd";
	}
	if (j == 3 && k != 13) {
		return i + "rd";
	}
	return i + "th";
});

Template7.registerHelper('escapeHTML', function (txt, options) {
	const map = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;'
	};

	return txt ? txt.replace(/[&<>"']/g, function (m) { return map[m]; }) : '';
});

window.onload = function () {
	setTimeout(function () {
		app.init();
	}, 1000);
}