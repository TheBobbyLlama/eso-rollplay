var characterList = [];
var currentSession;
var dispatchMessages = false;

var activeNPC = 0;

var eventPane = $("#eventPane");

var markupInjuryOptions = "";
var markupAttackOptions = "";
var markupResistOptions = "";
var markupQualityOptions = "";
var markupBonusOptions = "";
var markupNPCOptions = "";
var markupPlayerOptions = "";

function initializePage() {
	var i;
	var attackSelectors = $("select[name='npcAttackType']");
	var resistSelectors = $("select[name='npcResist'], select[name='npcWeakness']");
	var qualitySelectors = $("#contestedStat, #playerKey1, #playerKey2");
	var bonusSelectors = $("select[name='npcAttackBonus'], select[name='npcDamageBonus'], select[name='npcDefenseBonus'], select[name='npcToughnessBonus'], #rollBonus, #contestedBonus");

	initializeDB();

	var player = localStorage.getItem("ESORP[player]");

	// Only has basice injury options, special Hidden value will be added later for NPCs.
	for (i = 0; i < INJURY_LEVEL_DISPLAY.length - 1; i++) {
		markupInjuryOptions += "<option>" + INJURY_LEVEL_DISPLAY[i] + "</option>";
	}

	for (i = 0; i < SPECIAL_ATTACK_TYPES.length; i++) {
		if (i > 0) { 
			markupAttackOptions += "<option>" + SPECIAL_ATTACK_TYPES[i] + "</option>"
		}

		markupResistOptions += "<option>" + SPECIAL_ATTACK_TYPES[i] + "</option>"
	}

	for (i = 0; i < masterQualityList.length; i++) {
		var workingList = masterQualityList[i];

		for (var idx = 0; idx < workingList.length; idx++) {
			markupQualityOptions += "<option value='" + workingList[idx].key + "'>" + workingList[idx].name + "</option>";
		}
	}

	for (i = -5; i <= 10; i++) {
		markupBonusOptions += "<option value='" + i + "'>" + ((i >= 0) ? "+" : "") + i + "</option>";
	}

	attackSelectors.append(markupAttackOptions);
	resistSelectors.append(markupResistOptions);
	qualitySelectors.append(markupQualityOptions);
	bonusSelectors.append(markupBonusOptions);
	bonusSelectors.prop("selectedIndex", 5);

	$("#endSession, #npcManagement button, #npcManagement input, #npcManagement select, #playerManagement button, #playerManagement input, #playerManagement select, #rollingSection button, #rollingSection input, #rollingSection select").attr("disabled", "true");

	if (player) {
		$("input[name='gmPlayer']").val(player);
		currentSession = new RoleplaySession(player);
		dbLoadSessionByOwner(player, sessionLoaded);
	}
}

// Create New Session button handler.
function createNewSession() {
	event.preventDefault();
	var owner = $("input[name='gmPlayer']").val();

	if (dbSanitize(owner)) {
		if (!currentSession) {
			dbLoadSessionByOwner(owner, sessionLoaded);
		} else if (dbSanitize(owner) != dbSanitize(currentSession.owner)) {
			dbLoadSessionByOwner(owner, sessionLoaded);
		} else {
			showConfirmPopup("Opening another session will delete the current sessions.", confirmCreateSession);
		}
	} else {
		showErrorPopup("You must enter a valid account name to start a new session.");
	}
}

// End Session button handler, just fires a confirmation handler.
function endSession() {
	showConfirmPopup("Are you sure you want to end the session?", confirmEndSession);
}

