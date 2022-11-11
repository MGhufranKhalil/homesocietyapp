import Config from './config.js';
import DB from './db.js';
import Util from './util.js';
import { parse, format, formatDistance } from 'date-fns';

// @@TODO: replace all language string with constants
const Api = {
	refreshTimer: null,
	headers: {
		"X-API-VERSION": 'v2',
	},
	cache: {},
	init: function (f7) {
		Api.f7 = f7;
		Util.dbg('Api init success');
	},

	api_call: function (action, post, data, use_cache) {
		const token = DB.get("token");
		const expiry = DB.get("tokenExpiry");
		if (!token || !expiry) {
			return new Promise(function (resolve, reject) {
				reject({ error: "Token not available" });
			});
		}

		if (use_cache && Api.cache[action]) {
			return new Promise(function (resolve, reject) {
				resolve(Api.cache[action]);
			});
		}

		data = data || {};
		var param = {
			url: Config.api + action,
			data: data,
			contentType: "application/json",
			dataType: "json",
			timeout: Config.apiTimeout,
			method: "GET",
			headers: {
				...Api.headers,
				"Authorization": "Bearer " + token
			}
		};

		// check if expiry is close, and try to refresh the token
		if (Api.refreshTimer == null) {
			const diff = new Date(expiry) - new Date();
			const hours = diff / 36e5;
			if (hours < Config.tokenExpiryTime) {
				Api.refreshTimer = setTimeout(function () { Api.refresh_token(expiry) }, 2000);
			}
		}

		if (post) {
			// post request always without cache
			param.method = "POST";
			return Api.f7.request.promise(param);
		} else if (!use_cache) {
			// get request without cache
			return Api.f7.request.promise(param);
		}

		// cache get request data based on url
		return new Promise(function (resolve, reject) {
			Api.f7.request.promise(param).then(function (data) {
				Api.cache[action] = data;
				resolve(data);
			});
		});
	},

	multipart_request: function (action, data) {
		data = data || {};
		var param = {
			url: Config.api + action,
			data: data,
			contentType: "multipart/form-data",
			timeout: Config.apiTimeout,
			method: "POST",
			headers: {
				...Api.headers,
				"Authorization": "Bearer " + DB.get("token")
			}
		};

		return Api.f7.request.promise(param);
	},

	call: function (fn, data, fnToValidate, str, use_cache) {
		// const dt = parse(DB.get('tokenExpiry'), 'yyyy-MM-dd HH:mm:ss', new Date());
		// if(dt < new Date()) {
		// token expired, renew token
		// }
		return new Promise(function (r, j) {
			Api.api_call(fn, data ? true : false, data, use_cache).then(function (res) {
				Util.dbg("Api." + fn + " -> " + (typeof res) + " : " + res.length < 200 ? res : res.length);
				if (typeof res == "string") res = JSON.parse(res);
				if (fnToValidate.call(Api, res) == true) {
					Util.dbg("Api." + fn + " success");
					r(res);
				} else {
					Util.dbg("Api." + fn + " failure due to invalid response", typeof res);
					j(res.message || res.error || res.result || 'Failed to get ' + str);
				}
			}).catch(function (error) {
				Util.dbg("Api." + fn + " failure due to promise rejection", error);
				if (error.xhr && error.xhr.status && error.xhr.status == 401) {
					j('Your login session has expired. Please re-login to continue');
				} else {
					j('Failed to ' + str + '. Network error');
				}
			});
		});
	},

	login: function (data) {
		var param = {
			url: Config.api + "login",
			data: data,
			timeout: Config.apiTimeout,
			method: "POST"
		};

		return new Promise(function (r, j) {
			Api.f7.request.promise(param).then(function (res) {
				Util.dbg("Api.login ->", typeof res, res.status, res.data);
				let { data } = res;
				if (typeof data == "string") data = JSON.parse(data);
				if (data.success) {
					DB.set("token", data.data.token);
					DB.set("tokenExpiry", data.data.expiry);
					DB.set("user", JSON.stringify(data.data.user));
					r();
				} else {
					Util.dbg("Api.login failure due to invalid response", typeof res);
					j(data.error || 'Login Failed');
				}
			}).catch(function (error) {
				Util.dbg("Api.login failure due to promise rejection", error);
				j("Failed to complete network request");
			});
		});
	},

	register: function (data) {
		var param = {
			url: Config.api + "register",
			data: data,
			timeout: Config.apiTimeout,
			method: "POST"
		};

		return new Promise(function (r, j) {
			Api.f7.request.promise(param).then(function (res) {
				Util.dbg("Api.register ->", typeof res, res.status, res.data);
				let { data } = res;
				if (typeof data == "string") data = JSON.parse(data);
				if (data.success) {
					DB.set("token", data.data.token);
					DB.set("tokenExpiry", data.data.expiry);
					DB.set("user", JSON.stringify(data.data.user));
					r();
				} else {
					Util.dbg("Api.register failure due to invalid response", typeof res);
					j(res.message || res.error || res.result || 'Failed to Register.');
				}
			}).catch(function (error) {
				Util.dbg("Api.register failure due to promise rejection", error);
				j("Failed to complete network request");
			});
		});
	},

	set_society: function (sid) {
		var param = {
			url: Config.api + "society?sid=" + sid + "&t=" + (new Date().getTime()),
			timeout: Config.apiTimeout,
			method: "GET",
			contentType: "application/json",
		};

		return Api.f7.request.promise(param);
	},

	get_profile: function () {
		return Api.call(
			"profile",
			null,
			function (res) {
				return (res.data && typeof res.data == "object" ? true : false);
			},
			"retrieve profile"
		);
	},

	get_notices: function () {
		return Api.call(
			"notices",
			null,
			function (res) {
				return (res.data && typeof res.data == "object" ? true : false);
			},
			"get list of notices"
		);
	},

	get_complains: function () {
		return Api.call(
			"complains",
			null,
			function (res) {
				return (res.data && typeof res.data == "object" ? true : false);
			},
			"get list of complains"
		);
	},

	get_my_complains: function () {
		return Api.call(
			"complains/mine",
			null,
			function (res) {
				return (res.data && typeof res.data == "object" ? true : false);
			},
			"get list of complains"
		);
	},

	get_directory: function () {
		return Api.call(
			"directory",
			null,
			function (res) {
				return (res.data && typeof res.data == "object" ? true : false);
			},
			"get residents directory"
		);
	},

	get_complain: function (id) {
		return Api.call(
			`complains/info/${id}`,
			null,
			function (res) {
				return (res.data && typeof res.data == "object" ? true : false);
			},
			"get complain details"
		);
	},

	get_expenses: function (id) {
		return Api.call(
			"expenses",
			null,
			function (res) {
				return (res.data && typeof res.data == "object" ? true : false);
			},
			"expenses information"
		);
	},

	get_maintenance_list: function (month) {
		return Api.call(
			`collections/maintenance_list?month=${encodeURIComponent(month)}`,
			null,
			function (res) {
				return (res.data && typeof res.data == "object" ? true : false);
			},
			"maintenance records"
		);
	},

	add_complaint: function (data) {
		return Api.call(
			"complains/add",
			data,
			function (res) {
				return res.data && res.data.success ? true : false;
			},
			"add complaint"
		);
	},

	add_complaint_reply: function (data) {
		return Api.call(
			"complains/response",
			data,
			function (res) {
				return res.data && res.data.success ? true : false;
			},
			"add complaint reply"
		);
	},

	get_expense_details: function (month) {
		return Api.call(
			`expenses/view?month=${encodeURIComponent(month)}`,
			null,
			function (res) {
				return (res.data && typeof res.data == "object" ? true : false);
			},
			"get expense details"
		);
	},

	add_expense: function (data) {
		return Api.call(
			"expenses/add",
			data,
			function (res) {
				return res.data && res.data.success ? true : false;
			},
			"add expense"
		);
	},

	add_collection: function (data) {
		return Api.call(
			"collections/add",
			data,
			function (res) {
				return res.data && res.data.success ? true : false;
			},
			"add collection"
		);
	},

	add_bulk_maintenance: function (data) {
		return Api.call(
			"collections/maintenance",
			data,
			function (res) {
				return res.data && res.data.success ? true : false;
			},
			"add bulk maintenance"
		);
	},

	add_notice: function (data) {
		return Api.call(
			"notices/add",
			data,
			function (res) {
				return res.data && res.data.success ? true : false;
			},
			"add notice"
		);
	},

	update_notice: function (data) {
		return Api.call(
			"notices/update",
			data,
			function (res) {
				return res.data && res.data.success ? true : false;
			},
			"update notice"
		);
	},

	archive_notice: function (data) {
		return Api.call(
			"notices/archive",
			data,
			function (res) {
				return res.data && res.data.success ? true : false;
			},
			"archive notice"
		);
	},

	get_duedates: function () {
		return Api.call(
			`duedates`,
			null,
			function (res) {
				return (res.data && typeof res.data == "object" ? true : false);
			},
			"get list of due dates"
		);
	},

	update_duedates: function (data) {
		return Api.call(
			`duedates/update`,
			data,
			function (res) {
				return (res.data && typeof res.data == "object" ? true : false);
			},
			"update due dates"
		);
	},


	get_contact: function (data) {
		return Api.call(
			"contacts/info",
			data,
			function (res) {
				return res.data && res.data.success ? true : false;
			},
			"get contact info"
		);
	},

	update_contact: function (data) {
		return Api.call(
			"contacts/update",
			data,
			function (res) {
				return res.data && res.data.success ? true : false;
			},
			"update contact"
		);
	},

	update_profile: function (data) {
		return Api.call(
			"profile",
			data,
			function (res) {
				return res.data && res.data.success ? true : false;
			},
			"update profile"
		);
	},


	add_poll: function (data) {
		return Api.call(
			"polls/add",
			data,
			function (res) {
				return res.data && res.data.success ? true : false;
			},
			"add voting poll"
		);
	},

	get_poll: function (id) {
		return Api.call(
			`polls/info/${id}`,
			null,
			function (res) {
				return res.data && res.data.success ? true : false;
			},
			"view voting poll"
		);
	},

	add_vote: function (data) {
		return Api.call(
			"polls/vote",
			data,
			function (res) {
				return res.data && res.data.success ? true : false;
			},
			"add vote"
		);
	},

	edit_expense: function (data) {
		return Api.call(
			"expenses/edit",
			data,
			function (res) {
				return res.data && res.data.success ? true : false;
			},
			"edit expense"
		);
	},

	delete_expense: function (data) {
		return Api.call(
			"expenses/delete",
			data,
			function (res) {
				return res.data && res.data.success ? true : false;
			},
			"delete expense"
		);
	},

	edit_collection: function (data) {
		return Api.call(
			"collections/edit",
			data,
			function (res) {
				return res.data && res.data.success ? true : false;
			},
			"edit collection"
		);
	},

	delete_collection: function (data) {
		return Api.call(
			"collections/delete",
			data,
			function (res) {
				return res.data && res.data.success ? true : false;
			},
			"delete collection"
		);
	},

	delete_maintenance: function (data) {
		return Api.call(
			"collections/delete_maintenance",
			data,
			function (res) {
				return res.data && res.data.success ? true : false;
			},
			"delete maintenance"
		);
	},

	get_workers: function () {
		return Api.call(
			"workers",
			null,
			function (res) {
				return (res.data && typeof res.data == "object" ? true : false);
			},
			"get workers directory"
		);
	},

	get_worker: function (data) {
		return Api.call(
			"workers/info",
			data,
			function (res) {
				return res.data && res.data.success ? true : false;
			},
			"get worker info"
		);
	},

	add_worker: function (data) {
		return Api.call(
			"workers/add",
			data,
			function (res) {
				return res.data && res.data.success ? true : false;
			},
			"add worker"
		);
	},

	update_worker: function (data) {
		return Api.call(
			"workers/update",
			data,
			function (res) {
				return res.data && res.data.success ? true : false;
			},
			"update worker"
		);
	},

	get_guidelines: function () {
		return Api.call(
			"guidelines",
			null,
			function (res) {
				return (res.data && typeof res.data == "object" ? true : false);
			},
			"get guidelines"
		);
	},

	get_workers_leaves: function () {
		return Api.call(
			"workers/leaves",
			null,
			function (res) {
				return (res.data && typeof res.data == "object" ? true : false);
			},
			"get workers leave record"
		);
	},

	add_worker_leave: function (data) {
		return Api.call(
			"workers/add_leave",
			data,
			function (res) {
				return res.data && res.data.success ? true : false;
			},
			"add leave record"
		);
	},

	delete_worker_leave: function (id) {
		return Api.call(
			"workers/del_leave",
			{ id: id },
			function (res) {
				return res.data && res.data.success ? true : false;
			},
			"delete worker leave"
		);
	},

	refresh_token: function (expiry) {
		return Api.call(
			"chores/refresh",
			{ expiry: expiry },
			function (res) {
				Api.refreshTimer = null;
				const success = res.data && res.data.success ? true : false;
				if (success) {
					DB.set("token", res.data.data.token);
					DB.set("tokenExpiry", res.data.data.expiry);
					return true;
				}
				return false;
			},
			"refresh login session"
		);
	}

};

export default Api;
