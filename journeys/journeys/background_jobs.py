import json
import frappe
from frappe.integrations.utils import make_post_request

def sync_space_usage():
    secret = frappe.conf.get("sk_onehash")
    master_site = frappe.conf.get("master_site_domain")
    if not secret or not master_site:
        return
    
    data = frappe.conf.get("limits",{}).get("space_usage",{})
    if len(data)>0:
        data["site_name"] = frappe.local.site
        data["secret"] = secret
        try:
            make_post_request(f"https://{master_site}/api/method/better_saas.better_saas.doctype.saas_site.saas_site.update_space_usage",data=data)
        except Exception as e:
            print(frappe.get_traceback())
            frappe.log_error(frappe.get_traceback(),"Could not make Request")
        pass


def sync_user(doc, method):
    secret = frappe.conf.get("sk_onehash")
    master_site = frappe.conf.get("master_site_domain")
    if not secret or not master_site:
        return
    data = {"emai_id":doc.email, "first_name":doc.first_name, "last_name":doc.last_name, "active":doc.enabled, "last_active":doc.last_active, "user_type":doc.user_type }
    if len(data)>0:
        data["site_name"] = frappe.local.site
        data["secret"] = secret
        try:
            make_post_request(f"https://{master_site}/api/method/better_saas.better_saas.doctype.saas_site.saas_site.update_user",data=data)
        except Exception as e:
            print(frappe.get_traceback())
            frappe.log_error(frappe.get_traceback(),"Could not make Request")
            frappe.log_error(data,"Request Data")
        pass
    pass
