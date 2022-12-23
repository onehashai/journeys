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
	#	if not (self.crm_key and self.registered_mobile):
		if not (self.crm_key):
			frappe.msgprint(_("Missing value for CRM Key or Registered Mobile"), raise_exception=frappe.ValidationError)

	def validate_request(self):
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

		# url = "https://mapi.indiamart.com/wservce/enquiry/listing/GLUSR_MOBILE/{0}/GLUSR_MOBILE_KEY/{1}/".format(self.registered_mobile,self.crm_key)
		# url =   "https://mapi.indiamart.com/wservce/crm/crmListing/v2/?glusr_crm_key={0}/start_time={1}/end_time={2}/".format(self.crm_key,'21-Dec-2022','21-Dec-2022')
		# url = "https://mapi.indiamart.com/wservce/crm/crmListing/v2/?glusr_crm_key={0}".format(self.crm_key)
		url = "https://mapi.indiamart.com/wservce/crm/crmListing/v2/?glusr_crm_key={0}&start_time={1}&end_time={2}".format(settings.crm_key,start_time,end_time)
		# url = "http://localhost/deetee/indiamart.json?glusr_crm_key=mR20E71p4H7AQfep5nWN7liKoVrAnjVj&start_time=19-Dec-2022&end_time=21-DEC-2022"
		
		session = get_request_session()
		# d = session.get(url, data={},auth='', headers=None)
		# d.raise_for_status()
		# response = d.json()	
		
		try:
			d = session.get(url, data={},auth='', headers=None)
			d.raise_for_status()
			response = d.json()		
			# frappe.log_error(response)
			if(response!=[] and response["RESPONSE"]):
				frappe.msgprint(_(response["RESPONSE"]), raise_exception=frappe.ValidationError)
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

#	url = "https://mapi.indiamart.com/wservce/enquiry/listing/GLUSR_MOBILE/{0}/GLUSR_MOBILE_KEY/{1}/Start_Time/{2}/End_Time/{3}/".format(settings.registered_mobile,settings.crm_key,start_time,end_time)
#	url = "https://mapi.indiamart.com/wservce/crm/crmListing/v2/?glusr_crm_key=mR20E71p4H7AQfep5nWN7liKoVrAnjVj&start_time=01-Jan-2022&end_time=06-Jan-2022"
#	url = "https://mapi.indiamart.com/wservce/crm/crmListing/v2/?glusr_crm_key={1}/start_time={2}/end_time={3}".format(settings.registered_mobile,settings.crm_key,start_time,end_time)
 	
	url = "https://mapi.indiamart.com/wservce/crm/crmListing/v2/?glusr_crm_key={0}&start_time={1}&end_time={2}".format(settings.crm_key,start_time,end_time)
	
	# url = "https://mapi.indiamart.com/wservce/crm/crmListing/v2/?glusr_crm_key={0}&start_time=19-Dec-2022&end_time=21-DEC-2022".format(settings.crm_key,start_time,end_time)
	
