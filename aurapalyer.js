/*\
 |*|  :: cookies.js ::
 |*|  A complete cookies reader/writer framework with full unicode support.
 |*|  https://developer.mozilla.org/en-US/docs/DOM/document.cookie
 |*|
 |*|  This framework is released under the GNU Public License, version 3 or later.
 |*|  http://www.gnu.org/licenses/gpl-3.0-standalone.html
 |*|
 |*|  Syntaxes:
 |*|  * docCookies.setItem(name, value[, end[, path[, domain[, secure]]]])
 |*|  * docCookies.getItem(name)
 |*|  * docCookies.removeItem(name[, path], domain)
 |*|  * docCookies.hasItem(name)
 |*|  * docCookies.keys()
 \*/

 var docCookies = {
    getItem: function (sKey) {
        return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
    },
    setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
        if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) {
            return false;
        }
        var sExpires = "";
        if (vEnd) {
            switch (vEnd.constructor) {
                case Number:
                    sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
                    break;
                case String:
                    sExpires = "; expires=" + vEnd;
                    break;
                case Date:
                    sExpires = "; expires=" + vEnd.toUTCString();
                    break;
            }
        }
        document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
        return true;
    },
    removeItem: function (sKey, sPath, sDomain) {
        if (!sKey || !this.hasItem(sKey)) {
            return false;
        }
        document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + ( sDomain ? "; domain=" + sDomain : "") + ( sPath ? "; path=" + sPath : "");
        return true;
    },
    hasItem: function (sKey) {
        return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
    },
    keys: /* optional method: you can safely remove it! */ function () {
        var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
        for (var nIdx = 0; nIdx < aKeys.length; nIdx++) {
            aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]);
        }
        return aKeys;
    }
};

function clearTextFields() {
    $("textarea").each(function (index) {
        $(this).val("")
    });
    $("[type=text]").each(function (index) {
        $(this).val("")
    });
}
function clearInputFields() {
    $("[type=input]").each(function (index) {
        $(this).val("")
    });
}

function clearOutputFields() {
    if (showStatusMessages) {
        clearStatusMessages();
    }
    
    $(".output_value").val("");		// clear the regular fields
    var table = document.getElementById('tableOutput');		// clear output table

    if (table != null) {
        for (var i = table.rows.length - 1; i > 0; i--) {
            table.deleteRow(i);
        }
    }
}

function getInputFieldsAsQueryString() {
    var dataArray = new Array();
    if (useSessionStorage) {
        saveUserData();
        for (var i = 0; i < sessionStorage.length; i++) {
        	var key = sessionStorage.key(i);
        	var value = sessionStorage.getItem(key);
            if (key.indexOf("ls.") === -1 &&
                key.indexOf("serviceManagerLocalStorage.") === -1) {
                dataArray.push(key + "=" + (value === null ? "" : value));
            }
        }
    } else {
        for (var index = 0; index < inputElementsArray.length; index++) {
            var itemId = inputElementsArray[index].id;
            if (itemId == null || itemId.length == 0)
                continue;
            var itemValue = encodeURIComponent(inputElementsArray[index].value);
            dataArray.push(itemId + "=" + (itemValue.length > 0 ? itemValue : "null"));
        }
    }
    return dataArray.join("&");
}

function _populateCheckboxHTML(fieldElement, fieldValue) {
	fieldElement.checked = ("" + fieldValue == "true");
	fieldElement.previousSibling.className = fieldElement.previousSibling.className.replace("ui-checkbox-on", "").replace("ui-checkbox-off", "");
	fieldElement.previousSibling.className += (fieldElement.checked ? "ui-checkbox-on" : "ui-checkbox-off");
}

function _applyConverterFunction(fieldId, fieldValue) {
	var converter = window['convert_' + fieldId];
	return typeof converter === "function" ? converter(fieldValue) : fieldValue;
}

function _populateFieldCommon(fieldElement, fieldValue) {
	try {
        var nodeName = fieldElement.nodeName;
    	if (nodeName === "INPUT") {
    		if (fieldElement.type === "checkbox") {
    			_populateCheckboxHTML(fieldElement, fieldValue);
    		} else {
    			fieldElement.value = fieldValue;
    		}
    	} else if (nodeName === "TEXTAREA") {
            fieldElement.value = fieldValue;
        } else if (nodeName === "DIV" || nodeName === "LABEL") {
            fieldElement.innerHTML = fieldValue;
        } else if (nodeName === "A") {
        	
        	if (fieldElement.href.indexOf("tel:") === 0) {
        		fieldElement.innerHTML = fieldValue;
        		fieldElement.href = "tel:" + fieldValue;
        	} else { //link
        		fieldElement.innerHTML = _applyConverterFunction(fieldElement.id, fieldValue);
        		fieldElement.href = fieldElement.innerHTML;
        	}
        }
    } catch (e) {}
}

//set or add value to input fields and to session data
function populateField(fieldName, fieldValue, fieldPostfix) {
    var fieldElement;

    if (typeof(fieldPostfix) !== 'undefined') {
        fieldElement = document.getElementById(fieldName + fieldPostfix);
    }

    if (typeof(fieldElement) === 'undefined' || fieldElement == null) {
        fieldElement = document.getElementById(fieldName);
    }

    if (typeof(fieldElement) === 'undefined' || fieldElement == null) {
        if (useSessionStorage && typeof(fieldValue) !== 'undefined') {
            sessionStorage.setItem(fieldName, fieldValue);
            sessionStorage.setItem(fieldName + fieldPostfix, fieldValue);
            return;
        } else {
            fieldElement = addHiddenField(fieldName);
        }
    }

    if (typeof(fieldValue) !== "undefined") {
    	_populateFieldCommon(fieldElement, fieldValue);
    }

    try {
        if (useSessionStorage) {
            sessionStorage.setItem(fieldName, fieldValue);
        } else {
            //push into inputElementsArray
            var objExist = inputElementsArray.indexOf(fieldElement);
            if (objExist < 0) {
                inputElementsArray.push(fieldElement);
            }
        }
    } catch (e) {}
}

//set or add value to HTML ONLY input fields
function populateFieldHTML(fieldName, fieldValue, fieldPostfix) {
    var fieldElement;
    if (fieldPostfix != undefined)
        fieldElement = document.getElementById(fieldName + fieldPostfix);
    if (fieldElement == undefined)
        fieldElement = document.getElementById(fieldName);
    if (fieldElement == undefined || fieldElement == null) {
        return;
    }
    _populateFieldCommon(fieldElement, fieldValue);
}

function setDefaultValues() {
	if (defaultValues === undefined) {
		return;
	}
    for (var paramName in defaultValues) {
    	if (getSessionFieldValue(paramName, false) !== null) {
    		continue;
    	}
        var paramInfo = defaultValues[paramName];
        try {
            var paramElement = $('#' + paramName);
            if (paramInfo.type === 'checkbox') {
                paramElement.attr('checked', paramInfo.value).checkboxradio("refresh");
            } else if (paramInfo.type === 'slider') {
                paramElement.val(paramInfo.value).flipswitch('refresh');
            } else if (paramInfo.type === 'date') {
                paramElement.datepicker();
                paramElement.datepicker("option", "dateFormat", paramInfo.value.format);
                paramElement.datepicker().datepicker("setDate", paramInfo.value.dateValue);
            } else {
                populateFieldHTML(paramName, paramInfo.value);
            }
        }
        catch (e) {
        }
    }
}

function setUserDataValuesInFields() {
    if (useSessionStorage) {
    	for (var i = 0; i < sessionStorage.length; i++) {
        	var key = sessionStorage.key(i);
        	var value = sessionStorage.getItem(key);
            populateFieldHTML(key, (value === "null" ? "" : value), '_output');
        }
    } else {
        for (var i in data) {
            populateField(i, decodeURIComponent(data[i]));
        }
    }
}

function getInputFieldsAsJson() {
    "use strict";

    var dataStr = "{\"data\":{";
    for (var index = 0; index < inputElementsArray.length; index++) {
    	var inputElement = inputElementsArray[index];
        var itemId = inputElement.id;
        if (itemId === null || itemId.length === 0) {
            continue;
        }
        var itemValue = (inputElement.type === "checkbox" ? inputElement.checked : inputElement.value);
        dataStr += "\"" + itemId + "\":\"" + itemValue + "\",";
    }

    dataStr += "\"\":\"\"}}";

    return dataStr;
}

var inputElementsArray = null;


function getFieldValue(key) {
	var element = $("#" + key);
	var value;
	if (element.length > 0) {
		value = element.is("input") ? 
    			(element[0].type === "checkbox" ? element[0].checked : element.val()) :
    			element.text();
	}
    return  (value == undefined && useSessionStorage) ?
    		getSessionFieldValue(key) : cleanValue(value);
}

function refreshInputElements() {
    if (useSessionStorage) {
        //updateSessionDataFromHTML(inputElementsArray);
    }
    else {
        inputElementsArray = collectInputElements();
    }
}

function addHiddenField(key, value) {
    var element = document.getElementById(key);

    if (element == null) {
        var hidden = $('<input>').attr({
            type: 'hidden',
            id: key
        });

        if (value != undefined) {
            hidden.value = value;
        }

        hidden.appendTo('body');

        refreshInputElements();

        return hidden[0];
    }
}

