const self = {
	notify: function (msg, cssClass = 'success') {
		if(msg) {
			const time = msg.length > 30 ? msg.length * 100 : 3000;
			const appNotification = app.notification.create({
				icon: '<i class="notification-icon"></i>',
				title: 'Home Society',
				text: msg,
				closeOnClick: true,
				closeTimeout: time,
				cssClass: cssClass
			});
			appNotification.open();
		}
	},
	success: function(msg) {
		self.notify(msg);
	},
	error: function(err) {
		const msg = (err && err.message) ? err.message : err;
		self.notify(msg, 'error');
	}
};

export default self;
