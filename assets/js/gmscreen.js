var characterList = [];
var currentSession;
var dispatchMessages = false;

var userInfo = null

var activeNPC = 0;
var activePlayer = 0;

var eventPane = $("#eventPane");

var markupInjuryOptions = "";
var markupAttackOptions = "";
var markupResistOptions = "";
var markupQualityOptions = "";
var markupBonusOptions = "";
var markupNPCOptions = "";
var markupPlayerOptions = "";
var markupPlayerPetOptions = "";

var soundLibrary = {
	alert: {
		audio: new Audio("./assets/audio/alert.mp3")
	}/*,
	damage: {
		audio: new Audio("./assets/audio/damage.mp3")
	}*/
}

/// Called on page startup.
async function initializePage(myUser) {
	if (!myUser) {
		showErrorPopup("User " + firebase.auth().currentUser.displayName + " not found!", divertToLogin);
		return;
	}

	var i;
	var attackSelectors = $("select[name='npcAttackType']");
	var resistSelectors = $("select[name='npcResist'], select[name='npcWeakness']");
	var qualitySelectors = $("#rollStat, #playerKey1, #playerKey2");
	var bonusSelectors = $("select[name='npcAttackBonus'], select[name='npcDamageBonus'], select[name='npcDefenseBonus'], select[name='npcToughnessBonus'], #rollBonus, #contestedBonus");
	var npcTemplateList = $("#NPCTemplateOptions");
	userInfo = myUser;

	await localizePage(userInfo.language);

	// Only has basic injury options, special Hidden value will be added later for NPCs.
	for (i = 0; i < INJURY_LEVEL_DISPLAY.length - 1; i++) {
		markupInjuryOptions += "<option value='" + INJURY_LEVEL_DISPLAY[i] + "'>" + localize(INJURY_LEVEL_DISPLAY[i]) + "</option>";
	}

	for (i = 0; i < SPECIAL_ATTACK_TYPES.length; i++) {
		if (i > 0) { 
			markupAttackOptions += "<option value='" + SPECIAL_ATTACK_TYPES[i] + "'>" + localize(SPECIAL_ATTACK_TYPES[i]) + "</option>"
		}

		markupResistOptions += "<option value='" + SPECIAL_ATTACK_TYPES[i] + "'>" + localize(SPECIAL_ATTACK_TYPES[i]) + "</option>"
	}

	for (i = 0; i < masterQualityList.length; i++) {
		var workingList = masterQualityList[i];

		for (var idx = 0; idx < workingList.length; idx++) {
			markupQualityOptions += "<option value='" + workingList[idx].key + "'>" + localize(workingList[idx].name) + "</option>";
		}
	}

	for (i = 0; i < npcTemplates.length; i++) {
		npcTemplateList.append("<option value='" + npcTemplates[i].name + "'>" + localize(npcTemplates[i].name) + "</option>");
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

	currentSession = new RoleplaySession(userInfo.display);
	dbLoadSessionByOwner(userInfo.display, sessionLoaded);

	// Set alert volume levels.
	Object.getOwnPropertyNames(soundLibrary).forEach((element) => {
		soundLibrary[element].audio.volume = userInfo.alertVolume || 1;
	});
}

function doLogout() {
	showConfirmPopup(localize("LOGOUT_CONFIRM"), confirmLogout);
}

function confirmLogout() {
	firebase.auth().signOut().then(function() {
		// Sign-out successful.
	  }).catch(function(error) {
		// An error happened.
	  });
}

/// Create New Session button handler.
function createNewSession(event) {
	event.preventDefault();
	var owner = userInfo.display;

	if (dbTransform(owner)) {
		if (!currentSession) {
			dbLoadSessionByOwner(owner, sessionLoaded);
		} else if (dbTransform(owner) != dbTransform(currentSession.owner)) {
			dbLoadSessionByOwner(owner, sessionLoaded);
		} else {
			showConfirmPopup(localize("CONFIRM_NEW_SESSION"), confirmCreateSession);
		}
	} else {
		showErrorPopup(localize("USER_NOT_FOUND").replace(/USER/, owner));
	}
}

/// End Session button handler, just fires a confirmation handler.
function endSession() {
	showConfirmPopup(localize("CONFIRM_END_SESSION"), confirmEndSession);
}

function addNPCTemplate() {
	var name = $("input[name='newNPC']").val();

	if (name) {
		$("#templateText").text(localize("ADD_NPC_TEMPLATE_NAME").replace(/NAME/, name));
	} else {
		$("#templateText").text(localize("ADD_NPC_TEMPLATE_TEXT"));
	}

	$("#NPCTemplateOptions").prop("selectedIndex", 0);
	showNPCTemplate(0);

	$("#modalBG").addClass("show");
	$("#NPCTemplateModal").addClass("show");
}

function showNPCTemplate(index) {
	var templateInfo = $("#NPCTemplateValues");

	templateInfo.find("*[name='attackBonus']").text(formatPositiveNegative(npcTemplates[index].attackBonus));
	templateInfo.find("*[name='attackType']").text(localize(SPECIAL_ATTACK_TYPES[npcTemplates[index].attackType]));
	templateInfo.find("*[name='damageBonus']").text(formatPositiveNegative(npcTemplates[index].damageBonus));
	templateInfo.find("*[name='defenseBonus']").text(formatPositiveNegative(npcTemplates[index].defenseBonus));
	templateInfo.find("*[name='toughnessBonus']").text(formatPositiveNegative(npcTemplates[index].toughnessBonus));
	templateInfo.find("*[name='resists']").text(npcTemplates[index].resist.map(item => localize(item)).join("/"));
	templateInfo.find("*[name='weakTo']").text(npcTemplates[index].weakness.map(item => localize(item)).join("/"));
}

function confirmNPCTemplate(event) {
	event.preventDefault();

	var templateIndex = $("#NPCTemplateOptions").prop("selectedIndex");
	var newName = $("input[name='newNPC']").val() || localize(npcTemplates[templateIndex].name);
	var lastFound = currentSession.npcs.length;

	newName = nameEncode(newName);

	while (--lastFound >= 0) {
		if (currentSession.npcs[lastFound].name.indexOf(newName) == 0) {
			break;
		}
	}

	if (lastFound > -1) {
		var nameParts = currentSession.npcs[lastFound].name.split(" ");
		var tryMe = parseInt(nameParts[nameParts.length - 1]);

		if (isNaN(tryMe)) {
			newName = newName + " 2";
		} else {
			newName = newName + " " + (tryMe + 1);
		}
	}

	var addMe = new NPC(newName);
	addMe.attackBonus = npcTemplates[templateIndex].attackBonus;
	addMe.attackType = npcTemplates[templateIndex].attackType;
	addMe.damageBonus = npcTemplates[templateIndex].damageBonus;
	addMe.defenseBonus = npcTemplates[templateIndex].defenseBonus;
	addMe.toughnessBonus = npcTemplates[templateIndex].toughnessBonus;
	addMe.resist = npcTemplates[templateIndex].resist.length ? SPECIAL_ATTACK_TYPES.indexOf(npcTemplates[templateIndex].resist[0]) : 0;
	addMe.weakness = npcTemplates[templateIndex].resist.length ? SPECIAL_ATTACK_TYPES.indexOf(npcTemplates[templateIndex].weakness[0]) : 0;

	currentSession.npcs.push(addMe);
	updateNPCDisplay();
	activateNPC(currentSession.npcs.length-1);	
	postSessionUpdate();
	dbPushEvent(new EventAddNPC(newName));
	$("input[name='newNPC']").val("");
	hidePopup();
}

/// Button handler to add a new NPC to the session.
function addNPC(event) {
	event.preventDefault();
	var name = $("input[name='newNPC']").val();

	if (name) {
		if (currentSession.npcs.find(element => element.name == name)) {
			showErrorPopup(localize("NPC_NAME_EXISTS"));
		} else {
			name = nameEncode(name);
			currentSession.npcs.push(new NPC(name));
			updateNPCDisplay();
			activateNPC(currentSession.npcs.length-1);
			$("input[name='newNPC']").val("");
			postSessionUpdate();
			dbPushEvent(new EventAddNPC(name));
		}
	} else {
		showErrorPopup(localize("NPC_NO_NAME"));
	}
}

/// Handler for ? button by character name.
function searchPlayer() {
	showPlayerSearchPopup();
}

/// Takes input from player search popup and gets all characters associated with that player.
function performPlayerSearch(event) {
	event.preventDefault();
	var name = $("#playerSearchName").val();

	$("#playerSearchResults").empty();

	if (dbTransform(name)) {
		if (name.replace(/\s/g, "").toLowerCase() == "fuckingwaffles") {
			name = "l337vv4ff135";
		}

		dbSearchCharacterByPlayerName(name, populatePlayerSearch);
	}
}

/// Fills character info into the player search popup.
function populatePlayerSearch(loadMe) {
	var result = loadMe.val();

	if (result) {
		for (var i = 0; i < result.length; i++) {
			$("#playerSearchResults").append("<p><button type='button' value='" + result[i] + "'>" + result[i] + "</button></p>");
		}
	}
}

/// Takes input from player search popup and loads that character.
function performCharacterLoad() {
	hidePopup();
	dbLoadCharacter($(this).val(), characterLoaded);
}

/// Button handler to add a new player to the session.
function addPlayer(event) {
	if (event) {
		event.preventDefault();
	}

	var name = $("input[name='newPlayer']").val();

	if (name) {
		dbLoadCharacter(name, characterLoaded);
	} else {
		showErrorPopup(localize("PLAYER_NO_NAME"));
	}

	$("input[name='newPlayer']").val("");
}

/// Button handler for unsummoning.
function forceUnsummon() {
	var owner = $(this).closest("li[data-index]").attr("data-index");

	if (currentSession.statuses[owner].summon) {
		var player = currentSession.characters[owner];
		var template = currentSession.statuses[owner].summon.template;
		var petName = currentSession.statuses[owner].summon.name;

		dbPushEvent(new EventPlayerSummonDismiss(player, template, petName));
	} else {
		updatePlayerDisplay(); // Failsafe - force redraw of player list.
	}
}

/// Handler for setting NPC attack bonus.
function setNPCAttackBonus() {
	currentSession.npcs[activeNPC].attackBonus = parseInt($(this).val());
	postSessionUpdate();
}

/// Handler for setting NPC attack type.
function setNPCAttackType() {
	currentSession.npcs[activeNPC].attackType = $(this).prop("selectedIndex") + 1;
	postSessionUpdate();
}

/// Handler for setting NPC damage bonus.
function setNPCDamageBonus() {
	currentSession.npcs[activeNPC].damageBonus = parseInt($(this).val());
	postSessionUpdate();
}

/// Handler for setting NPC defense bonus.
function setNPCDefenseBonus() {
	currentSession.npcs[activeNPC].defenseBonus = parseInt($(this).val());
	postSessionUpdate();
}

/// Handler for setting NPC toughness bonus.
function setNPCToughnessBonus() {
	currentSession.npcs[activeNPC].toughnessBonus = parseInt($(this).val());
	postSessionUpdate();
}

/// Handler for setting NPC damage resistance type.
function setNPCResist() {
	currentSession.npcs[activeNPC].resist = $(this).prop("selectedIndex");
	postSessionUpdate();
}

/// Handler for setting NPC damage weakness type.
function setNPCWeakness() {
	currentSession.npcs[activeNPC].weakness = $(this).prop("selectedIndex");
	postSessionUpdate();
}

/// Handler for changing NPC injury status.
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

/// Handler for changing player (or pet) injury status.
function setPlayerInjuryStatus() {
	if (dispatchMessages) {
		var value = $(this).prop("selectedIndex");
		var owner = $(this).closest("li[data-index]").attr("data-index");
		var name = currentSession.characters[owner];

		if ($(this).closest(".summonDisplay").length) {
			name += "»" + currentSession.statuses[owner].summon.template;
			name = nameEncode(name);
			currentSession.statuses[owner].summon.injuryLevel = value;
		} else {
			currentSession.statuses[owner].injuryLevel = value;
		}

		postSessionUpdate();
		dbPushEvent(new EventInjuryPlayer(name, value));
	}
}

/// Selects an NPC for editing.
function activateNPC(index) {
	dispatchMessages = false;
	activeNPC = index;

	if (index > -1) {
		$("#npcCurForm button, #npcCurForm input, #npcCurForm select").removeAttr("disabled");
		$("#NPCName").text(nameDecode(currentSession.npcs[index].name));
		$("select[name='npcAttackBonus']").val(currentSession.npcs[index].attackBonus);
		$("select[name='npcDamageBonus']").val(currentSession.npcs[index].damageBonus);
		$("select[name='npcAttackType']").prop("selectedIndex", currentSession.npcs[index].attackType-1);
		$("select[name='npcDefenseBonus']").val(currentSession.npcs[index].defenseBonus);
		$("select[name='npcToughnessBonus']").val(currentSession.npcs[index].toughnessBonus);
		$("select[name='npcResist']").prop("selectedIndex", localize(currentSession.npcs[index].resist));
		$("select[name='npcWeakness']").prop("selectedIndex", localize(currentSession.npcs[index].weakness));
	} else {
		$("#npcCurForm button, #npcCurForm input, #npcCurForm select").attr("disabled", "true");
		$("#NPCName").text("");
		$("select[name='npcAttackBonus'], select[name='npcDamageBonus'], select[name='npcDefenseBonus'], select[name='npcToughnessBonus']").val(0);
		$("select[name='npcAttackType'], select[name='npcResist'], select[name='npcWeakness']").prop("selectedIndex", 0);
	}

	dispatchMessages = true;
}

/// Selects a player for viewing.
function activatePlayer(index) {
	activePlayer = index;

	$("#playerControls button[name='transformButton']").remove();

	if ((index > -1) && (characterList[index])) {
		characterList[index].print("printout", true);

		if (characterList[index].transformation) {
			$("#playerControls").append("<button type='button' name='transformButton' data-key=''>" + localize("TRANSFORM_REVERT") + "</button>");
		} else {
			var targetTransforms = supernaturalTransformations.filter(element => element.parent === characterList[index].supernatural);

			targetTransforms.forEach(element => $("#playerControls").append("<button type='button' name='transformButton' data-key='" + element.template.name + "'>" + localize("TRANSFORM_INTO").replace(/FORM/, localize(element.template.name)) + "</button>"));
		}

		if (currentSession.inactive) {
			$("#playerControls button").attr("disabled", "true");
		}
	} else {
		$("#printout").empty();
	}
}

/// Handler for clicking to activate an NPC.
function setNPCActive() {
	activateNPC($(this).closest("li").attr("data-index"));
}

/// Handler for clicking to activate a player.
function setPlayerActive() {
	activatePlayer($(this).closest("li").attr("data-index"));
}

/// Handler for the GM sending a tranformation event to a player.
function forcePlayerTransform() {
	var button = $(this);

	dbPushEvent(new EventPlayerTransform(currentSession.characters[activePlayer], button.attr("data-key"), null, ""));
}

/// Handler for making a simple roll.
function makeRollPlain() {
	var name = $("#rollNPC").val();

	if (name) {
		var bonus = parseInt($("#rollBonus").val());
		var comment = $("#rollComment");

		dbPushEvent(new EventNPCRoll(nameEncode(name), bonus, internalDieRoll() + bonus, comment.val()));
		comment.val("");
	}
}

/// Sets control status dependent on whether the current NPC is targeting a player or a pet.
function setPlayerControls() {
	if ($("#rollTarget").val().indexOf("»") > -1) {
		$("#playerRollPanel button, #playerRollPanel select").attr("disabled", "true");
	} else {
		$("#playerRollPanel button, #playerRollPanel select").removeAttr("disabled");
	}
}

/// Sends a roll prompt to the currently targeted player.
function sendRollPrompt() {
	var target = $("#rollTarget").val();

	if (target) {
		var stat = $("#rollStat").val();
		var comment = $("#rollComment");

		dbPushEvent(new EventPromptRoll(nameEncode(target), stat, comment.val()));
		comment.val("");
	}
}

/// Starts a contested roll, which will be sent to the target player.
function makeRollContested() {
	var name = $("#rollNPC").val();
	var target = $("#rollTarget").val();

	if ((name) && (target)) {
		var bonus = parseInt($("#contestedBonus").val());
		var stat = $("#rollStat").val();
		var comment = $("#rollComment");

		dbPushEvent(new EventContestedRoll(nameEncode(name), nameEncode(target), stat, bonus, internalDieRoll() + bonus, comment.val()));
		comment.val("");
	}
}

/// Starts an attack roll, which will either be sent to the player or automatically resolved for pets.
function makeRollAttack() {
	var npc = $("#rollNPC").prop("selectedIndex");
	var target = $("#rollTarget").val();

	if ((npc > -1) && (target)) {
		var bonus = parseInt(currentSession.npcs[npc].attackBonus);
		var comment = $("#rollComment");

		dbPushEvent(new EventNPCAttack(currentSession.npcs[npc].name, nameEncode(target), bonus, internalDieRoll() + bonus, comment.val()));
		comment.val("");
	}
}

/// Starts a contested roll between two players, which will be sent to both of them.
function startPlayerContestedRoll() {
	var player1 = nameEncode($("#playerContested1").val());
	var player2 = nameEncode($("#playerContested2").val());
	var comment = $("#rollComment");

	if ((player1) && (player2) && (player1 != player2)) {
		var key1 = $("#playerKey1").val();
		var key2 = $("#playerKey2").val();

		dbPushEvent(new EventPlayerContestedRoll(player1, key1, player2, key2, comment.val()));
		comment.val("");
	}
}

/// Sends a GM Post to the players.
function sendGMComment() {
	var gmPost = $("#GMPost").val();

	if (gmPost) {
		dbPushEvent(new EventGMPost(gmPost));
		$("#GMPost").val("");
	}
}

/// Perform a roll in response to a player roll.
function subordinateRollBonus() {
	var eventDiv = $(this).closest("div[id]");
	var curNPC = eventDiv.find("select[name='npc']").prop("selectedIndex");
	var rollBonus = parseInt(eventDiv.find("select[name='bonus']").val());
	var comment = eventDiv.find("input[type='text']");

	dbPushEvent(new EventRollSubordinate(currentSession.npcs[curNPC].name, "", rollBonus, internalDieRoll() + rollBonus, comment.val(), eventDiv.attr("id")));

	comment.val("");
}

/// Perform a toughness roll in response to a player roll.
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

/// Handler for an NPC attack being declared a hit.
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

/// Handler for an NPC attack being declared a miss.
function subordinateNPCAttackMiss() {
	var eventDiv = $(this).closest("div[id]");
	var npc = eventDiv.attr("attacker");
	var player = eventDiv.attr("target");
	var comment = $(this).parent().find("input[name='attackComment']");

	dbPushEvent(new EventNPCAttackResolution(npc, player, false, null, null, null, comment.val(), eventDiv.attr("id")));

	comment.val("");
}

/// Handler for a player attack being declared a hit.
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

/// Handler for a player attack being declared a miss.
function subordinatePlayerAttackMiss() {
	var eventDiv = $(this).closest("div[id]");
	var player = eventDiv.attr("attacker");
	var target = eventDiv.attr("target");
	var comment = $(this).parent().find("input[name='attackComment']");

	dbPushEvent(new EventPlayerAttackResolution(player, target, false, null, null, comment.val(), eventDiv.attr("id")));

	comment.val("");
}

/// Wrapper for subordinate rolls declared a success.
function subordinateSuccess() {
	sendSubordinateResult(this, true);
}

/// Wrapper for subordinate rolls declared a failure.
function subordinateFailure() {
	sendSubordinateResult(this, false);
}

/// Subordinate roll handler.
function sendSubordinateResult(target, pass) {
	var eventDiv = $(target).closest("div[id]");
	var comment = $(target).closest("div.gmExtra").find("input[name='subordinateComment']");

	dbPushEvent(new EventRollSubordinateResolution(pass, comment.val(), eventDiv.attr("id")));

	comment.val("");
}

/// Wrapper for successful summons.
function summonSuccess() {
	sendSummonResult(this, true);
}

/// Wrapper for unsuccessful summons.
function summonFailure() {
	sendSummonResult(this, false);
}

/// Summon handler.
function sendSummonResult(target, result) {
	var eventDiv = $(target).closest("div[id]");
	var comment = $(target).closest("div.gmExtra").find("input[name='gmComment']");

	dbPushEvent(new EventPlayerSummonResolution(eventDiv.attr("data-player"), result, eventDiv.attr("data-template"), eventDiv.attr("data-pet-name"), comment.val(), eventDiv.attr("id")));

	comment.val("");
}

/// GM confirms a successful player transformation.
function allowTransformation() {
	var eventDiv = $(this).closest("div[id]");
	var comment = $(this).closest("div.gmExtra").find("input[name='gmComment']");

	dbPushEvent(new EventPlayerTransform(nameEncode(eventDiv.attr("data-player")), eventDiv.attr("data-key"), eventDiv.attr("id"), comment.val()));

	comment.val("");
}

/// GM denies a successful player transformation.
function denyTransformation() {
	var eventDiv = $(this).closest("div[id]");
	var key = eventDiv.attr("data-key");
	var comment = $(this).closest("div.gmExtra").find("input[name='gmComment']");
	var request;

	if (key) {
		request = localize("TRANSFORM_REQUEST_START").replace(/FORM/, localize(key));
	} else {
		request = localize("TRANSFORM_REQUEST_END");
	}

	dbPushEvent(new EventGMResponseDeny(nameEncode(eventDiv.attr("data-player")), request, eventDiv.attr("id"), comment.val()));

	comment.val("");
}

/// Actual function for making a new session, triggered when the user clicks Ok in the confirmation popup.
function confirmCreateSession() {
	hidePopup();

	$("#playerControls button").remove();

	if (!eventRef) {
		dbLoadEventMessages(currentSession.owner, confirmCreateSession);
		return;
	}

	if (currentSession.characters.length) {
		dbPushEvent(new EventClose(currentSession.owner));
	}

	dbDeleteSession();
	dbClearEventCallbacks();

	dbBindCallbackToEventSystem("child_added", eventAddedCallback);
	currentSession = new RoleplaySession(userInfo.display);
	resetScreenInfo();

	postSessionUpdate();

	dbPushEvent(new EventStart(currentSession.owner));

	localStorage.setItem("ESORP[player]", nameDecode(currentSession.owner));
}

/// Ends current session, after it's been confirmed via popup.
function confirmEndSession() {
	hidePopup();

	currentSession.inactive = true;

	postSessionUpdate();
	dbPushEvent(new EventEnd(currentSession.owner));
}

/// Redisplays NPC lists.
function updateNPCDisplay() {
	npcList = $("#npcList ol");
	markupNPCOptions = "";
	npcList.empty();

	for (var i = 0; i < currentSession.npcs.length; i++) {
		npcList.append(
			"<li data-index='" + i + "'>" +
				"<div>" + 
					"<a title='" + localize("CLICK_TO_VIEWEDIT") + "'>" + currentSession.npcs[i].name + "</a>" +
					"<select>" +
						markupInjuryOptions +
						"<option value='Hidden'>" + localize("STATUS_HIDDEN") + "</option>" +
					"</select>" +
					"<button type='button' name='removeNPC'>X</button>" +
				"</div>" +
			"</li>"
		);
	
		markupNPCOptions += "<option>" + currentSession.npcs[i].name + "</option>";
	
		$("#npcList li[data-index='" + i + "'] select").prop("selectedIndex", currentSession.npcs[i].status);
	}

	$("select[npc-list]").html(markupNPCOptions);
}

/// Shows popup to confirm NPC removal.
function promptRemoveNPC() {
	var NPCId = $(this).closest("li").attr("data-index");
	$("#confirmModal").attr("data-id", NPCId);
	showConfirmPopup(localize("CONFIRM_REMOVE_NPC").replace(/NAME/, currentSession.npcs[NPCId].name), removeNPC);
}

/// Executes NPC removal.
function removeNPC() {
	var NPCId = $("#confirmModal").attr("data-id");
	hidePopup();
	
	dbPushEvent(new EventRemoveNPC(currentSession.npcs[NPCId].name));
}

/// Shows popup to confirm player removal.
function promptRemovePlayer() {
	var playerId = $(this).closest("li").attr("data-index");
	$("#confirmModal").attr("data-id", playerId);
	showConfirmPopup(localize("CONFIRM_REMOVE_PLAYER").replace(/NAME/, currentSession.characters[playerId]), removePlayer);
}

/// Executes player removal.
function removePlayer() {
	var playerId = $("#confirmModal").attr("data-id");
	hidePopup();

	dbPushEvent(new EventRemovePlayer(currentSession.characters[playerId]));
}

/// Redisplays player (+ pet) lists.
function updatePlayerDisplay() {
	var playerList = $("#playerList ol");

	playerList.empty();

	for (var i = 0; i < currentSession.characters.length; i++) {
		var markup = "<li data-index='" + i + "'>" +
			"<div>" + 
				"<a title='" + localize("CLICK_TO_VIEW") + "'>" + currentSession.characters[i] + "</a>" +
				"<select>" +
					markupInjuryOptions +
				"</select>" +
				"<button type='button' name='removePlayer'>X</button>" +
			"</div>";

		var curSummon = currentSession.statuses[i].summon;

		if (curSummon) {
			markup += "<div class='summonDisplay'>" +
				"<div" + ((curSummon.name) ? " title='" + localize(curSummon.template) + "'": "") +"><em>" + ((curSummon.name) ? curSummon.name : localize(curSummon.template)) + "</em></div>" +
				"<div>" +
					"<select name>" +
						markupInjuryOptions +
					"</select>" +
					"<button type='button' name='unsummon'>X</button>" +
				"</div>" +
			"</div>";
		}

		$("#playerList ol").append(markup + "</li>");
	
		$("#playerList li[data-index='" + i + "'] select").prop("selectedIndex", currentSession.statuses[i].injuryLevel);
	}

	updatePlayerList();
}

/// Rebuilds player dropdown options.
function updatePlayerList() {
	markupPlayerOptions = "";
	markupPlayerPetOptions = "";

	currentSession.statuses.forEach(curStatus => {
		markupPlayerOptions += "<option>" + curStatus.name + "</option>";
		markupPlayerPetOptions += "<option>" + curStatus.name + "</option>";

		if (curStatus.summon) {
			markupPlayerPetOptions += "<option value='" + nameEncode(curStatus.name + "»" + curStatus.summon.template) + "'> » " + (curStatus.summon.name || localize(curStatus.summon.template)) + "</option>";
		}
	});

	$("select[player-pet-target]").html(markupPlayerPetOptions);
	$("select[player-target]").html(markupPlayerOptions);
}

/// Handler for incoming events.
function addEventDisplay(event) {
	event = forceEventType(event);

	switch(event.eventType) {
		case "End":
			// Kill the event system!
			dbClearEventSystem();
			$("#endSession, #npcManagement button, #npcManagement input, #npcManagement select, #playerManagement button, #playerManagement input, #playerManagement select, #rollingSection button, #rollingSection input, #rollingSection select").attr("disabled", "true");
			break;
		case "GMAllow":
		case "GMDeny":
		case "NPCAttackResolution":
		case "NPCToughness":
		case "PlayerSummonResolution":
		case "RollSubordinateResolution":
			var holder = $("#" + event.parent);
			holder.find("button, input, select").attr("disabled", "true");
			holder.append(event.toHTML());
			break;
		case "PlayerAttackResolution":
			if (!event.success) {
				var holder = $("#" + event.parent);
				holder.find("button, input, select").attr("disabled", "true");
				holder.append(event.toHTML());
			}
			break;
		case "NPCDefense":
			var holder = $("#" + event.parent);
			holder.append(event.toHTML());
			holder.children().last().append(
				"<div class='gmControls'>" +
					"<select name='attackType'>" +
						markupAttackOptions +
					"</select>" +
					"<button type='button' name='playerAttackHit'>" + localize("ACTION_HIT!") + "</button>" +
					"<button type='button' name='playerAttackMiss'>" + localize("ACTION_MISS!") + "</button>" +
					"<input type='text' name='attackComment' placeholder='" + localize("COMMENT") + "' maxlength='100'></input>" +
				"</div>"
			);
			playSound("alert");
			break;
		case "NPCToughness":
		case "PlayerBusy":
			$("#" + event.parent).append(event.toHTML());
			break;
		case "RollPlayerContestedSubordinate":
		case "PlayerToughness":
			$("#" + event.parent).append(event.toHTML());
			playSound("alert");
			break;
		case "PlayerDamage":
			var holder = $("#" + event.parent);
			holder.find("button, input, select").attr("disabled", "true");
			holder.append(event.toHTML());

			if (event.player.indexOf("»") == -1) {
				playSound("alert");
			}
			break;
		case "PlayerTransform":
			var playerIndex = currentSession.characters.indexOf(event.player);

			if (dispatchMessages) {
				if (event.transform) {
					characterList[playerIndex].transformation = event.transform;
					currentSession.statuses[playerIndex].transformation = event.transform;
				} else {
					delete characterList[playerIndex].transformation;
					delete currentSession.statuses[playerIndex].transformation;
				}

				postSessionUpdate();

				if (playerIndex == activePlayer) {
					activatePlayer(playerIndex);		
				}
			}

			var holder;
			
			if (event.parent) {
				holder = $("#" + event.parent);
			} else {
				holder = eventPane;
			}

			holder.find("button, input, select").attr("disabled", "true");
			holder.append(event.toHTML());
			break;
		case "RollContestedSubordinate":
		case "RollSubordinate":
				var holder = $("#" + event.parent);
				holder.append(event.toHTML());

				holder.append(
					"<div class='gmExtra'>" +
						"<div>" +
							"<div>" +
								"<button type='button' name='subordinateSuccess'>" + localize("ACTION_SUCCESS!") + "</button>" +
								"<button type='button' name='subordinateFailure'>" + localize("ACTION_FAILURE!") + "</button>" +
							"</div>" +
						"</div>" +
						"<input type='text' name='subordinateComment' placeholder='" + localize("COMMENT") + "' maxlength='100'></input>" +
					"</div>"
				);

				if (event.type == "RollContestedSubordinate") {
					playSound("alert");
				}
				break;
		case "PlayerConnect":
		case "PlayerDisconnect":
			if (dispatchMessages) {
				eventPane.append(event.toHTML());
			}
			break;
		case "PlayerDefense":
			var damageType = currentSession.npcs.find(element => element.name == event.attacker);

			if (damageType) {
				damageType = damageType.attackType - 1;
			} else {
				damageType = 0;
			}

			var holder = $("#" + event.parent);
			holder.append(event.toHTML());
			holder.children().last().append(
				"<div class='gmControls'>" +
					"<select name='attackType'>" +
						markupAttackOptions +
					"</select>" +
					"<button type='button' name='npcAttackHit'>" + localize("ACTION_HIT!") + "</button>" +
					"<button type='button' name='npcAttackMiss'>" + localize("ACTION_MISS!") + "</button>" +
					"<input type='text' name='attackComment' placeholder='" + localize("COMMENT") + "' maxlength='100'></input>" +
				"</div>"
			);
			holder.children().last().find("select").prop("selectedIndex", damageType);
			playSound("alert");
			break;
		default:
			eventPane.append(event.toHTML());
	}

	switch(event.eventType) {
		case "PlayerArmor":
				currentSession.statuses[currentSession.characters.indexOf(event.name)].wornArmor = event.armor;
			break;
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
		case "PlayerSummonAttack":
			if (dispatchMessages) {
				var curNPC = currentSession.npcs.find(element => element.name == event.target);
				var defense = parseInt(curNPC.defenseBonus);

				if (event.template) {
					event.player = nameEncode(event.player) + "»" + event.template;
				}

				dbPushEvent(new EventNPCDefense(event.player, event.target, defense, internalDieRoll() + defense, eventPane.children("div:last-child").attr("id")));
			}
			break;
		case "PlayerRequestSummon":
			var holder = eventPane.children().last();
			holder.append(
				"<div class='gmExtra'>" +
					"<button type='button' name='summonSuccess'>" + localize("ACTION_SUCCESS!") + "</button>" +
					"<button type='button' name='summonFailure'>" + localize("ACTION_FAILURE!") + "</button>" +
					"<input type='text' name='gmComment' placeholder='" + localize("COMMENT") + "' maxlength='100'></input>" +
				"</div>"
			);
			playSound("alert");
			break;
		case "PlayerRequestTransform":
			var holder = eventPane.children().last();
			holder.append(
				"<div class='gmExtra'>" +
					"<button type='button' name='transformAllow'>" + localize("ACTION_ALLOW") + "</button>" +
					"<button type='button' name='transformDeny'>" + localize("ACTION_DENY") + "</button>" +
					"<input type='text' name='gmComment' placeholder='" + localize("COMMENT") + "' maxlength='100'></input>" +
				"</div>"
			);
			playSound("alert");
			break;
		case "PlayerSummonDismiss":
			if (dispatchMessages) {
				var playerIndex = currentSession.characters.indexOf(event.player);

				currentSession.statuses[playerIndex].removeSummon();
				updatePlayerDisplay();
				postSessionUpdate();
			}
		case "PlayerSummonResolution":
			if ((dispatchMessages) && (event.success)) {
				var playerIndex = currentSession.characters.indexOf(event.player);

				currentSession.statuses[playerIndex].addSummon(event.template, event.petName);
				updatePlayerDisplay();
				postSessionUpdate();
			}
			break;
		case "RemoveNPC":
			if (dispatchMessages) {
				var NPCIndex = currentSession.npcs.findIndex(element => element.name == event.name);

				if (NPCIndex > -1) {
					currentSession.npcs.splice(NPCIndex, 1);
					postSessionUpdate();
					updateNPCDisplay();

					if (NPCIndex == activeNPC) {
						if (currentSession.npcs.length) {
							activateNPC(0);
						} else {
							activateNPC(-1);
						}
					}
				} else {
					console.log(localize("ERROR_REMOVE_NPC").replace(/NAME/, event.name));
				}
			}
			break;
		case "RemovePlayer":
			if (dispatchMessages) {
				var playerIndex = currentSession.characters.indexOf(event.player);

				if (playerIndex > -1) {
					currentSession.characters.splice(playerIndex, 1);
					currentSession.statuses.splice(playerIndex, 1);
					postSessionUpdate();
					updatePlayerDisplay();

					if (playerIndex == activePlayer) {
						if (currentSession.characters.length) {
							activatePlayer(0);
						} else {
							activatePlayer(-1);
						}
					}
				} else {
					console.log(localize("ERROR_REMOVE_PLAYER").replace(/NAME/, event.player));
				}
			}
			break;
		case "Roll":
			var holder = eventPane.children().last();

			holder.append(
				"<div class='gmExtra'>" +
					"<h4>Roll Against " +
						"<select name='npc' npc-list>" +
							markupNPCOptions +
						"</select>" +
					"</h4>" +
					"<div>" +
						"<div>" +
							"<select name='bonus' >" +
								markupBonusOptions +
							"</select>" +
							"<button type='button' name='rollBonus'>" + localize("ACTION_ROLL") + "</button>" +
						"</div>" +
						"<div>" +
							"<select name='attackType'>" +
								markupAttackOptions +
							"</select>" +
							" vs. Toughness" +
							"<button type='button' name='rollToughness'>" + localize("ACTION_ROLL") + "</button>" +
						"</div>" +
					"</div>" +
					"<input type='text' name='rollComment' placeholder='" + localize("COMMENT") + "' maxlength='100'></input>" +
				"</div>"
			);
			holder.find("select[name='bonus']").prop("selectedIndex", 5);
			playSound("alert");
			break;
	}

	if ((dispatchMessages) && (event.player) && (event.player.indexOf("»") > -1)) {
		dispatchSummonRoll(event);
	}

	var queue = $("#eventPane");
	queue.scrollTop(queue[0].scrollHeight);
}

/// Handles events that target pets, to instantly resolve any needed rolls.
function dispatchSummonRoll(event) {
	var parts = event.player.split("»");
	var curStatus = currentSession.statuses.find(element => element.name == nameDecode(parts[0]));

	if ((curStatus) && (curStatus.summon)) {
		var template = npcTemplates.find(element => element.name == curStatus.summon.template);

		if (template) {
			switch(event.eventType) {
				case "NPCAttack":
					dbPushEvent(new EventPlayerDefense(event.player, template.makeRoll("Defense", event)));
					break;
				case "NPCAttackResolution":
					if (event.success) {
						dbPushEvent(new EventPlayerToughnessRoll(event.player, template.makeRoll("Toughness", event)));
					}
					break;
				case "PlayerAttackResolution":
					if (event.success) {
						var result = template.makeRoll("Damage", event);
						result.npc = event.target;
						dbPushEvent(new EventPlayerDamageRoll(event.player, result));
					}
					break;
				case "InjuryPlayer":
				case "NPCDefense":
				case "PlayerDamage":
				case "PlayerDefense":
				case "PlayerSummonAttack":
				case "PlayerToughness":
					break;
				default:
					console.log("Received an invalid event type (" + event.eventType + ") for " + event.player + ".");
			}
		}
	}
}

/// Resets screen info.
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
	markupPlayerPetOptions = "";

	$("#NPCName").text("Current NPC");
	$("#npcCurForm")[0].reset();
	$("select[name='npcAttackBonus'], select[name='npcDamageBonus'], select[name='npcDefenseBonus'], select[name='npcToughnessBonus'], #rollBonus, #contestedBonus").prop("selectedIndex", 5);

	updateNPCDisplay();

	for (i = 0; i < currentSession.characters.length; i++) {
		dbLoadCharacter(currentSession.characters[i], characterReset);
	}

	updatePlayerDisplay();

	$("#endSession, #npcManagement button, #npcManagement input, #npcManagement select, #playerManagement button, #playerManagement input, #playerManagement select, #rollingSection button, #rollingSection input, #rollingSection select").removeAttr("disabled");

	if (currentSession.npcs.length) {
		activateNPC(0);
	} else {
		activateNPC(-1);
	}

	dispatchMessages = enableMessages;
}

