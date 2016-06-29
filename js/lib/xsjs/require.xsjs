//Pass output to response
var myModule = $.require('./myModule');		
$.response.status = $.net.http.OK;
$.response.contentType = "application/json";
$.response.setBody(myModule.helloModule());