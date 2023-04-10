// Copyright (c) 2023, OneHash Inc and contributors
// For license information, please see license.txt

frappe.ui.form.on('ZoomSettings', {
	refresh(frm) {
		const baseUrl = new URL(window.location.href);
		baseUrl.pathname = "/";
		console.log(window.location.href, baseUrl.origin + '/app/zoom-meetings', "ZoomSettings");
		frm.set_value('redirect_uri', baseUrl.origin + '/api/method/journeys.journeys.doctype.zoom_meetings.zoom_meetings.zoom_get_access_token');
		frm.set_value('email_subscriptions_url', baseUrl.origin + '/api/method/journeys.journeys.doctype.zoom_meetings.zoom_meetings.zoom_get_access_token');
	}
});
