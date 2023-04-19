// Copyright (c) 2023, OneHash Inc and contributors
// For license information, please see license.txt

frappe.listview_settings['Aisensy Campaign'] = {
	refresh: async function (frm) {
		let enabled = await frappe.db.get_single_value('Aisensy Settings', 'enabled');
		// console.log(enabled, "Enabled")
		if (!enabled) {
			await frappe.msgprint("Aisensy Service is not Enabled");
			const baseUrl = new URL(window.location.href);
			baseUrl.pathname = "/";
			window.location.href = baseUrl.origin + '/app';
			// console.log(windows.location.href);
			return;
		}
		let addButton = document.querySelector('.btn.btn-primary.btn-sm.primary-action');
		addButton.disabled = true;
	}
}