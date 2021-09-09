from __future__ import unicode_literals

import frappe

def execute():
	# Add standard navbar items for OneHash in Navbar Settings
	update_report_an_issue_navbar_link()

def update_report_an_issue_navbar_link():
    navbar_settings = frappe.get_single("Navbar Settings")
    current_navbar_items = navbar_settings.help_dropdown
    navbar_settings.set('help_dropdown', [])
    
    for item in current_navbar_items:
        if(item.item_label=="Report an Issue"):
            navbar_settings.append('help_dropdown', {
                'item_label': item.item_label,
                'item_type': 'Action',
                'route': None,
                'action': "new frappe.views.CommunicationComposer({'recipients':'support@onehash.ai', 'subject':'['+window.location.host+'] '+frappe.session.user})",
                'is_standard': item.is_standard,
                'hidden': item.hidden
            })
        elif(item.item_label=="Manage Subscription"):
            navbar_settings.append('help_dropdown', {
                'item_label': item.item_label,
                'item_type': 'Action',
                'route': '',
                'action': "frappe.set_route('app/usage-info')",
                'is_standard': item.is_standard,
                'hidden': item.hidden
            })
        elif(item.item_label=="User Forum"):
            navbar_settings.append('help_dropdown', {
                'item_label': 'Roadmap',
                'item_type': 'Route',
                'route': 'https://roadmap.onehash.ai',
                'action': None,
                'is_standard': item.is_standard,
                'hidden': item.hidden
            })
        else:
            navbar_settings.append('help_dropdown',item)

    navbar_settings.save()