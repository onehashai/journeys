// Copyright (c) 2023, OneHash Inc and contributors
// For license information, please see license.txt

frappe.ui.form.on('CallHippo Settings', {
	refresh(frm) {
		const baseUrl = new URL(window.location.href);
		baseUrl.pathname = "/";
		frm.set_value('webhook_url', baseUrl.origin + '/api/method/journeys.journeys.doctype.callhippo_call_logs.callhippo_call_logs.add_callhippo_logs');
	}
});

