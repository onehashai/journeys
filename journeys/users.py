from __future__ import unicode_literals
import frappe, json
from frappe import _
from frappe.utils import cstr
from frappe.utils import get_url
from frappe.utils.pdf import get_pdf
from PyPDF2 import PdfFileReader, PdfFileWriter
import io

def update_user_to_main_app():
    admin_site_name = "admin_onehash"
    #current_site_name = site.name
    current_site_name = cstr(frappe.local.site)
    frappe.init(site=current_site_name)
    frappe.connect()
    print("Connected to site="+str(current_site_name))
    enabled_system_users = frappe.get_all("User",fields=['name','email','last_active','user_type','enabled','first_name','last_name','creation'])
    print("All User Count for Site="+str(current_site_name)+" is "+str(len(enabled_system_users)))  

    frappe.destroy()
    frappe.init(site=admin_site_name)
    frappe.connect()        
    try:
        print("Trying to retrieve site="+str(current_site_name))
        site_doc = frappe.get_doc('Saas Site',current_site_name)
        site_doc.user_details = {}
    
        enabled_users_count = 0
        max_last_active = None
        for user in enabled_system_users:
            print("Trying to retrieve site="+str(current_site_name)+" User "+str(user.name))        
            if(user.name in ['Administrator','Guest']):
                continue

            site_doc.append('user_details', {
                'first_name': user.first_name,
                'last_name': user.last_name,
                'user_type': user.user_type,
                'active': user.enabled,
                'emai_id': user.email,
                'last_active':user.last_active
            })

            if(user.enabled):
                enabled_users_count = enabled_users_count + 1

            if(user.last_active==None):
                continue

            if(max_last_active==None):
                max_last_active = user.last_active
            elif(max_last_active<user.last_active):
                max_last_active = user.last_active

        site_doc.number_of_users =   (len(enabled_system_users)-2)
        site_doc.number_of_active_users= enabled_users_count
        site_doc.last_activity_time = max_last_active
        site_doc.save()
        frappe.db.commit()
        print("Site Doc Updated for site "+str(current_site_name))
    except Exception as e:
        print(e)
    finally:
        frappe.destroy()

@frappe.whitelist()
def get_attach_link(doc, print_format):
    doc = json.loads(doc)
    doc = frappe.get_doc(doc.get("doctype"), doc.get("docname"))
    url = get_url() + "/api/method/journeys.users.get_print_pdf?key=" + doc.get_signature() + "&doc="+doc.doctype + "&name="+ doc.name + "&printf=" + print_format
    return url

@frappe.whitelist(allow_guest=True)    
def get_print_pdf(key, doc, name, printf):
    if not key == frappe.get_doc(doc, name).get_signature():
        return
    html = frappe.get_print(doc, name, printf)
    frappe.local.response.filename = "{name}.pdf".format(name=name.replace(" ", "-").replace("/", "-"))
    content = get_pdf(html)

    output = io.BytesIO()
    output.write(content)
    output.seek(0)

    reader = PdfFileReader(output)
    writer = PdfFileWriter()

    writer.appendPagesFromReader(reader)
    metadata = reader.getDocumentInfo()
    writer.addMetadata(metadata)
    writer.addMetadata({
        '/Title': frappe.local.response.filename
    })

    tmp = io.BytesIO()
    writer.write(tmp)

    frappe.local.response.filecontent = tmp.getvalue()
    frappe.local.response.type = "pdf"