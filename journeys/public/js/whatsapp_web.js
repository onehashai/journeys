frappe.provide("frappe.views")
frappe.views.WhatsAppdialogComposer = class {
	constructor(opts) {
		$.extend(this, opts);
		if (!this.doc) {
			this.doc = this.frm && this.frm.doc || {};
		}
		this.make();
	}

	make() {

		let contact_dict = {};
		let contact_list = [];
		let contacts = [];
		cur_frm.meta.fields.forEach((e) => { if (e.options == "Phone" || e.fieldname == "contact_phone" || e.fieldname == "contact_mobile") { contact_dict[e.fieldname] = e.label } })
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
				if(!contacts.includes(value)){
					contacts.push(value)
					contact_list.push({
						"value": value,
						"description": contact_dict[key]
					})
				}
			}
		}
		let person_name = ""
		if(cur_frm.doctype=="Lead"){
			person_name = cur_frm.doc.__onload.contact_list[0].name
		}
		var d = new frappe.ui.Dialog({
			'fields': [
				{ 
					'label': __("To"),
					'fieldname': 'mobile',
					'fieldtype': 'Select',
					'options': contact_list,
					'description': "<strong>Note</strong>: Please enter contact with Country Code",
					'reqd': 1
				},
				{
					'label': __("Template"), 
					'fieldname': 'whatsapp_messages_template', 
					'fieldtype': 'Link', 
					'options': 'WhatsApp Web Message Template', 
					"onchange": function (e) {
						console.log(this.value)
						if(this.value){
						frappe.db.get_doc("WhatsApp Web Message Template", this.value)
							.then((data) => {
								let message = data.whatsapp_messages_template
								try{
									message  = frappe.render(data.whatsapp_messages_template,cur_frm.doc);
								} catch (err){
									frappe.msgprint(err.message);
								}
								d.set_value("whatsapp_msg",message);
								
							});
					}
				}},
                {
                    'fieldtype': 'Text',
                    'label': 'Message Box',
                    'fieldname': 'whatsapp_msg',
					'reqd': 1
                  
                }
			],
			primary_action: function(values1){
                let values= d.get_values();
                let msg = values.whatsapp_msg;
                window.open('https://web.whatsapp.com/send?phone='+values.mobile+'+&text='+msg,"Web-WhatsApp");
            },
            primary_action_label: __("Send"),
			no_submit_on_enter: true,
			size: 'large',
			minimizable: true,
			title: __("Send WhatsApp Web Message"),
		});
		d.show();
	}
}

