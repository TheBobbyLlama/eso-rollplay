const statusClasses = [ "statusUnhurt", "statusInjured", "statusCritical", "statusIncapacitated", "statusHidden" ];
const transformRevertLabel = "End Transformation";
const playerInputSelector = "#charStatus input, #charStatus select, #charStatus button, #rollControls button, #rollControls input, #rollControls select, #summonControls button, #summonControls input, #summonControls select";

var userInfo = null;
var character = new CharacterSheet();
var currentSession;
var connectId = null;
var dispatchMessages = false;  // Flag used differentiating between archived and freshly received messages.
var queuedRoll; // Holds data for the roll we're making.
var lazyMode = false; // Automatically complete all rolls.

var markupNPCTargets = "";

var eventPane = $("#eventPane");

/// Called on page startup.
function initializePage(myUser) {
	if (!myUser) {
		showErrorPopup("User " + firebase.auth().currentUser.displayName + " not found!", divertToLogin);
		return;
	}

	userInfo = myUser;

	var inCharacter = localStorage.getItem("ESORP[character]");

	for (var i = 0; i < EQUIPPED_WEAPON.length; i++) {
		$("#playerWeapon").append("<option>" + EQUIPPED_WEAPON[i].weapon + "</option>");
	}

	for (var i = 0; i < WORN_ARMOR.length; i++) {
		$("#playerArmor").append("<option>" + getQuality(WORN_ARMOR[i]).name + "</option>");
	}

	$(playerInputSelector).attr("disabled", "true");

	resetRollSelect();

	if (inCharacter) {
		dbLoadCharacter(inCharacter, characterLoaded);
	} else {
		showErrorPopup("No character selected.", divertToDashboard);
	}
}