//remove output fields that have input field with same name
function removeDuplicatedFields() {
    var duplicatedFields = $(".requestField input").filter(function (index, elem) {
        return $(".responseField #" + elem.id).length > 0;
    });

    $(duplicatedFields).each(function (index, duplicatedField) {
        $(".responseField  #" + duplicatedField.id).closest('.responseField ').remove();
    });

    refreshInputElements();
}

function collectInputElements() {
    var result = new Array();

    //all input elements
    var inputArray = document.getElementsByTagName("input");

    var disallowedInputs = ['submit', 'button', 'file'];

    //get input fields of allowed types
    for (var index = 0; index < inputArray.length; index++) {
        if (disallowedInputs.indexOf(inputArray[index].type) == -1) {
            result.push(inputArray[index]);
        }
    }

    //add select elements
    var selectArray = document.getElementsByTagName("select");

    for (var index = 0; index < selectArray.length; index++) {
        result.push(selectArray[index]);
    }

    return result;
}

function setNodeValue(node, value) {
    if (node == undefined) return;
    node.textContent = value;
    return;
}

function getNodeValue(node) {

    if (node == undefined) return "Undefined";
    value = node.textContent;
    if (value == undefined)
        value = node.text;
    return value;
}

function getResponseNodeValueByName(nodeName, response) {
    if (window.response == null && response == null) {
        return "";
    } else if (typeof response === 'undefined' || response == null) {
        response = window.response;
    }

    return findValues(response, nodeName)[0] || "";
}

function setResponseNodeValueByName(nodeName, nodeValue) {
    if (window.response == null)
        return "";
    return setValues(window.response, nodeName, nodeValue);
}

function getResponseNodeListValueByName(nodeName) {
    if (window.response == null)
        return "";
    return findValues(window.response, nodeName);
}

function populateStatusMessages(statusBarMsg, popupMsg, errorMsg) {
    if (errorMsg.length > 0 && statusBarMsg.length == 0 && popupMsg.length == 0) {
        statusBarMsg = errorMsg;
        popupMsg = errorMsg;
    }

    if ($("#StatusBarMessages") != null)
        populateField("StatusBarMessages", statusBarMsg);
    if ($("#PopupMessages") != null)
        populateField("PopupMessages", popupMsg);

}

function clearStatusMessages() {
    if ($("#StatusBarMessages") != null)
        $("#StatusBarMessages").text("");
    if ($("#PopupMessages") != null)
        $("#PopupMessages").text("");
}

function validateRequiredFields() {
	if ($('#responseForm')[0] === undefined) {
		return;
	}

	if ($('#responseForm')[0].checkValidity()) {
    	$('button').prop('disabled', false);  
	} else {
    	$('button').prop('disabled', 'disabled');
	}
}

function getURLParameters(url) {
    var result = {};
    var searchIndex = url.indexOf("?");

    if (searchIndex == -1) {
        return result;
    }

    var sPageURL = url.substring(searchIndex + 1);
    var sURLVariables = sPageURL.split('&');

    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        result[sParameterName[0]] = sParameterName[1];
    }

    return result;
}

function getNameWoIndexLength(fieldName) {
	var pos = fieldName.lastIndexOf('_');
	return  pos !== -1 && /^\d+$/.test(fieldName.substr(pos + 1)) ?
			pos : 
			fieldName.length;
}

function uploadNewFiles() {
	spinner().start("Uploading attachments..");
	var deferred = $.Deferred();
	var deferreds = [];
	
	$('input[type="file"]').each(function(index, field){
		if (field.attributes.uploaded !== undefined && field.attributes.uploaded.value !== "true") {
			store(field.id, '');
			if (field.files.length !== 0 || field.attributes.fileFromCamera !== undefined) {
				var file = field.attributes.fileFromCamera !== undefined ? dataURItoBlob(field.attributes.fileFromCamera.value) : field.files[0];
				var target = field.attributes['data-target'] !== undefined ? field.attributes['data-target'].value : '';
				
				var formData = new FormData();
				formData.append('path', target !== '' ? target : 'www/upload');
				formData.append('file', file);
				if (target !== '') {
					formData.append('absolute', true);
				}
	
				deferreds.push($.ajax({
					url: getServiceManagerHost() + '/ServiceManager/Macro/FileManager',
					data: formData,
					type: 'POST',
					contentType: false, // (requires jQuery 1.6+)
					processData: false,
					success: function(response) {
						store(field.id, response.data);
						field.setAttribute("uploaded", true);
					}, error: function(jqXHR, textStatus, errorMessage) {
						spinner().stop();
						showInfoPopup('File upload failed', errorMessage);
					}
				 }));
			}
		}
	});
	
	$.when.all(deferreds).then(function(objects) {
		spinner().stop();
	    deferred.resolve();
	});
	
	return deferred.promise();
}

function dataURItoBlob(dataURI) {
    var byteString = atob(dataURI.split(',')[1]);
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: 'image/jpeg' });
}

if (typeof jQuery.when.all === 'undefined') {
    jQuery.when.all = function (deferreds) {
        return $.Deferred(function (def) {
            $.when.apply(jQuery, deferreds).then(
                function () {
                    def.resolveWith(this, [Array.prototype.slice.call(arguments)]);
                },
                function () {
                    def.rejectWith(this, [Array.prototype.slice.call(arguments)]);
                });
        });
    }
}

$(document).ready(function(){
    $("input[type=file]").click(function(){
        $(this).val("");
        document.getElementById(this.id + '_filename').innerHTML = '(No file)';
    });

    $("input[type=file]").change(function(){
        this.setAttribute("uploaded", false);
        this.removeAttribute("fileFromCamera");
        document.getElementById(this.id + '_filename').innerHTML = this.files[0].name;
    });
});

// get location from GPS and pass results to callback function
// Object example: {street_number: "12", route: "Rambam Street", locality: "Tel Aviv", administrative_area_level_1: "Tel Aviv District", country: "Israel"} 
function getLocation(callback) {
    var options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };

    var onSuccess = populatePosition.bind(this, callback);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(onSuccess, null, options);
    } else {
        msg = "Geolocation is not supported by this browser.";
        alert(msg)
    }
}

function populatePosition(callback, position) {

    var url = "http://maps.googleapis.com/maps/api/geocode/json?latlng=" + position.coords.latitude + "," + position.coords.longitude + "&language=en&sensor=false";
    jQuery.getJSON(url, function (json) {
        var res = {};

        //normalize google repsponse
        $.each(json['results'][0]['address_components'], function (i, elem) {
            res[elem['types'][0]] = elem['long_name']
        });

        callback(res);
    });
}

function executeHandler(handler) {
    if (handler == undefined) {
        return;
    }

    if (handler["preFunction"] != undefined) {
        executeCallFunctionHandler(handler["preFunction"], arguments);
    }
    
    if (/function$/.test(handler["action"])) {	//handler["action"].endsWith("function")
        executeCallFunctionHandler(handler['attr'], arguments);
        
    } else if (/webservice$/.test(handler["action"]) || handler["action"] == "onload") {
    	callWebServiceWithAllParams(handler['attr'], handler['initHandler'], handler['responseHandler'], handler['failureHandler'], true, true);

    } else if (/navigate$/.test(handler["action"])) {
        navigate(handler['attr']);
    }
}

function executeCallFunctionHandler(funcName, outerArguments) {
    if (window[funcName] == undefined) {
        alert("Undefined function: " + funcName);
    } else {
        window[funcName].apply(undefined,
            arguments.length > 1 ? Array.prototype.slice.call(outerArguments, 1) : undefined);
    }
}

function analyzeJson(json, responseHandler, serviceName, populateFields) {
    if (typeof json["Response"] === 'undefined') {
        executeResponseHandler(responseHandler, json, serviceName);
        return;
    }

    //Extract special output parameters
    var errorMsg = json["Response"][serviceName + "Message"]["Error"];
    var popupMsg = json["Response"][serviceName + "Message"]["PopupMessages"];
    var statusBarMsg = json["Response"][serviceName + "Message"]["StatusBarMessages"];
    
    var sessionId = json["Response"][serviceName + "Message"]["sessionId"];
    if (sessionId !== undefined) {
    	store('sessionId', sessionId);
    }

    if (showStatusMessages) {
        populateStatusMessages(statusBarMsg, popupMsg, errorMsg);
    }

    //Handle Elements
    var elements = json['Response'][serviceName + 'Elements'];

    if (typeof elements === "object" && elements !== null) {
        var nodeValue = "";
        var nodeName = "";
        for (var i in elements) {
            nodeName = i;
            nodeValue = elements[i];

            if (useSessionStorage === false) {	//TODO useSessionStorage?
                data[nodeName] = nodeValue;
            }

            //populate fields
            if (typeof(populateFields) === "undefined" || populateFields) {
                populateField(nodeName, nodeValue, "_output");
            }
        }
    }

    //Handle Array Items
    var tableRows = null;

    if (typeof json["Response"][serviceName + "TableArray"] !== 'undefined') {
        //if Object, convert to Array
        tableRows = [].concat(json["Response"][serviceName + "TableArray"][serviceName + "ArrayItem"]);
    }

    storeArrayInSessionStorage(tableRows);
    if (typeof(populateFields) === "undefined" || populateFields) {
    	setUserDataValuesInFields();
    	if ((hasTable || hasList)) {
            populateTableOrList();
        }
    }

    executeResponseHandler(responseHandler, json, serviceName, tableRows);
    return true;
}