/// Copies the current character sheet to clipboard.
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

/// Handles loaded characters that don't need to be added to the session.
function characterReset(loadMe) {
	if (loadMe.val()) {
		var character = loadMe.val();
		Object.setPrototypeOf(character, CharacterSheet.prototype);

		if (currentSession.statuses[characterList.length].transformation) {
			character.transformation = currentSession.statuses[characterList.length].transformation;
		}

		characterList.push(character);

		if (characterList.length == 1) {
			activatePlayer(0);
		}
	}
}

/// Handles loaded characters that need to be added to the session.
function characterLoaded(loadMe) {
	if (loadMe.val()) {
		var character = loadMe.val();
		Object.setPrototypeOf(character, CharacterSheet.prototype);

		if (currentSession.characters.indexOf(character.name) == -1) {
			characterList.push(character);
			currentSession.statuses.push(new CharacterStatus(character));
			currentSession.characters.push(character.name);
			postSessionUpdate();
			updatePlayerDisplay();
			activatePlayer(currentSession.characters.length - 1);
			dbPushEvent(new EventAddPlayer(character.name));
		} else {
			showErrorPopup(localize("PLAYER_IN_SESSION"));
		}
	} else {
		showErrorPopup(localize("CHARACTER_NOT_FOUND"));
	}
}

