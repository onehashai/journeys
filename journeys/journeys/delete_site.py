from __future__ import unicode_literals
import frappe
from frappe import _
import requests
import json
import re
from frappe import enqueue
from frappe.utils import today, nowtime, add_days

@frappe.whitelist()
def delete_site():
    if "System Manager" not in frappe.get_roles(frappe.session.user):
        frappe.msgprint("You must be a System Manager to perform this action.")
        return "Permission Error"
    try:
        config = frappe.get_site_config()
        facebook_config = config.get("facebook_config") if config.get("facebook_config") else {}
        master_domain = facebook_config.get("master_domain")
        if master_domain:
            commands = ["bench --site {} execute --args '{}' better_saas.better_saas.doctype.saas_user.saas_user.delete_site".format(master_domain, frappe.local.site)]
            frappe.enqueue('bench_manager.bench_manager.utils.run_command',
                commands = commands,
                doctype = "Saas Site",
                docname = frappe.local.site or None,
                key = today() + " " + nowtime()
                )
            return "Success"
    except:
        frappe.log_error(frappe.get_traceback())
        return "Error"