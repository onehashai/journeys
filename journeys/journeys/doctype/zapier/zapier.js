// Copyright (c) 2022, Frappe Technologies and contributors
// For license information, please see license.txt

frappe.ui.form.on('Zapier', {
	refresh: function(frm) {
		let found = false;
		// refresh when you click on a button which routes to other url(i.e not zapier doctype)
		let url = location.href;
document.body.addEventListener('click', ()=>{
	requestAnimationFrame(()=>{
	  if(url!==location.href){
		window.location.reload(true);
		url = location.href;
	  }
	});
}, true);
// when press back button refresh or clear cache
$(window).on('popstate', function(event) {
window.location.reload();
});
frm.add_custom_button("Connect", function(){
	
var script;
if(!found ){
	found = true;
	  script = document.createElement("script");
	  const stylesheet = document.createElement("link");
	  const element = document.createElement("zapier-full-experience");
	
script.type = "module";
script.src = "https://cdn.zapier.com/packages/partner-sdk/v0/zapier-elements/zapier-elements.esm.js";
document.head.appendChild(script);

// Load CSS

stylesheet.rel = "stylesheet";
stylesheet.href = "https://cdn.zapier.com/packages/partner-sdk/v0/zapier-elements/zapier-elements.css";
document.head.appendChild(stylesheet);
// Create and display zapier-full-experience
element.clientId = "2L9hiYHGrotVrOsyGI3LMCuFuok5UQfKFbU7eMcv";
element.target = "_blank";
element.theme = "light";
element.introCopyDisplay = "hide";
element.appSearchBarDisplay = "show";
const container = document.querySelector("#zapier-container") || document.body;
container.appendChild(element);


   

}  
});
frm.add_custom_button("Submit", function(){window.location.reload(); });

}
	
});