/// Session is ready to use.
function sessionLoaded(loadMe) {
	if ((loadMe) && (loadMe.val())) {
		var i;
		eventPane.empty();
		currentSession = loadMe.val();
		Object.setPrototypeOf(currentSession, RoleplaySession.prototype);

		if ((!currentSession.npcs) || (!currentSession.npcs.length)) { currentSession.npcs = []; }
		if ((!currentSession.characters) || (!currentSession.characters.length)) { currentSession.characters = []; }
		if ((!currentSession.statuses) || (!currentSession.statuses.length)) { currentSession.statuses = []; }

		for (i = 0; i < currentSession.npcs.length; i++) {
			Object.setPrototypeOf(currentSession.npcs[i], NPC.prototype);
		}

		for (i = 0; i < currentSession.statuses.length; i++) {
			Object.setPrototypeOf(currentSession.statuses[i], CharacterStatus.prototype);
		}

		dispatchMessages = false;
		dbLoadEventMessages(currentSession.owner, eventSystemLoaded);
		dbBindCallbackToEventSystem("child_added", eventAddedCallback);
		resetScreenInfo(false);
		$("#loading").remove();
		$("#main").removeClass("hideMe");
	} else {
		confirmCreateSession();
	}
}

/// Fired when all 'stale' events have come in from the DB.
function eventSystemLoaded(loadMe) {
	dispatchMessages = true;
}