#	frappe.log_error(url)
	session = get_request_session()
	try:
		d = session.get(url, data={},auth='', headers=None)
		d.raise_for_status()
		response = d.json()	
		# frappe.log_error(response['MESSAGE'],'tesponsev testing')
		
		
		if(len(response)>0):
			if(response["STATUS"]=="FAILURE"): 
				if(response["MESSAGE"]!="There are no leads in the given time duration. please try for a different duration."): 
					frappe.msgprint(_(response["MESSAGE"]), raise_exception=frappe.ValidationError)
				elif response["MESSAGE"]!="It is advised to hit this API once in every 5 minutes,but it seems that you have crossed this limit. Please try again after 5 minutes.":
					frappe.msgprint(_(response["MESSAGE"]), raise_exception=frappe.ValidationError)
			else:
				settings.last_sync_time = end_time
				settings.save()
				# else:
				# frappe.log_error(response["RESPONSE"],"responsedsbf")
				# if(len(response)>0 and response['STATUS']=='FAILURE'):
				
				# if(response['STATUS']=='FAILURE'):
				# 	if response["MESSAGE"]!="There are no leads in the given time duration.please try for a different duration.":
				# 		frappe.msgprint("Diffrenct duration")
				# 		# frappe.msgprint(_(response["MESSAGE"]), raise_exception=frappe.ValidationError)
				# 	if response["MESSAGE"]!="It is advised to hit this API once in every 5 minutes,but it seems that you have crossed this limit. Please try again after 5 minutes.":
				# 		frappe.msgprint("5 minutes error")
				# 	else:
				# 		settings.last_sync_time = end_time
				# 		settings.save()
					# if (len(response)>0):
					# frappe.log_error("ho Gya")
					# frappe.log_error(response["RESPONSE"],"responsedsbf")
			for opportunity in response["RESPONSE"]:
				# frappe.log_error(opportunity)
				opp_name = frappe.db.get_value("Opportunity", {"indiamart_query_id": opportunity["UNIQUE_QUERY_ID"]})
				if opp_name:
					continue 

				new_opportunity =frappe.get_doc({
					"doctype":"Opportunity",
					"indiamart_query_id":opportunity["UNIQUE_QUERY_ID"],
					"indiamart_qtype":opportunity["QUERY_TYPE"],
					"contact_email":opportunity["SENDER_EMAIL"],
					"contact_mobile":opportunity["SENDER_MOBILE"],
					"title":opportunity["SUBJECT"],
					"customer_name":opportunity["SENDER_COMPANY"],
					"opportunity_date":opportunity["QUERY_TIME"],
					"address_display":opportunity["SENDER_ADDRESS"],
					"enq_message":opportunity["QUERY_MESSAGE"],
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
	""".format(opportunity["SENDER_EMAIL"]), as_dict=True)
	if customer and customer[0].customer:
		party_name = customer[0].customer
		opportunity_from = "Customer"
		return opportunity_from,party_name

	if opportunity["SENDER_EMAIL"] is not None:
		lead_name = frappe.db.get_value("Lead", {"email_id": opportunity["SENDER_EMAIL"]})
	else:
		lead_name=""

	if not lead_name:
		sender_name = opportunity["SENDER_NAME"]
		lead = frappe.get_doc({
			"doctype": "Lead",
			"email_id": (opportunity["SENDER_EMAIL"] if opportunity["SENDER_EMAIL"] else ""),
			"source":"IndiaMart",
			"lead_name": sender_name or 'Unknown',
			"mobile_no":opportunity["SENDER_MOBILE"],
			"company_name":opportunity["SENDER_COMPANY"],
			# "organization_lead": 1 if opportunity["GLUSR_USR_COMPANYNAME"] else 0
			"organization_lead": 1 if opportunity["SENDER_COMPANY"] else 0
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
		"first_name":enquiry["SENDER_NAME"],
		"email_id":enquiry["SENDER_EMAIL"],
		"mobile_no":enquiry["SENDER_MOBILE"]
	})

	email_ids_obj = {}
	if(enquiry["SENDER_EMAIL"]):
		contact.append('email_ids',{"email_id":enquiry["SENDER_EMAIL"],"is_primary":1})

	if(enquiry["SENDER_EMAIL_ALT"]):
		contact.append('email_ids',{"email_id":enquiry["SENDER_EMAIL_ALT"],"is_primary":0})

	phone_nos_object={}
	if(enquiry["SENDER_MOBILE"]):
		contact.append('phone_nos',{"phone":enquiry["SENDER_MOBILE"],"is_primary_mobile":1})
	
	if(enquiry["SENDER_PHONE"]):
		contact.append('phone_nos',{"phone":enquiry["SENDER_PHONE"],"is_primary_phone":1})
	
	if(enquiry["SENDER_MOBILE_ALT"]):
		contact.append('phone_nos',{"phone":enquiry["SENDER_MOBILE_ALT"],"is_primary_phone":0,"is_primary_mobile":0})
	
	if(enquiry["SENDER_PHONE_ALT"]):
		contact.append('phone_nos',{"phone":enquiry["SENDER_PHONE_ALT"],"is_primary_phone":0,"is_primary_mobile":0})
	
	#contact.append('email_ids',email_ids_obj)
	#contact.append('phone_nos',phone_nos_object)
	contact.append("links",{"link_doctype":"Lead","link_name":lead_name})
	contact.insert(ignore_mandatory=True,ignore_permissions=True)
	

def create_address(enquiry,lead_name):
	address = frappe.get_doc({
		"doctype":"Address",
		"address_type":"Billing",
		"address_line1":enquiry["SENDER_ADDRESS"],
		"city":enquiry["SENDER_CITY"],
		"state":enquiry["SENDER_STATE"],
		"country": "India" if enquiry["SENDER_COUNTRY_ISO"]=="IN" else ""
	})
	address.append("links",{"link_doctype":"Lead","link_name":lead_name})
	address.insert(ignore_mandatory=True,ignore_permissions=True)