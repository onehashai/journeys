# -*- coding: utf-8 -*-
# Copyright (c) 2021, OneHash Inc and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
from enum import Flag
import frappe, json, re
from frappe.model.document import Document
import requests
from six import string_types

class WatiSettings(Document):
	pass

def send_whatsapp_message(receiver_list, message):
	
	if not frappe.db.get_single_value("Wati Settings", "enabled"):
		return 
	
	url = process_url("sendSessionMessage/")
	if not url:
		return

	payload={'messageText': message}
	files=[

	]
	headers = {
	'Authorization': 'Bearer ' + frappe.db.get_single_value("Wati Settings", "access_token")
	}
	for recipient in receiver_list:
		response = requests.request("POST", url+recipient.replace("+", ""), headers=headers, data=payload, files=files)



@frappe.whitelist()
def send_template_message(doc, whatsapp_numbers, broadcast_name, template_name, template_parameters):
	try:
		if not frappe.db.get_single_value("Wati Settings", "enabled"):
			return [False, "Wati Service is not Enabled"]
		
		url = process_url("sendTemplateMessage/")
		if not url:
			return [False, "Wati Service Url is not Configured"]

		token = frappe.db.get_single_value("Wati Settings", "access_token")
		if "Bearer " not in token:
			token = "Bearer " + token

		if isinstance(template_parameters, string_types):
			template_parameters = json.loads(template_parameters)
		
		param_payload = []
		for key, value in template_parameters.items():
			param_payload.append({"name": key, "value": value})

		param_payload = json.dumps(param_payload)
		
		payload = json.dumps({
		"template_name": template_name,
		"broadcast_name": broadcast_name,
		"parameters": param_payload
		})
		
		headers = {
		'Authorization': token,
		'Content-Type': 'application/json'
		}
		
		if isinstance(whatsapp_numbers, string_types):
			whatsapp_numbers = json.loads(whatsapp_numbers)
		
		if isinstance(template_parameters, string_types):
			template_parameters = json.loads(template_parameters)

		whatsapp_numbers = set(whatsapp_numbers)
		result = False
		for number in whatsapp_numbers:
			if not number:
				continue

			if not frappe.db.exists("WhatsApp Contact", number.replace("+","")):
				contact_resp = add_contact(number)
				if contact_resp[0] != True:
					if contact_resp[1]:
						frappe.msgprint(contact_resp[1])
					continue

			number = number.replace("+","")
			response = requests.request("POST", url+number, headers=headers, data=payload)

			response_text = json.loads(response.text)
			header_html = ""
			temp = frappe.get_doc("WhatsApp Template", template_name)
			if temp.header_type not in ["text", ""]:
				header_html = temp.header_type[0].upper() + temp.header_type[1:] + " Attachment: " + temp.header_link + " "

			if response_text.get("result") in ["success", "true", True]:
				# add comments if sent from doctype
				if isinstance(doc, string_types):
					doc = json.loads(doc)
					doc = frappe.get_doc(doc.get("doctype"), doc.get("docname"))
				doc.add_comment('Comment', text=frappe.render_template(frappe.get_doc("WhatsApp Template", template_name).message_body, template_parameters))
				# add whatsapp log
				frappe.get_doc({
					"doctype":"WhatsApp Message Log",
					"to": number,
					"status": "Sent",
					"message": frappe.render_template(header_html + "\n\n" + temp.message_body, template_parameters),
					"response_json": response.text
				}).insert()
				frappe.db.commit()
				result = True
				
			else:
				# add whatsapp log
				frappe.get_doc({
					"doctype":"WhatsApp Message Log",
					"to": number,
					"status": "Failed",
					"message": frappe.render_template(header_html + "\n\n" + temp.message_body, template_parameters),
					"response_json": response.text
				}).insert()
				frappe.db.commit()
				frappe.log_error(response.text, "WhatsApp Message Failed")
				result = False

		return [True, "WhatsApp Message Sent Successfully"] if result else [False, ""]
	except:
		frappe.log_error(frappe.get_traceback(), "WhatsApp Message Errored")

