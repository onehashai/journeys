frappe.ui.form.on('Web Form', {

	is_embeddable: function (frm) {
		frm.events.disable_enable_fields(frm);
	},

	disable_enable_fields: function (frm) {

        if (frm.doc.is_embeddable == 1) {
            frm.set_df_property('client_script', 'hidden', true);
            frm.set_df_property('client_script_section', 'hidden', true);
            frm.set_df_property('sidebar_items', 'hidden', true);
            frm.set_df_property('sidebar_settings', 'hidden', true);
            frm.doc.show_sidebar=0
    		refresh_field("show_sidebar")
            frm.doc.login_required=0
    		refresh_field("login_required")
            frm.set_df_property('login_required', 'hidden', true);
            let msg = `<div class="card mb-3 h-100"><div class="card-body"> <b>Embed URL</b> <br><br><textarea rows="4" cols="50"><iframe frameborder="0" style="height:500px;width:99%;border:none;" src='https://${frappe.boot.sitename}/api/method/journeys.users.forms?new=1&path=${frm.doc.name}'></iframe></textarea></div></div>`
            frm.set_df_property('embed_url', 'options', msg);
            frm.dirty()
        }
        if(frm.doc.is_embeddable == 0){

            frm.set_df_property('client_script', 'hidden', false);
            frm.set_df_property('client_script_section', 'hidden', false);
            frm.set_df_property('sidebar_items', 'hidden', false);
            frm.set_df_property('sidebar_settings', 'hidden', false);
            frm.set_df_property('login_required', 'hidden', false);
            frm.dirty()
        }
		
	}
});