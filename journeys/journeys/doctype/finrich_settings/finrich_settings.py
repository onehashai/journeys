# -*- coding: utf-8 -*-
# Copyright (c) 2021, OneHash Inc and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
# import frappe
from frappe.model.document import Document
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

class FinRichSettings(Document):
	def validate(self):
		if self.enable_finrich == 1:
			setup_custom_fields()
		else:
			pass


def setup_custom_fields():
	custom_fields = {
		"Lead": [
			dict(fieldname='cin', label='Company CIN',
				fieldtype='Data', insert_after='company', read_only=1, hidden=1,print_hide=1)
		]
	}
	create_custom_fields(custom_fields)
