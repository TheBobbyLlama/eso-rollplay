const statusClasses = [ "statusUnhurt", "statusInjured", "statusCritical", "statusIncapacitated", "statusHidden" ];
const playerInputSelector = "#charStatus input, #charStatus select, #charStatus button, #rollControls button, #rollControls input, #rollControls select, #summonControls button, #summonControls input, #summonControls select";

var userInfo = null;
var character = new CharacterSheet();
var currentSession;
var connectId = null;
var dispatchMessages = false;  // Flag used differentiating between archived and freshly received messages.
var currentRoll; // Holds data for the roll we're making.
var queuedRolls = []; // Holds any rolls that are waiting to be made.
var lazyMode = false; // Automatically complete all rolls.

var markupNPCTargets = "";

var eventPane = $("#eventPane");

var soundLibrary = {
	alert: {
		audio: new Audio("./assets/audio/alert.mp3")
	},
	damage: {
		audio: new Audio("./assets/audio/damage.mp3")
	}
}

/// Called on page startup.
async function initializePage(myUser) {
	if (!myUser) {
		showErrorPopup("User " + firebase.auth().currentUser.displayName + " not found!", divertToLogin);
		return;
	}

	userInfo = myUser;

	await localizePage(userInfo.language);

	var inCharacter = new URLSearchParams(window.location.search).get("character") || localStorage.getItem("ESORP[character]");

	for (var i = 0; i < EQUIPPED_WEAPON.length; i++) {
		$("#playerWeapon").append("<option value='" + EQUIPPED_WEAPON[i].weapon + "'>" + localize(EQUIPPED_WEAPON[i].weapon) + "</option>");
	}

	for (var i = 0; i < WORN_ARMOR.length; i++) {
		$("#playerArmor").append("<option value='" + getQuality(WORN_ARMOR[i]).name + "'>" + localize(getQuality(WORN_ARMOR[i]).name) + "</option>");
	}

	$(playerInputSelector).attr("disabled", "true");

	resetRollSelect();

	if (inCharacter) {
		dbLoadCharacter(inCharacter, characterLoaded);
		document.title = "ESO Rollplay - " + inCharacter;
	} else {
		showErrorPopup(localize("CHARACTER_NOT_FOUND"), divertToDashboard);
	}

	// Set alert volume levels.
	Object.getOwnPropertyNames(soundLibrary).forEach((element) => {
		soundLibrary[element].audio.volume = userInfo.alertVolume || 1;
	});
}

/// Populates attribute/skill dropdown based on the character's selections.
function resetRollSelect() {
	var i;
	var rollSelector = $("#rollSelect");
	var charItems = Object.entries(character.skills || {});
	
	rollSelector.empty();

	for (i = 0; i < charItems.length; i++) {
		var curQuality = getQuality(charItems[i][0]);

		rollSelector.append("<option value='" + curQuality.key +"'>" + localize(curQuality.name) + "</option>")
	}

	for(i = 0; i < masterQualityList.length; i++) {
		var workingList = masterQualityList[i];

		for (var idx = 0; idx < workingList.length; idx++) {
			if (!charItems.find(element => element[0] == workingList[idx].key)) {
				rollSelector.append("<option value='" + workingList[idx].key +"'>" + localize(workingList[idx].name) + "</option>")
			}
		}
	}
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
				"<div><em>" + localize(summonName) + "</em></div>" +
				"<div>" +
					"<button id='summonAttack' type='button'>" + localize("ACTION_ATTACK!") + "</button>" +
					"<select id='summonTarget' npc-target>" + markupNPCTargets + "</select>" +
				"</div>" +
				"<div><button id='summonDismiss' type='button'>" + localize("DISMISS_SUMMON") + "</button></div>" +
			"</div>"
		);
	} else {
		var markupSummonOptions = "";

		for (var i = 0; i < npcTemplates.length; i++) {
			if (npcTemplates[i].summonSkill) {
				markupSummonOptions += "<option value='" + npcTemplates[i].name + "'>" + localize(npcTemplates[i].name) + "</option>";
			}
		}

		controls.html("<div>" +
				"<select id='summonTemplate'>" + markupSummonOptions + "</select>" +
				"<p>" +
					"<label for='summonName'>" + localize("LABEL_NAME") + "</label>" +
					"<input type='text' id='summonName' maxlength='24' placeholder='(Optional)'></input>" +
				"</p>" +
			"</div>" +
			"<button id='summonExecute' type='button'>" + localize("ACTION_SUMMON!") + "</button>"
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
		startPlayerRoll(localize("SUMMON_ROLL_CAPTION").replace(/SKILL/, localize(getQuality(template.summonSkill).name)).replace(/TEMPLATE/, localize(templateName)), "", { key: template.summonSkill, playerInitiated: true, summonTemplate: templateName, summonName, callback: resolveSummonRequest });
		summonEl.val("");
	}
}

