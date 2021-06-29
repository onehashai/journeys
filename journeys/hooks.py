# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from . import __version__ as app_version

app_name = "journeys"
app_title = "Journeys"
app_publisher = "OneHash Inc"
app_description = "App to Show Usages Information and setting limits for user"
app_icon = "octicon octicon-file-directory"
app_color = "grey"
app_email = "support@onehash.ai"
app_license = "MIT"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/journeys/css/journeys.css"
# app_include_js = "/assets/journeys/js/journeys.js"

# include js, css files in header of web template
# web_include_css = "/assets/journeys/css/journeys.css"
# web_include_js = "/assets/journeys/js/journeys.js"

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

doctype_js = {
    'Lead': 'public/js/lead.js',
	'User': 'public/js/user.js'
}
# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
#	"Role": "home_page"
# }

# Website user home page (by function)
# get_website_user_home_page = "journeys.utils.get_home_page"

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Installation
# ------------

# before_install = "journeys.install.before_install"
# after_install = "journeys.install.after_install"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "journeys.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# Document Events
# ---------------
# Hook on document methods and events

doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
#	}
    "User":{
		"on_update": "journeys.limits.validate_user_limit"
	}
}

on_login = [
	"journeys.limits.check_if_expired"
]

before_write_file = "journeys.limits.validate_space_limit"

# Scheduled Tasks
# ---------------

scheduler_events = {
# 	"all": [
# 		"journeys.tasks.all"
# 	],
# 	"daily": [
#		"journeys.users.update_user_to_main_app"
# 	],
 	"hourly": [
 		"journeys.limits.update_space_usage",
		"journeys.limits.update_site_usage"
 	],
	 "cron": {
        "*/15 * * * *": [
            "journeys.journeys.doctype.indiamart_settings.indiamart_settings.sync_enquiry"
        ],
		"*/10 * * * *":[
			"journeys.journeys.doctype.event_notification_settings.event_notification_settings.event_reminder"
		]
    }
# 	"weekly": [
# 		"journeys.tasks.weekly"
# 	]
# 	"monthly": [
# 		"journeys.tasks.monthly"
# 	]	
}

# Testing
# -------

# before_tests = "journeys.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "journeys.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "journeys.task.get_dashboard_data"
# }

