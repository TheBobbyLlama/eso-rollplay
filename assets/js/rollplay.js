var character = new CharacterSheet();
var currentSession;
var dispatchNewMessages;  // Flag used differentiating between archived and freshly received messages.

var eventPane = $("#eventPane");

function initializePage() {
	initializeDB();

	$("input[name='charName']").val(localStorage.getItem("ESORP[name]"));
	$("input[name='charPlayer']").val(localStorage.getItem("ESORP[player]"));

	resetRollSelect();
}

function resetRollSelect() {
	var i;
	var rollSelector = $("#rollSelect");
	var charItems = Object.entries(character.skills);
	
	rollSelector.text("");

	for (i = 0; i < charItems.length; i++) {
		var curQuality = getQuality(charItems[i][0]);

		rollSelector.append("<option value='" + curQuality.key +"'>" + curQuality.name + "</option>")
	}

	for(i = 0; i < masterQualityList.length; i++) {
		var workingList = masterQualityList[i];

		for (var idx = 0; idx < workingList.length; idx++) {
			if (!charItems.find(element => element[0] == workingList[idx].key)) {
				rollSelector.append("<option value='" + workingList[idx].key +"'>" + workingList[idx].name + "</option>")
			}
		}
	}
		
}

function performRoll() {
	var key = $("#rollSelect").val();
	var result = character.makeRoll(key);
	var modifier = character.getRollModifier(key);
	var event = new EventRoll(character.name, key, modifier, result, $("#rollComment").val());
	$("#rollComment").val(""); // Clear the roll comment.
	dbPushEvent(event);
}

function copyOutput(event) {
	event.stopPropagation();
	var printout = $("#printout");
	var range = document.createRange();
	range.selectNodeContents(printout[0]);
	var sel = window.getSelection();
	sel.removeAllRanges();
	sel.addRange(range);
	document.execCommand("copy");
	sel.removeAllRanges();
}

function addEventDisplay(event) {
	switch (event.eventType) {
		case "Close":
			eventPane[0].textContent = "";
			dbLoadSessionByParticipant(character.name, sessionLoaded);
			break;
		default:
			eventPane.append(convertEventToHtml(event));
	}
}

function loadChar() {
	event.preventDefault();
	var tmpName = $("input[name='charName']").val();
	var tmpPlayer = $("input[name='charPlayer']").val();

	if ((!tmpName) || (!tmpPlayer)) {
		showErrorPopup("Please enter a character name and a player name.");
		return;
	}

	dbLoadCharacter(tmpName, characterLoaded)
}

function characterLoaded(loadMe) {
	if ((loadMe.val()) && (loadMe.val().player == $("input[name='charPlayer']").val())) {
		//character.loadValueHandler(loadMe.val());
		character = loadMe.val();
		Object.setPrototypeOf(character, new CharacterSheet());
		localStorage.setItem("ESORP[name]", character.name);
		character.print("printout");
		resetRollSelect();
		$("#rollExecute").removeAttr("disabled");

		eventPane.text("");
		dbLoadSessionByParticipant(character.name, sessionLoaded);
		
	} else {
		showErrorPopup("Character not found.");
		$("input[name='charName']").val(character.name);
		$("input[name='charPlayer']").val(character.player || localStorage.getItem("ESORP[player]"));
	}
}

function sessionLoaded(loadMe) {
	if (loadMe) {
		var i;
		var dummy;
		eventPane.text("");
		currentSession = loadMe;
		Object.setPrototypeOf(currentSession, new RoleplaySession());

		dummy = new CharacterStatus("");

		for (i = 0; i < currentSession.statuses.length; i++) {
			Object.setPrototypeOf(currentSession.statuses[i], dummy);
		}

		dummy = new NPC();

		for (i = 0; i < currentSession.npcs.length; i++) {
			Object.setPrototypeOf(currentSession.npcs[i], dummy);
		}

		dispatchNewMessages = false;
		dbLoadEventMessages(currentSession.owner, eventSystemLoaded);
		dbBindCallbackToEventSystem("child_added", eventAddedCallback);
	} else {
		showErrorPopup("This character is not part of an active roleplaying session.  Check with your Game Master.");
	}
}

function eventSystemLoaded(loadMe) {
	// Not needed?
}

function eventAddedCallback(loadMe) {
	if (loadMe.val()) {
		addEventDisplay(loadMe.val());
		dispatchNewMessages = true;
	}
}

function showErrorPopup(message) {
	$("#modalBG").addClass("show");
	$("#errorModal").addClass("show");
	$("#errorText").text(message);
}

function hideErrorPopup() {
	$("#modalBG").removeClass("show");
	$("#erorModal").removeClass("show");
}

$("#loadChar").on("click", loadChar);
$("#rollExecute").on("click", performRoll);
$("#printout").on("dblclick", copyOutput);
$("#errorButton").on("click", hideErrorPopup);

initializePage();