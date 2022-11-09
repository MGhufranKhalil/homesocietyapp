export default {
	introsDefault: {
		welcome: 1
	},
	init: function() {
		var i = localStorage.getItem('intros');
		if(i && i.length) {
			try {
				i = JSON.parse(i);
				this.intros = i;
			} catch(e) {
				this.intros = this.introsDefault;
			}
		} else {
			this.intros = this.introsDefault;
		}
	},
	set: function (key, val) {
		localStorage.setItem(key, val);
	},
	get: function (key) {
		return localStorage.getItem(key);
	},
	del: function(key) {
		return localStorage.setItem(key, "");
	},
	resetIntros: function() {
		this.intros = DB.introsDefault;
		localStorage.setItem('intros', JSON.stringify(this.introsDefault));
	},
	intro_needed: function(name) {
		return this.intros[name] && this.intros[name] > 0;
	},
	intro_done: function(name) {
		this.intros[name] = 0;
		localStorage.setItem('intros', JSON.stringify(this.intros));
	}
};
