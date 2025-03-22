import frappe, json
from frappe import _
from frappe.utils.safe_exec import get_safe_globals
from frappe.utils import nowdate, add_to_date
from frappe.email.doctype.notification.notification import Notification, get_context
from journeys.journeys.doctype.wati_settings.wati_settings import send_whatsapp_message, send_template_message



class JourneyNotification(Notification):
    def validate(self):
        self.validate_wati_settings()

    def validate_wati_settings(self):
        if self.enabled and self.channel == "WhatsApp" \
            and not frappe.db.get_single_value("Wati Settings", "enabled"):
            frappe.throw(_("Please enable Wati settings to send WhatsApp messages"))

    def send(self, doc):
        context = get_context(doc)
        context = {"doc": doc, "alert": self, "comments": None}
        if doc.get("_comments"):
            context["comments"] = json.loads(doc.get("_comments"))

        if self.is_standard:
            self.load_standard_properties(context)

        try:
            if self.channel == 'WhatsApp':
                self.send_whatsapp_msg(doc, context)
        except:
            frappe.log_error(title='Failed to send notification', message=frappe.get_traceback())

        super(JourneyNotification, self).send(doc)

    def send_whatsapp_msg(self, doc, context):

        whatsapp_template = self.whatsapp_template

        if not whatsapp_template:
            return

        whatsapp_template = frappe.get_doc("WhatsApp Template", whatsapp_template)
        template_parameters = frappe.render_template(self.message, context)

        params = json.loads(template_parameters)
        for k, v in params.items():
            if v and v.strip() in ["print_format", "Print Format"] and self.attach_print and self.print_format != "":
                url = frappe.utils.get_url()+"/" + doc.doctype + "/" + doc.name + "?format=" + self.print_format + "&key=" + doc.get_signature()
                params[k] = url

        send_template_message(
            doc = doc,
            whatsapp_numbers=self.get_receiver_list(doc, context), 
            broadcast_name = whatsapp_template.broadcast_name,
            template_name = whatsapp_template.template_name, 
            template_parameters= params)

    def get_documents_for_today(self):
        '''get list of documents that will be triggered today'''
        docs = []

        diff_days = self.days_in_advance
        if self.event=="Days After":
            diff_days = -diff_days

        reference_date = add_to_date(nowdate(), days=diff_days)
        reference_date_start = reference_date + ' 00:00:00.000000'
        reference_date_end = reference_date + ' 23:59:59.000000'

        if self.event == "Every Year":
            doc_list = frappe.db.sql("""
            SELECT 
                name
            FROM
                tab{}
            WHERE
                {} like '%{}%'
            """.format(self.document_type, self.date_changed, nowdate()[4:]), as_dict=1
            )
        else:    
            doc_list = frappe.get_all(self.document_type,
                fields='name',
                filters=[
                    { self.date_changed: ('>=', reference_date_start) },
                    { self.date_changed: ('<=', reference_date_end) }
                ])

        for d in doc_list:
            doc = frappe.get_doc(self.document_type, d.name)

            if self.condition and not frappe.safe_eval(self.condition, None, get_context(doc)):
                continue

            docs.append(doc)

        return docs