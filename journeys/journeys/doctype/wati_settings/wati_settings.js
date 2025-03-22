// Copyright (c) 2021, OneHash Inc and contributors
// For license information, please see license.txt

frappe.ui.form.on('Wati Settings', {
	refresh: function(frm) {
		frm.add_custom_button(__('Fetch Templates'), function () {
			frappe.show_progress('Fetching WhatsApp Templates...', 70, 100, 'Please wait');

			frappe.call({
				method: "journeys.journeys.doctype.wati_settings.wati_settings.get_message_templates",
				callback: function (r) {
					if(r.message[0] == true){
						frappe.hide_progress("Fetching WhatsApp Templates...")
						frappe.msgprint({
							title: __('Success'),
							indicator: 'green',
							message: __(r.message[1])
						});
					}else if(r.message[0] == false){
						frappe.hide_progress("Fetching WhatsApp Templates...")
						frappe.msgprint({
							title: __('Failure'),
							indicator: 'red',
							message: __(r.message[1])
						});
					}
				}
			})
		});

		frm.add_custom_button(__('Fetch Contacts'), function () {
			frappe.show_progress('Fetching WhatsApp Contacts...', 70, 100, 'Please wait');

			frappe.call({
				method: "journeys.journeys.doctype.wati_settings.wati_settings.get_contacts",
				callback: function (r) {
					if(r.message[0] == true){
						frappe.hide_progress("Fetching WhatsApp Contacts...")
						frappe.msgprint({
							title: __('Success'),
							indicator: 'green',
							message: __(r.message[1])
						});
					}else if(r.message[0] == false){
						frappe.hide_progress("Fetching WhatsApp Contacts...")
						frappe.msgprint({
							title: __('Failure'),
							indicator: 'red',
							message: __(r.message[1])
						});
					}
				}
			})
		});

	}
});
