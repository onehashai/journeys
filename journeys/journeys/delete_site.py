from __future__ import unicode_literals
import frappe
from frappe import _

@frappe.whitelist()
def delete_site():
    if "System Manager" not in frappe.get_roles(frappe.session.user):
        frappe.msgprint("You must be a System Manager to perform this action.")
        return "Permission Error"
    try:
        config = frappe.get_site_config()
        master_domain = config.get("master_site_name")
        if master_domain:
            frappe.enqueue("journeys.journeys.delete_site.request_deletion", queue='default', timeout=None, event=None,	is_async=True, job_name=None, now=False, enqueue_after_commit=False, master=master_domain)
            return "Success"
    except:
        frappe.log_error(frappe.get_traceback())
        return "Error"

def request_deletion(master):
    local_site = frappe.local.site
    frappe.local.initialised = False
    commands = ["bench --site {} execute --args '{}' better_saas.better_saas.doctype.saas_user.saas_user.delete_site".format(master, local_site)]
    frappe.connect(site=master)
    frappe.enqueue('bench_manager.bench_manager.utils.run_command',
        commands = commands,
        doctype = "Bench Settings",
        key = frappe.utils.today() + " " + frappe.utils.nowtime()
        )
    frappe.destroy()
    frappe.local.initialised = False
    frappe.connect(site=local_site)