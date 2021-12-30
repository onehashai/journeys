# -*- coding: utf-8 -*-
from __future__ import unicode_literals
import frappe
__version__ = '0.0.1'
frappe.admin_db = getattr(frappe.local, 'admin_db', None)
def connect_admin_db():
    if not frappe.admin_db: 
        from frappe.database import get_db
        master_site_name = frappe.conf.get("master_site_name") or "admin_onehash"
        admin_site_config = frappe.get_site_config(site_path="./"+master_site_name)
        user = admin_site_config.db_name
        password = admin_site_config.db_password
        frappe.local.admin_db = get_db(host=admin_site_config.host, user=user, password=password)
        frappe.admin_db = frappe.local('admin_db')
        frappe.site_db = frappe.db
        frappe.db = frappe.admin_db
    else:
        frappe.db = frappe.admin_db

def switch_to_site_db():
    if frappe.site_db:
        frappe.db = frappe.site_db

def destroy_admin_connection():
    if frappe.admin_db:
        frappe.admin_db.close()