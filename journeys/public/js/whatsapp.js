frappe.provide("frappe.views")
frappe.views.WhatsAppComposer = class {
	constructor(opts) {
		$.extend(this, opts);
		if (!this.doc) {
			this.doc = this.frm && this.frm.doc || {};
		}
		this.make();
	}

	make() {

		let counter = 0
		let context = {}
		let contact_dict = {};
		let contact_list = [];
		cur_frm.meta.fields.forEach((e) => { if (e.options == "Phone") { contact_dict[e.fieldname] = e.label } })
		let doc_field_list = [{
			"value": "Attachment",
			"description": "Attach a file"
		}]
		if (frappe.model.can_print(null, cur_frm) && !cur_frm.meta.issingle) {
			doc_field_list.push({
				"value": "Print Format",
				"description": "Print Format"
			})
		}
		let data_link_dict = {}
		cur_frm.meta.fields.forEach((e) => { if (e.fieldtype == "Data" || e.fieldtype == "Link") { data_link_dict[e.fieldname] = e.label } })
		for (const [key, value] of Object.entries(cur_frm.doc)) {
			if (key in data_link_dict && value.replaceAll(" ", "") != "") {
				doc_field_list.push({
					"value": value,
					"description": data_link_dict[key]
				})
			}
			if (key in contact_dict && value.replaceAll(" ", "") != "") {
				contact_list.push({
					"value": value,
					"description": contact_dict[key]
				})
			}
		}
		var d = new frappe.ui.Dialog({
			'fields': [
				{ 'label': __("To"), 'fieldname': 'mobile_no', 'fieldtype': 'MultiSelect', 'options': contact_list },
				{
					'label': __("Template"), 'fieldname': 'template', 'fieldtype': 'Link', 'options': "Whatsapp Template",
					onchange: function (e) {
						frappe.db.get_doc("Whatsapp Template", this.value)
							.then((data) => {
								counter += 1
								if (counter == 1) {
									cur_frm.broadcast_name = data.broadcast_name
									document.getElementsByClassName("modal-body ui-front").forEach((e) => { e.addEventListener("click", function () { verify(cur_frm.dialog_d, cur_frm.dialog_context, cur_frm.dialog_data, cur_frm.dialog_header_html); }); })

									cur_frm.fields_list = data.whatsapp_map
									let option_list = ["Attachment"]
									if (frappe.model.can_print(null, cur_frm) && !cur_frm.meta.issingle) {
										option_list.push("Print Format")
									}
									data.whatsapp_map.forEach((e) => {
										if (e.location == "header") {

											d.make_field({
												"fieldtype": "Select",
												"label": e.field_name,
												"fieldname": e.field_name,
												"options": option_list,
												"reqd": 1
											})
										} else {
											d.make_field({
												"fieldtype": "MultiSelect",
												"label": e.field_name,
												"fieldname": e.field_name,
												"reqd": 1
											})

										}
										// make attach field for every field
										d.make_field({
											"label": __("Attachment"),
											"fieldtype": "Attach",
											"fieldname": e.field_name + "_attachment",
											"hidden": true
										})
										d.get_field(e.field_name + "_attachment").df.options = {
											restrictions: {
												allowed_file_types: ['.csv']
											}
										};
										d.get_field(e.field_name + "_attachment").refresh()

										// make print_format field for every field
										d.make_field({
											"label": __("Select Print Format"),
											"fieldtype": "Select",
											"fieldname": e.field_name + "_print_format",
											"options": frappe.meta.get_print_formats(cur_frm.meta.name),
											"hidden": true
										});
										d.get_field(e.field_name + "_print_format").refresh()

										d.get_field(e.field_name).refresh();
										context[e.field_name] = "";

										if (e.location != "header") {
											d.get_field(e.field_name).set_data(doc_field_list)
										}

										d.fields_dict[e.field_name].input.onchange = function () {
											if (this.value && this.value.replace(", ", "") == "Attachment") {
												d.get_field(e.field_name + "_attachment").df.hidden = false
												d.get_field(e.field_name + "_attachment").value = ""
												d.get_field(e.field_name + "_attachment").refresh()

												d.get_field(e.field_name + "_print_format").df.hidden = true
												d.get_field(e.field_name + "_print_format").refresh()
												cur_frm.dialog_context[e.field_name] = ""
											}
											else if (this.value && this.value.replace(", ", "") == "Print Format") {
												d.get_field(e.field_name + "_attachment").df.hidden = true
												d.get_field(e.field_name + "_attachment").refresh()

												d.get_field(e.field_name + "_print_format").df.hidden = false
												d.get_field(e.field_name + "_print_format").refresh()
												cur_frm.dialog_context[e.field_name] = ""
											} else {
												d.get_field(e.field_name + "_attachment").df.hidden = true
												d.get_field(e.field_name + "_attachment").refresh()

												d.get_field(e.field_name + "_print_format").df.hidden = true
												d.get_field(e.field_name + "_print_format").refresh()
											}

											verify(cur_frm.dialog_d, cur_frm.dialog_context, cur_frm.dialog_data, cur_frm.dialog_header_html)

										}

									})
									let header_html = "";
									if (data.header_type != 'text' && data.header_type != '') {
										header_html = data.header_type.charAt(0).toUpperCase() + data.header_type.slice(1) + ` Attachment: <a href="` + data.header_link + `">` + data.header_link + `</a><br><br>`

									}
									$(d.get_field('content').wrapper).html(
										`<div class="card mb-3 h-100"><div class="card-body">` + header_html + data.message_body + `<br><br></div></div>`
									);

									cur_frm.dialog_d = d
									cur_frm.dialog_context = context
									cur_frm.dialog_data = data
									cur_frm.dialog_header_html = header_html
								}
							});
					}
				},

				{ 'label': __("Content"), 'fieldname': 'content', 'fieldtype': 'HTML' },

			],
			primary_action: function () {
				
				frappe.call({
					method: "journeys.journeys.doctype.wati_settings.wati_settings.send_template_message",
					args: { "doc": { "doctype": cur_frm.doc.doctype, "docname": cur_frm.doc.name }, "whatsapp_numbers": d.get_field("mobile_no").input.value.replaceAll(" ", "").split(","), "broadcast_name": cur_frm.broadcast_name || "Broadcast", "template_name": d.get_field("template").value, "template_parameters": context },
					callback: (r) => {
						if(r.message[0] == true){
							show_alert("WhatsApp message sent successfully");
							d.hide();
						}else{
							show_alert(r.message[1] || "An error occured. Please Retry")
						}
					}
				});
				
			},
			primary_action_label: __("Send"),
			no_submit_on_enter: true,
			size: 'large',
			minimizable: true,
			title: ("Send Whatsapp Message"),
		});

		d.show();
		d.get_primary_btn()[0].disabled = true
	}
}