function executeResponseHandler(responseHandler, data, serviceName, tableRows) {
    if (typeof responseHandler === 'undefined' || responseHandler === '') {
        return;
    }

    //response handler is function
    if (typeof responseHandler.indexOf === 'undefined' || responseHandler.indexOf(':') === -1) {
        if (typeof responseHandler !== 'undefined' ||
            (typeof window[responseHandler] !== 'undefined' && window[responseHandler] !== null)) {
            if (typeof window[responseHandler] === 'function') {
                window[responseHandler].call(this, data, serviceName, tableRows);
            } else if (typeof responseHandler === 'function') {
                responseHandler.call(this, data, serviceName, tableRows);
            }
        }

        return;
    }
    
    if (/^popupErrors:/.test(responseHandler)) {	//responseHandler.startsWith('popupErrors:')
        var popupContents = responseHandler.substring(12);
        var separatorPos = popupContents.lastIndexOf(';');
        showServiceErrorsPopup(popupContents.substring(0, separatorPos), popupContents.substring(separatorPos + 1));
        return;
    }

    if (/^popupAndNavigate:/.test(responseHandler)) {	//responseHandler.startsWith('popupAndNavigate:')
    	var separatorPos = responseHandler.lastIndexOf(':');
    	var popupText = responseHandler.substring(17, separatorPos);
    	var targetPage = responseHandler.substring(separatorPos + 1);
        showInfoPopup('', popupText, function() {
    	    navigate(targetPage);
    	});
        return;
    }
    
    if (/^popup:/.test(responseHandler)) {	//responseHandler.startsWith('popup:')
        var popupText = responseHandler.substring(6);
        showInfoPopup('', popupText);
        return;
    }

    if (/^navigate:/.test(responseHandler)) {	//responseHandler.startsWith('navigate:')
        var targetPage = responseHandler.substring(9);
        navigate(targetPage);
        return;
    }
}

function _callWebServiceWithAllParams(webService, initHandler, responseHandler, failureHandler, asyncFlag, populateFields) {
	var params = getInputFieldsAsQueryString();
	callWebService(webService, params, initHandler, responseHandler, failureHandler, asyncFlag, populateFields);
}

/**
 *
 * @param webService -    name of webservice
 * @param initHandler - function to be run before call to webservice,
 *                        return false to abort execution.
 *                        initHandler(serviceName)
 *
 * @param responseHandler - function to be run after webservice call,
 *                            responseHandler(response, serviceName, status)
 *            response - in json format
 *            serviceName - string
 *            status - one of: "success","notfound","internal","parsererror","timeout","abort","unknown"
 *
 */
function callWebServiceWithAllParams(webService, initHandler, responseHandler, failureHandler, asyncFlag, populateFields) {
	if (typeof window['uploadNewFiles'] === 'function') {
		uploadNewFiles().then(function() {
	    	_callWebServiceWithAllParams(webService, initHandler, responseHandler, failureHandler, asyncFlag, populateFields);
	    });
	} else {
		_callWebServiceWithAllParams(webService, initHandler, responseHandler, failureHandler, asyncFlag, populateFields);
	}
}

function generatePartialPlaybackQueryTokens(serviceName) {
	var $ = '';
	
	if (typeof(partialPlayback) !== "undefined") {
		if (partialPlayback.keepAlive instanceof Array &&
			partialPlayback.keepAlive.indexOf(serviceName) !== -1) {
				$ += '&keepAlive=true'
		}
	}
	return $;
}

/**
 *
 * @param webService -     name of webservice
 * @param params -         query string
 * @param initHandler -    function to be run before call to webservice,
 *                         return false to abort execution.
 *                         initHandler(serviceName)
 * @param asyncFlag -      call web service asynchronously
 * @param populateFields - field populator callback
 * @param failureHandler - function to be run after webservice call in case of a failure
 * @param responseHandler - function to be run after webservice call,
 *                            responseHandler(response, serviceName, status)
 *            response - in json format.
 *            serviceName - string
 *            status - one of: "success","notfound","internal","parsererror","timeout","abort","unknown"
 *
 */
function callWebService(webService, params, initHandler, responseHandler, failureHandler, asyncFlag, populateFields) {
	if (waitingForResponse) {	//prevent calls to webservice while waiting for response
        return;
    }

    webService = webService.trim();
    if (typeof webService === 'undefined' || webService === '') {
        return;
    }
    
    var webServiceUrl;
    if (webService.indexOf("/") === -1 && webService.indexOf(".") === -1 && webService.indexOf(":") === -1) {
        webServiceUrl = "/ServiceManager/Macro/ExecMacro/" + webService;	//if webService is not URL, assume it is local service
    } else {
        webServiceUrl = webService;		//webService is assumed to be URL
    }
    
    var serviceName = webServiceUrl.substr(webServiceUrl.lastIndexOf('/') + 1);

    var queryData = encodeURI(params) + '&randomSeed=' + (Math.random() * 1000000) + '&userDataId=' + userDataId + '&json=true';
    queryData += generatePartialPlaybackQueryTokens(serviceName);
    
    //call init handler
    if (typeof initHandler !== 'undefined') {
        //get the function by calling window[errorHandler]
        if (typeof window[initHandler] !== 'undefined' && window[initHandler] !== null) {
            if (typeof(window[initHandler]) === 'function')
                var initResult = window[initHandler].call(this, serviceName);
            if (initResult === false) {
                return; //abort execution
            }
        }
    }

    $(document).triggerHandler("sendRequest");

    var response = loadCachedOfflineResponse(serviceName);
    if (response !== undefined) {
    	onWebServiceAjaxSuccess(response, responseHandler, failureHandler, serviceName, populateFields);
    } else {
    	sendWebServiceRequest(serviceName, getServiceManagerHost() + webServiceUrl, queryData, asyncFlag, responseHandler, failureHandler, populateFields);
    }
}

function sendWebServiceRequest(serviceName, url, queryData, asyncFlag, responseHandler, failureHandler, populateFields) {
	waitingForResponse = true;
	$.ajax({
        url: url,
        type: "POST",
        timeout: WEB_SERVICE_TIMEOUT, //timeout in ms
        dataType: "json", // expected format for response
        data: queryData,
        async: typeof asyncFlag === 'undefined' ? true : asyncFlag,
        success: function (response) {
    		storeOfflineResponseIfNeeded(serviceName, response);
            onWebServiceAjaxSuccess(response, responseHandler, failureHandler, serviceName, populateFields);
        },
        error: function (response, status, error) {
        	if (response.status === 0) {
        		spinner().stop();
        		invokeOfflineHandler(serviceName, url, queryData);
        	} else {
        		onWebServiceAjaxFailure(response, status, failureHandler, serviceName, populateFields);
        	}
        },
        complete: function () {
            waitingForResponse = false;
        }
    });
}

function populateErrorsToHandler(failureHandler, message, status) {
	if (typeof failureHandler === 'function' || !/^popupErrors:/.test(failureHandler)) {	//!failureHandler.startsWith('popupErrors:')
		return failureHandler;
	}
	return failureHandler + message + ";" + status;
}

function onWebServiceAjaxSuccess(response, responseHandler, failureHandler, serviceName, populateFields) {
    window.response = response;
    var serviceErrorMsg = getResponseNodeValueByName("Error");

    if (serviceErrorMsg == "Service is disabled.") {
        showInfoPopup('Service Error', serviceErrorMsg);
        executeResponseHandler(failureHandler, undefined, serviceName, undefined);
        $(document).triggerHandler("receiveResponse", [null, serviceName, "error", populateFields]);

    } else if (typeof serviceErrorMsg !== 'undefined' && serviceErrorMsg !== null && serviceErrorMsg !== '') {
        failureHandler = populateErrorsToHandler(failureHandler, serviceErrorMsg, 200);
        analyzeJson(response, failureHandler, serviceName, populateFields);
        $(document).triggerHandler("receiveResponse", [null, serviceName, "error", populateFields]);
    } else {
        analyzeJson(response, responseHandler, serviceName, populateFields);
        $(document).triggerHandler("receiveResponse", [response, serviceName, "success", populateFields]);
    }
}

function populateErrorsToHandler(failureHandler, message, status) {
    if (typeof failureHandler === 'function' || !/^popupErrors:/.test(failureHandler)) {	//!failureHandler.startsWith('popupErrors:')
        return failureHandler;
    }

    return failureHandler + message + ";" + status;
}

function onWebServiceAjaxFailure(response, status, failureHandler, serviceName, populateFields) {
    var serviceErrorMsg = getResponseNodeValueByName("Error", response.responseJSON);

    if (typeof serviceErrorMsg === 'undefined' || serviceErrorMsg == null || serviceErrorMsg === "") {
    	if (response.status === 404) {
            showInfoPopup('Service Error', 'Service has failed with status of 404 - Requested page not found');
        } else if (response.status === 500) {
            showInfoPopup('Service Error', 'Service has failed with status of 500 - Internal Server Error');
        } else if (status === 'parsererror') {
            showInfoPopup('Service Error', 'Requested url parse failed');
        } else if (status === 'timeout') {
            showInfoPopup('Service Error', 'Timeout reached, no response');
        } else if (status === 'abort') {
            showInfoPopup('Service Error', 'Ajax request aborted');
        } else {
            showInfoPopup('Service Error', 'Unexpected Error: \n' + response.responseText);
        }
        
        if (!/^popupErrors:/.test(failureHandler)) {		//!failureHandler.startsWith('popupErrors:') || !popupLaunched
        	executeResponseHandler(failureHandler, undefined, serviceName, undefined);
        }

    } else if (typeof serviceErrorMsg !== 'undefined' && serviceErrorMsg != null && serviceErrorMsg !== "") {
        failureHandler = populateErrorsToHandler(failureHandler, serviceErrorMsg, response.status);
        analyzeJson(response.responseJSON, failureHandler, serviceName, populateFields);
    }

    $(document).triggerHandler("receiveResponse", [null, serviceName, "error", populateFields]);
}

