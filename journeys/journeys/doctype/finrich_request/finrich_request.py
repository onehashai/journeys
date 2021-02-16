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

class FinRichRequest(Document):
	pass

@frappe.whitelist()
def get_finrich_data(cin,reference_doctype=None,reference_docname=None,resync=True):
	frappe.site_db = frappe.db
	try:
		if(resync):
			finrich_request = make_finrich_request(cin,reference_doctype,reference_docname)
			response = sync_finrich_request(finrich_request)
		else:
			queued_request = frappe.get_list('FinRich Request',filters={"cin": cin,"status":"Queued"},fields='["*"]',order_by="creation desc",limit_page_length=1)
			if(len(queued_request)>0):
				#frappe.throw(_("Request already in queue."))
				response = sync_finrich_request(queued_request[0])
			else:
				request_data = frappe.get_list("FinRich Request",filters={"cin": cin,"status":"Success"},fields='["*"]',order_by="creation desc",limit_page_length=1)
				if len(request_data)>0:
					return request_data[0]
				else:
					finrich_request = make_finrich_request(cin,reference_doctype,reference_docname)
					response = sync_finrich_request(finrich_request)
		return response
	except Exception as e:
		frappe.msgprint("Error Occured at get_finrich_data")
		frappe.log_error(frappe.get_traceback())
		#finrich_request = frappe.get_doc({"doctype":"FinRich Request"}).insert(ignore_permissions=True)


def make_finrich_request(cin,reference_doctype,reference_docname):
	try:
		journeys.switch_to_site_db()
		finrich_request = frappe.get_doc({
			"doctype":"FinRich Request",
			"reference_doctype":reference_doctype,
			"reference_docname":reference_docname,
			"cin":cin,
			"owner": frappe.session.user,
			"status":"Queued"
		}).insert(ignore_permissions=True)
		frappe.db.commit()
		return finrich_request
	except Exception as e:
		frappe.msgprint("Error Occured at make_finrich_request")
		frappe.log_error(frappe.get_traceback())


def sync_finrich_request(finrich_request):
	try:
		current_site_name = frappe.local.site
		admin_site_name = 'admin_onehash'
		finrich_request.reference_finrich_site = current_site_name
		journeys.connect_admin_db()
		archive_data_record=None
		from better_saas.better_saas.doctype.finrich_archive.finrich_archive import insert_finrich_archive,update_finrich_archive_request
		prev_sync_request = frappe.get_list('FinRich Archive',filters={'reference_site':current_site_name,'reference_finrich_request':finrich_request.name,'status':'Success'},fields=["*"],order_by="creation desc",limit_page_length=1)
		if len(prev_sync_request)>0:
			archive_data_record = prev_sync_request[0]
			insta_summary = json.loads(archive_data_record.request_data)
		else:
			prev_sync_request = frappe.get_list('FinRich Archive',filters={'cin':finrich_request.cin,'status':'Success'},fields=["*"],order_by="creation desc",limit_page_length=1)
			#print(prev_sync_request)
			if(len(prev_sync_request)>0):
				archive_data_record = prev_sync_request[0]
				insta_summary = json.loads(archive_data_record.request_data)
			else:
				insta_summary = get_insta_summary(finrich_request.cin)
				archive_data_record = insert_finrich_archive(finrich_request)
		response = update_finrich_archive_request(insta_summary,archive_data_record)
		return response
	except Exception as e:
		#print(e)
		frappe.msgprint("Error Occured at sync_finrich_request")
		frappe.log_error(frappe.get_traceback())
	finally:
		journeys.switch_to_site_db()


def get_insta_summary(cin):
	#cin="L23201MH1959GOI011388"
	url = "https://instafinancials.com/api/InstaSummary/v1/json/CompanyCIN/"+cin
	session = get_request_session()
	headers = {
		'user-key': "WfG6K/QqnAeikBvqchHciogw+XkUlyFj9WC83ToQrlM3tpdQolysOg==",
		'dataType': "json"
	}

	try:
		d = session.get(url, data={},auth='', headers=headers)
		d.raise_for_status()
		response = d.json()
		return response
	except Exception as e:
		frappe.msgprint("Error Occured at get_insta_summary")
		frappe.log_error(frappe.get_traceback())

@frappe.whitelist()
def get_cin_by_name(company_name):
	url = "https://instafinancials.com/api/GetCIN/v1/json/Search/"+company_name+"/Mode/nc"
	session = get_request_session()
	headers = {
		'user-key': "WfG6K/QqnAeikBvqchHciogw+XkUlyFj9WC83ToQrlM3tpdQolysOg==",
		'dataType': "json"
	}

	try:
		d = session.get(url, data={},auth='', headers=headers)
		d.raise_for_status()
		response = d.json()
		#print(response)
		return response
	except Exception as e:
		frappe.log_error(frappe.get_traceback())