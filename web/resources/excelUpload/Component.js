jQuery.sap.declare("sap.shineNext.excelUpload.Component");

sap.ui.core.UIComponent.extend("sap.shineNext.excelUpload.Component", {

	init: function(){
		jQuery.sap.require("sap.m.MessageBox");
		jQuery.sap.require("sap.m.MessageToast");		
		
	    var oModel = new sap.ui.model.odata.ODataModel(
		          "/xsodata/user2.xsodata/", true);
	    sap.ui.getCore().setModel(oModel, "userModel");  
		sap.ui.core.UIComponent.prototype.init.apply(this, arguments);
	},
	
	createContent: function() {

		var settings = {
				ID: "excelUpload",
				title: "Excel Upload Exercise",
				description: "SHINE Excel Upload Exercise"
			};
		
		var oView = sap.ui.view({
			id: "app",
			viewName: "sap.shineNext.excelUpload.view.App",
			type: "XML",
			viewData: settings
		});
		
		 oView.setModel(sap.ui.getCore().getModel("userModel"), "userModel");   
		return oView;
	}
});