/// Populates attribute/skill dropdown based on the character's selections.
function resetRollSelect() {
	var i;
	var rollSelector = $("#rollSelect");
	var charItems = Object.entries(character.skills);
	
	rollSelector.empty();

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

function doLogout() {
	showConfirmPopup("Log out of your account?", confirmLogout);
}

function confirmLogout() {
	firebase.auth().signOut().then(function() {
		// Sign-out successful.
	  }).catch(function(error) {
		// An error happened.
	  });
}

/// Handles player's weapon selection.
function changeWeapon(event) {
	var newWeapon = $("#playerWeapon").prop("selectedIndex");
	currentSession.statuses[currentSession.characters.indexOf(character.name)].equippedWeapon = newWeapon;
	$("#rollSelect").val(EQUIPPED_WEAPON[newWeapon].quality);

	if ((event) && (dispatchMessages)) {
		dbPushEvent(new EventPlayerWeapon(character.name, newWeapon));
	}
}

/// Handles player's armor selection.
function changeArmor() {
	var newArmor = $("#playerArmor").prop("selectedIndex");
	currentSession.statuses[currentSession.characters.indexOf(character.name)].wornArmor = newArmor;

	if (dispatchMessages) {
		dbPushEvent(new EventPlayerArmor(character.name, newArmor));
	}
}

/// Handles player's request to transform.
function requestTransformation() {
	var transformation = $(this).attr("data-key");

	dbPushEvent(new EventPlayerRequestTransform(character.name, transformation));
}

/// Creates UI elements dependent on whether the player has a summoned pet or not.
function setSummonControls() {
	var controls = $("#summonControls");
	var playerIndex = currentSession.characters.indexOf(character.name);

	if (currentSession.statuses[playerIndex].summon) {
		var summonName = currentSession.statuses[playerIndex].summon.name || currentSession.statuses[playerIndex].summon.template;

		controls.html("<div>" +
				"<div><em>" + summonName + "</em></div>" +
				"<div>" +
					"<button id='summonAttack' type='button'>Attack!</button>" +
					"<select id='summonTarget' npc-target>" + markupNPCTargets + "</select>" +
				"</div>" +
				"<div><button id='summonDismiss' type='button'>Dismiss</button></div>" +
			"</div>"
		);
	} else {
		var markupSummonOptions = "";

		for (var i = 0; i < npcTemplates.length; i++) {
			if (npcTemplates[i].summonSkill) {
				markupSummonOptions += "<option>" + npcTemplates[i].name + "</option>";
			}
		}

		controls.html("<div>" +
				"<select id='summonTemplate'>" + markupSummonOptions + "</select>" +
				"<p>" +
					"<label for='summonName'>Name:</label>" +
					"<input type='text' id='summonName' maxlength='24' placeholder='(Optional)'></input>" +
				"</p>" +
			"</div>" +
			"<button id='summonExecute' type='button'>Summon!</button>"
		);
	}
}

/// Handles player's request to summon a pet.
function requestSummon() {
	var templateName = $("#summonTemplate").val();
	var summonEl = $("#summonName");
	var summonName = summonEl.val();
	var template = npcTemplates.find(element => element.name == templateName);

	if (template) {
		doPlayerRoll("Make a " + getQuality(template.summonSkill).name + " roll to summon a " + templateName + ".", "", { key: template.summonSkill, playerInitiated: true, summonTemplate: templateName, summonName, callback: resolveSummonRequest });
		summonEl.val("");
	}
}

/// Takes player's summoning roll and passes it to an event.
function resolveSummonRequest() {
	dbPushEvent(new EventPlayerRequestSummon(character.name, queuedRoll));
}

/// Handles attacks made by player's summoned pet.
function summonAttack() {
	var playerIndex = currentSession.characters.indexOf(character.name);

	if (currentSession.statuses[playerIndex].summon) {
		var template = npcTemplates.find(element => element.name == currentSession.statuses[playerIndex].summon.template);

		if (template) {
			var result = template.makeRoll("Attack");
			result.target = $("#summonTarget").val();

			dbPushEvent(new EventPlayerSummonAttack(character.name, currentSession.statuses[playerIndex].summon.template, currentSession.statuses[playerIndex].summon.name, result));
		}
	} else {
		updatePlayerDisplay();
		setSummonControls();
	}
}

/// Handles dismissal of player's summoned pet.
function summonDismiss() {
	var playerIndex = currentSession.characters.indexOf(character.name);

	if (currentSession.statuses[playerIndex].summon) {
		dbPushEvent(new EventPlayerSummonDismiss(character.name, currentSession.statuses[playerIndex].summon.template, currentSession.statuses[playerIndex].summon.name));
	} else {
		updatePlayerDisplay();
		setSummonControls();
	}
}

/// Handles player making a plain roll against an attribute or skill.
function performRoll() {
	var key = $("#rollSelect").val();

	doPlayerRoll("Make a roll using " + getQuality(key).name + ".", "", { key, playerInitiated: true, callback: resolveRoll });
}

/// Takes player's plain roll and passes it to an event.
function resolveRoll() {
	dbPushEvent(new EventRoll(character.name, queuedRoll));
}

/// Handles player making an attack against an NPC.
function performAttack() {
	var target = nameEncode($("#rollTarget").val());
	var key = $("#rollSelect").val();

	doPlayerRoll("Make an attack using " + getQuality(key).name + ".", "", { target, key, playerInitiated: true, callback: resolveAttack });
}

/// Takes player's attack roll and passes it to an event.
function resolveAttack() {
	dbPushEvent(new EventPlayerAttack(character.name, queuedRoll));
}

/// Toggles automatic handling of rolls.
function toggleLazyMode() {
	lazyMode = $(this).prop("checked");
}

/// Copies character sheet to clipboard.
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

/// Redsiplays the players in the session and their pets.
function updatePlayerDisplay() {
	var charList = $("#charList");

	charList.empty();

	if (!currentSession) { return; }

	for (var i = 0; i < currentSession.characters.length; i++) {
		var markup = "<li><div class='" + statusClasses[currentSession.statuses[i].injuryLevel] + "' title='Click to view profile'>" + currentSession.characters[i] + "</div>";

		if (currentSession.statuses[i].summon) {
			markup += "<div class='" + statusClasses[currentSession.statuses[i].summon.injuryLevel] + "'" + ((currentSession.statuses[i].summon.name) ? " title='" + currentSession.statuses[i].summon.template + "'" : "") + ">" + (currentSession.statuses[i].summon.name || currentSession.statuses[i].summon.template) + "</div>";
		}

		charList.append(markup + "</li>");
	}
}

/// Redisplays the NPCs in the session.  Hidden NPCs will not be shown.
function updateNPCDisplay() {
	var npcList = $("#npcList");

	npcList.empty();
	markupNPCTargets = "";

	if (!currentSession) { return; }

	for (var i = 0; i < currentSession.npcs.length; i++) {
		npcList.append("<li class='" + statusClasses[currentSession.npcs[i].status] + "'>" + currentSession.npcs[i].name + "</li>");

		if (currentSession.npcs[i].status < statusClasses.length - 1) {
			markupNPCTargets += "<option>" + currentSession.npcs[i].name + "</option>";
		}
	}

	$("select[npc-target]").html(markupNPCTargets);
}

/// Handler for session events.
function addEventDisplay(event) {
	event = forceEventType(event);

	switch (event.eventType) {
		case "AddNPC":
			if (dispatchMessages) {
				currentSession.npcs.push(new NPC(event.name));
				updateNPCDisplay();
			}
			break;
		case "AddPlayer":
			if (dispatchMessages) {
				currentSession.characters.push(event.player);
				currentSession.statuses.push(new CharacterStatus(event.player));
				updatePlayerDisplay();
			}
			break;
		case "Close":
			eventPane.empty();
			$(playerInputSelector).attr("disabled", "true");
			dbLoadSessionByParticipant(character.name, loadSessionList);
			break;
		case "End":
			$(playerInputSelector).attr("disabled", "true");
			eventPane.append(event.toHTML());
			dbClearEventSystem();
			break;
		case "GMAllow":
			if (event.player == character.name) {
				eventPane.append(event.toHTML());
			}
			break;
		case "GMDeny":
			if (event.player == character.name) {
				eventPane.append(event.toHTML());

				if (event.parent.startsWith("RequestTransform_")) {
					$("#transformButton").removeAttr("disabled");
				}
			}
			break;
		case "InjuryPlayer":
			if (dispatchMessages) {
				if (event.player.indexOf("»") > -1) {
					var parts = event.player.split("»");
					var playerIndex = currentSession.characters.indexOf(nameDecode(parts[0]));

					currentSession.statuses[playerIndex].summon.injuryLevel = event.status;
				} else {
					var playerIndex = currentSession.characters.indexOf(event.player);
					currentSession.statuses[playerIndex].injuryLevel = event.status;
				}

				updatePlayerDisplay();
			}

			eventPane.append(event.toHTML());
			break;
		case "NPCAttack":
			if ((dispatchMessages) && (event.player == character.name)) {
				doPlayerRoll("You have been attacked by " + nameDecode(event.name) + "!", event.comment, { npc: event.name, key: "Defense", parent: event.id, callback: resolveNPCAttack} );
			}
			break;
		case "NPCAttackResolution":
			if (event.success) {
				if ((dispatchMessages) && (event.player == character.name)) {
					doPlayerRoll("You have been hit by " + nameDecode(event.name) + "!", event.comment, { npc: event.name, key: "Toughness", attackType: event.attackType, parent: event.parent, callback: resolveNPCDamage});
				}
			} else {
				eventPane.find("div[data-parent='" + event.parent + "']").append(event.toHTML());
			}
			break;
		case "NPCStatus":
				if (dispatchMessages) {
					currentSession.npcs.find(element => element.name == event.name).status = event.status;
					updateNPCDisplay();
				}

				eventPane.append(event.toHTML());
				break;
		case "PlayerArmor":
			if (character.name == event.name) {
				$("#playerArmor").prop("selectedIndex", event.armor);
			}

			currentSession.statuses[currentSession.characters.indexOf(character.name)].wornArmor = event.armor;
			break;
		case "PlayerWeapon":
				if (character.name == event.name) {
					$("#playerWeapon").prop("selectedIndex", event.weapon);
					changeWeapon(false); // Why do I have to manually fire this???
				}
	
				currentSession.statuses[currentSession.characters.indexOf(character.name)].equippedWeapon = event.weapon;
				break;
		case "PlayerAttackResolution":
			if ((dispatchMessages) && (event.success)) {
				if (event.player == character.name) {
					doPlayerRoll("You hit " + nameDecode(event.target) + "!  Roll for damage!", event.comment, { npc: event.target, key: getQuality(event.key).governing, attackType: event.attackType, parent: event.parent, callback: resolvePlayerDamage });
				}
			} else {
				$("#" + event.parent).append(event.toHTML());
			}
			break;
		case "PlayerConnect":
			if ((dispatchMessages) && (event.player == character.name) && (event.timeStamp != connectId)) {
				dbClearEventSystem(); // Kill the event system, we're leaving!
				showErrorPopup("Players can only maintain one connection to a session.  This player has connected from somewhere else.", divertToDashboard);
			}
			break;
		case "PlayerDamage":
		case "RollPlayerContestedSubordinate":
		case "RollSubordinateResolution":
			$("#" + event.parent).append(event.toHTML());
			break;
		case "PlayerRequestTransform":
			if (event.name == character.name) {
				$("#transformButton").attr("disabled", "true");
			}
			break;
		case "PlayerToughness":
			eventPane.find("div[data-parent='" + event.parent + "']").append(event.toHTML());
			break;
		case "PlayerTransform":
				if (event.player == character.name) {
					if (event.transform) {
						character.transformation = event.transform;
						$("#transformButton").text(transformRevertLabel).attr("data-key", "").removeAttr("disabled");
					} else {
						delete character.transformation;

						var targetTransform = supernaturalTransformations.find(element => element.parent === character.supernatural);

						if (targetTransform) {
							var transformName = targetTransform.template.name;
							$("#transformButton").text("Transform into " + transformName).attr("data-key", transformName).removeAttr("disabled");
						}
					}

					character.print("printout");
				}
				eventPane.append(event.toHTML());
			break;
		case "PromptRoll":
			if ((dispatchMessages && (event.player == character.name))) {
				doPlayerRoll("Roll " + getQuality(event.key).name + "!", event.comment, { key: event.key, parent: event.id, callback: resolveRoll });
			}
			break;
		case "RemoveNPC":
			if (dispatchMessages) {
				var NPCIndex = currentSession.npcs.findIndex(element => element.name == event.name);

				if (NPCIndex > -1) {
					currentSession.npcs.splice(NPCIndex, 1);
					updateNPCDisplay();
				} else {
					console.log("Error removing NPC '" + event.name + "' from the session - not found.");
				}
			}
			break;
		case "RemovePlayer":
			if (dispatchMessages) {
				if (event.player == character.name) {
					dbClearSession();
					eventPane.empty();
					currentSession = null;
					updatePlayerDisplay();
					updateNPCDisplay();
					$(playerInputSelector).attr("disabled", "true");
					showErrorPopup("You have been removed from the session.");
				} else {
					var playerIndex = currentSession.characters.indexOf(event.player);

					if (playerIndex > -1) {
						currentSession.characters.splice(playerIndex, 1);
						currentSession.statuses.splice(playerIndex, 1);
						updatePlayerDisplay();
					} else {
						console.log("Error removing player'" + event.player + "' from the session - not found.");
					}
				}
			}
			break;
		case "RollContested":
			if ((dispatchMessages) && (event.player == character.name)) {
				doPlayerRoll("Roll " + getQuality(event.key).name + " vs. " + nameDecode(event.name) + "!", event.comment, { npc: event.name, key: event.key, parent: event.id, callback: resolveContestedRoll });
			}
			break;
		case "RollContestedSubordinate":
			eventPane.append(event.toHTML());
			eventPane.children().last().attr("id", event.parent);
			break;
		case "RollPlayerContested":
			eventPane.append(event.toHTML());

			if (dispatchMessages) {
				if (event.player1 == character.name) {
					doPlayerRoll("Roll " + getQuality(event.key1).name + " vs. " + nameDecode(event.player2) + "!", event.comment, { target: event.player2, key: event.key1, parent: event.id, callback: resolvePlayerContestedRoll });
				} else if (event.player2 == character.name) {
					doPlayerRoll("Roll " + getQuality(event.key2).name + " vs. " + nameDecode(event.player1) + "!", event.comment, { target: event.player1, key: event.key2, parent: event.id, callback: resolvePlayerContestedRoll });
				}
			}
			break;
		case "PlayerSummonDismiss":
			eventPane.append(event.toHTML());

			if (dispatchMessages) {
				var charIndex = currentSession.characters.indexOf(event.player);
				currentSession.statuses[charIndex].removeSummon();
				updatePlayerDisplay();
				setSummonControls();
			}
			break;
		case "PlayerSummonResolution":
			$("#" + event.parent).append(event.toHTML());

			if ((dispatchMessages) && (event.success)) {
				var charIndex = currentSession.characters.indexOf(event.player);
				currentSession.statuses[charIndex].addSummon(event.template, event.petName);
				updatePlayerDisplay();
				setSummonControls();
			}
			break;
		default:
			if (GM_EVENTS.indexOf(event.eventType) < 0) {
				eventPane.append(event.toHTML());
			}
	}

	eventPane.scrollTop(eventPane[0].scrollHeight);
}

/// Takes player's roll against an NPC and passes it to an event.
function resolveContestedRoll() {
	dbPushEvent(new EventContestedResponse(character.name, queuedRoll));
}

/// Takes player's roll against another player and passes it to an event.
function resolvePlayerContestedRoll() {
	dbPushEvent(new EventPlayerContestedRollSubordinate(character.name, queuedRoll));
}

/// Takes player's defense roll against an attack and passes it to an event.
function resolveNPCAttack() {
	var weaponIndex = currentSession.statuses[currentSession.characters.indexOf(character.name)].equippedWeapon;

	if (EQUIPPED_WEAPON[weaponIndex].useBlock) {
		queuedRoll.useBlock = true;
		queuedRoll.blockMod = character.getBlockModifier();
	}

	dbPushEvent(new EventPlayerDefense(character.name, queuedRoll));
}

/// Takes players toughness roll against damage and passes it to an event.
function resolveNPCDamage() {
	var armorIndex = currentSession.statuses[currentSession.characters.indexOf(character.name)].wornArmor;

	queuedRoll.armor = armorIndex;
	queuedRoll.armorMod = character.getArmorModifier(armorIndex);

	dbPushEvent(new EventPlayerToughnessRoll(character.name, queuedRoll));
}

/// Takes player's damage roll against an NPC and passes it to an event.
function resolvePlayerDamage() {
	var weaponIndex = currentSession.statuses[currentSession.characters.indexOf(character.name)].equippedWeapon;

	if (EQUIPPED_WEAPON[weaponIndex].useBlock) {
		queuedRoll.shieldPenalty = true;
		queuedRoll.shieldMod = -2;
	}

	dbPushEvent(new EventPlayerDamageRoll(character.name, queuedRoll));
}

/// Sends player connection event to the session.
function sendConnectEvent() {
	if ((character) && (currentSession)) {
		var connectionEvent = new EventPlayerConnect(character.name);
		connectId = connectionEvent.timeStamp;
		dbPushEvent(connectionEvent);
	}
}

/// Sends player disconnect event to the session.
function sendDisconnectEvent() {
	if ((character) && (currentSession)) {
		dbPushEvent(new EventPlayerDisconnect(character.name));
	}
}

/// Displays popup with character description when player clicks on them in the list.
function launchCharacterProfile(event) {
	event.preventDefault();
	window.getSelection().removeAllRanges();

	showProfilePopup($(this).text());
}

/// Receives a character from the database.
function characterLoaded(loadMe) {
	var tmpChar = loadMe.val();

	if ((tmpChar) && (dbTransform(tmpChar.player) == dbTransform(userInfo.display))) {
		character = tmpChar;
		Object.setPrototypeOf(character, CharacterSheet.prototype);

		var targetTransform = supernaturalTransformations.find(element => element.parent === character.supernatural);

		if (targetTransform) {
			var transformName = targetTransform.template.name;
			$("#charStatus").append("<button type='button' id='transformButton' data-key='" + transformName + "' disabled>Transform into " + transformName + "</button>");
		}

		character.print("printout");
		resetRollSelect();

		eventPane.empty();
		dbLoadSessionByParticipant(character.name, loadSessionList);

		$("#loading").remove();
		$("#main").removeClass("hideMe");
	} else {
		showErrorPopup("Character not found.", divertToDashboard);
	}
}

/// Button handler to manually load session.
function loadCharacterSession() {
	$("#loadSession").attr("disabled");
	dbLoadSessionByParticipant(character.name, loadSessionList);
}

/// Determines how to load character into a session.
function loadSessionList(result) {
	switch (result.length) {
		case 0:
			$("#loadSession").removeAttr("disabled");
			showErrorPopup("This character is not part of an active roleplaying session.  Check with your Game Master.");
			break;
		case 1:
			dbLoadSessionByOwner(result[0], sessionLoaded);
			break;
		default:
			showSessionSelection(result);
	}
}

/// Receives a session from the database.
function sessionLoaded(loadMe) {
	var result = loadMe.val();

	if (result) {
		var i;
		eventPane.empty();
		$("#charList, #npcList").empty();
		currentSession = result;
		Object.setPrototypeOf(currentSession, RoleplaySession.prototype);

		for (i = 0; i < currentSession.statuses.length; i++) {
			Object.setPrototypeOf(currentSession.statuses[i], CharacterStatus.prototype);

			if (currentSession.characters[i] == character.name) {
				$("#playerWeapon").prop("selectedIndex", currentSession.statuses[i].equippedWeapon);
				changeWeapon(false); // Why do I have to manually fire this???
				$("#playerArmor").prop("selectedIndex", currentSession.statuses[i].wornArmor);
				$(playerInputSelector).removeAttr("disabled");
				setSummonControls();
			}
		}

		if (currentSession.npcs) {
			for (i = 0; i < currentSession.npcs.length; i++) {
				Object.setPrototypeOf(currentSession.npcs[i], NPC.prototype);

				if (currentSession.npcs[i].status < INJURY_LEVEL_DISPLAY.length - 1) {
					$("#rollTarget").append("<option>" + currentSession.npcs[i].name + "</option>");
				}
			}
		} else {
			currentSession.npcs = [];
		}

		updatePlayerDisplay();
		updateNPCDisplay();

		dispatchMessages = false;
		dbLoadEventMessages(currentSession.owner, eventSystemLoaded);
		dbBindCallbackToEventSystem("child_added", eventAddedCallback);
	} else {
		showErrorPopup("Your session failed to load.");
	}
}

/// Fired when the page connects to the session's event system.
function eventSystemLoaded(loadMe) {
	$(playerInputSelector).removeAttr("disabled");
	dispatchMessages = true;

	sendConnectEvent();
}

/// Catches events that are coming from the event system.
function eventAddedCallback(loadMe) {
	if (loadMe.val()) {
		addEventDisplay(loadMe.val());
	}
}

/// Displays confirm modal.
function showConfirmPopup(message, callback) {
	$("#modalBG, #confirmModal").addClass("show");
	$("#confirmText").html(message);
	$("#confirmOk").off("click").on("click", callback);
}

/// Displays error modal.
function showErrorPopup(message, callback=null) {
	$("#modalBG, #errorModal").addClass("show");
	$("#errorText").text(message);
	$("#errorButton").off("click").on("click", hidePopup);
	
	if (callback) {
		$("#errorButton").on("click", callback);
	}
}

/// Display modal for choosing which session to join.
function showSessionSelection(sessionList) {
	$("#sessionList").empty();

	for (var i = 0; i < sessionList.length; i++) {
		$("#sessionList").append("<p><button type='button' value='" + sessionList[i] + "'>" + sessionList[i] + "</button></p>");
	}

	$("#modalBG").addClass("show");
	$("#sessionModal").addClass("show");
}

/// Loads session selected in session modal.
function performSessionLoad() {
	hidePopup();
	dbLoadSessionByOwner($(this).val(), sessionLoaded);
}

/// Shows rolling modal, or automatically completes the roll if in lazy mode.
function doPlayerRoll(message, comment, rollInfo) {
	if (!dispatchMessages) {
		return;
	} else if ((queuedRoll) || ($("#modalBG").hasClass("show"))) {
		dbPushEvent(new EventPlayerBusy(character.name, rollInfo.parent));
		return;
	}

	/* npc, key, attackType, parent, callback */
	queuedRoll = rollInfo;

	character.makeRoll(queuedRoll);

	if (lazyMode) {
		queuedRoll.comment = "Lazy mode.";
		acceptPlayerRoll();
	} else {
		if (queuedRoll.playerInitiated) {
			$("#rollModal h3").text("Make a Roll");
		} else {
			$("#rollModal h3").text("Roll Needed!");
		}

		$("#dieRollComment").val("");
		$("#modalBG").addClass("show");
		$("#rollModal").addClass("show");
		$("#dieRollText").text(message);
		$("#dieRollGMComment").text(comment).toggleClass("show", !!(comment));
		$("#rollModal button, #rollModal input").removeAttr("disabled");
		$("#cancelDieRoll").toggle(queuedRoll.playerInitiated === true);
		$("#dieRollContinue").hide();
	}

	if (navigator.vibrate) {
		navigator.vibrate(200);
	}
}

/// Displays dice rolls in the rolling modal.
function executePlayerRoll(event) {
	event.preventDefault();
	var rollPanel = $("#dieRollPanel");
	var chosenRoll = 0;

	$(this).parent().find("button, input").attr("disabled", "true");
	queuedRoll.comment = $("#dieRollComment").val();

	rollPanel.append("<div><div>" + queuedRoll.rolls[0] + "</div></div>");

	if (queuedRoll.rolls.length > 1) {
		var curRoll = 1;

		if (queuedRoll.resist) {
			rollPanel.append("<div class='good resist'><div>" + queuedRoll.rolls[curRoll] + "</div></div>");
			curRoll++;
		}

		if (queuedRoll.lucky) {
			rollPanel.append("<div class='good lucky'><div>" + queuedRoll.rolls[curRoll] + "</div></div>");
			curRoll++;
		}

		if (queuedRoll.weak) {
			rollPanel.append("<div class='bad weak'><div>" + queuedRoll.rolls[curRoll] + "</div></div>");
			curRoll++;
		}

		if (queuedRoll.unlucky) {
			rollPanel.append("<div class='bad unlucky'><div>" + queuedRoll.rolls[curRoll] + "</div></div>");
			curRoll++;
		}

		setTimeout(function() { rollPanel.addClass("double"); }, 1000);

		if (queuedRoll.rolls.length > 2) {
			setTimeout(function() { rollPanel.addClass("triple"); }, 3000);
		}

		chosenRoll = queuedRoll.rolls.indexOf(queuedRoll.result);
		setTimeout(finalizePlayerRoll, 2000 * queuedRoll.rolls.length - 500);
	} else {
		setTimeout(finalizePlayerRoll, 1000);
	}

	if (chosenRoll > -1) {
		$("#dieRollPanel > div:nth-of-type(" + (chosenRoll + 1) + ")").attr("chosen", "true");
	}
}

/// Fires once dice roll display has completed.
function finalizePlayerRoll() {
	$("#dieRollPanel > div:not([chosen])").addClass("discarded");
	$("#dieRollContinue").show();
}

/// Completes the roll, firing its associated callback.
function acceptPlayerRoll() {
	queuedRoll.callback();
	queuedRoll = null;
	hidePopup();
	$("#dieRollPanel").removeClass("double triple").empty();
}

/// Cancels the roll in progress.  This is only available on rolls the player initiated.
function cancelPlayerRoll() {
	queuedRoll = null;
	hidePopup();
}

/// Displays profile modal.
function showProfilePopup(name) {
	$("#modalBG").addClass("show");
	$("#profileModal").addClass("show");
	$("#profileModal iframe").attr("src", "profile.html?character=" + name + "&minimal=true");
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
$(window).on("online", sendDisconnectEvent);
$(window).on("offline, unload", sendDisconnectEvent);
$("#loadSession").on("click", loadCharacterSession);
$("#playerWeapon").on("change", changeWeapon);
$("#playerArmor").on("change", changeArmor);
$("#charStatus").on("click", "#transformButton", requestTransformation);
$("#charList").on("click", "li > div:first-child", launchCharacterProfile);
$("#rollExecute").on("click", performRoll);
$("#attackExecute").on("click", performAttack);
$("#summonControls").on("click", "button#summonExecute", requestSummon);
$("#summonControls").on("click", "button#summonAttack", summonAttack);
$("#summonControls").on("click", "button#summonDismiss", summonDismiss);
$("#lazyMode").on("click", toggleLazyMode);
$("#printout").on("dblclick", copyOutput);
$("#sessionList").on("click", "button", performSessionLoad);
$("#makeDieRoll").on("click", executePlayerRoll);
$("#dieRollContinue").on("click", acceptPlayerRoll);
$("#cancelDieRoll").on("click", cancelPlayerRoll);
$("#confirmCancel, #errorButton, #sessionSelectionCancel, #profileDone").on("click", hidePopup);