function verify(d, context, data, header_html) {
	for (const [key, value] of Object.entries(context)) {
		if ((d.get_field(key).input.value).replace(", ", "") == "Attachment") {
			if (d.get_field(key + "_attachment").value == null || d.get_field(key + "_attachment").value.length == 0) {
				return
			}
			else if (d.get_field(key + "_attachment").value && d.get_field(key + "_attachment").value.includes("https://")) {
				context[key] = (d.get_field(key + "_attachment").value)
			} else {
				context[key] = ("https://" + frappe.boot.sitename + d.get_field(key + "_attachment").value)
			}
		} else if ((d.get_field(key).input.value).replace(", ", "") == "Print Format") {
			frappe.call({
				method: "journeys.users.get_attach_link",
				args: { "doc": { "doctype": cur_frm.doc.doctype, "docname": cur_frm.doc.name }, "print_format": d.get_field(key + "_print_format").value },
				callback: (r) => {
					context[key] = r.message
				}
			})
		} else {
			context[key] = (d.get_field(key).input.value).replace(", ", "");
		}
	}
	$(d.get_field('content').wrapper).html(
		`<div class="card mb-3 h-100"><div class="card-body">` + frappe.render(header_html, context) + frappe.render(data.message_body, context) + `<br><br></div></div>`
	);
	d.get_primary_btn()[0].disabled = false
}