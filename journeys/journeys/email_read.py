from __future__ import unicode_literals, absolute_import
import frappe
from frappe.utils import  get_datetime
import frappe.email.smtp
from frappe import _

@frappe.whitelist(allow_guest=True)
def mark_email_as_seen(name=None, queue=None, recipient=None):
    try:
        if queue and recipient:
            queue_recipient = frappe.db.get_value('Email Queue Recipient', {'parent': queue, 'recipient': recipient}, ['name'])
            frappe.db.set_value("Email Queue Recipient", queue_recipient, "status", "Read")
        if name and frappe.db.exists("Communication", name) and not frappe.db.get_value("Communication", name, "read_by_recipient"):
            frappe.db.set_value("Communication", name, "read_by_recipient", 1)
            frappe.db.set_value("Communication", name, "delivery_status", "Read")
            frappe.db.set_value("Communication", name, "read_by_recipient_on", get_datetime())
        frappe.db.commit()
    except Exception:
        frappe.log_error(frappe.get_traceback())
    finally:
        # Return image as response under all circumstances
        from PIL import Image
        import io
        im = Image.new('RGBA', (1, 1))
        im.putdata([(255,255,255,0)])
        buffered_obj = io.BytesIO()
        im.save(buffered_obj, format="PNG")

        frappe.response["type"] = 'binary'
        frappe.response["filename"] = "imaginary_pixel.png"
        frappe.response["filecontent"] = buffered_obj.getvalue()
