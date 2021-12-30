# -*- coding: utf-8 -*-
# Copyright (c) 2021, OneHash Inc and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
from frappe import _
from frappe.model.document import Document
from frappe.utils import get_request_session
import journeys
from journeys.addon_limits import check_limits,consume_credit,MaxLimitReachedError

service_name = "Profile Enrich"
class ProfileEnrichRequest(Document):
	pass

@frappe.whitelist()
def get_profile_data(email=None,mobile_no=None,reference_doctype=None,reference_docname=None,resync=False):
	if(not email and not mobile_no):
		frappe.throw("Please Enter Atleast Email or Mobile No")
	
	service_name = "Profile Enrich"
	frappe.site_db = frappe.db
	query_object={}
	if(email):
		query_object["email"]=email
	if(mobile_no):
		query_object["mobile_no"] = mobile_no

	try:
		if(resync):
			profile_enrich_request = make_profile_enrich_request(email, mobile_no,reference_doctype,reference_docname)
			response = sync_profile_enrich_request(profile_enrich_request)
		else:
			queued_request = frappe.get_list('Profile Enrich Request',filters={"status":"Queued"},or_filters=query_object,fields='["*"]',order_by="creation desc",limit_page_length=1,ignore_permissions=True)
			if(len(queued_request)>0):
				response = sync_profile_enrich_request(queued_request[0])
			else:
				request_data = frappe.get_list("Profile Enrich Request",filters={"status":"Success"},or_filters = query_object,fields='["*"]',order_by="creation desc",limit_page_length=1,ignore_permissions=True)
				if len(request_data)>0:
					return request_data[0]
				else:
					profile_enrich_request = make_profile_enrich_request(email,mobile_no,reference_doctype,reference_docname)
					response = sync_profile_enrich_request(profile_enrich_request)
		return response
	except Exception as e:
		frappe.log_error(frappe.get_traceback())


def make_profile_enrich_request(email=None,mobile_no=None,reference_doctype=None,reference_docname=None):
	journeys.switch_to_site_db()
	if(not check_limits(service_name)):
		frappe.throw(_("Insuffecient Credits for {0}.").format(service_name),MaxLimitReachedError,_("Insuffecient Credits"))
		return
	profile_enrich_request = frappe.get_doc({
		"doctype":"Profile Enrich Request",
		"reference_doctype":reference_doctype,
		"reference_docname":reference_docname,
		"email":email,
		"mobile_no":mobile_no,
		# "owner": frappe.session.user if frappe.session.user else "Administrator",
		"status":"Queued"
	}).insert(ignore_permissions=True)
	frappe.db.commit()
	consume_credit(service_name)
	return profile_enrich_request

def sync_profile_enrich_request(profile_enrich_request):
	#try:
	current_site_name = frappe.local.site
	admin_site_name = frappe.conf.get("master_site_name") or "admin_onehash"
	profile_enrich_request.reference_profile_enrich_site = current_site_name
	journeys.connect_admin_db()
	archive_data_record=None
	query_object={}
	
	if(profile_enrich_request.email):
		query_object["email"]=profile_enrich_request.email
	else:
		query_object["mobile_no"]=profile_enrich_request.mobile_no
		
	from better_saas.better_saas.doctype.profile_enrich_archive.profile_enrich_archive import insert_profile_enrich_archive,update_profile_enrich_archive_request
	prev_sync_request = frappe.get_list('Profile Enrich Archive',filters={'reference_site':current_site_name,'reference_profile_enrich_request':profile_enrich_request.name,'status':'Success'},fields=["*"],order_by="creation desc",limit_page_length=1,ignore_permissions=True)
	if len(prev_sync_request)>0:
		archive_data_record = prev_sync_request[0]
		profile_enrich = json.loads(archive_data_record.request_data)
	else:
		prev_sync_request = frappe.get_list('Profile Enrich Archive',filters={'status':'Success'},or_filters=query_object,fields=["*"],order_by="creation desc",limit_page_length=1,ignore_permissions=True)
		if(len(prev_sync_request)>0):
			archive_data_record = prev_sync_request[0]
			profile_enrich = json.loads(archive_data_record.request_data)
		else:
			profile_enrich = get_profile_enrich(email=profile_enrich_request.email,mobile_no=profile_enrich_request.mobile_no)
			archive_data_record = insert_profile_enrich_archive(profile_enrich_request)
	response = update_profile_enrich_archive_request(profile_enrich,archive_data_record,profile_enrich_request)
	journeys.destroy_admin_connection()
	return response
	# except Exception as e:
	# 	frappe.msgprint("Error Occured at sync_profile_enrich_request")
	# 	frappe.log_error(frappe.get_traceback())
	# finally:
	# 	journeys.switch_to_site_db()

@frappe.whitelist()
def get_profile_enrich(email=None,mobile_no=None):
	from piplapis.search import SearchAPIRequest
	from piplapis.search import SearchAPIError
	try:
		request = SearchAPIRequest(email=email,phone=mobile_no, api_key=frappe.conf.pipl_business_api_key)
		response = request.send()
		#frappe.render_template()
		return response.to_json()
	except SearchAPIError as e:
		frappe.log_error(frappe.get_traceback())
		print(e.http_status_code, e)