function getHandlersByFilter(handlerMap, filter) {
    if (handlerMap == undefined) {
        return [];
    }

    return $(handlerMap).filter(function (index, handler) {
        return objFilter(handler, filter);
    });
}

function fetchService(serviceName, responseHandler, failureHandler) {
    var fetchServiceUrl;

    serviceName = serviceName.trim();

    if (typeof serviceName === 'undefined' || serviceName === '') {
        return;
    }

    fetchServiceUrl = "/ServiceManager/Macro/Service/" + serviceName;

    $.ajax({
        url: getServiceManagerHost() + fetchServiceUrl,
        type: "GET",
        timeout: WEB_SERVICE_TIMEOUT,
        dataType: "json",
        async: true,
        success: responseHandler,
        error: failureHandler
    });
}

function showServiceErrorsPopup(serviceErrorMsg, status) {
    var errorAlert = "<div> Service failed with errors [status " + status + "]:<br />&#9658;";
    
    errorAlert += [].concat.apply([], serviceErrorMsg.split("'").map(function(v,i){
        return i % 2 ? "'" + v + "'" : v.split(';').join("<br />&#9658;")
	})).filter(Boolean).join("");

    errorAlert += "<div/>";
    showInfoPopup('Service Error', errorAlert);
}

//utility function, used by getHandlersByFilter
function objFilter(obj, filter) {
    var result = true;

    for (key in filter) {
        result &= obj[key] == filter[key];
    }

    return result;
}

function getServiceManagerHost() {
	return 	typeof app !== 'undefined' && app.serviceManagerHost != undefined && app.serviceManagerHost != null ?
			app.serviceManagerHost.trim().replace(/\/$/, '') :
			'';
}

function navigate(targetUrl) {
    saveUserData();
    window.location = targetUrl;
}

//GLOBALS
var showStatusMessages = false;
var WEB_SERVICE_TIMEOUT = 30000;
var waitingForResponse = false;
var useSessionStorage = true; //true - save data on the browser local storage / false - save data on the server.
var handlerMap;
var userDataId;
var cookieLifespan = 1 * 60 * 60; //default one hour
var data = {};
window.lastFocusedElement = null;
var showErrorInRequest = true;

//initialize data
function initData() {

    userDataId = docCookies.getItem("userDataId");
    if (useSessionStorage) {
        setUserDataValuesInFields();
        initTableOrListFlags();
        populateTableOrList();
        addTableOrListClickListener();
    }
    else {
        if (userDataId != null) {
            refreshInputElements();
            getUserDataFromServer();	//will put fields in the input elements as well
        }
        else {
        	//generate new userDataId, save to cookie
            userDataId = Math.ceil(Math.random() * 10000000);
            data = new Object();
            var expiration = new Date();
            expiration.setSeconds(expiration.getSeconds() + cookieLifespan);
            docCookies.setItem("userDataId", userDataId, expiration);
        }
    }

    //set fields from query string into user data
    var qs = getURLParameters(window.location.search);
    for (param in qs) {
        populateField(param, qs[param]);
    }

    initEventHandlers();
    
    if (typeof window['handlerMap'] === "object") {
    	executeOnLoadHandlers();
    } else {
    	loadHandlersWithAjax();		//backward compatibility
    }
}

function loadHandlersWithAjax() {
	var creationTimestamp = $('meta[name="Creation-Timestamp"]').attr("content");
    if (creationTimestamp == undefined) {
        alert("Error: Meta tag Creation-Timestamp is missing");
    }
    var jsonFile = 'handlerMap_' + creationTimestamp + '.json';
	
	$.ajax({
        url: 'json/' + jsonFile,	// no need for getServiceManagerHost() since this is method is used only by old versions
        //async: false,
        dataType: 'text',
        timeout: WEB_SERVICE_TIMEOUT, //timeout in ms
        success: function (response) {
        	if (/^handlerMap=/.test(response)) {	// response.startsWith('handlerMap=')
        		response = response.substring('handlerMap='.length, response.length - ';'.length);
        	}
        	handlerMap = JSON.parse(response);
        	executeOnLoadHandlers();
        },
        error: function () {
            alert("Error loading handler map " + jsonFile);
        }
    });
}

function executeOnLoadHandlers() {
	var onloadFunctions = [];
	$.merge(onloadFunctions, getHandlersByFilter(handlerMap, {"action": "onload"}));
	$.merge(onloadFunctions, getHandlersByFilter(handlerMap, {"action": "onload:navigate"}));
	$.merge(onloadFunctions, getHandlersByFilter(handlerMap, {"action": "onload:function"}));
	for (var i = 0; i < onloadFunctions.length; i++) {
		executeHandler(onloadFunctions[i]);
	}
	$(document).triggerHandler("pageInitialized");
}

function initEventHandlers() {
	$(document).on("sendRequest", function () {
        if (window["sendRequestHandler"] != undefined) {
            window["sendRequestHandler"].call(this);
        }
    });

    $(document).on("receiveResponse", function (event, response, serviceName, status, populateFields) {
        if (window["receiveResponseHandler"] != undefined) {
            window["receiveResponseHandler"].call(this, response, serviceName, status, populateFields);
        }
    });

    $(document).on("pageInitialized", function () {
        if (window["pageInitializedHandler"] != undefined) {
            window["pageInitializedHandler"].call(this);
        }
    });
}

//initialize event listeners
$(function () {
	//initialize on-click event for inputs of type button
    $("input[type='button']").on("click", function () {
        var buttonId = $(this).attr('id');
        var handlers = getHandlersByFilter(handlerMap, {"element": buttonId});

        for (var i = 0; i < handlers.length; i++) {
            executeHandler(handlers[i]);
        }
    });

    //initialize on-click event for buttons
    $("button").on("click", function () {
        var buttonId = $(this).attr('id');
        var handlers = getHandlersByFilter(handlerMap, {"element": buttonId});

        for (var i = 0; i < handlers.length; i++) {
            executeHandler(handlers[i]);
        }
    });

    //initialize key-down event
    $(document).keydown(function (e) {
        var keyId = e.which;
        window.lastFocusedElement = e.target;
        var targetId = e.target.id;
        var handlers = getHandlersByFilter(handlerMap, {"key": keyId});

        for (var i = 0; i < handlers.length; i++) {
            //element not specified, execute
            if (handlers[i]["element"] == undefined ||
                handlers[i]["element"] == "") {
                executeHandler(handlers[i]);
            }
            //element matches rule, execute
            else if (handlers[i]["element"] == targetId) {
                executeHandler(handlers[i]);
            }
        }
        
        // do not propagate the event if the key was ENTER.
        if (keyId === 13) {
        	event.preventDefault();
        	return false;
        }
    });
});

//wait for window to load before showing
$(window).load(function () {
    $('body').show();
});

/**
 * Create list: Query webservice, use result json to populate list
 *
 * @param serviceName - name of the service
 * @param listItemTitle - Either A> name of output field which value will be used for list-item title
 *                or B> function(outputParams, index) -
 *                        @param outputParams  - object containing selected item output params
 *                        @param index - index of item in list
 *                        return title for list item in list
 *
 * @param selectionHandler - function(outputParams) - handler function for element pressed
 *                        @param outputParams  - object containing selected item output params
 *                        default: defaultListSelectionHandler
 */
function createList(serviceName, listItemTitle, selectionHandler) {

    //query web service with input parameters
    var params = getInputFieldsAsQueryString();

    var url = "/ServiceManager/Macro/ExecMacro/" + serviceName +
        "?" + params +
        "&json=true";

    //call web service
    jQuery.getJSON(encodeURI(url), function (json) {
        //populate results to list
        populateList(json, serviceName, listItemTitle, selectionHandler);
    });

}

/**
 * Populate webservice result in list
 *
 * @param json - the json result of the webservice call
 * @param serviceName - the name of the called webservice
 * @param listItemTitle - Either A> name of output field which value will be used for list-item title
 *                or B> function(outputParams, index) -
 *                        @param outputParams  - object containing selected item output params
 *                        @param index - index of item in list
 *                        return title for list item in list
 * @param selectionHandler - function(outputParams) - handler function for element pressed
 *                        @param outputParams  - object containing selected item output params
 *                        default: defaultListSelectionHandler
 */
function populateList(json, serviceName, listItemTitle, selectionHandler) {

    //Handle Array Items
    var tableNodes = null;

    //get list items from json
    if (json["Response"][serviceName + "TableArray"] != undefined) {
        //if Object, convert to Array
        tableNodes = [].concat(json["Response"][serviceName + "TableArray"][serviceName + "ArrayItem"]);
    }

    populateListItems(tableNodes, listItemTitle, selectionHandler);
}

