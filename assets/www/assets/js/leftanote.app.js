//URL root to the webservice
var WEBSERVICE = "http://leftanote.com/webservice/";

function QueryString(query)
{
	if(!query)query = window.location.href.split('?');
	var array = [];
	if(query.length > 1)
	{
		var segs = query[1].split('&');
		var segcount = segs.length;
		for(var i=0; i < segcount; ++i)
		{
			var subseg = segs[i].split('=');
			array[subseg[0]] = subseg[1];
		}
	}
	return array;
}

function DeleteNote(state, number, id, password)
{
    $.ajax(
    {
        url: WEBSERVICE+'note/'+state+'/'+number+'?noteid='+id+'&auth='+password,
        type: 'DELETE',
        dataType: 'json',
        success: function(response){if(response.success === true)alert('Note Was Deleted.');}
    });
}

/*
 Generic Jquery Mobile Application Framework.
 Add actions by implementing the MobileApp.Action
 interface and implement the necessary page
 functions then call registerAction to add the
 new action to the action queue.
*/
var MobileApp = {
	
	//Interface for any page actions.
	Action: function()
	{
		//The page element that you wish to add actions to.
		MobileApp.Action.prototype.page = "";
		//The jQuery Mobile pagebeforecreate event
		MobileApp.Action.prototype.pageBeforeCreate = function(){};
		//The jQuery Mobile pagecreate event
		MobileApp.Action.prototype.pageCreate = function(){};
		//The jQuery Mobile pagebeforeshow event
		MobileApp.Action.prototype.pageBeforeShow = function(){};
		//The jQuery Mobile pageshow event
		MobileApp.Action.prototype.pageShow = function(){};
		//The jQuery Mobile pagebeforehide event
		MobileApp.Action.prototype.pageBeforeHide = function(){};
		//The jQuery Mobile pagehide event
		MobileApp.Action.prototype.pageHide = function(obj, event, ui){};
	},
	
	actions:  new Array(),
	registerAction: function(action){this.actions.push(action);},
	init: function()
	{
		var self = this;
		for(var i=0; i < this.actions.length; i++)
		{
			var action = this.actions[i];
			//Bind mobile events to the actions page element
			//whether the page element exists yet or not.
			$(action.page).live(
			{
				"pagebeforecreate":	action.pageBeforeCreate,
				"pagecreate": 		action.pageCreate,
				"pagebeforeshow": 	action.pageBeforeShow,
				"pageshow": 		action.pageShow,
				"pagebeforehide":	action.pageBeforeHide,
				"pagehide": 		action.pageHide
			});
			//If additional initialization code exists then run it.
			if(action.init)action.init();
		}
	}
};

