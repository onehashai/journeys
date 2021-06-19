# -*- coding: utf-8 -*-
# Copyright (c) 2021, OneHash Inc and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
from frappe import _
from frappe.model.document import Document
from frappe.utils import get_request_session
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

class IndiaMartSettings(Document):
	def validate(self):
		if self.enable_indiamart == 1:
			setup_custom_fields()
			add_lead_source()
			self.validate_access_credentials()
			self.validate_request()
		else:
			pass
	
	def validate_access_credentials(self):
		if not (self.crm_key and self.registered_mobile):
			frappe.msgprint(_("Missing value for CRM Key or Registered Mobile"), raise_exception=frappe.ValidationError)

	def validate_request(self):
		url = "https://mapi.indiamart.com/wservce/enquiry/listing/GLUSR_MOBILE/{0}/GLUSR_MOBILE_KEY/{1}/".format(self.registered_mobile,self.crm_key)
		session = get_request_session()
		try:
			d = session.get(url, data={},auth='', headers=None)
			d.raise_for_status()
			response = d.json()			
			if(response!=[] and response[0]["Error_Message"]):
				frappe.msgprint(_(response[0]["Error_Message"]), raise_exception=frappe.ValidationError)
		except Exception as e:
			frappe.log_error(frappe.get_traceback())
			#raise e


def setup_custom_fields():
	custom_fields = {
		"Opportunity": [
			dict(fieldname='indiamart_query_id', label='IndiaMart Query Id',
				fieldtype='Data', insert_after='series', read_only=1, print_hide=1),
			dict(fieldname='indiamart_qtype', label='IndiaMart Lead Source',
				fieldtype='Data', insert_after='indiamart_query_id', read_only=1, print_hide=1),
			dict(fieldname='enq_message', label='Enquiry Message',
				fieldtype='Small Text', insert_after='customer_name', read_only=1, print_hide=1)
		]
		
	}

	create_custom_fields(custom_fields)

def add_lead_source():
	try:
		source = frappe.get_doc("Lead Source","IndiaMart")		
	except Exception as e:
		lead_source = frappe.get_doc({
			"doctype":"Lead Source",
			"source_name":"IndiaMart"
		})
		lead_source.insert()
	

def sync_enquiry():
	try:
		settings = frappe.get_doc('IndiaMart Settings')
	except Exception as e:
		print(e)
		settings=None
		pass
	if(settings==None):
		return

	if(not settings.enable_indiamart):
		return 

	end_time = frappe.utils.now()
	if(settings and settings.last_sync_time):
		start_time = settings.last_sync_time
	else:
		import datetime
		start_time = datetime.datetime.now()-datetime.timedelta(minutes=15)

	url = "https://mapi.indiamart.com/wservce/enquiry/listing/GLUSR_MOBILE/{0}/GLUSR_MOBILE_KEY/{1}/Start_Time/{2}/End_Time/{3}/".format(settings.registered_mobile,settings.crm_key,start_time,end_time)
	session = get_request_session()
	try:
		d = session.get(url, data={},auth='', headers=None)
		d.raise_for_status()
		response = d.json()		
		if(len(response)>0 and "Error_Message" in response[0]):
			if response[0]["Error_Message"]!="There are no leads in the given time duration.please try for a different duration.":
				frappe.msgprint(_(response[0]["Error_Message"]), raise_exception=frappe.ValidationError)
			else:
				settings.last_sync_time = end_time
				settings.save()
		else:
			for opportunity in response:
				opp_name = frappe.db.get_value("Opportunity", {"indiamart_query_id": opportunity["QUERY_ID"]})
				if opp_name:
					continue 

				new_opportunity =frappe.get_doc({
					"doctype":"Opportunity",
					"indiamart_query_id":opportunity["QUERY_ID"],
					"indiamart_qtype":opportunity["QUERY_MODID"],
					"contact_email":opportunity["SENDEREMAIL"],
					"contact_mobile":opportunity["MOB"],
					"title":opportunity["SUBJECT"],
					"customer_name":opportunity["SENDERNAME"],
					"opportunity_date":opportunity["DATE_RE"],
					"address_display":opportunity["ENQ_ADDRESS"],
					"enq_message":opportunity["ENQ_MESSAGE"],
					"source":"IndiaMart"
				})
				result = make_new_lead_if_required(opportunity)				
				new_opportunity.opportunity_from=result[0]
				new_opportunity.party_name = result[1]
				new_opportunity.insert()
			
			settings.last_sync_time = end_time
			settings.save()

	except Exception as e:
		#print(frappe.get_traceback())		
		frappe.log_error(frappe.get_traceback())
		

