// ==UserScript==
// @name		TP-LINK Prettifier
// @author		Giuseppe Bertone, Brainmote s.r.l.s.
// @namespace	http://www.brainmote.com
// @version		1.1
// @updateURL   https://raw.githubusercontent.com/Brainmote/TP-Link-Prettifier/master/tp-link-prettifier.user.js
// @downloadURL	https://raw.githubusercontent.com/Brainmote/TP-Link-Prettifier/1.1-release/tp-link-prettifier.user.js
// @description This script is used to prettify the "Wireless Station Status" page for TP-Link TD-W8970 router. In particular, with this script you can see the description near the MAC address for devices you already registered in the Wireless MAC Filtering page. (you can see a snapshot here https://goo.gl/pBjoLY). Tested on Firmware version: 0.6.0 2.8 v000c.0 Build 130828 Rel.38099n and Hardware version: TD-W8970 v1 00000000
// @match		http://192.168.1.1/*
// @copyright	2014+, Brainmote s.r.l.s.
// @license		Apache License Version 2.0
// @require		https://s3-eu-west-1.amazonaws.com/public.brainmote.com/userscripts/jquery-2.1.1.min.js
// @grant		unsafeWindow
// ==/UserScript==

$(document).ready(
    function() {
        //Modify the original ajax function so I can call the prettify when needed
        unsafeWindow.$.ajaxOriginal = unsafeWindow.$.ajax;
        unsafeWindow.$.ajax = function( s ) {
            if ( "/cgi?7" == s.url ){
                $.when( unsafeWindow.$.ajaxOriginal( s ) ).done( function(){
                    //Use a little timeout to let the list to be loaded
                    setTimeout( 
                        function() {
                            //Native call to the router to get the registered mac list and description
                            unsafeWindow.$.io( "./cgi?5", false, function( response ) {
                                //Read the response and prepare a clean MAC list (key = mac address, value = description)
                                response = response.replace( /X_TPLINK_Description=/g, "" );
                                response = response.replace( /X_TPLINK_MACAddress=/g, "" );
                                var responseArray = response.split( '\n' );
                                var descList = {}, descListSize = 0;
                                for( var i = 2; i < responseArray.length; i+=4 ){
                                    descList[responseArray[i]] = responseArray[i+1];
                                }
                                //Native call to the router to get IP and hostname associated to the mac
                                unsafeWindow.$.io( "./cgi?5", false, function( response ) {
                                    //Read the response and prepare a clean MAC list (key = mac address, value = description)
                                    response = response.replace( /MACAddress=/g, "" );
                                    response = response.replace( /hostName=/g, "" );
                                    response = response.replace( /IPAddress=/g, "" );
                                    var responseArray = response.split( '\n' );
                                    var hostnameList = {}, ipList = {};
                                    for( var i = 2; i < responseArray.length; i+=5 ){
                                        hostnameList[responseArray[i]] = responseArray[i+1];
                                        ipList[responseArray[i]] = responseArray[i+2];
                                    }
                                    //Prepare data for the prettify function
                                    hostList = {};
                                    Object.keys(ipList).
                                    forEach(function(element, index, array){
                                        hostList[element] = {};
                                        hostList[element]["IP"] = ipList[element];
                                        hostList[element]["HOSTNAME"] = hostnameList[element];
                                        hostList[element]["DESC"] = descList[element];
                                    });
                                    //List all MAC addresses and insert detailed info
                                    $( "td[width='20%']" ).each( function( index, element ) {
                                        var jqElement = $(element);
                                        var mac = jqElement.text();
                                        var hostData = hostList[mac];
                                        if ( hostData ) {
                                            jqElement.after($("<td>").text(mac));
                                            jqElement.after($("<td>").text(hostData["HOSTNAME"]));
                                            jqElement.text(hostData["DESC"])
                                            .after($("<td>").text(hostData["IP"]));
                                        }
                                    });
                                    $( "#tlbHead" ).remove();
                                    $( "th[width='5%']" ).remove();
                                    $( "td[width='5%']" ).remove();
                                    $( "#staTbl" ).css("border", "1px solid #999");            
                                    $( "#staTbl td" ).removeAttr("width");
                                    $( "#staTbl tbody" ).prepend("<tr style='font-weight:bold;'><td>Description</td><td>IP</td><td>Hostname</td><td>MAC address</td><td>Current status</td><td>Received packets</td><td>Sent packets</td></tr>");
                                }, "[LAN_HOST_ENTRY#0,0,0,0,0,0#0,0,0,0,0,0]0,4\r\nleaseTimeRemaining\r\nMACAddress\r\nhostName\r\nIPAddress\r\n", false );
                            }, "[LAN_WLAN_MACTABLEENTRY#0,0,0,0,0,0#1,1,0,0,0,0]0,3\r\nX_TPLINK_Enabled\r\nX_TPLINK_MACAddress\r\nX_TPLINK_Description\r\n", false );
                        }, 250 );});
            } else {
                unsafeWindow.$.ajaxOriginal( s );
            }
        }
    });
