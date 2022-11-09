import { Base64 } from 'js-base64';

export default {
	set: function (key, val) {
		localStorage.setItem(`cache-${key}`, Base64.encode(JSON.stringify(val)));
	},
	get: function (key, defValue) {
		let val = localStorage.getItem(`cache-${key}`);
		try {
			val = Base64.decode(val);
			val = JSON.parse(val);
			if(val && typeof val == typeof defValue) {
				return val;
			}
			return defValue;
		} catch(error) {
			localStorage.removeItem(`cache-${key}`);
			return defValue;
		}
	},
	del: function(key) {
		return localStorage.removeItem(`cache-${key}`);
	},
	purge: function() {
		for (var _x in localStorage) {
			if (_x.substring(0, 6) != 'cache-') {
				continue;
			}
			if (!localStorage.hasOwnProperty(_x)) {
				continue;
			}
			localStorage.removeItem(_x);
		}
	}
};