/**
 * Populate data in list
 *
 * @param data - data to be populated in list
 * @param listItemTitle - Either A> name of output field which value will be used for list-item title
 *                or B> function(outputParams, index) -
 *                        @param outputParams  - object containing selected item output params
 *                        @param index - index of item in list
 *                        return title for list item in list
 * @param selectionHandler - function(outputParams) - handler function for element pressed
 *                        @param outputParams  - object containing selected item output params
 *                        default: defaultListSelectionHandler
 *
 */

function populateListItems(listData, listItemTitle, selectionHandler) {

    //set default handler
    if (selectionHandler == null) {
        selectionHandler = defaultListSelectionHandler;
    }

    //set default title generator
    if (listItemTitle == null) {
        listItemTitle = defaultTitleGenerator;
    }

    //init list menu
    $("#listMenu").popup();
    $("#listItems").find(".lovItem").remove();

    $("#listMenu").off("click", "li")


    //add list items to lov
    if (listData != null && isArray(listData)) {
        for (var j = 0; j < listData.length; j++) { //row in table

            var liElement = $("<li/>");
            liElement.addClass("lovItem");

            for (var k in listData[j]) {
                var cellName = k;
                var cellValue = listData[j][k];
                liElement.data(cellName, cellValue);

            }

            var aElem = $("<a/>");
            aElem.attr("href", "#");
            aElem.addClass("ui-btn");
            aElem.addClass("ui-btn-icon-right");
            aElem.addClass("ui-icon-carat-r");


            if (isFunction(listItemTitle)) {
                var text = listItemTitle.call(this, liElement.data(), j);
                aElem.text(text);
            }
            else {
                //populate list-item text
                aElem.text(liElement.data(String(listItemTitle)));
            }

            liElement.append(aElem);

            $("#listItems").append(liElement);

        }
    }

    //handle item clicked
    $("#listMenu").on("click", "li",
        function () {
            $("#listMenu").popup("close");
            selectionHandler.call(this, $(this).data());
        }
    );

    $("#listMenu").popup();

    $("#listMenu").popup("open");

}

/**
 * Default function for list title generation
 * @param outputParams  - object containing selected item output params
 * @param index - index of selected list item, 0-based
 * @returns {String}
 */
function defaultTitleGenerator(outputParams, index) {
    return (index + 1) + ") " + outputParams[Object.keys(outputParams)[0]];
}

/**
 * Populate data fields of selected item to input fields
 *
 * @param selected - object containing selected item output params
 */
function defaultListSelectionHandler(selected) {
    for (inputId in selected) {
        var value = selected[inputId];
        populateFieldHTML(inputId, value);
    }
}

function createSelectObject(fieldID) {
    var selectObj = document.getElementById(fieldID);

    if (selectObj.type.indexOf('select') < 0) {
        var newSelect = document.createElement('select');
        newSelect.id = fieldID;
        var parent = selectObj.parentNode;

        if (parent.className.indexOf("ui-input-text") > -1) {
            var temp = selectObj.parentNode;
            selectObj.parentNode.parentNode.replaceChild(newSelect, temp);
        }
        else {
            selectObj.parentNode.replaceChild(newSelect, selectObj);

        }

        selectObj.id = fieldID;
        selectObj = newSelect;
    }
    //remove previous elements
    selectLength = selectObj.length
    for (i = 0; i < selectLength; i++) {
        selectObj.remove(0);
    }

    return selectObj;
}

function populateSelectItems(tableNodes, fieldID) {
    var selectObj = createSelectObject(fieldID)

    if (tableNodes != null && isArray(tableNodes) && tableNodes[0] != undefined) {
        keyName = Object.keys(tableNodes[0]);
        for (var j = 0; j < tableNodes.length; j++) {
            var optionArray = tableNodes[j][keyName].split(',')
            var option = document.createElement('option');
            option.value = optionArray[0];
            option.textContent = optionArray[1];

            if (option.textContent != undefined && option.textContent.trim() != "")
                selectObj.appendChild(option);
        }
    }
    return selectObj;
}

function populateSelect(json, serviceName, fieldID, onChangeFunc, defaultIndex) {
    //Handle Array Items
    var tableNodes = null;

    //get list items from json
    if (json["Response"][serviceName + "TableArray"] != undefined) {
        //if Object, convert to Array
        tableNodes = [].concat(json["Response"][serviceName + "TableArray"][serviceName + "ArrayItem"]);
    }

    var selectObj = populateSelectItems(tableNodes, fieldID);
    if (defaultIndex != undefined) {
        $(selectObj).selectedIndex = defaultIndex;
    }
    else {
        $(selectObj).selectedIndex = 0;
    }

    $(selectObj).selectmenu();
    $(selectObj).selectmenu("refresh");
    $(selectObj).change(onChangeFunc);
}

/**
 * createSelect: Query webservice, use result json to populate select object
 *
 * @param serviceName - name of the service
 * @param fieldID - name of output field which the select would be populated into
 * @param onChangeFunc - (optional) onchange function handler
 * @param defaultIndex - (optional) - index to be selected - default: 0
 */
function createSelect(serviceName, fieldID, onChangeFunc, defaultIndex) {
    if ($("#" + fieldID) == null) return;

    //query web service with input parameters
    var params = getInputFieldsAsQueryString();

    var url = "/ServiceManager/Macro/ExecMacro/" + serviceName +
        "?" + params +
        "&json=true";

    //call web service
    jQuery.getJSON(encodeURI(url), function (json) {
        //populate results to list
        populateSelect(json, serviceName, fieldID, onChangeFunc, defaultIndex);
    });
}

var autocomplete_config = {};
var fired_suggestions = [];
var suggestions_in_progress = [];

function highlightText(text, $node) {
	text = $.trim(text);
	if (text === '') {
		return;
	}
	var searchText = text.toLowerCase(), currentNode = $node.get(0).firstChild, matchIndex, newTextNode, newSpanNode;
	while ((matchIndex = currentNode.data.toLowerCase().indexOf(searchText)) >= 0) {
		newTextNode = currentNode.splitText(matchIndex);
		currentNode = newTextNode.splitText(searchText.length);
		newSpanNode = document.createElement("span");
		newSpanNode.className = "highlight";
		currentNode.parentNode.insertBefore(newSpanNode, currentNode);
		newSpanNode.appendChild(newTextNode);
	}
}

function invokeOnSelectUserDefinedCallback(serviceName, selectedItem) {
	var itemHandler = window[autocomplete_config[serviceName].itemHandler];
	if (typeof(itemHandler) === 'undefined') {
		return;
	}
	
	if (/^_static_lov_/.test(autocomplete_config[serviceName].webService)) {		//autocomplete_config[serviceName].webService).startsWith('_static_lov_')
		itemHandler(selectedItem);
	} else {
		fetchService(serviceName, function (serviceData) {
			if (typeof serviceData !== 'undefined') {
				var useLabelsAsKeys = serviceData.data.useLabelsAsKeys;
				itemHandler(selectedItem, useLabelsAsKeys);
				validateRequiredFields();
			} else {
				onSuggestionsError();
			}
		}, onSuggestionsError);
	}
}

function setAutocomplete(serviceName, labelItemPairs, keepClosed) {
	var config = autocomplete_config[serviceName];
	var element = $("#" + config.elementId);
	if (element[0].nodeName === "DIV") {
		element = $(element[0].parentElement);
	}

	element.autocomplete({
		source: labelItemPairs,
		minLength: 0,
		selectFirst: true,
		select: function(event, ui) {
			invokeOnSelectUserDefinedCallback(config.webService, ui.item.item);
			return false;
		}
	})
	.click(function() {
		$(this).autocomplete("search", $(this).val());
	})
	.data("ui-autocomplete")._renderItem = function(ul, item) {
		var $a = $("<a></a>").text(item.label);
		highlightText(this.term, $a);
		return $("<li></li>").append($a).appendTo(ul);
	};
	
	if (!keepClosed && labelItemPairs.length > 0) {
		var element = $('#' + autocomplete_config[serviceName].elementId);
		element.autocomplete("search", element.val());
	}
}

function prepareAutocompleteRequestParams(serviceName) {
	var requestPreparer = window[autocomplete_config[serviceName].requestPreparer];
	if (typeof requestPreparer !== 'undefined') {
		var inputParams = requestPreparer();
		var inputParamArray = [];
		for (var paramName in inputParams) {
			if (inputParams.hasOwnProperty(paramName)) {
				inputParamArray.push(paramName + "=" + inputParams[paramName]);
			}
		}
		return inputParamArray.join("&");
	} else {
		return "";
	}
}

function presentAutocompleteItems(serviceName, arrayItems) {
	var itemPresenter = window[autocomplete_config[serviceName].itemPresenter];
	if (typeof itemPresenter !== "undefined") {
		fetchService(serviceName, function (serviceData) {
			if (typeof serviceData !== 'undefined') {
				var useLabelsAsKeys = serviceData.data.useLabelsAsKeys;
				
				var autocompleteOptions = [];
				for (var i = 0; i < arrayItems.length; i++) {
					autocompleteOptions.push({label: itemPresenter(arrayItems[i], useLabelsAsKeys), item: arrayItems[i]});
				}
				
				setAutocomplete(serviceName, autocompleteOptions);
			} else {
				onSuggestionsError();
			}
		}, onSuggestionsError);
	}
}

function onSuggestionsSuccess(response, serviceName, arrayItems) {	
	console.log('Received ' + arrayItems.length + ' autocomplete suggesstions from service ' + serviceName);
	
	presentAutocompleteItems(serviceName, arrayItems);
	suggestions_in_progress.splice(suggestions_in_progress.indexOf(serviceName), 1);
	stopSmallSpinner();
}

