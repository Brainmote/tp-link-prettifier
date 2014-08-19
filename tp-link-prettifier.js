// ==UserScript==
// @name		TP-LINK Prettifier
// @author		Giuseppe Bertone, Brainmote s.r.l.s.
// @namespace	http://www.brainmote.com
// @version		1.0
// @downloadURL	https://goo.gl/yWY7pS
// @description This script is used to prettify the "Wireless Station Status" page for TP-Link TD-W8970 router. In particular, with this script you can see the description near the MAC address for devices you already registered in the Wireless MAC Filtering page. (you can see a snapshot here https://goo.gl/pBjoLY). Tested on Firmware version: 0.6.0 2.8 v000c.0 Build 130828 Rel.38099n and Hardware version: TD-W8970 v1 00000000
// @match		http://192.168.1.1/*
// @copyright	2014+, Brainmote s.r.l.s.
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
                            //Native call to the router to get the registered mac list
                            unsafeWindow.$.io( "./cgi?5", false, function( response ) {
                                //Read the response and prepare a clean MAC list (key = mac address, value = description)
                                response = response.replace( /X_TPLINK_Description=/g, "" );
                                response = response.replace( /X_TPLINK_MACAddress=/g, "" );
                                var responseArray = response.split( '\n' );
                                var macList = {};
                                for( var i = 2; i < responseArray.length; i+=4 ){
                                    macList[responseArray[i]] = responseArray[i+1];
                                }
                                //Change the table headers widths
                                var largeColumnWidth = "35%";
                                var smallColumnWidth = "20%";
                                var header = $( ".T.T_macaddr" );
                                header.attr( "width", largeColumnWidth );
                                header.text( "Description (MAC Address)" );
                                $( "#t_curstat1" ).attr( "width", smallColumnWidth );
                                $( "#t_rxpkts1" ).attr( "width", smallColumnWidth );
                                //List all MAC addresses and show description
                                $( "td[width='20%']" ).each( function( index, element ) {
                                    element.width = largeColumnWidth;
                                    if ( macList[element.innerHTML] ) {
                                        element.innerHTML = macList[element.innerHTML] + " (" + element.innerHTML + ")";
                                    }
                                });
                                //Modify widths of other tds
                                $( "td[width='25%']" ).each( function( index, element ) { element.width = smallColumnWidth; });
                            }, "[LAN_WLAN_MACTABLEENTRY#0,0,0,0,0,0#1,1,0,0,0,0]0,3\r\nX_TPLINK_Enabled\r\nX_TPLINK_MACAddress\r\nX_TPLINK_Description\r\n", false );
                        }, 250 );});
            } else {
                unsafeWindow.$.ajaxOriginal( s );
            }
        }
    });