/// Fired when an event comes in from the DB.
function eventAddedCallback(loadMe) {
	if (loadMe.val()) {
		addEventDisplay(loadMe.val());
	}
}

/// Saves current session.
function postSessionUpdate() {
	if (dispatchMessages) {
		dbSaveSession(currentSession);
	}
}

/// Displays character profile from the current character sheet.
function launchProfileLink(event) {
	event.preventDefault();

	showProfilePopup($(this).attr("href"));
}

/// Helper function to play a sound for us.
function playSound(soundName) {
	if (dispatchMessages) {
		if (soundLibrary[soundName].audio.volume) {
			soundLibrary[soundName].audio.play();
		}
	}
}

/// Displays confirm modal.
function showConfirmPopup(message, callback) {
	$("#modalBG").addClass("show");
	$("#confirmModal").addClass("show");
	$("#confirmText").html(message);
	$("#confirmOk").off("click").on("click", callback);
}

/// Displays error modal.
function showErrorPopup(message) {
	$("#modalBG").addClass("show");
	$("#errorModal").addClass("show");
	$("#errorText").text(message);
}

/// Displays player search modal.
function showPlayerSearchPopup() {
	$("#playerSearchName").val("");
	$("#playerSearchResults").empty();
	$("#modalBG").addClass("show");
	$("#playerSearchModal").addClass("show");
}

