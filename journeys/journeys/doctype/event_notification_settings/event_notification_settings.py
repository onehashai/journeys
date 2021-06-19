# -*- coding: utf-8 -*-
# Copyright (c) 2021, OneHash Inc and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
import datetime
import re
from frappe.core.doctype.sms_settings.sms_settings import send_sms
from frappe.utils import (getdate, cint, add_months, date_diff, add_days,
	nowdate, get_datetime_str, cstr, get_datetime, now_datetime, format_datetime)

class EventNotificationSettings(Document):
	pass


def event_reminder():
    try:
        system_notification_enabled = frappe.get_value("Event Notification Settings", "Event Notification Settings", "system_notification")
        email_notification_enabled = frappe.get_value("Event Notification Settings", "Event Notification Settings", "email_notification")
        if not system_notification_enabled and not email_notification_enabled:
            return
        events = frappe.get_all("Event", filters=[
                ['starts_on', '<', frappe.utils.now_datetime()+datetime.timedelta(minutes=10)],
                ['starts_on', '>=', frappe.utils.now_datetime()]
            ])
        for event in events:
            event = frappe.get_doc("Event", event.get("name"))
            event_participants = event.event_participants
            if event_participants:
                for participant in event_participants:
                    if participant.reference_doctype == "Lead":
                        lead = frappe.get_doc("Lead", participant.reference_docname)
                        if lead.contact_by:
                            mob_user = frappe.get_doc("User", lead.contact_by)
                            contact_number = []
                            if mob_user.mobile_no:
                                contact_number.append(mob_user.mobile_no)
                            if mob_user.phone:
                                contact_number.append(mob_user.phone)
                            trigger_notification(user = lead.contact_by, number = contact_number, msg = event, party = "internal", emp = mob_user.full_name, client = lead.lead_name)
                        if lead.email_id:
                            trigger_notification(user = lead.email_id, msg = event, party = "external", emp = mob_user.full_name, client = lead.lead_name)
                        contact_number = []
                        if lead.mobile_no:
                            contact_number.append(lead.mobile_no)
                        if lead.phone:
                            contact_number.append(lead.phone)
                        if contact_number:
                            trigger_notification(number = contact_number, msg = event, party = "external", emp = mob_user.full_name, client = lead.lead_name)


                    elif participant.reference_doctype == "Contact":
                        user, contact_number, client = get_contact_details(contact_name = participant.reference_docname)
                        trigger_notification(user = user, number = contact_number, msg = event, party = "external", emp = None, client = client)
                    
                    elif participant.reference_doctype == "Customer":
                        user, contact_number, client = get_customer_details(customer_name = participant.reference_docname)
                        trigger_notification(user = user, number = contact_number, msg = event, party = "external", emp = None, client = client)

                    elif participant.reference_doctype == "Opportunity":
                        opp = frappe.get_doc("Opportunity", participant.reference_docname)
                        if opp.contact_by:
                            mob_user = frappe.get_doc("User", opp.contact_by)
                            contact_number = []
                            if mob_user.mobile_no:
                                contact_number.append(mob_user.mobile_no)
                            if mob_user.phone:
                                contact_number.append(mob_user.phone)
                            trigger_notification(user=opp.contact_by, number = contact_number, msg = event, party = "internal", emp = mob_user.full_name, client = opp.customer_name)
                        if opp.opportunity_from == "Customer":
                            user, contact_number, client = get_customer_details(customer_name = opp.party_name)
                            trigger_notification(user = user, number = contact_number, msg = event, party = "external", emp = mob_user.full_name, client = client)
                        elif opp.opportunity_from == "Lead":
                            lead = frappe.get_doc("Lead", opp.party_name)
                            if lead.email_id:
                                trigger_notification(user = lead.email_id, msg = event, party = "external", emp = None, client = lead.lead_name)
                            contact_number = []
                            if lead.mobile_no:
                                contact_number.append(lead.mobile_no)
                            if lead.phone:
                                contact_number.append(lead.phone)
                            if contact_number:
                                trigger_notification(number = contact_number, msg = event, party = "external",  emp = mob_user.full_name, client = client)
    except Exception as e:
        frappe.log_error(frappe.get_traceback())
        
