# Copyright (c) 2023, OneHash Inc and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.integrations.utils import make_get_request, make_post_request, create_request_log
import json
class KnowlarityCallLogs(Document):
	pass

# Fetch All Call Logs of Knowlarity
@frappe.whitelist(allow_guest=True)
def get_all_knowlarity_call_logs():

	#Make Outbound Call
	frappe.log_error("","Into Call Log server script")
	k_settings=frappe.get_doc("Knowlarity Settings")
	frappe.log_error(frappe.form_dict,"Form Dict")
	frappe.log_error(k_settings,"Knowlarity Settings")

	url = k_settings.base_url+"/"+k_settings.channel+'/v1/account/calllog'+'?start_time='+'1900-03-29 18:10:30+05:30'+'&end_time='+'2050-03-29 18:10:30+05:30'+'&limit='+'500'
	frappe.log_error("",url)
	frappe.log_error({
		'Authorization': k_settings.authorization,
		'Content-Type': k_settings.content_type,
		'x-api-key': k_settings.x_api_key
	})
	response =make_get_request(url,headers={
		'Authorization': k_settings.authorization,
		'Content-Type': k_settings.content_type,
		'x-api-key': k_settings.x_api_key
	})
	for call_log in response["objects"]:
		if not frappe.db.exists('Knowlarity Call Logs', call_log['uuid']):
			frappe.get_doc({
				"doctype": "Knowlarity Call Logs",
				"uuidd": call_log['uuid'],
				"customer_number":call_log['customer_number'],
				"status":call_log['agent_number'],
				"agent_number":call_log['destination'],
				"call_duration":call_log['call_duration'],
				"knowlarity_number":call_log['knowlarity_number'],
				"start_time":call_log['start_time'][:-6]+'.000000',
				"extension":call_log['extension'],
				"call_recording":call_log['call_recording']
			}).insert(ignore_permissions=True)

# Make ClickToCall Knowlarity
@frappe.whitelist(allow_guest=True)
def make_click_to_call_knowlarity():

	#Make Outbound Call
	k_settings=frappe.get_doc("Knowlarity Settings")

	url = k_settings.base_url+"/"+k_settings.channel+'/v1/account/call/makecall'
	data={
	"k_number": k_settings.k_number,
	"agent_number": k_settings.agent_number,
	"customer_number":"+"+frappe.form_dict['customer_number'],
	"caller_id": k_settings.caller_id
	}
	response =make_post_request(url,data=json.dumps(data),headers={
		'Authorization': k_settings.authorization,
		'Content-Type': k_settings.content_type,
		'x-api-key': k_settings.x_api_key
	})
	call_placed="false"
	message=""
	if 'success' in response:
		success_data = response['success']
		message=success_data['message']
		call_placed="true"
	elif 'error' in response:
		error_data = response['error']
		message=error_data['message']
	else:
		message="Unknown response from API"

	# Redirecting to Knowlarity Call Logs Doctype
	frappe.response["type"] = "redirect"
	frappe.response["location"] = '/app/lead/'+frappe.form_dict['lead_number']+'?call_placed='+call_placed+"&message="+message

