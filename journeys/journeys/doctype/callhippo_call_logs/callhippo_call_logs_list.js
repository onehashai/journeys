// Copyright (c) 2023, OneHash Inc and contributors
// For license information, please see license.txt


frappe.listview_settings['CallHippo Call Logs'] = {
	refresh: function (listview) {
		let addButton = document.querySelector('.btn.btn-primary.btn-sm.primary-action');
		addButton.disabled = true;
	}
};