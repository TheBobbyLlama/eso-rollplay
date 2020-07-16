var characterList = [];
var currentSession;
var dispatchMessages = false;

var activeNPC;

var eventPane = $("#eventPane");

function initializePage() {
	var i;
	var attackSelectors = $("select[name='npcAttackType']");
	var resistSelectors = $("select[name='npcResist'], select[name='npcWeakness']");

	initializeDB();

	var player = localStorage.getItem("ESORP[player]");

	while (!player) {
		player = prompt("Please enter your ESO account name.");
	}

	$("input[name='gmPlayer']").val(player);
	currentSession = new RoleplaySession(player);

	for (i = 0; i < SPECIAL_ATTACK_TYPES.length; i++) {
		if (i > 0) { 
			attackSelectors.append("<option>" + SPECIAL_ATTACK_TYPES[i] + "</option>");
		}

		resistSelectors.append("<option>" + SPECIAL_ATTACK_TYPES[i] + "</option>");
	}

	dbLoadSessionByOwner(player, sessionLoaded);
}

// Create New Session button handler, just fires a confirmation handler.
function createNewSession() {
	showConfirmPopup("This will delete the current session.", confirmCreateSession);
}

// Button handler to add a new NPC to the session.
function addNPC(event) {
	event.preventDefault();
	var name = $("input[name='newNPC']").val();

	if (name) {
		if (currentSession.npcs.find(element => element.name == name)) {
			showErrorPopup("An NPC with that name already exists. Please enter a unique name for the NPC.");
		} else {
			currentSession.npcs.push(new NPC(name));
			addNPCToList(name, currentSession.npcs.length-1);
			activateNPC(currentSession.npcs.length-1);
			$("input[name='newNPC']").val("");
			postSessionUpdate();
			dbPushEvent(new EventAddNPC(name));
		}
	} else {
		showErrorPopup("Please enter a name for the NPC.");
	}
}

// Button handler to add a new player to the session.
function addPlayer(event) {
	event.preventDefault();
	var name = $("input[name='newPlayer']").val();

	if (name) {
		dbLoadCharacter(name, characterLoaded);
	} else {
		showErrorPopup("You must enter a character name to add.");
	}

	$("input[name='newPlayer']").val("");
}

// Selects an NPC for editing.
function activateNPC(index) {
	dispatchMessages = false;
	$("#NPCName").text(currentSession.npcs[index].name);
	$("input[name='npcAttackBonus']").val(currentSession.npcs[index].attackBonus);
	$("select[name='npcAttackType']").prop("selectedIndex", currentSession.npcs[index].attackType-1);
	$("input[name='npcResistanceBonus']").val(currentSession.npcs[index].resistanceBonus);
	$("select[name='npcResist']").prop("selectedIndex", currentSession.npcs[index].resists);
	$("select[name='npcWeakness']").prop("selectedIndex", currentSession.npcs[index].weakness);
	dispatchMessages = true;
}

// Actual function for making a new session, triggered when the user clicks Ok in the confirmation popup.
function confirmCreateSession() {
	hideConfirmPopup();

	if (currentSession.characters.length) {
		dbPushEvent(new EventClose(currentSession.owner));
	}

	dbDeleteSession();
	currentSession = new RoleplaySession($("input[name='gmPlayer']").val());
	resetScreenInfo();

	postSessionUpdate();

	dbPushEvent(new EventStart(currentSession.owner, new Date().toLocaleString("en-US")));
}

// Displays a new NPC on the page.
function addNPCToList(name, index) {
	var buildMarkup = "<li data-index='" + index + "'><div><a>" + name + "</a><select selectedIndex='" + currentSession.npcs[index].injuryLevel + "'>";

	for (var i = 0; i < INJURY_LEVEL_DISPLAY.length; i++) {
		buildMarkup += "<option>" + INJURY_LEVEL_DISPLAY[i] + "</option>";
	}

	$("#npcList ol").append(buildMarkup + "</select><div></li>");
}