def trigger_notification(user= None, number = None, msg=None, party="external", emp = None, client = None):
    system_notification_enabled = frappe.get_value("Event Notification Settings", "Event Notification Settings", "system_notification")
    email_notification_enabled = frappe.get_value("Event Notification Settings", "Event Notification Settings", "email_notification")
    msg = msg.as_dict()
    msg["starts_on"] = format_datetime(msg["starts_on"], 'hh:mm a')
    msg["emp"] = emp if emp else None
    msg["client"] = client if client else None
    if party == "internal":
        if user:
            if system_notification_enabled:
                frappe.publish_realtime(event='msgprint',message="Hi {}, you have an upcoming event at {} with {}.".format(msg["emp"], msg["starts_on"], msg["client"]),user=user)
            comm_list = frappe.get_list("Communication", {"reference_doctype": "Event", "reference_name": msg.name})
            if comm_list:
                comm = comm_list[0]
            comm = frappe.get_doc("Communication", comm)
            comm.read_receipt = 1
            comm.save(ignore_permissions=True)
            if email_notification_enabled:
                frappe.sendmail(
                recipients=user,
                subject=frappe._("Upcoming Event with {}".format(msg["client"])),
                template="upcoming_event_internal",
                args={
                    'events': [msg],
                },
                header=[frappe._("Upcoming Event Alert!"), 'blue'],
                communication = comm.name
                )
        if number:
            message = "Hey {}\nYou have an upcoming {} with {}.\n- Team OneHash".format(msg["emp"]+",", \
            (msg["event_category"] if msg["event_category"] not in ["Sent/Received Email", "Other"] else "Event")+" at "+ msg["starts_on"],\
            msg["client"])
            send_sms(list(set(number)), message)
    
    elif party == "external":
        email_id = ""
        description = msg["description"]
        if description:
            reg = re.findall(r"[A-Za-z0-9._%+-]+"
                            r"@[A-Za-z0-9.-]+"
                            r"\.[A-Za-z]{2,4}", description)
            if reg:
                email_id = reg[0]
                msg["email_id"] = email_id
            else:
                msg["email_id"] = frappe.local.site
        if user:
            if not emp:
                msg["emp"] = msg["email_id"]
            if system_notification_enabled:
                frappe.publish_realtime(event='msgprint',message="Hi {}, you have an upcoming event at {} with {}.".format(msg["client"], msg["starts_on"], msg["emp"]),user=user)
            # email_template = frappe.get_doc("Email Template", "External Notification")
            # message = frappe.render_template(email_template.response, msg)
            #create new communication to link with external email_queue
            comm = frappe.new_doc("Communication")
            comm.update({
                "subject": "Notify " + str(client),
                "communication_type" : "Notification",
                "status": "Linked",
                "sent_or_received": "Sent",
                "read_receipt": 1,
                "reference_doctype": "Event",
                "reference_name": msg.name
            })
            comm.insert(ignore_permissions=True)
            
            # frappe.sendmail(
            #     recipients=user,
            #     subject = email_template.subject,
            #     message = message,
            #     header=[frappe._("Upcoming Event Alert"), 'blue'],
            #     communication=comm.name
            # )
            if email_notification_enabled:
                frappe.sendmail(
                recipients=user,
                subject=frappe._("Upcoming Event with {}".format(msg["emp"])),
                template="upcoming_event_external",
                args={
                    'events': [msg],
                },
                header=[frappe._("Upcoming Event Alert!"), 'blue'],
                communication = comm.name
                )
        if number:
            message = "Hey {}\nYou have an upcoming {} with {}.\n- Team OneHash".format(msg["client"]+",", \
            (msg["event_category"] if msg["event_category"] not in ["Sent/Received Email", "Other"] else "Event")+" at "+ msg["starts_on"],\
            msg["emp"])
            send_sms(list(set(number)), message)

def get_contact_details(contact_name):
    contact = frappe.get_doc("Contact", contact_name)
    full_name = str(contact.first_name) + str(contact.last_name)
    user = None
    if contact.email_id:
        user = contact.email_id
    elif contact.user:
        user = contact.user
    number = [doc.phone for doc in contact.phone_nos]
    return [user, number, full_name]

def get_customer_details(customer_name):
    customer = frappe.get_doc("Customer", customer_name)
    if customer.customer_primary_contact:
        user, contact_number, full_name = get_contact_details(contact_name = customer.customer_primary_contact)
        return [user, contact_number, full_name]


