// Copyright (c) 2023, OneHash Inc and contributors
// For license information, please see license.txt

frappe.listview_settings['Knowlarity Call Logs'] = {
	refresh: async function (listview) {

		let enabled=await frappe.db.get_single_value('Knowlarity Settings', 'enabled');

		if (!enabled){
			await frappe.msgprint("Knowlarity Service is not Enabled");
			const baseUrl = new URL(window.location.href);
			baseUrl.pathname = "/";
			window.location.href = baseUrl.origin+'/app';
			console.log(windows.location.href);
			return;
		}
		let addButton = document.querySelector('.btn.btn-primary.btn-sm.primary-action');
		addButton.disabled = true;

		listview.page.add_inner_button("Fetch Call Logs", async function () {
			console.log("Fetching Knolwarity Call Logs");
			const baseUrl = new URL(window.location.href);
			baseUrl.pathname = "/";
			console.log(window.location.href, baseUrl.origin + '/app/zoom-meetings', "KnowlaritySettings");
			let url = baseUrl.origin + '/api/method/journeys.journeys.doctype.knowlarity_call_logs.knowlarity_call_logs.get_all_knowlarity_call_logs';
			frappe.call({
				callback: (r) => {
					console.log(r)
				},
				url: url,
				success: function (response) {
					console.log("Fetched All Knowlarity CallLog List", response);
				}
			});
		});

	},
	button: {
		show: function (doc) {
			return true;
		},
		get_label: function () {
			return __('View');
		},
		get_description: function (doc) {
			return __('Print {0}', [doc.name])
		},
		action: function (doc) {
			console.log(window);
		}
	}
}

