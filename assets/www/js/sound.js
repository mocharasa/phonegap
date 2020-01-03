// JavaScript Document
$(document).ready(function(){
		"use strict";
		
	var mySounds = [new Audio("audio/click.mp3"), new Audio("audio/horn.mp3")];

	$("[id^='playClip']").click(function(e){
		var clickID = e.target.id;
		var clickNUM = clickID.substr(clickID.length - 2);
		var arrayIndex = clickNUM - 1;
		
		mySounds[arrayIndex].play();
	});
});