function onSuggestionsError(response, serviceName) {
	var serviceErrorMsg = getResponseNodeValueByName("Error");
	if (serviceErrorMsg != undefined && serviceErrorMsg.length > 0) {
		setTimeout(function () {
	        showServiceErrorsPopup(serviceErrorMsg, 200);
	    }, 1000);
	}
	
	suggestions_in_progress.splice(suggestions_in_progress.indexOf(serviceName), 1);
	stopSmallSpinner();
}

function getSuggestions(id, serviceName) {
	if (suggestions_in_progress.indexOf(serviceName) != -1) {
		console.log('Aborting: getSuggestions is already in progress!');
		return;
	}
	startSmallSpinner('Loading suggestions..');
	suggestions_in_progress.push(serviceName);
	callWebService(serviceName, prepareAutocompleteRequestParams(serviceName), undefined, onSuggestionsSuccess, onSuggestionsError, true, false);
	spinner().stop();
}

function initAutocompleteFocusTrigeer(id, serviceName) {
	var handler = function() {
		if (fired_suggestions.indexOf(serviceName) != -1) {
			return;
		}
		getSuggestions(id, serviceName);
	    fired_suggestions.push(serviceName);
	};
	
	var field = $('#' + id);
	if (field[0].nodeName === 'DIV') {
		$($('#' + id)[0].parentElement).click(handler);
	} else {
		$('#' + id).focusin(handler);
	}
}

function initAutocompleteButton(triggerId, serviceName) {
	$('#' + triggerId).click(function () {
		getSuggestions(triggerId, serviceName);
		setAutocomplete(serviceName, []);
	});
}

function prepareMobileLOV(options) {
	var isStaticLov = (options.webService === '');
	if (isStaticLov) {
		options.webService = '_static_lov_' + options.elementId;
	}
	
	autocomplete_config[options.webService] = options;
	
	if (isStaticLov) {
		var converter = 'convert_' + options.elementId;
		if (typeof window[converter] === 'function') {
			setAutocomplete(options.webService, window[converter](), true);
		} else {
			console.error('No converter seed function found for static lov: ' + id);
		}
	} else {
		initAutocompleteFocusTrigeer(options.elementId, options.webService);
		initAutocompleteButton(options.triggerId, options.webService);
	}
}

var map, geocoder, marker;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
    	center: {lat: 40.7115648, lng: -74.0038266},
    	zoom: 12,
    	gestureHandling: "cooperative",
    	fullscreenControl: false,
    	streetViewControl: false
    });
    geocoder = new google.maps.Geocoder();
    
    var initialAddress = generateAddress();
    if (!initialAddress || initialAddress.length == 0) {
    	initialAddress = defaultValues['Map'].value;
    	document.getElementById('map_address').innerHTML = initialAddress;
	}
    geocodeAddress(initialAddress);
    
	document.getElementById('map_navigate_button').addEventListener('click', function() {
		var address = document.getElementById('map_address').innerHTML;
		var url = 'https://www.google.com/maps/search/?api=1&query=' + address.replace(' ', '+');
		window.open(url, '_blank');
	});
    document.getElementById('map_locate_button').addEventListener('click', function() {
    	geocodeAddress(generateAddress(), true);
	});
}

function generateAddress() {
	var address = window['convert_map']();
	document.getElementById('map_address').innerHTML = address;
	return address.trim();
}

function geocodeAddress(address, isButtonTriggered) {
	if (marker !== undefined) {
		marker.setMap(null);
	}
	if (!address || address.length == 0) {
		return;
	}
	geocoder.geocode({'address': address}, function(results, status) {
		if (status === 'OK') {
			map.setCenter(results[0].geometry.location);
			marker = new google.maps.Marker({
				map: map,
				position: results[0].geometry.location
			});
		} else {
			if (isButtonTriggered) {
				showInfoPopup('Map', 'Unable to resolve address: ' + status);
			}
		}
	});
}

/*********************************
 *** Is supported / get config ***
 *********************************/
var offlineRequestsTableData;

function checkOfflineSupport() {
	if (typeof(Storage) === "undefined") {
		showInfoPopup('Offline Support', 'LocalStorage is not supported by your browser, offline capabilities malfunction.');
	}
}

function getOfflineConfig(serviceName) {
	var allConfig = typeof(offlineConfig) !== "undefined" && offlineConfig instanceof Array ? offlineConfig : [];
	for (var i = 0; i < allConfig.length; i++) {
		if (allConfig[i].service === serviceName) {
			return allConfig[i];
		}
	}
	return {};
}

/*********************************
 *** Handler *********************
 *********************************/

function invokeOfflineHandler(serviceName, url, query) {
	var config = getOfflineConfig(serviceName);
	switch (config.action) {
	case 'ERROR':
		showInfoPopup('Offline', 'Please try again later.');
		break;
	case 'SYNC_LATER':
		storeOfflineRequest(getPageName(), serviceName, url, query);
		break;
	case 'STORAGE_THEN_LIVE':
		// will never get here
		break;
	case 'LIVE_THEN_STORAGE':
		
		break;
	default:
	}
}

function getPageName() {
	var $ = window.location.pathname.split("/").pop();
	return  $.indexOf('#') !== -1 ?	$ = $.substring(0, $.indexOf('#')) : $;
}

/*********************************
 *** Sync ************************
 *********************************/

function syncOfflineRequest(index) {
	alert('syncOfflineRequest' + index);
}

function syncAllOfflineRequests() {
	alert('syncAllOfflineRequests');
}

/*********************************
 *** Request *********************
 *********************************/

function getFirstOfflineReqIndex() {
	var index = localStorage['offlineReq_start'];
	return index !== undefined ? +index : 0;
}

function getLastOfflineReqIndex() {
	var index = localStorage['offlineReq_end'];
	return index !== undefined ? +index : -1;
}

function storeOfflineRequest(pageName, serviceName, url, query) {
	var nextIndex = getLastOfflineReqIndex() + 1;
	var now = new Date();
	localStorage['offlineReq_' + nextIndex + '_page'] = pageName;
	localStorage['offlineReq_' + nextIndex + '_service'] = serviceName;
	localStorage['offlineReq_' + nextIndex + '_time'] = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
	localStorage['offlineReq_' + nextIndex + '_url'] = url;
	localStorage['offlineReq_' + nextIndex + '_query'] = query;
	localStorage['offlineReq_end'] = nextIndex;
	showInfoPopup('Offline', 'Your action will be synced later.');
}

function deleteOfflineRequest(index) {
	localStorage.removeItem('offlineReq_' + index + '_page');
	localStorage.removeItem('offlineReq_' + index + '_service');
	localStorage.removeItem('offlineReq_' + index + '_time');
	localStorage.removeItem('offlineReq_' + index + '_url');
	localStorage.removeItem('offlineReq_' + index + '_query');
}

function getOfflineRequests() {
	var $ = [];
	var start = getFirstOfflineReqIndex();
	var end = getLastOfflineReqIndex();
	
	for (var i = start; i < end + 1; i++) {
		if (localStorage['offlineReq_' + i + '_service'] !== undefined) {
			$.push({
				index: 		i,
				page: 		localStorage['offlineReq_' + i + '_page'],
				service: 	localStorage['offlineReq_' + i + '_service'],
				time: 		localStorage['offlineReq_' + i + '_time'],
				url:		localStorage['offlineReq_' + i + '_url'],
				query:		localStorage['offlineReq_' + i + '_query']
			});
		}
	}
	showHideOfflineRequestsTable($);
	return $;
}

/*********************************
 *** Response ********************
 *********************************/

function loadCachedOfflineResponse(serviceName) {
	var offlineAction = getOfflineConfig(serviceName).action;
	if (offlineAction === 'STORAGE_THEN_LIVE') {
		var response = localStorage['offlineRes_' + serviceName];
		if (response !== undefined) {
			return JSON.parse(response);
		}
	}
	return undefined;
}

function deleteOfflineResponse(serviceName) {
	localStorage.removeItem('offlineRes_' + serviceName);
}

function storeOfflineResponseIfNeeded(serviceName, response) {
	var offlineAction = getOfflineConfig(serviceName).action;
	if (offlineAction === 'STORAGE_THEN_LIVE' || offlineAction === 'LIVE_THEN_STORAGE') {
		localStorage['offlineRes_' + serviceName] = JSON.stringify(response);
	}
}

/*********************************
 *** UI **************************
 *********************************/

function showHideOfflineRequestsTable(offlineRequests) {
	if (offlineRequests.length !== 0) {
		document.getElementById('offlineRequestsContainer').style.display = 'block';
		document.getElementById('noOfflineRequestsContainer').style.display = 'none';
	} else {
		document.getElementById('offlineRequestsContainer').style.display = 'none';
		document.getElementById('noOfflineRequestsContainer').style.display = 'block';
	}
}