def get_whatsapp_messages():
	pass

@frappe.whitelist()
def get_message_templates():
	try:
		if not frappe.db.get_single_value("Wati Settings", "enabled"):
			return [False, "Wati Service is not Enabled"] 
		
		url = process_url("getMessageTemplates/")
		if not url:
			return [False, "Wati Service Url is not Configured"]
		
		max_num = frappe.db.get_single_value("Wati Settings", "number_of_templates") or 250

		token = frappe.db.get_single_value("Wati Settings", "access_token")
		if "Bearer " not in token:
			token = "Bearer " + token

		broadcast_name = frappe.db.get_single_value("Wati Settings", "broadcast_name")
		payload={'pageSize': "250",
		'pageNumber': '1'}
		files=[

		]
		headers = {
		'Authorization': token
		}

		saved_templates = [x.name for x in frappe.get_list("WhatsApp Template")]
		num_saved_templates = len(saved_templates)

		if num_saved_templates >= max_num:
			return [False, "Please Increase Number of Templates Limit"]

		response = requests.request("GET", url, headers=headers, data=payload, files=files)
		
		if response.text:
			response_text = json.loads(response.text)
			if response_text.get("result") in ["success", "true", True]:
				for template in response_text.get("messageTemplates"):
					if template.get("status") == "APPROVED" and template.get("elementName") not in saved_templates and num_saved_templates < max_num:
						num_saved_templates += 1
						if template.get("header") and template.get("header", {}).get("link", {}):
							header_link = template.get("header").get("link")
						elif template.get("header") and template.get("header", {}).get("mediaFromPC", ""):
							header_link = template.get("header").get("mediaFromPC")
						else:
							header_link = ""
						wt_doc = frappe.get_doc({
							"doctype": "WhatsApp Template",
							"broadcast_name": broadcast_name or "Broadcast",
							"template_name": template.get("elementName"),
							"category": template.get("category"),
							"language_code": template.get("language").get("value", None),
							"header_type": template.get("header").get("typeString", None) if template.get("header") else "",
							"header_text": template.get("header").get("text", None) if template.get("header") else "",
							"header_link": header_link,
							"message_body": template.get("bodyOriginal") if template.get("type") == "template" else template.get("hsmOriginal")
						})

						header_content = str(wt_doc.header_text) + str(wt_doc.header_link)
						body_content = str(wt_doc.message_body)
						header_args_list = re.findall('{{(.*?)}}', header_content)
						body_args_list = re.findall('{{(.*?)}}', body_content)
						if header_args_list:
							for arg in header_args_list:
								wt_doc.append("whatsapp_map", {"field_name": arg, "location": "header"})
						if body_args_list:
							for arg in body_args_list:
								wt_doc.append("whatsapp_map", {"field_name": arg, "location": "body"})
						wt_doc.insert()

				frappe.db.commit()
				return [True, "WhatsApp Templates Fetched Successfully"]
			else:
				frappe.log_error(response.text, "WhatsApp Templates Failed")
				return [False, "WhatsApp Templates Failed to Fetch"]
		else:
			frappe.log_error(response, "WhatsApp Templates Failed")
			return [False, "WhatsApp Templates Failed to Fetch"]
	except:
		frappe.log_error(frappe.get_traceback(), "WhatsApp Templates Errored")
		return [False, "WhatsApp Templates Failed to Fetch"]

