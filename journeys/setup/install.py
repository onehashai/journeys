# Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
# License: GNU General Public License v3. See license.txt

from __future__ import print_function, unicode_literals

import frappe
from frappe import _

def after_install():
	add_standard_navbar_items()
	add_app_name()
	enable_finrich_profile_enrich()
	frappe.db.commit()

def add_standard_navbar_items():
	navbar_settings = frappe.get_single("Navbar Settings")
	update_navbar_items = {"Documentation":
		{
                'item_label': 'Documentation',
                'item_type': 'Route',
                'route': 'https://help.onehash.ai',
                'action': '',
                'is_standard': 1
        },
		"Report an Issue":{
                'item_label': 'Report an Issue',
                'item_type': 'Action',
                'route': '',
                'action': "new frappe.views.CommunicationComposer({'recipients':'support@onehash.ai', 'subject':'['+window.location.host+'] '+frappe.session.user})",
                'is_standard': 1
        }
	}
	onehash_navbar_items = [
		{
			"item_label": "Manage Subscription",
			"item_type": "Action",
			"route": "",
			"action":"frappe.set_route('app/usage-info')",
			"is_standard": 1
		},
        {
			"item_label": "",
			"item_type": "Separator",
			"route": "",
			"is_standard": 1
		}
	]

	current_navbar_items = navbar_settings.help_dropdown
	navbar_settings.set('help_dropdown', [])

	for item in onehash_navbar_items:
		current_labels = [item.get('item_label') for item in current_navbar_items]
		if not item.get('item_label') in current_labels:
			navbar_settings.append('help_dropdown', item)

	for item in current_navbar_items:
		if item.item_label in update_navbar_items:
			navbar_settings.append('help_dropdown', {
				'item_label': item.item_label,
				'item_type': item.item_type,
				'route': update_navbar_items[item.item_label]['route'],
				'action': update_navbar_items[item.item_label]['action'],
				'is_standard': update_navbar_items[item.item_label]['is_standard'],
				'hidden': item.hidden
			})
		else:
			navbar_settings.append('help_dropdown', {
				'item_label': item.item_label,
				'item_type': item.item_type,
				'route': item.route,
				'action': item.action,
				'is_standard': item.is_standard,
				'hidden': item.hidden
			})

	navbar_settings.save()

def add_app_name():
	frappe.db.set_value('System Settings', None, 'app_name', 'OneHash')
	frappe.db.set_value('Website Settings', None, 'app_name', 'OneHash')

def enable_finrich_profile_enrich():
    frappe.db.set_value('Profile Enrich Settings', None, 'enable_profile_enrich',1)
    frappe.db.set_value('FinRich Settings', None, 'enable_finrich',1)