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
service_name = "FinRich"
class FinRichRequest(Document):
	pass

@frappe.whitelist()
def get_finrich_data(cin,reference_doctype=None,reference_docname=None,request_for="Summary",resync=False):
	service_name = "FinRich" if request_for=="Basic" else "FinRich Plus"
	frappe.site_db = frappe.db
	try:
		if(resync):
			finrich_request = make_finrich_request(cin,reference_doctype,reference_docname,request_for)
			response = sync_finrich_request(finrich_request)
			#response = frappe.enqueue("journeys.journeys.doctype.finrich_request.finrich_request.sync_finrich_request",**{"finrich_request":finrich_request})
		else:
			queued_request = frappe.get_list('FinRich Request',filters={"cin": cin,"status":"Queued","request_for":request_for},fields='["*"]',order_by="creation desc",limit_page_length=1,ignore_permissions=True)
			if(len(queued_request)>0):
				#response = frappe.enqueue("journeys.journeys.doctype.finrich_request.finrich_request.sync_finrich_request",**{"finrich_request":queued_request[0]})
				response = sync_finrich_request(queued_request[0])
			else:
				request_data = frappe.get_list("FinRich Request",filters={"cin": cin,"status":"Success","request_for":request_for},fields='["*"]',order_by="creation desc",limit_page_length=1,ignore_permissions=True)
				if len(request_data)>0:
					return request_data[0]
				else:
					finrich_request = make_finrich_request(cin,reference_doctype,reference_docname,request_for)
					response = sync_finrich_request(finrich_request)
					#response = frappe.enqueue("journeys.journeys.doctype.finrich_request.finrich_request.sync_finrich_request",**{"finrich_request":finrich_request})
		#frappe.msgprint("Request has been submitted Sucessfully","Retireving Details")
		return response
	except MaxLimitReachedError as e:
		# frappe.msgprint("Insuffecient Credits")
		frappe.log_error(frappe.get_traceback())
	except Exception as e:
		frappe.msgprint("Error while retrieving data.")
		frappe.log_error(frappe.get_traceback(),"Error In Get Finrich Data")


def make_finrich_request(cin,reference_doctype,reference_docname,request_for):
	journeys.switch_to_site_db()
	service_name = "FinRich" if request_for=="Basic" else "FinRich Plus"
	if(not check_limits(service_name)):
		frappe.throw(_("Insuffecient Credits for {0}.").format(service_name),MaxLimitReachedError,_("Insuffecient Credits"))
		return
	finrich_request = frappe.get_doc({
		"doctype":"FinRich Request",
		"reference_doctype":reference_doctype,
		"reference_docname":reference_docname,
		"cin":cin,
      "request_for":request_for,
		# "owner": if frappe.session.user,
		"status":"Queued"
	}).insert(ignore_permissions=True)
	frappe.db.commit()
	consume_credit(service_name)
	return finrich_request

def sync_finrich_request(finrich_request):
	try:
		current_site_name = frappe.local.site
		admin_site_name = frappe.conf.get("master_site_name") or "admin_onehash"
		finrich_request.reference_finrich_site = current_site_name
		journeys.connect_admin_db()
		archive_data_record=None
		from better_saas.better_saas.doctype.finrich_archive.finrich_archive import insert_finrich_archive,update_finrich_archive_request
		#frappe.set_user("Administrator")
		prev_sync_request = frappe.get_list('FinRich Archive',filters={'reference_site':current_site_name,'reference_finrich_request':finrich_request.name,'status':'Success','request_for':finrich_request.request_for},fields=["*"],order_by="creation desc",limit_page_length=1,ignore_permissions=True)
		if len(prev_sync_request)>0:
			archive_data_record = prev_sync_request[0]
			insta_summary = json.loads(archive_data_record.request_data)
		else:
			prev_sync_request = frappe.get_list('FinRich Archive',filters={'cin':finrich_request.cin,'status':'Success','request_for':finrich_request.request_for},fields=["*"],order_by="creation desc",limit_page_length=1,ignore_permissions=True)
			if(len(prev_sync_request)>0):
				archive_data_record = prev_sync_request[0]
				insta_summary = json.loads(archive_data_record.request_data)
			else:
				insta_summary = get_insta_summary(finrich_request.cin) if finrich_request.request_for=="Summary" else get_insta_basic(finrich_request.cin)
				archive_data_record = insert_finrich_archive(finrich_request)
		response = update_finrich_archive_request(insta_summary,archive_data_record,finrich_request)
		#frappe.publish_realtime("finrich_sync_completed",response,user=frappe.session.user)
		#frappe.set_user(frappe.user)
		return response
	except Exception as e:
		frappe.msgprint("Error Occured at sync_finrich_request")
		frappe.log_error(e)
		frappe.log_error(frappe.get_traceback())
	finally:
		journeys.switch_to_site_db()
		journeys.destroy_admin_connection()
		#frappe.set_user(frappe.user)


def get_insta_summary(cin):
	#cin="L23201MH1959GOI011388"
	insta_financial_api_key = frappe.conf.get("insta_financial_api_key")
	url = "https://instafinancials.com/api/InstaSummary/v1/json/CompanyCIN/"+cin
	session = get_request_session()
	headers = {
		'user-key': insta_financial_api_key,
		'dataType': "json"
	}
	try:
		d = session.get(url, data={},auth='', headers=headers)
		d.raise_for_status()
		response = d.json()
		return response
	except Exception as e:
		frappe.log_error(str(e),title="Insta Summary Error")
		frappe.log_error(d,title="Insta Summary Response")
		frappe.log_error(frappe.get_traceback())
		frappe.throw("Sorry, could not fetch details, please retry.")

@frappe.whitelist()
def get_insta_basic(cin=None):
   #L23209TG1989PLC010336
	insta_financial_api_key = frappe.conf.get("insta_financial_api_key")
	url = "https://instafinancials.com/api/InstaBasic/V1/json/CompanyCIN/"+cin+"/all"
	session = get_request_session()
	headers = {
		'user-key': insta_financial_api_key,
		'dataType': "json"
	}
	try:
		d = session.get(url, data={},auth='', headers=headers)
		d.raise_for_status()
		response = d.json()
		return response
	except Exception as e:
		frappe.msgprint("Error Occured at get_insta_basic")
		frappe.log_error(e)
		frappe.log_error(frappe.get_traceback())

@frappe.whitelist()
def get_cin_by_name(company_name):
	insta_financial_api_key = frappe.conf.get("insta_financial_api_key")
	url = "https://instafinancials.com/api/GetCIN/v1/json/Search/"+company_name+"/Mode/sw"
	session = get_request_session()
	headers = {
		'user-key': insta_financial_api_key,
		'dataType': "json"
	}

	try:
		d = session.get(url, data={},auth='', headers=headers)
		d.raise_for_status()
		response = d.json()
		return response
	except Exception as e:
		frappe.log_error(frappe.get_traceback())
		