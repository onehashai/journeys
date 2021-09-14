frappe.ui.form.on('Notification', {

	refresh: function (frm) {
		frm.events.setup_whatsapp_template(frm);
	},

	channel: function (frm) {
		frm.events.setup_whatsapp_template(frm);
	},

	whatsapp_template: function (frm) {
		frm.doc.message = ""
		refresh_field("message")
		frm.events.setup_whatsapp_template(frm);
	},

	setup_whatsapp_template: function (frm) {
		let template = '';
		let total_html = "";
		if (frm.doc.channel === 'WhatsApp') {

			if (frm.doc.whatsapp_template != undefined) {
				frappe.db.get_doc("WhatsApp Template", frm.doc.whatsapp_template)
					.then((data) => {
						frm.fields_list = data.whatsapp_map
						if (frm.doc.message == "" || frm.doc.message == "Add your message here") {
							let param_html = ""
							if (data.whatsapp_map.length > 0) {
								param_html = `{`
								data.whatsapp_map.forEach((e) => {
									param_html += `"` + e.field_name + `": "", `
								})
								param_html = param_html.slice(0,-2)
								param_html += `}`
								frm.doc.message = param_html
								refresh_field("message")
								frm.dirty()
							}

						}
						let header_html = "";

						if (data.header_type != 'text' && data.header_type != '') {

							header_html = `Attachment: <a href="` + data.header_link + `">` + data.header_link + `</a><br><br>`

						}

						total_html = `<div class="card mb-3 h-100"><div class="card-body">` + header_html + data.message_body + `<br><br></div></div>`
						template = `<h5 style='display: inline-block'>Warning:</h5><br>Only Use Pre-Approved WhatsApp Template. Message should be a dictionary of parameters and values for the selected template.
								<h5>Message Example:</h5>
								<pre>{"file_url":"https://www.onehash.ai/files/demo.pdf", "name": "{{ doc.name }}" }</pre>
								<pre>Put "print_format" to attach Print Format of document. Also enable and select Print Format in Print Settings below.
								</pre>`;
						if (template) {
							frm.set_df_property('message_examples', 'options', template);
						}

					})
			}
		}
	}
});