@frappe.whitelist()
def get_contacts():
	try:
		if not frappe.db.get_single_value("Wati Settings", "enabled"):
			return [False, "Wati Service is not Enabled"] 
		
		url = process_url("getContacts")
		if not url:
			return [False, "Wati Service Url is not Configured"]

		token = frappe.db.get_single_value("Wati Settings", "access_token")
		if "Bearer " not in token:
			token = "Bearer " + token

		payload={'pageSize': str(frappe.db.get_single_value("Wati Settings", "number_of_contacts") or 500),
		'pageNumber': '1'}
		files=[

		]
		headers = {
		'Authorization': token
		}

		response = requests.request("GET", url, headers=headers, data=payload, files=files)

		if response.text:
			response_text = json.loads(response.text)
			if response_text.get("result") in ["success", "true", True]:
				saved_contacts = [x.name for x in frappe.get_list("WhatsApp Contact")]
				contact_list = response_text.get("contact_list")
				for contact in contact_list:
					if contact.get("phone") not in saved_contacts:
						frappe.get_doc({
							"doctype":"WhatsApp Contact",
							"contact": contact.get("phone"),
							"full_name": contact.get("fullName")
						}).insert(ignore_permissions=True)
						saved_contacts.append(contact.get("phone"))
				frappe.db.commit()
				return [True, "WhatsApp Contacts Fetched Successfully"]
			else:
				frappe.log_error(response.text, "WhatsApp Contact Fetch Failed")
				return [False, "WhatsApp Contacts Failed to Fetch"]
		else:
			frappe.log_error(response, "WhatsApp Contact Fetch Failed")
			return [False, "WhatsApp Contacts Failed to Fetch"]
	except:
		frappe.log_error(frappe.get_traceback(), "WhatsApp Contact Fetch Errored")
		return [False, "WhatsApp Contacts Failed to Fetch"]

def add_contact(number=None):
	try:
		if not frappe.db.get_single_value("Wati Settings", "enabled"):
			return [False, "Wati Service is not Enabled"]
		
		url = process_url("addContact/")
		if not url:
			return [False, "Wati Service Url is not Configured"]
		
		token = frappe.db.get_single_value("Wati Settings", "access_token")
		if "Bearer " not in token:
			token = "Bearer " + token

		custom_params = []
		for param in frappe.get_single("Wati Settings").as_dict().get("add_contact_parameters"):
			custom_params.append({"name": param.get("parameter"), "value": param.get("value")})
		if not custom_params:
			custom_params = [{"name": "doc", "value": "Lead"}]
		
		contact_list = list(set([x.get("parent") for x in frappe.get_list('Contact Phone', filters={'phone': number}, fields=['parent'])]))
		if not contact_list:
			return [False, "Contact {} not found".format(number)]
		
		contact_doc = frappe.get_doc("Contact", contact_list[0])
		if not contact_doc:
			return [False, "Contact not found"]
		
		full_name = contact_doc.first_name.strip()
		full_name += (" "+contact_doc.middle_name.strip()) if contact_doc.middle_name and contact_doc.middle_name.strip() else ""
		full_name += (" "+contact_doc.last_name.strip()) if contact_doc.last_name and contact_doc.last_name.strip() else ""
		
		payload = json.dumps({
		"name": full_name,
		"customParams": custom_params
		})
		
		headers = {
		'Authorization': token,
		'Content-Type': 'application/json'
		}

		response = requests.request("POST", url+number, headers=headers, data=payload)

		if response.text:
			response_text = json.loads(response.text)
			if response_text.get("result") in ["success", "true", True]:
				frappe.get_doc({
							"doctype":"WhatsApp Contact",
							"contact": number,
							"full_name": full_name
						}).insert(ignore_permissions=True)
				frappe.db.commit()
				return [True, ""]
			else:
				frappe.log_error(response.text, "WhatsApp Contact Failed")
				return [False, ""]
		else:
			frappe.log_error(response.text, "WhatsApp Contact Failed")
			return [False, ""]
	except:
		frappe.log_error(frappe.get_traceback(), "WhatsApp Contact Errored")
		return [False, ""]

def process_url(method):
	url = frappe.db.get_single_value("Wati Settings", "api_endpoint")
	if not url:
		return None
	url = url.strip()
	if "api/v1" not in url:
		if url[-1] != "/":
			url = url + "/"
		url = url + "api/v1/"
	if url[-1] != "/":
		url = url + "/"
	return url + method