def make_new_lead_if_required(opportunity):
	"""Set lead against new opportunity"""
	#if opportunity["SENDEREMAIL"]:
	# check if customer is already created agains the self.contact_email
	customer = frappe.db.sql("""select
		distinct `tabDynamic Link`.link_name as customer
		from
			`tabContact`,
			`tabDynamic Link`
		where `tabContact`.email_id='{0}'
		and
			`tabContact`.name=`tabDynamic Link`.parent
		and
			ifnull(`tabDynamic Link`.link_name, '')<>''
		and
			`tabDynamic Link`.link_doctype='Customer'
	""".format(opportunity["SENDEREMAIL"]), as_dict=True)
	if customer and customer[0].customer:
		party_name = customer[0].customer
		opportunity_from = "Customer"
		return opportunity_from,party_name

	if opportunity["SENDEREMAIL"] is not None:
		lead_name = frappe.db.get_value("Lead", {"email_id": opportunity["SENDEREMAIL"]})
	else:
		lead_name=""

	if not lead_name:
		sender_name = opportunity["SENDERNAME"]
		lead = frappe.get_doc({
			"doctype": "Lead",
			"email_id": (opportunity["SENDEREMAIL"] if opportunity["SENDEREMAIL"] else ""),
			"source":"IndiaMart",
			"lead_name": sender_name or 'Unknown',
			"mobile_no":opportunity["MOB"],
			"company_name":opportunity["GLUSR_USR_COMPANYNAME"],
			"organization_lead": 1 if opportunity["GLUSR_USR_COMPANYNAME"] else 0
		})
		#lead.flags.ignore_email_validation = True
		lead.insert(ignore_permissions=True)
		lead_name = lead.name
		create_contact(opportunity,lead_name)
		create_address(opportunity,lead_name)

	opportunity_from = "Lead"
	party_name = lead_name
	return opportunity_from,party_name

def create_contact(enquiry,lead_name):
	contact = frappe.get_doc({
		"doctype":"Contact",
		"first_name":enquiry["SENDERNAME"],
		"email_id":enquiry["SENDEREMAIL"],
		"mobile_no":enquiry["MOB"]
	})

	email_ids_obj = {}
	if(enquiry["SENDEREMAIL"]):
		contact.append('email_ids',{"email_id":enquiry["SENDEREMAIL"],"is_primary":1})

	if(enquiry["EMAIL_ALT"]):
		contact.append('email_ids',{"email_id":enquiry["EMAIL_ALT"],"is_primary":0})

	phone_nos_object={}
	if(enquiry["MOB"]):
		contact.append('phone_nos',{"phone":enquiry["MOB"],"is_primary_mobile":1})
	
	if(enquiry["PHONE"]):
		contact.append('phone_nos',{"phone":enquiry["PHONE"],"is_primary_phone":1})
	
	if(enquiry["MOBILE_ALT"]):
		contact.append('phone_nos',{"phone":enquiry["MOBILE_ALT"],"is_primary_phone":0,"is_primary_mobile":0})
	
	if(enquiry["PHONE_ALT"]):
		contact.append('phone_nos',{"phone":enquiry["PHONE_ALT"],"is_primary_phone":0,"is_primary_mobile":0})
	
	#contact.append('email_ids',email_ids_obj)
	#contact.append('phone_nos',phone_nos_object)
	contact.append("links",{"link_doctype":"Lead","link_name":lead_name})
	contact.insert(ignore_mandatory=True,ignore_permissions=True)
	

def create_address(enquiry,lead_name):
	address = frappe.get_doc({
		"doctype":"Address",
		"address_type":"Billing",
		"address_line1":enquiry["ENQ_ADDRESS"],
		"city":enquiry["ENQ_CITY"],
		"state":enquiry["ENQ_STATE"],
		"country": "India" if enquiry["COUNTRY_ISO"]=="IN" else ""
	})
	address.append("links",{"link_doctype":"Lead","link_name":lead_name})
	address.insert(ignore_mandatory=True,ignore_permissions=True)