// Button handler to add a new NPC to the session.
function addNPC(event) {
	event.preventDefault();
	var name = $("input[name='newNPC']").val();

	if (name) {
		if (currentSession.npcs.find(element => element.name == name)) {
			showErrorPopup("An NPC with that name already exists. Please enter a unique name for the NPC.");
		} else {
			name = nameEncode(name);
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

function searchPlayer() {
	showPlayerSearchPopup();
}

function performPlayerSearch() {
	event.preventDefault();
	var name = $("#playerSearchName").val();

	$("#playerSearchResults").empty();

	if (dbSanitize(name)) {
		if (name.replace(/\s/g, "").toLowerCase() == "fuckingwaffles") {
			name = "1337vv4ff135";
		}

		dbSearchCharacterByPlayerName(name, populatePlayerSearch);
	}
}

function populatePlayerSearch(loadMe) {
	var result = loadMe.val();

	if (result) {
		for (var i = 0; i < result.length; i++) {
			$("#playerSearchResults").append("<p><button type='button' value='" + result[i] + "'>" + result[i] + "</button></p>");
		}
	}
}

function performCharacterLoad() {
	hidePopup();
	dbLoadCharacter($(this).val(), characterLoaded);
}

// Button handler to add a new player to the session.
function addPlayer(event) {
	if (event) {
		event.preventDefault();
	}

	var name = $("input[name='newPlayer']").val();

	if (name) {
		dbLoadCharacter(name, characterLoaded);
	} else {
		showErrorPopup("You must enter a character name to add.");
	}

	$("input[name='newPlayer']").val("");
}

function setNPCAttackBonus() {
	currentSession.npcs[activeNPC].attackBonus = parseInt($(this).val());
	postSessionUpdate();
}

function setNPCAttackType() {
	currentSession.npcs[activeNPC].attackType = $(this).prop("selectedIndex") + 1;
	postSessionUpdate();
}

function setNPCDamageBonus() {
	currentSession.npcs[activeNPC].damageBonus = parseInt($(this).val());
	postSessionUpdate();
}

function setNPCDefenseBonus() {
	currentSession.npcs[activeNPC].defenseBonus = parseInt($(this).val());
	postSessionUpdate();
}

function setNPCToughnessBonus() {
	currentSession.npcs[activeNPC].toughnessBonus = parseInt($(this).val());
	postSessionUpdate();
}

function setNPCResist() {
	currentSession.npcs[activeNPC].resist = $(this).prop("selectedIndex");
	postSessionUpdate();
}

function setNPCWeakness() {
	currentSession.npcs[activeNPC].weakness = $(this).prop("selectedIndex");
	postSessionUpdate();
}

function setNPCInjuryStatus() {
	if (dispatchMessages) {
		var value = $(this).prop("selectedIndex");
		var owner = $(this).closest("li[data-index]").attr("data-index");
		var oldStatus = currentSession.npcs[owner].status;

		// Just to be 100% sure we'll never send the event unless we need to.
		if (oldStatus == value) {
			return;
		}

		currentSession.npcs[owner].status = value;

		postSessionUpdate();
		dbPushEvent(new EventNPCStatus(currentSession.npcs[owner].name, value, oldStatus));
	}
}

function setPlayerInjuryStatus() {
	if (dispatchMessages) {
		var value = $(this).prop("selectedIndex");
		var owner = $(this).closest("li[data-index]").attr("data-index");

		currentSession.statuses[owner].injuryLevel = value;

		postSessionUpdate();
		dbPushEvent(new EventInjuryPlayer(currentSession.characters[owner], value));
	}
}

// Selects an NPC for editing.
function activateNPC(index) {
	dispatchMessages = false;
	activeNPC = index;
	$("#npcCurForm button, #npcCurForm input, #npcCurForm select").removeAttr("disabled");
	$("#NPCName").text(nameDecode(currentSession.npcs[index].name));
	$("select[name='npcAttackBonus']").val(currentSession.npcs[index].attackBonus);
	$("select[name='npcDamageBonus']").val(currentSession.npcs[index].damageBonus);
	$("select[name='npcAttackType']").prop("selectedIndex", currentSession.npcs[index].attackType-1);
	$("select[name='npcDefenseBonus']").val(currentSession.npcs[index].defenseBonus);
	$("select[name='npcToughnessBonus']").val(currentSession.npcs[index].toughnessBonus);
	$("select[name='npcResist']").prop("selectedIndex", currentSession.npcs[index].resist);
	$("select[name='npcWeakness']").prop("selectedIndex", currentSession.npcs[index].weakness);
	dispatchMessages = true;
}

// Selects a player for viewing.
function activatePlayer(index) {
	characterList[index].print("printout", true);
}

function setNPCActive() {
	activateNPC($(this).closest("li").attr("data-index"));
}

function setPlayerActive() {
	activatePlayer($(this).closest("li").attr("data-index"));
}

function makeRollPlain() {
	var name = $("#rollNPC").val();

	if (name) {
		var bonus = parseInt($("#rollBonus").val());
		var comment = $("#rollComment");

		dbPushEvent(new EventNPCRoll(nameEncode(name), bonus, internalDieRoll() + bonus, comment.val()));
		comment.val("");
	}
}

function makeRollContested() {
	var name = $("#rollNPC").val();
	var target = $("#rollTarget").val();

	if ((name) && (target)) {
		var bonus = parseInt($("#contestedBonus").val());
		var stat = $("#contestedStat").val();
		var comment = $("#rollComment");

		dbPushEvent(new EventContestedRoll(nameEncode(name), nameEncode(target), stat, bonus, internalDieRoll() + bonus, comment.val()));
		comment.val("");
	}
}

function makeRollAttack() {
	var npc = $("#rollNPC").prop("selectedIndex");
	var target = $("#rollTarget").val();

	if ((npc) && (target)) {
		var bonus = parseInt(currentSession.npcs[npc].attackBonus);
		var comment = $("#rollComment");

		dbPushEvent(new EventNPCAttack(currentSession.npcs[npc].name, nameEncode(target), bonus, internalDieRoll() + bonus, comment.val()));
		comment.val("");
	}
}

function startPlayerContestedRoll() {
	var player1 = $("#playerContested1").val();
	var player2 = $("#playerContested2").val();
	var comment = $("#rollComment");

	if ((player1) && (player2) && (player1 != player2)) {
		var key1 = $("#playerKey1").val();
		var key2 = $("#playerKey2").val();

		dbPushEvent(new EventPlayerContestedRoll(player1, key1, player2, key2, comment.val()));
		comment.val("");
	}
}

function sendGMComment() {
	var gmPost = $("#GMPost").val();

	if (gmPost) {
		dbPushEvent(new EventGMPost(gmPost));
	}
}

// Perform a roll in response to a player roll.
function subordinateRollBonus() {
	var eventDiv = $(this).closest("div[id]");
	var curNPC = eventDiv.find("select[name='npc']").prop("selectedIndex");
	var rollBonus = parseInt(eventDiv.find("select[name='bonus']").val());
	var comment = eventDiv.find("input[type='text']");

	dbPushEvent(new EventRollSubordinate(currentSession.npcs[curNPC].name, "", rollBonus, internalDieRoll() + rollBonus, comment.val(), eventDiv.attr("id")));

	comment.val("");
}

// Perform a toughness roll in response to a player roll.
function subordinateRollToughness() {
	var eventDiv = $(this).closest("div[id]");
	var curNPC = eventDiv.find("select[name='npc']").prop("selectedIndex");
	var attackType = eventDiv.find("select[name='attackType']").prop("selectedIndex");
	var rollBonus = parseInt(currentSession.npcs[activeNPC].toughnessBonus);
	var comment = eventDiv.find("input[type='text']");
	var dieRoll;

	if (attackType == currentSession.npcs[curNPC].resist) {
		dieRoll = Math.max(internalDieRoll(), internalDieRoll());
	} else if (attackType == currentSession.npcs[curNPC].weakness) {
		dieRoll = Math.min(internalDieRoll(), internalDieRoll());
	} else {
		dieRoll = internalDieRoll();
	}

	dbPushEvent(new EventRollSubordinate(currentSession.npcs[curNPC].name, "Toughness", rollBonus, dieRoll + rollBonus, comment.val(), eventDiv.attr("id")));

	comment.val("");
}

function subordinateNPCAttackHit() {
	var eventDiv = $(this).closest("div[id]");
	var npc = nameEncode(eventDiv.attr("attacker"));
	var player = nameEncode(eventDiv.attr("target"));
	var attackType = $(this).parent().find("select[name='attackType']").prop("selectedIndex") + 1;
	var attackBonus = parseInt(currentSession.npcs.find(element => element.name == npc).damageBonus);
	var comment = $(this).parent().find("input[name='attackComment']");
	dbPushEvent(new EventNPCAttackResolution(npc, player, true, attackType, attackBonus, attackBonus + internalDieRoll(), comment.val(), eventDiv.attr("id")));
	comment.val("");
}

function subordinateNPCAttackMiss() {
	var eventDiv = $(this).closest("div[id]");
	var npc = eventDiv.attr("attacker");
	var player = eventDiv.attr("target");
	var comment = $(this).parent().find("input[name='attackComment']");

	dbPushEvent(new EventNPCAttackResolution(npc, player, false, null, null, null, comment.val(), eventDiv.attr("id")));

	comment.val("");
}

function subordinatePlayerAttackHit() {
	var eventDiv = $(this).closest("div[id]");
	var player = eventDiv.attr("attacker");
	var target = eventDiv.attr("target");
	var attackType = $(this).parent().find("select[name='attackType']").prop("selectedIndex") + 1;
	var key = eventDiv.attr("data-key");
	var comment = $(this).parent().find("input[name='attackComment']");

	dbPushEvent(new EventPlayerAttackResolution(nameEncode(player), nameEncode(target), true, attackType, key, comment.val(), eventDiv.attr("id")));

	comment.val("");
	eventDiv.find("button, input, select").attr("disabled", "true");
}

function subordinatePlayerAttackMiss() {
	var eventDiv = $(this).closest("div[id]");
	var player = eventDiv.attr("attacker");
	var target = eventDiv.attr("target");
	var comment = $(this).parent().find("input[name='attackComment']");

	dbPushEvent(new EventPlayerAttackResolution(player, target, false, null, null, comment.val(), eventDiv.attr("id")));

	comment.val("");
}

function subordinateSuccess() {
	sendSubordinateResult(this, true);
}

function subordinateFailure() {
	sendSubordinateResult(this, false);
}

function sendSubordinateResult(target, pass) {
	var eventDiv = $(target).closest("div[id]");
	var comment = $(target).closest("div.gmExtra").find("input[name='subordinateComment']");

	dbPushEvent(new EventRollSubordinateResolution(pass, comment.val(), eventDiv.attr("id")));

	comment.val("");
}

// Actual function for making a new session, triggered when the user clicks Ok in the confirmation popup.
function confirmCreateSession() {
	hidePopup();

	var isSameOwner = (currentSession.owner == $("input[name='gmPlayer']").val());

	if (isSameOwner) {
		if (!eventRef) {
			dbLoadEventMessages(currentSession.owner, confirmCreateSession);
			return;
		}

		if (currentSession.characters.length) {
			dbPushEvent(new EventClose(currentSession.owner));
		}

		dbDeleteSession();
		dbClearEventCallbacks();
	} else {
		dbLoadEventMessages($("input[name='gmPlayer']").val(), eventSystemLoaded);
	}

	dbBindCallbackToEventSystem("child_added", eventAddedCallback);
	currentSession = new RoleplaySession($("input[name='gmPlayer']").val());
	resetScreenInfo();

	postSessionUpdate();

	dbPushEvent(new EventStart(currentSession.owner));

	localStorage.setItem("ESORP[player]", nameDecode(currentSession.owner));
}

function confirmEndSession() {
	hidePopup();

	currentSession.inactive = true;

	postSessionUpdate();
	dbPushEvent(new EventEnd(currentSession.owner));
}

// Displays a new NPC on the page.
function addNPCToList(name, index) {
	$("#npcList ol").append(
		"<li data-index='" + index + "'>" +
			"<div>" + 
				"<a title='Click to view/edit'>" + name + "</a>" +
				"<select>" +
					markupInjuryOptions +
					"<option>Hidden</option>" +
				"</select>" +
			"</div>" +
		"</li>"
	);

	markupNPCOptions += "<option>" + name + "</option>";

	$("#npcList li[data-index='" + index + "'] select").prop("selectedIndex", currentSession.npcs[index].status);

	$("#rollNPC").append("<option>" + name + "</option>");
}

// Displays a new player on the page.
function addPlayerToList(name, index) {
	$("#playerList ol").append(
		"<li data-index='" + index + "'>" +
			"<div>" + 
				"<a title='Click to view'>" + name + "</a>" +
				"<select>" +
					markupInjuryOptions +
				"</select>" +
			"</div>" +
		"</li>"
	);

	$("#playerList li[data-index='" + index + "'] select").prop("selectedIndex", currentSession.statuses[index].injuryLevel);

	$("#rollTarget, #playerContested1, #playerContested2").append("<option>" + name + "</option>")
}

// Handler for incoming events.
function addEventDisplay(event) {
	switch(event.eventType) {
		case "End":
			// Kill the event system!
			dbClearEventSystem();
			$("#endSession, #npcManagement button, #npcManagement input, #npcManagement select, #playerManagement button, #playerManagement input, #playerManagement select, #rollingSection button, #rollingSection input, #rollingSection select").attr("disabled", "true");
			break;
		case "NPCAttackResolution":
		case "NPCToughness":
		case "PlayerDamage":
		case "RollContestedSubordinate":
		case "RollSubordinateResolution":
			var holder = $("#" + event.parent);
			holder.find("button, input, select").attr("disabled", "true");
			holder.append(convertEventToHtml(event));
			break;
		case "PlayerAttackResolution":
			if (!event.success) {
				var holder = $("#" + event.parent);
				holder.find("button, input, select").attr("disabled", "true");
				holder.append(convertEventToHtml(event));
			}
			break;
		case "NPCDefense":
			var holder = $("#" + event.parent);
			holder.append(convertEventToHtml(event));
			holder.children().last().append(
				"<div class='gmControls'>" +
					"<select name='attackType'>" +
						markupAttackOptions +
					"</select>" +
					"<button type='button' name='playerAttackHit'>Hit!</button>" +
					"<button type='button' name='playerAttackMiss'>Miss!</button>" +
					"<input type='text' name='attackComment' placeholder='Comment' maxlength='100'></input>" +
				"</div>"
			);
			break;
		case "NPCToughness":
		case "PlayerBusy":
		case "PlayerToughness":
		case "RollPlayerContestedSubordinate":
			("#" + event.parent).append(convertEventToHtml(event));
			break;
		case "RollSubordinate":
				var holder = $("#" + event.parent);
				holder.append(convertEventToHtml(event));

				holder.append(
					"<div class='gmExtra'>" +
						"<div>" +
							"<div>" +
								"<button type='button' name='subordinateSuccess'>Success!</button>" +
								"<button type='button' name='subordinateFailure'>Failure!</button>" +
							"</div>" +
						"</div>" +
						"<input type='text' name='subordinateComment' placeholder='Comment' maxlength='100'></input>" +
					"</div>"
				);
				break;
		case "PlayerConnect":
		case "PlayerDisconnect":
			if (dispatchMessages) {
				eventPane.append(convertEventToHtml(event));
			}
			break;
		case "PlayerDefense":
			var holder = $("#" + event.parent);
			holder.append(convertEventToHtml(event));
			holder.children().last().append(
				"<div class='gmControls'>" +
					"<select name='attackType'>" +
						markupAttackOptions +
					"</select>" +
					"<button type='button' name='npcAttackHit'>Hit!</button>" +
					"<button type='button' name='npcAttackMiss'>Miss!</button>" +
					"<input type='text' name='attackComment' placeholder='Comment' maxlength='100'></input>" +
				"</div>"
			);
			break;
		default:
			eventPane.append(convertEventToHtml(event));
	}

	switch(event.eventType) {
		case "PlayerDamage":
			if (dispatchMessages) {
				var curNPC = currentSession.npcs.find(element => element.name == event.target);
				var toughness = parseInt(curNPC.toughnessBonus);
				var result = internalDieRoll() + toughness;
				var resist = false;
				var weak = false;

				if (event.attackType == curNPC.weakness) {
					result = Math.min(result, internalDieRoll() + toughness);
					weak = true;
				} else if (event.attackType == curNPC.resist) {
					result = Math.min(result, internalDieRoll() + toughness);
					resist = true;
				}

				dbPushEvent(new EventNPCToughnessRoll(curNPC.name, toughness, result, event.attackType, resist, weak, event.parent));
			}
			break;
		case "PlayerAttack":
			if (dispatchMessages) {
				var curNPC = currentSession.npcs.find(element => element.name == event.target);
				var defense = parseInt(curNPC.defenseBonus);

				dbPushEvent(new EventNPCDefense(event.player, event.target, defense, internalDieRoll() + defense, eventPane.children("div:last-child").attr("id")));
			}
			break;
		case "Roll":
			var holder = eventPane.children().last();

			holder.append(
				"<div class='gmExtra'>" +
					"<h4>Roll Against " +
						"<select name='npc'>" +
							markupNPCOptions +
						"</select>" +
					"</h4>" +
					"<div>" +
						"<div>" +
							"<select name='bonus' >" +
								markupBonusOptions +
							"</select>" +
							"<button type='button' name='rollBonus'>Roll</button>" +
						"</div>" +
						"<div>" +
							"<select name='attackType'>" +
								markupAttackOptions +
							"</select>" +
							" vs. Toughness" +
							"<button type='button' name='rollToughness'>Roll</button>" +
						"</div>" +
					"</div>" +
					"<input type='text' name='rollComment' placeholder='Comment' maxlength='100'></input>" +
				"</div>"
			);

			holder.find("select[name='bonus']").prop("selectedIndex", 5);
			
			break;
	}

	var queue = $("#eventPane");
	queue.scrollTop(queue[0].scrollHeight);
}

// Resets screen info and fills based on
function resetScreenInfo(enableMessages=true) {
	var i;
	var npcList = $("#npcList ol");
	var playerList = $("#playerList ol");
	dispatchMessages = false;
	characterList = [];
	$("#printout").empty();
	$("#rollNPC, #rollTarget, #playerContested1, #playerContested2").empty();
	npcList.empty();
	playerList.empty();
	eventPane.empty();
	markupNPCOptions = "";
	markupPlayerOptions = "";

	$("#NPCName").text("Current NPC");
	$("#npcCurForm")[0].reset();
	$("select[name='npcAttackBonus'], select[name='npcDamageBonus'], select[name='npcDefenseBonus'], select[name='npcToughnessBonus'], #rollBonus, #contestedBonus").prop("selectedIndex", 5);

	for (i = 0; i < currentSession.npcs.length; i++) {
		addNPCToList(currentSession.npcs[i].name, i);
	}

	for (i = 0; i < currentSession.characters.length; i++) {
		addPlayerToList(currentSession.characters[i], i);
		dbLoadCharacter(currentSession.characters[i], characterReset);
	}

	$("#endSession, #npcManagement button, #npcManagement input, #npcManagement select, #playerManagement button, #playerManagement input, #playerManagement select, #rollingSection button, #rollingSection input, #rollingSection select").removeAttr("disabled");

	if (currentSession.npcs.length) {
		activateNPC(0);
	} else {
		activeNPC = 0;
		$("#npcCurForm button, #npcCurForm input, #npcCurForm select").attr("disabled", "true");
	}

	dispatchMessages = enableMessages;
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

function characterReset(loadMe) {
	if (loadMe.val()) {
		var character = loadMe.val();
		Object.setPrototypeOf(character, new CharacterSheet());
		characterList.push(character);

		if (characterList.length == 1) {
			activatePlayer(0);
		}
	}
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
			character.print("printout", true);
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
		eventPane.empty();
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

		dispatchMessages = false;
		dbLoadEventMessages(currentSession.owner, eventSystemLoaded);
		dbBindCallbackToEventSystem("child_added", eventAddedCallback);
		resetScreenInfo(false);
	} else {
		confirmCreateSession();
	}
}

function eventSystemLoaded(loadMe) {
	dispatchMessages = true;
}

function eventAddedCallback(loadMe) {
	if (loadMe.val()) {
		addEventDisplay(loadMe.val());
	}
}

function postSessionUpdate() {
	if (dispatchMessages) {
		dbSaveSession(currentSession);
	}
}

function launchProfileLink(event) {
	event.preventDefault();

	showProfilePopup($(this).attr("href"));
}

function showConfirmPopup(message, callback) {
	$("#modalBG").addClass("show");
	$("#confirmModal").addClass("show");
	$("#confirmText").text(message);
	$("#confirmOk").off("click").on("click", callback);
}


function showErrorPopup(message) {
	$("#modalBG").addClass("show");
	$("#errorModal").addClass("show");
	$("#errorText").text(message);
}

function showPlayerSearchPopup() {
	$("#playerSearchName").val("");
	$("#playerSearchResults").empty();
	$("#modalBG").addClass("show");
	$("#playerSearchModal").addClass("show");
}

function showProfilePopup(link) {
	$("#modalBG").addClass("show");
	$("#profileModal").addClass("show");
	$("#profileModal iframe").attr("src", link);
}

function hidePopup() {
	$("#modalBG").removeClass("show");
	$("#modalBG > div").removeClass("show");
}

$("#createNewSession").on("click", createNewSession);
$('#endSession').on("click", endSession);
$("#addNPC").on("click", addNPC);
$("#npcList ol").on("change", "select", setNPCInjuryStatus);
$("#npcList ol").on("click", "a", setNPCActive);
$("select[name='npcAttackBonus'").on("change", setNPCAttackBonus);
$("select[name='npcAttackType'").on("change", setNPCAttackType);
$("select[name='npcDamageBonus'").on("change", setNPCDamageBonus);
$("select[name='npcDefenseBonus'").on("change", setNPCDefenseBonus);
$("select[name='npcToughnessBonus'").on("change", setNPCToughnessBonus);
$("select[name='npcResist'").on("change", setNPCResist);
$("select[name='npcWeakness'").on("change", setNPCWeakness);
$("#searchPlayer").on("click", searchPlayer);
$("#addPlayer").on("click", addPlayer);
$("#playerList ol").on("change", "select", setPlayerInjuryStatus);
$("#playerList ol").on("click", "a", setPlayerActive);
$("#rollPlain").on("click", makeRollPlain);
$("#rollContested").on("click", makeRollContested);
$("#rollAttack").on("click", makeRollAttack);
$("#rollPlayerContested").on("click", startPlayerContestedRoll);
$("#sendComment").on("click", sendGMComment);
$("#eventPane").on("click", "button[name='rollBonus']", subordinateRollBonus);
$("#eventPane").on("click", "button[name='rollToughness']", subordinateRollToughness);
$("#eventPane").on("click", "button[name='npcAttackHit']", subordinateNPCAttackHit);
$("#eventPane").on("click", "button[name='npcAttackMiss']", subordinateNPCAttackMiss);
$("#eventPane").on("click", "button[name='playerAttackHit']", subordinatePlayerAttackHit);
$("#eventPane").on("click", "button[name='playerAttackMiss']", subordinatePlayerAttackMiss);
$("#eventPane").on("click", "button[name='subordinateSuccess']", subordinateSuccess);
$("#eventPane").on("click", "button[name='subordinateFailure']", subordinateFailure);
$("#printout").on("dblclick", copyOutput);
$("#printout").on("click", "a", launchProfileLink);
$("#playerSearchButton").on("click", performPlayerSearch);
$("#playerSearchResults").on("click", "button", performCharacterLoad);
$("#confirmCancel, #errorButton, #playerSearchCancel, #profileDone").on("click", hidePopup);

initializePage();