LeftANoteAction.prototype = new MobileApp.Action;
function LeftANoteAction()
{
	LeftANoteAction.prototype.buildAction = function(form, stateOnly)
	{
		var state = $(form).find('select[name="state"]').val();
        var number = $.trim($(form).find('input[name="number"]').val()).replace(/(\-|\s|_)/g, '');
		if(number != '' && state != '')return WEBSERVICE+$(form).attr('action')+'/'+state+'/'+number;
		else if(state != '' && stateOnly)return WEBSERVICE+$(form).attr('action')+'/'+state;
		else return false;
	};
	
	LeftANoteAction.prototype.attachReport = function()
	{
		var self = this;
		$(self.page+' .content .note-block li a.report').live('click', function(e)
		{
			$.mobile.showPageLoadingMsg();
			var elm = $(this);
			$.post(WEBSERVICE+elm.jqmData('action'), function(response)
			{
				$.mobile.hidePageLoadingMsg();
				if(response.success === true)alert('Thanks for the heads up. We will investigate this note.');
				else alert(response.message);
			}, 'json').error(function(request, statusText)
			{
				$.mobile.hidePageLoadingMsg();
				if(request.status !== 404)
				{
					var response = JSON.parse(request.responseText);
					alert(response.message);
				}
				else
				{
					elm.hide();
					alert("Could not find the note to report.");
				}
			});
		});
	};
	
	LeftANoteAction.prototype.attachViewMore = function()
	{
		var self = this;
		$(self.page+' .content .note-block ul .more input').live('click', function(e)
		{
			$.mobile.showPageLoadingMsg();
			var elm = $(self.page+' .content .note-block ul .more');
			var start = elm.jqmData('start');
            var count = 10;
			$.get(elm.jqmData('href'), {start: start, count: count}, function(response)
			{
				var length = response.data.length;
				if(length < count)
				{
					elm.hide();
					count = length;
				}
				var width = $(self.page+' .content .note-block').width() - 24;
				var html = '';
				for(var i=0; i < count; ++i)
				{
					var temp = $('#templates .note-template');
					console.log(response.data[i]);
					temp.find('.header .plate').text(response.data[i].state);
					temp.find('.header .details').text(response.data[i].state_full+' '+response.data[i].number);
					temp.find('.header .date').text(response.data[i].date_string);
					
					if(response.data[i].image === "1")temp.find('.note').replaceWith('<img class="note" width="'+width+'" src="'+response.data[i].note+'" alt="Image Note"/>');
					else temp.find('.note').replaceWith('<p class="note">'+response.data[i].note+'</p>');
					
					temp.find('.report').attr('data-action', 'report/'+response.data[i].state+'/'+response.data[i].number+'/'+response.data[i].id);
					html += temp.html();
				}
				elm.before(html);
				var total = start+length;
				$(self.page+' .content .note-block .title').text(total+' '+(total == 1 ? 'Note':'Notes'));
				elm.jqmData('start', total);
				
				$.mobile.hidePageLoadingMsg();
			}, 'json').error(function(request, statusText)
			{
				$.mobile.hidePageLoadingMsg();
				if(request.status !== 404)
				{
					var response = JSON.parse(request.responseText);
					alert(response.message);
				}
				else
				{
					elm.hide();
					alert("No more notes. You have reached the bottom.");
				}
			});
		});
	};
}

AddNote.prototype = new LeftANoteAction;
function AddNote()
{
    var self = this;
    AddNote.prototype.page = "#addnote";
	AddNote.prototype.init = function()
	{
		//Resize the canvas on orientation change.
		$('#addnote').bind('orientationchange', function(e)
		{
			var canvassize = $('#addnote .content dl').width() - 24; //For some reason the padding is off.
			$('#scribble').jqScribble.update({width: canvassize, height: 300});//300 seems like a decent height.
		});
	};
	
    AddNote.prototype.pageCreate = function()
    {
		$('#scribble').jqScribble();
		$(self.page+' .content a.color').live('click', function(e)
		{
			e.preventDefault();
			e.stopPropagation();
			if(!$(this).hasClass('color-selected'))
			{
				$('#scribble').jqScribble.update({brushColor: $(this).jqmData('color')});
				$(self.page+' .content a.color-selected').removeClass('color-selected');
				$(this).addClass('color-selected');
			}
		});
		$(self.page+' .content a.clear-scribble').live('click', function(e)
		{
			e.preventDefault();
			e.stopPropagation();
			$('#scribble').jqScribble.clear();
		});
        $(self.page+' .content').submit(function(e)
        {
			var note = $.trim($(this).find('textarea[name="note"]').val());
			var blank = $('#scribble').jqScribble.blank;
			if(note === '' && blank === true)
			{
				alert("You did not make a note.");
				$(self.page+' .content textarea[name="note"]').val('');
			}
			else
			{
				var action = self.buildAction($(this));
				if(action === false)alert("You must enter all license plate information.");
				else
				{
					$.mobile.showPageLoadingMsg();
                    $(self.page+' .content input[type="submit"]').prop('disabled', true);
					var data = {note: note};
					if(blank === false)data['image'] = $('#scribble').jqScribble.canvas.toDataURL('image/jpg');
					$.post(action, data, function(response)
					{
						$.mobile.hidePageLoadingMsg();
						$.mobile.changePage('http://leftanote.com/#checkplate?state='+response.state+'&number='+response.number);
					}, 'json').error(function(request, statusText)
					{
						$.mobile.hidePageLoadingMsg();
                        $(self.page+' .content input[type="submit"]').prop('disabled', false);
						var response = JSON.parse(request.responseText);
						alert(response.message);
					});
				}
			}
            return false;
        });
    };
    
    AddNote.prototype.pageBeforeShow = function()
    {
        $(self.page+' .content')[0].reset();
		$(self.page+' .content select').selectmenu("refresh");
		$('#scribble').jqScribble.clear();
        $(self.page+' .content input[type="submit"]').prop('disabled', false);
    };
	
	AddNote.prototype.pageShow = function()
	{
		var canvassize = $('#addnote .content dl').width() - 24; //For some reason the padding is off.
		$('#scribble').jqScribble.update({width: canvassize, height: 300});//300 seems like a decent height.
	};
}
MobileApp.registerAction(new AddNote());

