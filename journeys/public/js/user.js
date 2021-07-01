frappe.ui.form.on('User', {
    onload: function(frm) {
    if (frappe.user.has_role("System Manager") && frappe.session.user == frm.doc.name) {
        frm.add_custom_button(__('Delete Site'), function () {
            frappe.confirm('Are you sure you want to continue? This action is Irreversible and will delete this site and all of your data.',
            () => {
                frappe.warn('Are you sure you want to proceed?',
                    'All the data will be lost permanently.',
                    () => {
                        // action to perform if Continue is selected
                        frappe.call({
                            method: "journeys.journeys.delete_site.delete_site",
                            callback: function (r) {
                                if(r.message == "Success"){
                                    frappe.msgprint({
                                        title: __('Success'),
                                        indicator: 'green',
                                        message: __('Site will be deleted shortly.')
                                    });
                                }else if(r.message == "Permission Error"){
                                    frappe.msgprint({
                                        title: __('Permission Error'),
                                        indicator: 'red',
                                        message: __('You do not have enough permission to perform this action.')
                                    });
                                }else if(r.message == "Error"){
                                    frappe.msgprint({
                                        title: __('Error'),
                                        indicator: 'red',
                                        message: __('An error occurred. Please Retry.')
                                    });
                                }
                            }
                        })
                    },
                    'Continue',
                    false // Sets dialog as minimizable
                )
            }, () => {
                // action to perform if No is selected
            })
		});
    }
}
});