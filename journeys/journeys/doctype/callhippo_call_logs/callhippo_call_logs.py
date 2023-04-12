# Copyright (c) 2023, OneHash Inc and contributors
# For license information, please see license.txt

from frappe.model.document import Document
import pytz
import frappe
import frappe.utils
import hashlib
import hmac
import json
import requests
import base64
from datetime import datetime
from frappe.core.doctype.communication.email import make
from werkzeug.wrappers import Response
from frappe.integrations.utils import make_get_request, make_post_request, create_request_log


class CallHippoCallLogs(Document):
	pass

# Fetch All Call Logs of CallHippo
@frappe.whitelist(allow_guest=True)
def add_callhippo_logs():

	call_log=frappe.form_dict
	if (call_log['to']=='+11111111111'):
		frappe.log_error("","Connected with CallHippo")
	else :
		frappe.log_error(call_log,"call_log")
		data = {
			"doctype": "CallHippo Call Logs",
			"to": call_log['to'],
			"from": call_log['from'],
			"status": call_log['status'],
			"call_charge": call_log['callCharge'],
			"caller_name": call_log.get('callerName', ''),
			"admin_email": call_log['adminEmail'],
			"call_sid": call_log['callSid'],
			"country": call_log['countryName'],
			"answered_device": call_log['answeredDevice'],
			"hangup_by": call_log['hangupBy'],
			"call_queue": call_log['callQueue'],
			"reason": call_log.get('reason', ''),
			"start_time": format_callhippo_to_onehash_date(call_log['startTime']),
			"end_time": format_callhippo_to_onehash_date(call_log['endTime']),
			"call_type":call_log['callType'],
			"caller_email":call_log['email'],
			"ring_answer_duration": call_log['ringAnswerDuration'],
			"billed_minutes": call_log['billedMinutes'],
			"time": format_callhippo_to_onehash_date(call_log['time']),
			"call_duration": call_log['duration'],
			"call_recording": call_log.get('recordingUrl', ''),
			"note": call_log.get('note', '')

		}
		frappe.get_doc(data).insert(ignore_permissions=True)

# Saving CallHippo time to onehash time
@frappe.whitelist(allow_guest=True)
def format_callhippo_to_onehash_date(start_time):

    # Get the timezone from system settings
    timezone =  frappe.db.get_single_value("System Settings", "time_zone")

    # Parse the UTC datetime string into a datetime object
    utc_time = datetime.strptime(start_time, '%Y-%m-%dT%H:%M:%S.%fZ')

    # Set the timezone for the datetime object
    localized_time = pytz.utc.localize(utc_time).astimezone(pytz.timezone(timezone))

    # Format the datetime object into a string
    start_time_formatted = localized_time.strftime('%Y-%m-%d %H:%M:%S.%f')

    return start_time_formatted