CheckPlate.prototype = new LeftANoteAction;
function CheckPlate()
{
    var self = this;
    CheckPlate.prototype.page = "#checkplate";
    CheckPlate.prototype.init = function()
    {
    	$(self.page).bind('orientationchange', function(e)
		{
			var width = $(self.page+' .content .note-block').width() - 24; //For some reason the padding is off.
			$(self.page+' img.note').attr('width', width);
		});
    };
    CheckPlate.prototype.pageCreate = function()
    {
		var max = 10;
		self.attachViewMore();
		self.attachReport();
        $(self.page+' .content form').submit(function(e)
        {
			var action = self.buildAction($(this), true);
			if(action === false)
			{
				alert("You must select a state.");
				$(self.page+' .content form input[name="number"]').val('');
			}
			else
			{
				$.mobile.showPageLoadingMsg();
				$.get(action, {start: 0, count: max}, function(response)
				{
					var count = response.data.length;
					
					var html = '<ul>';
					var width = $(self.page+' .content .note-block').width() - 24;
					for(var i=0; i < count; ++i)
					{
						var temp = $('#templates .note-template');
						temp.find('.header .plate').text(response.data[i].state);
						temp.find('.header .details').text(response.data[i].state_full+' '+response.data[i].number);
						temp.find('.header .date').text(response.data[i].date_string);
						
						if(response.data[i].image === "1")temp.find('.note').replaceWith('<img class="note" width="'+width+'" src="'+response.data[i].note+'" alt="Image Note"/>');
						else temp.find('.note').replaceWith('<p class="note">'+response.data[i].note+'</p>');
					
						temp.find('.report').attr('data-action', 'report/'+response.data[i].state+'/'+response.data[i].number+'/'+response.data[i].id);
						html += temp.html();
					}
					if(count === max)html += '<li class="more" data-start="'+max+'" data-href="'+action+'"><span class="button"><input type="button" data-role="none" data-inline="true" value="View More"/></span></li>';
					html += '</ul>';
					
					$(self.page+' .content .note-block').html(html);
					$.mobile.hidePageLoadingMsg();
				}, 'json').error(function(request, statusText)
				{
					$.mobile.hidePageLoadingMsg();
					var response = JSON.parse(request.responseText);
					alert(response.message);
				});
			}	
            return false;
        });
    };
    
    CheckPlate.prototype.pageBeforeShow = function()
    {
        $(self.page+' .content form')[0].reset();
        //Have to refresh the select UI so 
        //that it resets the select display. 
        $(self.page+' .content select').selectmenu("refresh");
        $(self.page+' .content .note-block').html('');
		//Look for a car that was set because
		//a note was entered.
		var query = QueryString();
		if('state' in query && 'number' in query)
		{
			$(self.page+' .content :input[name="state"]').val(query['state']);
			$(self.page+' .content :input[name="number"]').val(query['number']);
			//Refresh the select so it will display the state that was set
			$(self.page+' .content select').selectmenu("refresh");
			$(self.page+' .content form').submit();
		}
    };
}
MobileApp.registerAction(new CheckPlate());

