from __future__ import unicode_literals
from frappe import _

def get_data():
	return [
		{
			"label": _("Settings"),
			"items": [
				{
					"type": "doctype",
					"name": "IndiaMart Settings",
                    "description": _("Connect IndiaMart with OneHash"),
				}
			]
		},
        {
			"label": _("Data Enrich"),
			"icon": "fa fa-star",
			"items": [
				{
					"type": "doctype",
					"name": "FinRich Request",
					"description": _("Company Financial Summary"),
				},
				{
					"type": "doctype",
					"name": "FinRich Settings",
					"description": _("Enable FinRich"),
				}
			]
		}
	]