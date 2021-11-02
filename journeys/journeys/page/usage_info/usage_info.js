frappe.pages['usage-info'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Usage Info',
		single_column: true
	});
	var master_domain="https://app.onehash.ai";

	frappe.call({
		method: "journeys.limits.get_usage_info",
		callback: function(r) {
			var usage_info = r.message;
			master_domain = r.message.master_domain
			if (!usage_info) {
				// nothing to show
				// TODO improve this
				return;
			}
			let custom_domain = usage_info.custom_domain;
			let domain_status = usage_info.domain_status;
			let site_name = frappe.boot.sitename;
			let limits = usage_info.limits;
			let database_percent = (limits.space_usage.database_size / limits.space) * 100;
			let files_percent = (limits.space_usage.files_size / limits.space) * 100;
			let backup_percent = (limits.space_usage.backup_size / limits.space) * 100;
			let addon_limits = usage_info.addon_limits;

			let total_consumed = database_percent + files_percent + backup_percent;

			let last_part = backup_percent;
			if (total_consumed > 100) {
				last_part = backup_percent - (total_consumed - 100);
			}
			backup_percent = last_part;

			let usage_message = '';
			if (limits.space_usage.total > limits.space) {
				usage_message = __('You have used up all of the space allotted to you. Please buy more space in your subscription.');
			} else {
				let available = flt(limits.space - limits.space_usage.total, 2);
				usage_message = __('{0} available out of {1}', [(available + ' MB').bold(), (limits.space + ' MB').bold()]);
			}

			$(frappe.render_template("usage_info", Object.assign(usage_info, {
				database_percent,
				files_percent,
				backup_percent,
				usage_message,
				addon_limits,
				custom_domain,
				domain_status,
				site_name
			}))).appendTo(page.main);


			let formdata = "site_name="+frappe.boot.sitename;
			$.ajax({
				url:"https://"+master_domain+"/api/method/better_saas.www.add-on.get_addon",
				data: {"currency":frappe.boot.sysdefaults.currency},
				crossDomain:true,
				success: function(r) {
					if(r.message){
						$(page.main).find("#saas-addon").html(frappe.render_template("addons",{addon_list:r.message,addon_limits:addon_limits,master_domain:master_domain,site_name:site_name,currency:frappe.boot.sysdefaults.currency}));
					}
				},
				error:function(xhr,status,error){
					$(page.main).find("#saas-addon").html("Sorry, Could not load Addon.");
				}
			});

			
			$.ajax({
				url:"https://"+master_domain+"/api/method/better_saas.better_saas.doctype.saas_user.saas_user.get_promocode_benefits",
				data: formdata,
				crossDomain:true,
				success: function(r) {
					if(r.message){
						let is_lifetime = false;
						let coupon_count = r.message.length;
						$.each(r.message,(key,value)=>{
							if(value.no_expiry && limits.users==0){
								is_lifetime = true;
								$(page.main).find(".upgrade-message").addClass("hide");
								return false;
							}
						});
						$(page.main).find("#coupon-benefits").html(frappe.render_template("promocode",{coupon_codes:r.message,coupon_count:coupon_count}));
					}
				},
				error:function(xhr,status,error){
					$(page.main).find("#coupon-benefits").html("Sorry, Could not load the details.");
				}
			});

			var btn_text = usage_info.limits.users == 1 ? __("Upgrade") : __("Renew / Upgrade");
			$(page.main).find('.btn-upgrade').html(btn_text).on('click', () => {
				let open_link = (usage_info.upgrade_url)?usage_info.upgrade_url:("mailto:"+usage_info.support_email+"?subject=Upgrade Site");
				window.open(open_link);
			});
			var delete_text = "Delete " + (frappe.boot.sitename || "Site")
			$(page.main).find("#delete-action").html(delete_text);
			$(page.main).find('#delete-action').on('click', () => {
				frappe.confirm('Are you sure you want to continue? This action is Irreversible and will delete this site and all of your data.',
				() => {
					frappe.warn('Are you sure you want to proceed?',
						'All the data will be lost permanently.',
						() => {
							// action to perform if Continue is selected
							frappe.call({
								method: "journeys.journeys.delete_site.delete_site",
								callback: function (r) {
									if(r.message == "Success"){
										frappe.msgprint({
											title: __('Success'),
											indicator: 'green',
											message: __('Site will be deleted shortly.')
										});
									}else if(r.message == "Permission Error"){
										frappe.msgprint({
											title: __('Permission Error'),
											indicator: 'red',
											message: __('You do not have enough permission to perform this action.')
										});
									}else if(r.message == "Error"){
										frappe.msgprint({
											title: __('Error'),
											indicator: 'red',
											message: __('An error occurred. Please Retry.')
										});
									}
								}
							})
						},
						'Continue',
						false // Sets dialog as minimizable
					)
				}, () => {
					// action to perform if No is selected
				})
			});
			
			document.getElementById("warning-text").innerText = "Permanently delete OneHash Account and all the data.";
			$("#promocode-form").on("submit",function(){
				let formdata = $(this).serialize();
				
				formdata += "&site_name="+frappe.boot.sitename;
				$(".coupon").prop("disabled",true);
				$.ajax({
					url:"https://"+master_domain+"/api/method/better_saas.better_saas.doctype.saas_user.saas_user.apply_promocode",
					data: formdata,
					crossDomain:true,
					success: function(r) {
						if(r.message && r.message["success"]){
							$(".coupon").prop("disabled",false);
							$("#promo-validation-feedback").removeClass("invalid-feedback");
							$("#promo-validation-feedback").addClass("valid-feedback");
							$("#promo-validation-feedback").text(r.message["message"]);
							$("#promo-validation-feedback").show();
							setTimeout(() => {
								window.location.reload();	
							}, 2000);
						}
					},
					error:function(xhr,status,error){
						$(".coupon").prop("disabled",false);
						$("#promo-validation-feedback").show();
						message = JSON.parse(JSON.parse(xhr.responseJSON._server_messages)[0])["message"];
						$("#promo-validation-feedback").text(message);

					}
				});
			});

			$("#add-domain-form").on("submit",function(){
				let formdata = $(this).serialize();
				
				formdata += "&site_name="+frappe.boot.sitename+"&user="+frappe.session.user;
				$(".custom-domain").prop("disabled",true);
				$.ajax({
					url:"https://"+master_domain+"/api/method/better_saas.better_saas.doctype.saas_site.saas_site.add_custom_domain",
					data: formdata,
					crossDomain:true,
					success: function(r) {
						if(r.message){
							frappe.msgprint("Domain Added Successfully.<br>Please Add CNAME Record:"+frappe.boot.sitename);
							$(".custom-domain").prop("disabled",false);
							$("#domain-validation-feedback").removeClass("invalid-feedback");
							$("#domain-validation-feedback").addClass("valid-feedback");
							$("#domain-validation-feedback").text("Domain Added Successfully.<br>Please Add CNAME Record:"+frappe.boot.sitename);
							$("#domain-validation-feedback").show();
							setTimeout(() => {
								window.location.reload();	
							}, 2000);
						}
					},
					error:function(xhr,status,error){
						$(".custom-domain").prop("disabled",false);
						$("#domain-validation-feedback").show();
						message = JSON.parse(JSON.parse(xhr.responseJSON._server_messages)[0])["message"];
						$("#domain-validation-feedback").text(message);
					}
				});
			});

			$("#verify-domain").off("click").on("click",function(){
				let custom_domain = $(this).data("custom-domain");
				let formdata = "custom_domain="+custom_domain+"&site_name="+frappe.boot.sitename+"&user="+frappe.session.user;
				$(".custom-domain").prop("disabled",true);
				$.ajax({
					url:"https://"+master_domain+"/api/method/better_saas.better_saas.doctype.saas_site.saas_site.verify_domain",
					data: formdata,
					crossDomain:true,
					success: function(r) {
						if(r.message){
							frappe.msgprint("Domain Verification Request Received.");
							setTimeout(() => {
								window.location.reload();	
							}, 2000);
						} else{
							frappe.msgprint("Please Add CNAME Record to proceed.");
						}
					},
					error:function(xhr,status,error){
						$(".custom-domain").prop("disabled",false);
						$("#domain-validation-feedback").show();
						message = JSON.parse(JSON.parse(xhr.responseJSON._server_messages)[0])["message"];
						$("#domain-validation-feedback").text(message);
					}
				});
			});

			$("#remove-domain").off("click").on("click",function(){
				let custom_domain = $(this).data("custom-domain");
				let formdata = "custom_domain="+custom_domain+"&site_name="+frappe.boot.sitename+"&user="+frappe.session.user;
				
				frappe.warn(
					'Are you sure you want to continue?','This action is Irreversible, Users will not be able to access site with url: '+custom_domain,
					()=>{
						$(".custom-domain").prop("disabled",true);
						$.ajax({
							url:"https://"+master_domain+"/api/method/better_saas.better_saas.doctype.saas_site.saas_site.remove_custom_domain",
							data: formdata,
							crossDomain:true,
							success: function(r) {
								if(r.message){
									frappe.msgprint("Custom Domain Removed Successfully.");
									setTimeout(() => {
										window.location.reload();	
									}, 2000);
								} else{
									frappe.msgprint("Could not remove the domain.");
								}
							},
							error:function(xhr,status,error){
								message = JSON.parse(JSON.parse(xhr.responseJSON._server_messages)[0])["message"];
								frappe.msgprint(message);
							}
						});
					},
					'Continue',
					false
				);
				
			});
		}
	});




}