WatchPlate.prototype = new LeftANoteAction;
function WatchPlate()
{
    var self = this;
    WatchPlate.prototype.page = '#watchplate';
    WatchPlate.prototype.pageCreate = function()
    {
        $(self.page+' .content form').submit(function(e)
        {
            var action = self.buildAction($(this));
			if(action === false)alert("You must enter all license plate information.");
            else
			{
				var email = $(self.page+' .content form input[name="email"]').val();
                if($.trim(email).length > 0)
                {
                    $.mobile.showPageLoadingMsg();
                    $.post(action, {email: email}, function(response)
                    {
                        $.mobile.hidePageLoadingMsg();
                        alert('Success!! We will send you an email anytime a note gets posted to that license plate.');
                        $.mobile.changePage('#addnote');
                    }, 'json').error(function(request, statusText)
                    {
                        $.mobile.hidePageLoadingMsg();
                        var response = JSON.parse(request.responseText);
                        alert(response.message);
                    });

                }
                else alert("Please enter an email address.");
            }
            return false;
        });
    };

    WatchPlate.prototype.pageBeforeShow = function()
    {
        $(self.page+' .content form')[0].reset();
        //Have to refresh the select UI so
        //that it resets the select display.
        $(self.page+' .content select').selectmenu("refresh");
        var query = QueryString();
		if('state' in query && 'number' in query)
		{
			$(self.page+' .content :input[name="state"]').val(query['state']);
			$(self.page+' .content :input[name="number"]').val(query['number']);
			//Refresh the select so it will display the state that was set
			$(self.page+' .content select').selectmenu("refresh");
		}
    };
}
MobileApp.registerAction(new WatchPlate());

DeleteWatch.prototype = new LeftANoteAction;
function DeleteWatch()
{
    var self = this;
    DeleteWatch.prototype.page = '#deletewatch';
    DeleteWatch.prototype.pageCreate = function()
    {
    	$(self.page+' .content form').submit(function(e)
        {
            var action = self.buildAction(this);
            if(action === false)alert("You must enter all license plate information.");
            else
			{
				var email = $(self.page+' .content form input[name="email"]').val();
                if($.trim(email).length > 0)
                {
                    $.mobile.showPageLoadingMsg();
                    $.ajax({
                        url: action+'?email='+email,
                        type: 'DELETE',
                        dataType: 'json',
                        success: function(response)
                        {
                            $.mobile.hidePageLoadingMsg();
                            if(response.success === true)alert('You will no longer receive alerts when a note is posted to the address.');
                            else if(response.message)alert(response.message);
                            $(self.page+' .content form')[0].reset();
                            //Have to refresh the select UI so
                            //that it resets the select display.
                            $(self.page+' .content select').selectmenu("refresh");
                        },
                        error: function(request, statusText)
                        {
                            $.mobile.hidePageLoadingMsg();
                            var response = JSON.parse(request.responseText);
                            if(response.message)alert(response.message);
                            else alert(statusText);
                        }
                    });
                }
                else alert("Please enter an email address.");
            }
            return false;
        });
    };

    DeleteWatch.prototype.pageBeforeShow = function()
    {
        $(self.page+' .content form')[0].reset();
        //Have to refresh the select UI so
        //that it resets the select display.
        $(self.page+' .content select').selectmenu("refresh");
        var query = QueryString();
		if('state' in query && 'number' in query)
		{
			$(self.page+' .content :input[name="state"]').val(query['state']);
			$(self.page+' .content :input[name="number"]').val(query['number']);
			//Refresh the select so it will display the state that was set
			$(self.page+' .content select').selectmenu("refresh");
		}
    };
}
MobileApp.registerAction(new DeleteWatch());

$(function()
{
	MobileApp.init();
	//This is a fix for older Android devices that do not
	//have the toDataURL function of canvas implemented.
	var tdu = HTMLCanvasElement.prototype.toDataURL;
	HTMLCanvasElement.prototype.toDataURL = function(type)
	{
		var res = tdu.apply(this,arguments);
		//If toDataURL fails then we improvise
		if(res.substr(0,6) == "data:,")
		{
			var encoder = new JPEGEncoder();
			return encoder.encode(this.getContext("2d").getImageData(0,0,this.width,this.height), 90);
		}
		else return res;
	}
});