/// Takes player's summoning roll and passes it to an event.
function resolveSummonRequest() {
	dbPushEvent(new EventPlayerRequestSummon(character.name, currentRoll));
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

	startPlayerRoll(localize("PLAYER_ROLL_CAPTION").replace(/QUALITY/, localize(getQuality(key).name)), "", { key, playerInitiated: true, callback: resolveRoll });
}

/// Takes player's plain roll and passes it to an event.
function resolveRoll() {
	dbPushEvent(new EventRoll(character.name, currentRoll));
}

/// Handles player making an attack against an NPC.
function performAttack() {
	var target = nameEncode($("#rollTarget").val());
	var key = $("#rollSelect").val();

	startPlayerRoll(localize("ATTACK_ROLL_CAPTION").replace(/QUALITY/, localize(getQuality(key).name)), "", { target, key, playerInitiated: true, callback: resolveAttack });
}

/// Takes player's attack roll and passes it to an event.
function resolveAttack() {
	dbPushEvent(new EventPlayerAttack(character.name, currentRoll));
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
		var markup = "<li><div class='" + statusClasses[currentSession.statuses[i].injuryLevel] + "' title='" + localize("CLICK_TO_VIEW_PROFILE") + "'>" + currentSession.characters[i] + "</div>";

		if (currentSession.statuses[i].summon) {
			markup += "<div class='" + statusClasses[currentSession.statuses[i].summon.injuryLevel] + "'" + ((currentSession.statuses[i].summon.name) ? " title='" + localize(currentSession.statuses[i].summon.template) + "'" : "") + ">" + (currentSession.statuses[i].summon.name || localize(currentSession.statuses[i].summon.template)) + "</div>";
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
				currentSession.characters.splice(event.index, 0, event.player);
				currentSession.statuses.splice(event.index, 0, new CharacterStatus(event.player));
				updatePlayerDisplay();
			}
			break;
		case "CancelQueuedRoll":
			if (dispatchMessages) {
				var findRoll = queuedRolls.findIndex(item => item.rollInfo.parent === event.roll);
				if (findRoll > -1) {
					queuedRolls.splice(findRoll, 1);
					dbPushEvent(new EventCancelQueuedRollSuccess(character.name, event.roll));
				} else {
					console.log("Not found!");
				}
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
				if (event.player == character.name) {
					var body = $("body");
					var playerIndex = currentSession.characters.indexOf(event.player);

					if (event.status > currentSession.statuses[playerIndex].injuryLevel) {
						playSound("damage");

						body.addClass("damage");

						setTimeout(() => { body.removeClass("damage") }, 100);
					} else if (event.status < currentSession.statuses[playerIndex].injuryLevel) {
						body.addClass("healed");

						setTimeout(() => { body.removeClass("healed") }, 100);
					}
				}

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
				startPlayerRoll(localize("INCOMING_ATTACK_CAPTION").replace(/NAME/, nameDecode(event.name)), event.comment, { npc: event.name, key: "Defense", parent: event.id, callback: resolveNPCAttack} );
			}
			break;
		case "NPCAttackResolution":
			if (event.success) {
				if ((dispatchMessages) && (event.player == character.name)) {
					startPlayerRoll(localize("INCOMING_HIT_CAPTION").replace(/NAME/, nameDecode(event.name)), event.comment, { npc: event.name, key: "Toughness", attackType: event.attackType, parent: event.parent, callback: resolveNPCDamage});
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
					changeWeapon(false);
				}
	
				currentSession.statuses[currentSession.characters.indexOf(character.name)].equippedWeapon = event.weapon;
				break;
		case "PlayerAttackResolution":
			if (dispatchMessages) {
				if (event.player == character.name) {
					if (event.success) {
						startPlayerRoll(localize("ATTACK_HIT_CAPTION").replace(/TARGET/, nameDecode(event.target)), event.comment, { npc: event.target, key: getQuality(event.key).governing || event.key, attackType: event.attackType, parent: event.parent, callback: resolvePlayerDamage });
					} else {
						playSound("alert");
					}
				}
			}
			
			if (!event.success)
			{
				$("#" + event.parent).append(event.toHTML());
			}
			break;
		case "PlayerConnect":
			if ((dispatchMessages) && (event.player == character.name) && (event.timeStamp != connectId)) {
				dbClearEventSystem(); // Kill the event system, we're leaving!
				showErrorPopup(localize("ERROR_CONNECTED_ELSEWHERE"), divertToDashboard);
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
						$("#transformButton").text(localize("TRANSFORM_REVERT")).attr("data-key", "").removeAttr("disabled");
					} else {
						delete character.transformation;

						var targetTransform = supernaturalTransformations.find(element => element.parent === character.supernatural);

						if (targetTransform) {
							var transformName = targetTransform.template.name;
							$("#transformButton").text(localize("TRANSFORM_INTO").replace(/FORM/, localize(transformName))).attr("data-key", transformName).removeAttr("disabled");
						}
					}

					character.print("printout");
					playSound("alert");
				}
				eventPane.append(event.toHTML());
			break;
		case "PromptRoll":
			if ((dispatchMessages && (event.player == character.name))) {
				startPlayerRoll(localize("ROLL_CAPTION").replace(/QUALITY/, localize(getQuality(event.key).name)), event.comment, { key: event.key, parent: event.id, callback: resolveRoll });
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
					showErrorPopup(localize("YOU_HAVE_BEEN_REMOVED_FROM_THE_SESSION"));
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
				startPlayerRoll(localize("ROLL_AGAINST_OPPONENT_CAPTION").replace(/QUALITY/, localize(getQuality(event.key).name)).replace(/NAME/, nameDecode(event.name)), event.comment, { npc: event.name, key: event.key, parent: event.id, callback: resolveContestedRoll });
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
					startPlayerRoll(localize("ROLL_AGAINST_OPPONENT_CAPTION").replace(/QUALITY/, localize(getQuality(event.key1).name)).replace(/NAME/, nameDecode(event.player2)), event.comment, { target: event.player2, key: event.key1, parent: event.id, callback: resolvePlayerContestedRoll });
				} else if (event.player2 == character.name) {
					startPlayerRoll(localize("ROLL_AGAINST_OPPONENT_CAPTION").replace(/QUALITY/, localize(getQuality(event.key2).name)).replace(/NAME/, nameDecode(event.player1)), event.comment, { target: event.player1, key: event.key2, parent: event.id, callback: resolvePlayerContestedRoll });
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

			if (event.player == character.name) {
				playSound("alert");
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
	dbPushEvent(new EventContestedResponse(character.name, currentRoll));
}

/// Takes player's roll against another player and passes it to an event.
function resolvePlayerContestedRoll() {
	dbPushEvent(new EventPlayerContestedRollSubordinate(character.name, currentRoll));
}

/// Takes player's defense roll against an attack and passes it to an event.
function resolveNPCAttack() {
	var weaponIndex = currentSession.statuses[currentSession.characters.indexOf(character.name)].equippedWeapon;

	if (EQUIPPED_WEAPON[weaponIndex].useBlock) {
		currentRoll.useBlock = true;
		currentRoll.blockMod = character.getBlockModifier();
	}

	dbPushEvent(new EventPlayerDefense(character.name, currentRoll));
}

/// Takes players toughness roll against damage and passes it to an event.
function resolveNPCDamage() {
	var armorIndex = currentSession.statuses[currentSession.characters.indexOf(character.name)].wornArmor;

	currentRoll.armor = armorIndex;
	currentRoll.armorMod = character.getArmorModifier(armorIndex);

	dbPushEvent(new EventPlayerToughnessRoll(character.name, currentRoll));
}

/// Takes player's damage roll against an NPC and passes it to an event.
function resolvePlayerDamage() {
	var weaponIndex = currentSession.statuses[currentSession.characters.indexOf(character.name)].equippedWeapon;

	if (EQUIPPED_WEAPON[weaponIndex].useBlock) {
		currentRoll.shieldPenalty = true;
		currentRoll.shieldMod = -2;
	}

	dbPushEvent(new EventPlayerDamageRoll(character.name, currentRoll));
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

	if ((tmpChar) && ((dbTransform(tmpChar.player) == dbTransform(userInfo.display)) || (tmpChar.npc))) {
		character = tmpChar;
		Object.setPrototypeOf(character, CharacterSheet.prototype);

		var targetTransform = supernaturalTransformations.find(element => element.parent === character.supernatural);

		if (targetTransform) {
			var transformName = targetTransform.template.name;
			$("#charStatus").append("<button type='button' id='transformButton' data-key='" + transformName + "' disabled>" + localize("TRANSFORM_INTO").replace(/FORM/, localize(transformName)) + "</button>");
		}

		character.print("printout");
		resetRollSelect();

		eventPane.empty();
		if (character.npc) {
			dbLoadSessionByOwner(userInfo.display, sessionLoaded);
		} else {
			dbLoadSessionByParticipant(character.name, loadSessionList);
		}

		$("#loading").remove();
		$("#main").removeClass("hideMe");
	} else {
		showErrorPopup(localize("CHARACTER_NOT_FOUND"), divertToDashboard);
	}
}

/// Button handler to manually load session.
function loadCharacterSession() {
	if (character.npc) {
		dbLoadSessionByOwner(userInfo.display, sessionLoaded);
	} else {
		dbLoadSessionByParticipant(character.name, loadSessionList);
	}
}

/// Determines how to load character into a session.
function loadSessionList(result) {
	switch (result.length) {
		case 0:
			$("#loadSession").removeAttr("disabled");
			showErrorPopup(localize("NOT_PART_OF_SESSION"));
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

		if (!result.characters.find(item => item === character.name)) {
			showErrorPopup(localize("ERROR_SESSION_FAILED_TO_LOAD"));
			return;
		}

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
		showErrorPopup("ERROR_SESSION_FAILED_TO_LOAD");
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

/// Helper function to play a sound for us.
function playSound(soundName) {
	if (dispatchMessages) {
		if (soundLibrary[soundName].audio.volume) {
			soundLibrary[soundName].audio.play();
		}
	}
}

/// Determines if/how a roll should be made.
function startPlayerRoll(message, comment, rollInfo) {
	if (!dispatchMessages) {
		return;
	}
	else if (!currentRoll) {
		currentRoll = rollInfo;
		doPlayerRoll(message, comment);
	} else if ((currentRoll) || ($("#modalBG").hasClass("show"))) {
		queuedRolls.push({ message, comment, rollInfo });
		dbPushEvent(new EventRollQueued(character.name, rollInfo.parent));
		return;
	}

	/* npc, key, attackType, parent, callback */
	currentRoll = rollInfo;
}

/// Shows rolling modal, or automatically completes the roll if in lazy mode.
function doPlayerRoll(message, comment) {
	character.makeRoll(currentRoll);

	if (lazyMode) {
		currentRoll.comment = localize("LAZY_MODE");
		acceptPlayerRoll();
	} else {
		if (currentRoll.playerInitiated) {
			$("#rollModal h3").text(localize("TITLE_MAKE_A_ROLL"));
		} else {
			$("#rollModal h3").text(localize("TITLE_ROLL_NEEDED"));
		}

		$("#dieRollComment").val("");
		$("#modalBG").addClass("show");
		$("#rollModal").addClass("show");
		$("#dieRollText").text(message);
		$("#dieRollGMComment").text(comment).toggleClass("show", !!(comment));
		$("#rollModal button, #rollModal input").removeAttr("disabled");
		$("#cancelDieRoll").toggle(currentRoll.playerInitiated === true);
		$("#dieRollContinue").hide();
	}

	if (!currentRoll.playerInitiated) {
		if (navigator.vibrate) {
			navigator.vibrate(200);
		}

		playSound("alert");
	}
}

/// Displays dice rolls in the rolling modal.
function executePlayerRoll(event) {
	event.preventDefault();
	var rollPanel = $("#dieRollPanel");
	var chosenRoll = 0;

	$(this).parent().find("button, input").attr("disabled", "true");
	currentRoll.comment = $("#dieRollComment").val();

	rollPanel.append("<div><div>" + currentRoll.rolls[0] + "</div></div>");

	if (currentRoll.rolls.length > 1) {
		var curRoll = 1;

		if (currentRoll.resist) {
			rollPanel.append("<div class='good resist'><div>" + currentRoll.rolls[curRoll] + "</div></div>");
			curRoll++;
		}

		if (currentRoll.lucky) {
			rollPanel.append("<div class='good lucky'><div>" + currentRoll.rolls[curRoll] + "</div></div>");
			curRoll++;
		}

		if (currentRoll.weak) {
			rollPanel.append("<div class='bad weak'><div>" + currentRoll.rolls[curRoll] + "</div></div>");
			curRoll++;
		}

		if (currentRoll.unlucky) {
			rollPanel.append("<div class='bad unlucky'><div>" + currentRoll.rolls[curRoll] + "</div></div>");
			curRoll++;
		}

		setTimeout(function() { rollPanel.addClass("double"); }, 1000);

		if (currentRoll.rolls.length > 2) {
			setTimeout(function() { rollPanel.addClass("triple"); }, 3000);
		}

		chosenRoll = currentRoll.rolls.indexOf(currentRoll.result);
		setTimeout(finalizePlayerRoll, 2000 * currentRoll.rolls.length - 500);
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
	currentRoll.callback();
	currentRoll = null;
	hidePopup();
	$("#dieRollPanel").removeClass("double triple").empty();

	if (queuedRolls.length) {
		({ message, comment, rollInfo } = queuedRolls.shift());
		startPlayerRoll(message, comment, rollInfo);
	}
}

/// Cancels the roll in progress.  This is only available on rolls the player initiated.
function cancelPlayerRoll() {
	currentRoll = null;
	hidePopup();

	if (queuedRolls.length) {
		({ message, comment, rollInfo } = queuedRolls.shift());
		startPlayerRoll(message, comment, rollInfo);
	}
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
