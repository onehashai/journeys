from __future__ import unicode_literals
from better_saas.better_saas.doctype.saas_user.saas_user import get_bench_path
import frappe
from frappe import _
from frappe.utils import now_datetime, getdate, flt, cint, get_fullname
from frappe.installer import update_site_config
from frappe.utils.data import formatdate
from frappe.utils.user import get_enabled_system_users,reset_simultaneous_sessions,get_system_managers
from frappe.utils.__init__ import get_site_info
import os, subprocess, json
from six.moves.urllib.parse import parse_qsl, urlsplit, urlunsplit, urlencode
from six import string_types


class SiteExpiredError(frappe.ValidationError):
	http_status_code = 417

class MaxLimitReachedError(frappe.ValidationError):
	http_status_code = 417

def get_limits(service_name=None,site = None):
	site_path=None
	if(site):
		bench_path = get_bench_path(site) or "."
		site_path = bench_path+"/sites/"+site

	site_config = frappe._dict(frappe.get_site_config(site_path=site_path))
	if(service_name and 'addon_limits' in site_config and service_name in site_config["addon_limits"]):
		return site_config['addon_limits'][service_name]
	elif(service_name and 'addon_limits' not in site_config):
		return {}
	else:
		return site_config["addon_limits"]


def check_limits(service_name,required_credits=1):
	service_limits = get_limits(service_name)
	if(service_limits and 'available_credits' in service_limits and cint(service_limits["available_credits"])>=required_credits):
		return True
	else:
		return False

def consume_credit(service_name,credits=1):
	limits = get_limits()
	limits[service_name]['available_credits'] = limits[service_name]['available_credits'] - credits
	update_limits(limits)
	

def topup_credit(service_name,credits,site_name=None):
	limits = get_limits()
	if(service_name in limits):
		limits[service_name]['available_credits'] = cint(limits[service_name]['available_credits']) + cint(credits)
		frappe.log_error({"limits":limits,"credits":credits},site_name)
	else:
		limits[service_name]={'available_credits':credits,'service_name':service_name}
	update_limits(limits,site_name)
	

def update_limits(limits_dict,site_name=None):
	'''Add/Update limit in site_config'''
	limits = get_limits()
	limits.update(limits_dict)
	bench_path = get_bench_path(site_name) or "."
	site_path= os.path.join(bench_path+"/sites/"+site_name, "site_config.json") if site_name else None
	update_site_config("addon_limits", limits, validate=True,site_config_path=site_path)
	if(site_path):
		frappe.local.conf.addon_limits = limits