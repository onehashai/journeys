// Copyright (c) 2023, OneHash Inc and contributors
// For license information, please see license.txt

frappe.listview_settings['User for callHippo'] = {
	refresh: async function (listview) {
		let enabled = await frappe.db.get_single_value('CallHippo Settings', 'enabled');

		if (!enabled) {
			await frappe.msgprint("CallHippo Service is not Enabled");
			const baseUrl = new URL(window.location.href);
			baseUrl.pathname = "/";
			window.location.href = baseUrl.origin + '/app';
			return;
		}
	}
}