function populateOfflineRequestsTable(offlineRequests) {
	offlineRequestsTableData = offlineRequests;
	
	var tbody = document.getElementById('offlineRequestsTbody');
	if (tbody === null) {
		return;
	}
	while(tbody.rows.length > 0) {
		tbody.deleteRow(0);
	}
	for (var i = 0; i < offlineRequests.length; i++) {
		var row = tbody.insertRow(i);
		var cell;
		
		cell = document.createElement('td');
        row.appendChild(cell);
        cell.innerHTML = offlineRequests[i]['index'];
        
        cell = row.insertCell(-1);
        cell.innerHTML = offlineRequests[i]['page'];
        
        cell = row.insertCell(-1);
        cell.innerHTML = offlineRequests[i]['service'];
        
        cell = row.insertCell(-1);
        cell.innerHTML = offlineRequests[i]['time'];
        
        cell = row.insertCell(-1);
        cell.innerHTML = '<a title="Sync" href="#" onclick="syncOfflineRequest(' + i + ')"\r\n' +
						 'class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-icon-refresh ui-btn-icon-notext"\r\n' +
						 'style="width: 40px !important; margin-right: 10px"></a>\r\n' +
						 '<a title="Delete" href="#" onclick="deleteTableOfflineRequest(' + i + ')"\r\n' +
						 'class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-icon-minus ui-btn-icon-notext"\r\n' +
						 'style="width: 40px !important; margin-right: 0"></a>';
	}
}

function deleteTableOfflineRequest(index) {
	var rowData = offlineRequestsTableData[index];
	showConfirmPopup('Delete sync request #' + rowData.index, 'Are you sure you want to delete request for service ' + rowData.service + ' made from ' + rowData.page + '?', function() {
		offlineRequestsTableData.splice(index, 1);
		document.getElementById("offlineRequestsTbody").deleteRow(index);
		deleteOfflineRequest(rowData.index);
	});
}

/**************
 * Info popup *
 **************/

function showInfoPopup(title, message, confirmCallback) {
    $("#infoPopupTitle").text(title);
    $("#infoPopupMessage").html(message);

    $("#infoPopup").popup({
        afterclose: function (event, ui) {
            if (typeof confirmCallback !== 'undefined') {
                confirmCallback();
            }
        }
    });
    
    setTimeout(function() {
    	$("#infoPopup").popup("open");
    }, 200);
}


/**********************
 * Confirmation popup *
 **********************/

function showConfirmPopup(title, message, confirmCallback, cancelCallback) {
    $("#confirmPopupTitle").text(title);
    $("#confirmPopupMessage").text(message);

    confirmPopupConfirmCallback = confirmCallback;
    confirmPopupCancelCallback = cancelCallback;

    setTimeout(function() {
    	$("#confirmPopup").popup("open");
    }, 200);
}

var confirmPopupConfirmCallback = undefined;
var confirmPopupCancelCallback = undefined;

$(function () {
    $("#confirmPopupOk").on("click", function () {
        if (confirmPopupConfirmCallback != undefined) {
            confirmPopupConfirmCallback();
        }
    });

    $("#confirmPopupCancel").on("click", function () {
        if (confirmPopupCancelCallback != undefined) {
            confirmPopupCancelCallback();
        }
    });
});

/*
 * spinner function - starts/stops spinner over html element
 * 
 * spinner.start(parentElemtId) - start spinner over parentElemtId
 * spinner.stop() - stop spinner
 * 
 */
var androidSpinner = (function () {
    "use strict";

    var spinner = {};

    spinner.start = function (loadingText, theme) {
        $.mobile.loading("show", {
            text: loadingText,
            textVisible: true,
            theme: (theme === 'b') ? theme : 'z',
            html: ""
        });
    };

    spinner.stop = function () {
        $.mobile.loading("hide");
    };

    return spinner;
}());

function spinner(template) {
	return androidSpinner;
}

function startSmallSpinner(text) {
	$('#mainBody').append(
		'<div id="small-spinner" class="ui-loader ui-corner-all ui-body-z ui-loader-verbose small-spinner">' +
	   		'<span class="ui-icon-loading"><h1>' + text + '</h1></span>' + 
	   	'</div>');
}

function stopSmallSpinner() {
	var spinner = document.getElementById('small-spinner');
	if (spinner != undefined) {
		spinner.remove();
	}
}

function saveInputFieldsToServer() {
    "use strict";

    $.ajax({
        url: getServiceManagerHost() + "/ServiceManager/Macro/UserData/" + userDataId,
        type: "PUT",
        contentType: 'application/json',
        async: false,
        dataType: "text", // expected format for response
        data: getInputFieldsAsJson(),
        success: function () {
        },
        error: function () {
            //alert('Error receiving data from server');
        }
    });

}

function getUserDataFromServer() {
    "use strict";

    //get user data from server
    $.ajax({
        url: getServiceManagerHost() + '/ServiceManager/Macro/UserData/' + userDataId,
        async: false,
        dataType: 'text',
        cache: false,
        success: function (response) {
            try {
                try {
                    response = response;
                } catch (e) {
                }
                data = JSON.parse(response).data;
            }
            catch (e) {
                data = new Object();
            }
            setUserDataValuesInFields();

        }
    });
}

function saveUserData() {
    "use strict";

    if (useSessionStorage) {
        updateSessionDataFromHTML(collectInputElements());
    } else {
        saveInputFieldsToServer();
    }
}

function clearUserData() {
    if (useSessionStorage) {
        sessionStorage.clear();
    }
    else {
        for (item in data) {
            data[item] = "null";
        }
    }
}

function updateSessionDataFromHTML(inputElementsArray) {
    "use strict";

    for (var index = 0; index < inputElementsArray.length; index++) {
    	var inputElement = inputElementsArray[index];
        var itemId = inputElement.id;
        if (itemId == null || itemId.length == 0)
            continue;
        var itemValue = (inputElement.type === "checkbox" ? inputElement.checked : inputElement.value);
        if (useSessionStorage) {
            sessionStorage.setItem(itemId, itemValue)
        }
    }
}

function store(fieldName, fieldValue) {
	if (useSessionStorage) {
        sessionStorage.setItem(fieldName, fieldValue);
    } else {
    	data[fieldName] = fieldValue;
    }
}

function storeFromIndex(fieldName, index) {
	var indexedFieldName = fieldName.substr(0, getNameWoIndexLength(fieldName)) + '_' + index;
	var fieldValue = getSessionFieldValue(indexedFieldName);
	store(fieldName, fieldValue);
}

function clearArrayKeysInSessionStorage(array) {
	for (var key in array[0]) {
		removeItem(key);
		
		var keyNameWoIndex = key.substr(0, getNameWoIndexLength(key));
		var i = 0,
			key = keyNameWoIndex + '_0';
		while (i === 0 || containsKey(key)) {
			removeItem(key);
			i++;
			key = keyNameWoIndex + '_' + i;
		}
	}
}

function getMaxArrayIndexToStore(arrayLength) {
	return 	typeof app !== 'undefined' && app.maxArrayIndexToStore != undefined && app.maxArrayIndexToStore != null ?
			Math.min(app.maxArrayIndexToStore, arrayLength) :
			arrayLength;
}

function storeArrayInSessionStorage(array) {
	if (array == null || !isArray(array)) {
		return;
	}
	
	clearArrayKeysInSessionStorage(array);
	
	for (var i = 0; i < getMaxArrayIndexToStore(array.length); i++) {
		var arrayRow = array[i]; 
        if (arrayRow == undefined) {
        	continue;
        }

        for (var key in arrayRow) {
            var indexedKey = key.substr(0, getNameWoIndexLength(key)) + '_' + i;
            
            data[indexedKey] = arrayRow[key];
            if (useSessionStorage == true) {
                sessionStorage.setItem(indexedKey, arrayRow[key]);
            }
            
            if (i === 0 && !/_0$/.test(key)) {	//!key.endsWith('_0')
            	data[key] = arrayRow[key];
                if (useSessionStorage == true) {
                    sessionStorage.setItem(key, arrayRow[key]);
                }
            }
        }
    }
}

function containsKey(key) {
	if (useSessionStorage) {
        return (sessionStorage.getItem(key) !== null);
    } else {
        return (key in data);
    }
}

function getSessionFieldValue(key, shouldTrimValue) {
    var value = "";
    try {
        if (useSessionStorage) {
            value = sessionStorage.getItem(key);
        }
        else {
            value = data[key];
        }
    } catch (e) {}

    return shouldTrimValue === false ? value : cleanValue(value);
}

function removeItem(key) {
    if (useSessionStorage) {
        sessionStorage.removeItem(key);
    } else {
        data[key] = null;
    }
}

function removeItemNameContains(keyName) {
    if (useSessionStorage) {
        for (var key in sessionStorage) {
            if (key.indexOf(keyName) >= 0) {
                sessionStorage.removeItem(key);
            }
        }
    }
}

/****************************
 *** Common *****************
 ****************************/

/**
 * Get the highest index existing for a parameter 
 * @param fieldName
 */
function getHighestIndex(fieldName) {
	var $ = -1;
	var fieldNameWoIndex = fieldName.substr(0, getNameWoIndexLength(fieldName));
	
	for (var key in sessionStorage) {
        var keyWoIndex = key.substr(0, getNameWoIndexLength(key));
        
		if (keyWoIndex === fieldNameWoIndex) {
			var index = +key.substr(key.lastIndexOf('_') + 1);
			if (index > $) {
				$ = index;
			}
		}
	}
	return $;
} 

