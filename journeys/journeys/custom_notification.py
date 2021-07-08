import frappe
from frappe import _
from frappe.utils.safe_exec import get_safe_globals
from frappe.utils import nowdate, add_to_date
from frappe.email.doctype.notification.notification import Notification


class JourneyNotification(Notification):
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

def get_context(doc):
    return {"doc": doc, "nowdate": nowdate, "frappe": frappe._dict(utils=get_safe_globals().get("frappe").get("utils"))}
