from __future__ import unicode_literals
from os import environ
import frappe, json, re
from frappe import _
from frappe.utils import cstr
from frappe.utils import get_url
from frappe.utils.pdf import get_pdf
from PyPDF2 import PdfFileReader, PdfFileWriter
import io, requests
from werkzeug.wrappers import Response, Request
from frappe.website.render import render
from bs4 import BeautifulSoup

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

@frappe.whitelist(allow_guest=True)    
def forms(path=None, referer=None):
    try:
        form = frappe.get_doc("Web Form", path)
        if not form.is_embeddable:
            resp = render("/message", http_status_code=200)
            data = resp.data
            soup = BeautifulSoup(data, 'html.parser')
            soup = minify(soup)
            msg = "<p>This Form is not Embeddable</p>"
            for i in soup.find_all('div',  {"class":"page-card-body"}):
                i.append(BeautifulSoup(msg, 'html.parser'))
            resp.data = soup.prettify()
            resp.headers["X-Frame-Options"] = "ALLOWALL"
            return resp

        if form.time_limit and (frappe.utils.get_datetime() > form.to_date or frappe.utils.get_datetime() < form.from_date):
            resp = render("/message", http_status_code=200)
            data = resp.data
            soup = BeautifulSoup(data, 'html.parser')
            soup = minify(soup)
            msg = "<p>Time Limit has exceeded to submit this form</p>"
            for i in soup.find_all('div',  {"class":"page-card-body"}):
                i.append(BeautifulSoup(msg, 'html.parser'))
            resp.data = soup.prettify()
            resp.headers["X-Frame-Options"] = "ALLOWALL"
            return resp
        doc_list_len = len(frappe.get_all("Web Form Log", {"form": path}))
        if form.restrict_number_of_submission not in [0,""] and form.restrict_number_of_submission <= doc_list_len:
            resp = render("/message", http_status_code=200)
            data = resp.data
            soup = BeautifulSoup(data, 'html.parser')
            soup = minify(soup)
            msg = "<p>Maximum Submission Limit has been reached for this Form</p>"
            for i in soup.find_all('div',  {"class":"page-card-body"}):
                i.append(BeautifulSoup(msg, 'html.parser'))
            resp.data = soup.prettify()
            resp.headers["X-Frame-Options"] = "ALLOWALL"
            return resp
        if frappe.local.request_ip:
            doc_list_len = len(frappe.get_all("Web Form Log", {"form": path, "ip_address": frappe.local.request_ip}))
            if form.restrict_submission_per_ip not in [0, ""] and form.restrict_submission_per_ip <= doc_list_len:
                resp = render("/message", http_status_code=200)
                data = resp.data
                soup = BeautifulSoup(data, 'html.parser')
                soup = minify(soup)
                msg = "<p>Maximum Submission Limit has been reached for this Form against your IP Address</p>"
                for i in soup.find_all('div',  {"class":"page-card-body"}):
                    i.append(BeautifulSoup(msg, 'html.parser'))
                resp.data = soup.prettify()
                resp.headers["X-Frame-Options"] = "ALLOWALL"
                return resp
        city = region = country = loc = None
        if form.collect_geo_location and frappe.local.request_ip:
            url = "https://ipinfo.io/" + str(frappe.local.request_ip)
            res = requests.get(url)
            if res.status_code in [200, "200"]:
                data = json.loads(res.text)
                city = data.get("city")
                region = data.get("region")
                country = data.get("country")
                loc = data.get("loc")

        record = frappe.get_doc({
            "doctype": "Web Form Log",
            "form": path,
            "doc_type": form.doc_type,
            "module": form.module,
            "geo_location": "",
            "city": city,
            "region": region,
            "country": country,
            "geo_location": loc,
            "ip_address": frappe.local.request_ip if form.collect_ip_address else "",
            "referer": referer or ""
        })
        record.insert(ignore_permissions=True)
        frappe.db.commit()
        if not path:
            if frappe.local.request.__dict__.get("environ").get("HTTP_REFERER") != frappe.local.request.__dict__.get("url"):
                path = frappe.local.request.__dict__.get("environ").get("HTTP_REFERER")
                try:
                    # Python 3
                    from urllib.parse import urlparse, parse_qs
                except ImportError:
                    # Python 2
                    from urlparse import urlparse, parse_qs

                o = urlparse(path)
                query = parse_qs(o.query)
                path = query.get("path")[0] if query.get("path") else ""

        resp = render("/"+form.route, http_status_code=200)
        resp.headers["X-Frame-Options"] = "ALLOWALL"

        data = resp.data

        soup = BeautifulSoup(data, 'html.parser')
        soup = minify(soup)
        soup.find('body').attrs["data-path"] += "?path=" + path
        #soup.find(text=re.compile('is_chat_enabled')).replace_with(soup.find(text=re.compile('is_chat_enabled'))[:-29])
        resp.data = soup.prettify()
        return resp
    except:
        frappe.log_error(frappe.get_traceback(), "Embeddable Form {} Error".format(path))

def minify(soup):    
    for n in soup.find_all('nav'):
        n.decompose()
    for f in soup.find_all('footer'):
        f.decompose()
    for g in soup.find_all('meta',  {"name":"url"}):
        g.decompose()
    for h in soup.find_all('meta',  {"property":"og:url"}):
        h.decompose()
    for i in soup.find_all('link',  {"rel":"canonical"}):
        i.decompose()
    return soup
