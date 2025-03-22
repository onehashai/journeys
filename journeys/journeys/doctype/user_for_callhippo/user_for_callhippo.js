// Copyright (c) 2023, OneHash Inc and contributors
// For license information, please see license.txt

frappe.ui.form.on('User for callHippo', {
	refresh: function (frm) {

		// CallHistory CallHippo
		frm.add_custom_button(__('Call Logs CallHippo'), function () {
			frappe.set_route('List', 'CallHippo Call Logs', { 'caller_email': frm.doc.email_id });
		});
	},
	before_save: async function (frm) {

		let authentication_token = await frappe.db.get_single_value('CallHippo Settings', 'token');
		if (typeof cur_frm.doc.user_id == 'undefined' || cur_frm.doc.user_id == '') {
			await fetch('https://web.callhippo.com/v1/user/add', {
				method: 'POST',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					'apiToken': authentication_token,
				},
				body: JSON.stringify({
					"number": cur_frm.doc.contact_no,
					"firstName": cur_frm.doc.first_name,
					"lastName": cur_frm.doc.last_name,
					"email": cur_frm.doc.email_id,
				})
			}).then(r => r.json())
				.then(r => {
					if (r.success === true) {
						frappe.msgprint("CallHippo User Added");
					}
					else if (r.success === false) {
						if (r.error.error !== undefined) {
							frappe.throw("CallHippo Error: " + r.error.error);
						} else {
							frappe.throw("CallHippo Error: " + r.error);
						}
					}
					else {
						frappe.throw("Unexpected error while calling CallHippo");
					}
				})
		}
		else {

			await fetch('https://web.callhippo.com/v1/user/edit/' + cur_frm.doc.user_id, {
				method: 'PUT',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					'apiToken': authentication_token,
				},
				body: JSON.stringify({
					"number": cur_frm.doc.contact_no,
					"firstName": cur_frm.doc.first_name,
					"lastName": cur_frm.doc.last_name,
					"email": cur_frm.doc.email_id,
				})
			}).then(r => r.json())
				.then(r => {
					if (r.success === true) {
						frappe.msgprint("CallHippo User Updated");
					}
					else if (r.success === false) {
						frappe.throw("CallHippo Error: " + r.error.error);
					}
					else {
						frappe.throw("Unexpected error while calling CallHippo");

					}
				})

		}
	}
});

