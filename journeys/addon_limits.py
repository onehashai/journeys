from __future__ import unicode_literals
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

class MaxUserLimitReachedError(frappe.ValidationError):
	http_status_code = 417

def test_execute_function():
    print("my Test function")