// Displays a new player on the page.
function addPlayerToList(name, index) {
	var buildMarkup = "<li data-index='" + index + "'><div><a>" + name + "</a><select selectedIndex='" + currentSession.statuses[index].injuryLevel +"'>";

	for (var i = 0; i < INJURY_LEVEL_DISPLAY.length; i++) {
		buildMarkup += "<option>" + INJURY_LEVEL_DISPLAY[i] + "</option>";
	}

	$("#playerList ol").append(buildMarkup + "</select><div></li>");
}

// Handler for incoming events.
function addEventDisplay(event) {
	eventPane.append(convertEventToHtml(event));
}

// Resets screen info and fills based on
function resetScreenInfo() {
	var i;
	var npcList = $("#npcList ol");
	var playerList = $("#playerList ol");
	dispatchMessages = false;
	npcList.text("");
	playerList.text("");
	eventPane.text("");

	for (i = 0; i < currentSession.npcs.length; i++) {
		addNPCToList(currentSession.npcs[i].name, i);
	}

	for (i = 0; i < currentSession.characters.length; i++) {
		addPlayerToList(currentSession.characters[i], i);
	}

	dispatchMessages = true;
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

function characterLoaded(loadMe) {
	if (loadMe.val()) {
		var character = loadMe.val();
		Object.setPrototypeOf(character, new CharacterSheet());

		if (currentSession.characters.indexOf(character.name) == -1) {
			characterList.push(character);
			currentSession.statuses.push(new CharacterStatus(character));
			currentSession.characters.push(character.name);
			addPlayerToList(character.name, currentSession.characters.length-1);
			postSessionUpdate();
			character.print("printout");
			dbPushEvent(new EventAddPlayer(character.name));
		} else {
			showErrorPopup("This character is already in the session.");
		}
	} else {
		showErrorPopup("Character not found.");
	}
}

function sessionLoaded(loadMe) {
	if ((loadMe) && (loadMe.val())) {
		var i;
		var dummy;
		eventPane.text("");
		currentSession = loadMe.val();
		Object.setPrototypeOf(currentSession, new RoleplaySession());

		// Weird bug, arrays only half exist unless they're created explicitly???
		if ((!currentSession.npcs) || (!currentSession.npcs.length)) { currentSession.npcs = []; }
		if ((!currentSession.characters) || (!currentSession.characters.length)) { currentSession.characters = []; }
		if ((!currentSession.statuses) || (!currentSession.statuses.length)) { currentSession.statuses = []; }

		dummy = new NPC("dummy");

		for (i = 0; i < currentSession.npcs.length; i++) {
			Object.setPrototypeOf(currentSession.npcs[i], dummy);
		}

		dummy = new CharacterStatus(new CharacterSheet());

		for (i = 0; i < currentSession.statuses.length; i++) {
			Object.setPrototypeOf(currentSession.statuses[i], dummy);
		}

		dbLoadEventMessages(currentSession.owner, eventSystemLoaded);
		dbBindCallbackToEventSystem("child_added", eventAddedCallback);
		resetScreenInfo();
	}
	// Don't show an error if session fails to load, we can start a new one.
}

function eventSystemLoaded(loadMe) {
	// Not needed?
}

function eventAddedCallback(loadMe) {
	if (loadMe.val()) {
		dispatchMessages = false;
		addEventDisplay(loadMe.val());
		dispatchMessages = true;
	}
}

function postSessionUpdate() {
	if (dispatchMessages) {
		dbSaveSession(currentSession);
	}
}

function showConfirmPopup(message, callback) {
	$("#modalBG").addClass("show");
	$("#confirmModal").addClass("show");
	$("#confirmText").text(message);
	$("#confirmOk").on("click", callback);
}

function hideConfirmPopup() {
	$("#modalBG").removeClass("show");
	$("#confirmModal").removeClass("show");
}

function showErrorPopup(message) {
	$("#modalBG").addClass("show");
	$("#errorModal").addClass("show");
	$("#errorText").text(message);
}

function hideErrorPopup() {
	$("#modalBG").removeClass("show");
	$("#errorModal").removeClass("show");
}

$("#createNewSession").on("click", createNewSession);
$("#addNPC").on("click", addNPC);
$("#addPlayer").on("click", addPlayer);
$("#printout").on("dblclick", copyOutput);
$("#confirmCancel").on("click", hideConfirmPopup);
$("#errorButton").on("click", hideErrorPopup);

initializePage();