var conn = $.hdb.getConnection();
var XSDS = $.require("sap-cds").xsjs(conn);

//Import(Namespace,Entity Name, fields, options)
var oEmployee = XSDS.$importEntity("dev703", "MD.Employees");
var employee = null;
employee = oEmployee.$get({ EMPLOYEEID: "1" });

$.response.status = $.net.http.OK;
$.response.contentType = "application/json";
$.response.setBody(JSON.stringify(employee));