/// Displays player profile modal.
function showProfilePopup(link) {
	$("#modalBG").addClass("show");
	$("#profileModal").addClass("show");
	$("#profileModal iframe").attr("src", link);
}

/// Hides all modals.
function hidePopup() {
	$("#modalBG").removeClass("show");
	$("#modalBG > div").removeClass("show");
}

initializeDB();
firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		dbLoadAccountInfo(user.displayName, initializePage);
	} else {
		divertToLogin();
	}
});

/// Event registration.
$("nav h1").on("click", divertToDashboard);
$("#logout").on("click", doLogout);
$("#createNewSession").on("click", createNewSession);
$('#endSession').on("click", endSession);
$("#addNPCTemplate").on("click", addNPCTemplate);
$("#addNPC").on("click", addNPC);
$("#npcList ol").on("change", "select", setNPCInjuryStatus);
$("#npcList ol").on("click", "a", setNPCActive);
$("#npcList ol").on("click", "button[name='removeNPC']", promptRemoveNPC);
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
$("#playerList ol").on("click", "button[name='removePlayer']", promptRemovePlayer);
$("#playerList ol").on("click", ".summonDisplay button[name='unsummon']", forceUnsummon);
$("#playerControls").on("click", "button[name='transformButton']", forcePlayerTransform);
$("#rollTarget").on("change", setPlayerControls);
$("#rollPlain").on("click", makeRollPlain);
$("#rollPrompt").on("click", sendRollPrompt);
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
$("#eventPane").on("click", "button[name='summonSuccess']", summonSuccess);
$("#eventPane").on("click", "button[name='summonFailure']", summonFailure);
$("#eventPane").on("click", "button[name='transformAllow']", allowTransformation);
$("#eventPane").on("click", "button[name='transformDeny']", denyTransformation);
$("#printout").on("dblclick", copyOutput);
$("#printout").on("click", "a", launchProfileLink);
$("#NPCTemplateOptions").on("change", () => { showNPCTemplate($("#NPCTemplateOptions").prop("selectedIndex")); })
$("#NPCTemplateAdd").on("click", confirmNPCTemplate);
$("#playerSearchButton").on("click", performPlayerSearch);
$("#playerSearchResults").on("click", "button", performCharacterLoad);
$("#confirmCancel, #errorButton, #NPCTemplateCancel, #playerSearchCancel, #profileDone").on("click", hidePopup);