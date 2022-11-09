var handlePushNotificationReceived = function(jsonData) {
	slog('Notification Received');
	slog(JSON.stringify(jsonData.notification.payload));
	// reload notifications list
	app.views[2].router.refreshPage();

	// update number of notifications on toolbar
	var num = Number($$('[href="#view-notifications"] .badge').html());
	if(!num) num = 0;
	num++;
	app.methods.SetNotificationBadge(num);
};

var handlePushNotificationOpened = function(jsonData) {
	slog('Notification Opened');

	// decrease number of notifications on toolbar
	var num = Number($$('[href="#view-notifications"] .badge').html());
	if(!num) num = 1;
	num -= 1;
	if(num > 0) {
		app.methods.SetNotificationBadge(num);
	} else {
		app.methods.SetNotificationBadge();
	}

	slog(JSON.stringify(jsonData.notification.payload));
	var notification = jsonData.notification || {};
	var data = notification.payload.additionalData || {};
	var reqType = data.reqType ? data.reqType.toLowerCase() : '';
	var reqId = data.reqId || '';
	var forRole = data.forRole ? data.forRole.toLowerCase() : 'user';
	notificationPageToOpen = '';

	switch(reqType) {
		case 'sdesk':
			notificationPageToOpen = "/view-ticket/" + reqId;
			break;
		case 'it':
			notificationPageToOpen = "/request-detail/it/" + reqId + "/something";
			break;
		case 'asset':
			if(forRole == "approver") {
				notificationPageToOpen = "/request-detail/asset/" + reqId + "/something";
			} else {
				notificationPageToOpen = "/request-detail/asset/" + reqId + "/something";
			}
			break;
		case 'certificate':
			if(forRole == "approver") {
				notificationPageToOpen = "/approve-request/SalaryCertificate/" + reqId;
			} else {
				notificationPageToOpen = "/request-detail/SalaryCertificate/" + reqId;
			}
			break;
		case 'leave':
			if(forRole == "approver") {
				notificationPageToOpen = "/approve-request/LeaveRequest/" + reqId;
			} else {
				notificationPageToOpen = "/request-detail/LeaveRequest/" + reqId;
			}
			break;
		case 'rejoining':
			if(forRole == "approver") {
				notificationPageToOpen = "/approve-request/RejoiningRequest/" + reqId;
			} else {
				notificationPageToOpen = "/request-detail/RejoiningRequest/" + reqId;
			}
			break;
		default:
			break;
	}

	if(notificationPageToOpen) {
		slog("Page to navigate to: " + notificationPageToOpen);
		if(app.data.ready) {
			slog('Navigating immediately as app is ready');
			app.methods.go(notificationPageToOpen);
		} else {
			slog('Delaying navigation until app ready');
			postAppLoadFunction = function() {
				slog('Delayed navigation processing after app ready');
				slog('Page to navigate to: ' + notificationPageToOpen);
				setTimeout(function() {
					slog('Opening page now: ' + notificationPageToOpen);
					app.methods.go(notificationPageToOpen);
				}, 1000);
			};
		}
	} else {
		slog("Could not determine which page to navigate to");
	}
};

var getPageUrlFromNotification = function(cat, subcat, role, reqId) {
	var reqType = subcat ? subcat.toLowerCase() : '';
	var forRole = role ? role.toLowerCase() : 'user';
	page = '';

	switch(reqType) {
		case 'sdesk':
			page = "/view-ticket/" + reqId;
			break;
		case 'it':
			page = "/request-detail/it/" + reqId + "/something";
			break;
		case 'asset':
			if(forRole == "approver") {
				page = "/request-detail/asset/" + reqId + "/something";
			} else {
				page = "/request-detail/asset/" + reqId + "/something";
			}
			break;
		case 'certificate':
			if(forRole == "approver") {
				page = "/approve-request/SalaryCertificate/" + reqId;
			} else {
				page = "/request-detail/SalaryCertificate/" + reqId;
			}
			break;
		case 'leave':
			if(forRole == "approver") {
				page = "/approve-request/LeaveRequest/" + reqId;
			} else {
				page = "/request-detail/LeaveRequest/" + reqId;
			}
			break;
		case 'rejoining':
			if(forRole == "approver") {
				page = "/approve-request/RejoiningRequest/" + reqId;
			} else {
				page = "/request-detail/RejoiningRequest/" + reqId;
			}
			break;
		default:
			break;
	}

	return page;

};

var notificationPageToOpen = "";
var postAppLoadFunction = function() {};