function executeTableOnClickHandlers(row, col, rowCells) {
	var onTableClickHandlers = [];
    $.merge(onTableClickHandlers, getHandlersByFilter(handlerMap, {"action": "tableClick:webservice"}));
    $.merge(onTableClickHandlers, getHandlersByFilter(handlerMap, {"action": "tableClick:navigate"}));
    $.merge(onTableClickHandlers, getHandlersByFilter(handlerMap, {"action": "tableClick:function"}));
    for (var i = 0; i < onTableClickHandlers.length; i++) {
        executeHandler(onTableClickHandlers[i], row, col, rowCells);
    }
}

function formatTableValue(displayFormat, value) {
	return  !!displayFormat && displayFormat.indexOf('%s') !== -1 ?
			displayFormat.replace('%s', value):
			value;
}

/****************************
 *** table-list selectors ***
 ****************************/

var hasTable, hasList;
var tableOutputBody, listOutput;

function populateTableOrList() {
	if (hasTable) {
		populateTable(tableOutputBody);
	} else if (hasList) {
		populateTableListLayout(listOutput);
	}
}

/****************************
 *** onLoad *****************
 ****************************/

function initTableOrListFlags() {
	tableOutputBody = document.getElementById("tableOutputBody");
	listOutput = document.getElementById("listOutput");
	
	hasTable = (tableOutputBody != null);
	hasList = (listOutput != null);
}

function addTableOrListClickListener() {
	if (hasTable) {
		addTableClickListener();
	} else if (hasList) {
		addTableListLayoutClickListener();
	}
}

/**
 * Get array of the field IDs serving as columns.
 */
function getListColumnsMetadata() {
	var listOutputHead = document.getElementById("listOutputHead");
	if (listOutputHead == null) {
		return null;
	}
	
	var $ = [];
	var columnElements = listOutputHead.getElementsByTagName('div');
	for(var i = 0; i < columnElements.length; i++) {
		$.push({id: columnElements[i].id, displayFormat: columnElements[i].getAttribute('display-format')});
	}
	return $;
}

/**
 * Insert a new row to list, and populate it with values from local storage.
 * The fields index will be the row index.
 * Meaning, when populating parameter S_CUSTOMER_ID_0 for row number 4, the value
 * will be evaluated as sessionStorage[S_CUSTOMER_ID_4]. 
 * @param rowIndex number of row in table.
 */
function populateTableListLayoutRow(listOutput, columnsMetadata, rowIndex) {
	var rowColumnValues = "";
	
	for (var i in columnsMetadata) {
    	var cellName = columnsMetadata[i].id;
    	var cellNameWithIdx = cellName.substr(0, getNameWoIndexLength(cellName)) + '_' + rowIndex;
    	var cellValue = formatTableValue(columnsMetadata[i].displayFormat, sessionStorage[cellNameWithIdx]);
    	
    	var alphabeticalIndex = String.fromCharCode("a".charCodeAt(0) + (+i % 2));
    	rowColumnValues += 
    		"<div" + (+i >= 2 ? " style=\"font-weight:normal\"" : "") + " class=\"ui-block-" + alphabeticalIndex +"\">\n" + 
    		"	" + cellValue + "\n" +
    		"</div>\n";
	}
	
	var liClass = columnsMetadata.length == 1 ? "ui-grid-solo" : "ui-grid-a";
	listOutput.innerHTML += 
		"<li><a href=\"#\" class=\"ui-btn ui-btn-icon-right ui-icon-carat-r\">\n" +
		"	<div class=\"" + liClass + "\">\n" +
		"		" + rowColumnValues +
		"	\n</div>\n" +
		"</a></li>";
}

function clearAllTableListLayoutRows() {
	if (listOutput == null) {
		return;
	}
	
	var numOfDataChildren = listOutput.childElementCount - 1;
	for (var i = 0; i < numOfDataChildren; i++) {
		listOutput.removeChild(listOutput.lastElementChild);
	}
}

/**
 * Insert rows to list according to sessionStorage.
 */
function populateTableListLayout(listOutput) {
	if (listOutput == null) {
		return;
	}
	
	var columnsMetadata = getListColumnsMetadata();
	if (columnsMetadata == null) {
		return;
	}
	
	clearAllTableListLayoutRows();
	
	var lastIndex = getHighestIndex(columnsMetadata[0].id);
	for (var i = 0; i <= lastIndex; i++) {
		populateTableListLayoutRow(listOutput, columnsMetadata, i);
	}
}

/****************************
 *** onLoad *****************
 ****************************/

function calculateIndexInParent(element){
    var i = 0;
    while ((element = element.previousElementSibling) != null) {
    	i++;
    }
    return i;
}

function addTableListLayoutClickListener() {
	$('#listOutput').on('click','li', function(e){
		var row = calculateIndexInParent(e.currentTarget) - 1;	//first row is the table header
		var col = 0;	//list doesn't have meaning to columns. 
		
		var rowCells = [];
		var domCells = e.currentTarget.children[0].children[0].children;
		for (var i = 0; i < domCells.length; i++) {
			rowCells.push(domCells[i].innerText);
		}
		
		executeTableOnClickHandlers(row, col, rowCells);
	});
}

/**
 * Get array of the field IDs serving as columns.
 */
function getTableColumnsMetadata() {
	var tableOutputHead = document.getElementById("tableOutputHead");
	if (tableOutputHead == null) {
		return null;
	}
	
	var $ = [];
	var tdElements = tableOutputHead.getElementsByTagName('th');
	for(var i = 0; i < tdElements.length; i++) {
		$.push({id: tdElements[i].id, displayFormat: tdElements[i].getAttribute('display-format')});
	}
	return $;
}

/**
 * Insert a new row to table, and populate it with values from local storage.
 * The fields index will be the row index.
 * Meaning, when populating parameter S_CUSTOMER_ID_0 for row number 4, the value
 * will be evaluated as sessionStorage[S_CUSTOMER_ID_4]. 
 * @param rowIndex number of row in table.
 */
function populateTableRow(tableOutputBody, columnsMetadata, rowIndex) {
	var rowCount = tableOutputBody.rows.length;
	var row = tableOutputBody.insertRow(rowCount);
	
	for (var i in columnsMetadata) {
    	var cellName = columnsMetadata[i].id;
    	var cellNameWithIdx = cellName.substr(0, getNameWoIndexLength(cellName)) + '_' + rowIndex;
    	var cellValue = formatTableValue(columnsMetadata[i].displayFormat, sessionStorage[cellNameWithIdx]);
    	
    	var cell;
    	if (row.cells.length == 0) {
            cell = document.createElement('td');
            row.appendChild(cell);
        } else {
            cell = row.insertCell(-1);
        }
    	cell.innerHTML = cellValue;
    }
}

/**
 * Insert rows to table according to sessionStorage.
 */
function populateTable(tableOutputBody) {
	if (tableOutputBody == null) {
		return;
	}
	
	var columnsMetadata = getTableColumnsMetadata();
	if (columnsMetadata == null) {
		return;
	}
	
	clearAllTableRows();
	
	var lastIndex = getHighestIndex(columnsMetadata[0].id);
	for (var i = 0; i <= lastIndex; i++) {
		populateTableRow(tableOutputBody, columnsMetadata, i);
	}
}

function clearAllTableRows() {
	if (tableOutputBody == null) {
		return;
	}
	
	while(tableOutputBody.rows.length > 0) {
		tableOutputBody.deleteRow(0);
	}
}

/****************************
 *** onLoad *****************
 ****************************/

function addTableClickListener() {
	$('#tableOutput').on('click','td', function(e){
		var row = e.currentTarget.parentElement.rowIndex - 1;	//first row is the table header
		var col = e.currentTarget.cellIndex;
		
		var rowCells = [];
		var domCells = e.currentTarget.parentElement.cells;
		for (var i = 0; i < domCells.length; i++) {
			rowCells.push(domCells[i].innerText);
		}
		
		executeTableOnClickHandlers(row, col, rowCells);
	});
}

function isEmpty(str) {
    return (!str || 0 === str.length);
}

function isArray(o) {
    if (o == undefined) return false;
    return Object.prototype.toString.call(o) === '[object Array]';
}

function isFunction(functionToCheck) {
    var getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

function setValues(obj, key, value) {
    return setValuesHelper(obj, key, value);
}

function setValuesHelper(obj, key, value) {
    if (!obj) return;
    if (obj instanceof Array) {
        for (var i in obj) {
            setValuesHelper(obj[i], key, value);
        }
        return;
    }

    if (obj[key]) obj[key] = value;

    if ((typeof obj == "object") && (obj !== null)) {
        var children = Object.keys(obj);
        if (children.length > 0) {
            for (i = 0; i < children.length; i++) {
                setValuesHelper(obj[children[i]], key, value);
            }
        }
    }
}

function findValues(obj, key) {
    return findValuesHelper(obj, key, []);
}

function findValuesHelper(obj, key, list) {
    if (!obj) return list;
    if (obj instanceof Array) {
        for (var i in obj) {
            list = list.concat(findValuesHelper(obj[i], key, []));
        }
        return list;
    }
    if (obj[key]) list.push(obj[key]);

    if ((typeof obj == "object") && (obj !== null)) {
        var children = Object.keys(obj);
        if (children.length > 0) {
            for (i = 0; i < children.length; i++) {
                list = list.concat(findValuesHelper(obj[children[i]], key, []));
            }
        }
    }
    return list;
}

//if the value does not exist return empty string
//trim the white spaces from the value. trim
function cleanValue(val) {
	switch (typeof val) {
	case "string":
		return val.trim();
	case "boolean":
	case "number":
		return val;
	default:
		return "";
	}
}
