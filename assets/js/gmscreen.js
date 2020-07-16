var characterList = [];
var currentSession;
var dispatchNewMessages;

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

function createNewSession() {
	showConfirmPopup("This will delete the current session.", confirmCreateSession);
}

function addNPC(event) {
	event.preventDefault();
	// TODO
}

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

function addEventDisplay(event) {
	eventPane.append(convertEventToHtml(event));
}

function resetScreenInfo() {
	var i;
	var playerList = $("#playerList ol");
	playerList.text("");
	eventPane.text("");

	for (i = 0; i < currentSession.characters.length; i++) {
		playerList.append("<li>" + currentSession.characters[i] + "</li>");
	}
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
			$("#playerList ol").append("<li>" + character.name + "</li>");
			characterList.push(character);
			currentSession.characters.push(character.name);
			currentSession.statuses.push(new CharacterStatus(character));
			postSessionUpdate();
		} else {
			showErrorPopup("This character is already in the session.");
		}
	} else {
		showErrorPopup("Character not found.");
	}
}

function sessionLoaded(loadMe) {
	if ((loadMe) && (loadMe.val())) {
		eventPane.text("");
		currentSession = loadMe.val();
		Object.setPrototypeOf(currentSession, new RoleplaySession());
		dispatchNewMessages = false;
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
		addEventDisplay(loadMe.val());
		dispatchNewMessages = true;
	}
}

function postSessionUpdate() {
	dbSaveSession(currentSession);
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