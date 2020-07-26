const statusClasses = [ "statusUnhurt", "statusInjured", "statusCritical", "statusIncapacitated", "statusHidden" ];

var character = new CharacterSheet();
var currentSession;
var dispatchMessages = false;  // Flag used differentiating between archived and freshly received messages.
var lazyMode = false; // Autoroll all forced rolls.

var eventPane = $("#eventPane");

function initializePage() {
	initializeDB();

	$("input[name='charName']").val(localStorage.getItem("ESORP[name]"));
	$("input[name='charPlayer']").val(localStorage.getItem("ESORP[player]"));
	$("#rollControls button, #rollControls input, #rollControls select").attr("disabled", "true");

	resetRollSelect();
}

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

function performRoll() {
	var key = $("#rollSelect").val();
	var result = character.makeRoll(key);
	var modifier = character.getRollModifier(key);
	var comment = $("#rollComment");
	dbPushEvent(new EventRoll(character.name, key, modifier, result, comment.val()));

	comment.val("");
}

function performAttack() {
	var target = $("#rollTarget").val();
	var key = $("#rollSelect").val();
	var result = character.makeRoll(key);
	var modifier = character.getRollModifier(key);
	var comment = $("#rollComment");

	dbPushEvent(new EventPlayerAttack(character.name, nameEncode(target), key, modifier, result, comment.val()));

	comment.val("");
}

function toggleLazyMode() {
	lazyMode = $(this).prop("checked");
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

function addPlayerToList(name) {
	$("#charList").append("<li class='" + statusClasses[0] + "' title='Click to view profile.'>" + name + "</li>");
}

function addNPCToList(name) {
	var npcList = $("#npcList")
	npcList.append("<li class='" + statusClasses[0] + "'>" + name + "</li>");
	setNPCStatus(npcList.children().length - 1, currentSession.npcs[npcList.children().length - 1].status);
}

function setPlayerStatus(index, status) {
	var pElement = $("#charList li:nth-child(" + (index + 1) + ")");

	for (var i = 0; i < statusClasses.length; i++) {
		pElement.toggleClass(statusClasses[i], (i == status));
	}
}

function setNPCStatus(index, status) {
	var pElement = $("#npcList li:nth-child(" + (index + 1) + ")");

	for (var i = 0; i < statusClasses.length; i++) {
		pElement.toggleClass(statusClasses[i], (i == status));
	}
}

function addEventDisplay(event) {
	switch (event.eventType) {
		case "AddNPC":
			if (dispatchMessages) {
				currentSession.npcs.push(new NPC(event.name));
				addNPCToList(event.name);
			}
			break;
		case "AddPlayer":
			if (dispatchMessages) {
				currentSession.characters.push(event.player);
				addPlayerToList(event.player);
			}
			break;
		case "Close":
			eventPane[0].textContent = "";
			$("#rollControls button, #rollControls input, #rollControls select").attr("disabled", "true");
			dbLoadSessionByParticipant(character.name, loadSessionList);
			break;
		case "End":
			$("#rollControls button, #rollControls input, #rollControls select").attr("disabled", "true");
			eventPane.append(convertEventToHtml(event));
			dbClearEventSystem();
		case "InjuryPlayer":
			if (dispatchMessages) {
				setPlayerStatus(currentSession.characters.indexOf(event.player), event.status);
			}

			eventPane.append(convertEventToHtml(event));
			break;
		case "NPCAttack":
			if ((dispatchMessages) && (event.player == character.name)) {
				forcePlayerRoll("You have been attacked by " + nameDecode(event.name) + "!", event.comment, event.name, "Defense", "", event.id, resolveNPCAttack);
			}
			break;
		case "NPCAttackResolution":
			if (event.success) {
				if ((dispatchMessages) && (event.player == character.name)) {
					forcePlayerRoll("You have been hit by " + nameDecode(event.name) + "!", event.comment, event.name, "Toughness", event.attackType, event.parent, resolveNPCDamage);
				}
			} else {
				eventPane.find("div[data-parent='" + event.parent + "']").append(convertEventToHtml(event));
			}
			break;
		case "NPCStatus":
				if (dispatchMessages) {
					if (event.oldStatus == INJURY_LEVEL_DISPLAY.length - 1) {
						$("#rollTarget").append("<option>" + event.name + "</option>");
					} else if (event.status == INJURY_LEVEL_DISPLAY.length - 1) {
						var rollOptions = $("#rollTarget").children();

						for (var i = 0; i < rollOptions.length; i++) {
							if (rollOptions[i].value == event.name) {
								rollOptions[i].remove();
							}
						}
					}

					setNPCStatus(currentSession.npcs.findIndex(element => element.name == event.name), event.status);
				}

				eventPane.append(convertEventToHtml(event));
				break;
		case "PlayerAttackResolution":
			if ((dispatchMessages) && (event.success)) {
				if (event.player == character.name) {
					forcePlayerRoll("You hit " + nameDecode(event.target) + "!  Roll for damage!", event.comment, event.target, event.key, event.attackType, event.parent, resolvePlayerDamage);
				}
			} else {
				$("#" + event.parent).append(convertEventToHtml(event));
			}
			break;
		case "PlayerDamage":
		case "RollPlayerContestedSubordinate":
		case "RollSubordinateResolution":
				$("#" + event.parent).append(convertEventToHtml(event));
		case "PlayerToughness":
				eventPane.find("div[data-parent='" + event.parent + "']").append(convertEventToHtml(event));
			break;
		case "RollContested":
			if ((dispatchMessages) && (event.player == character.name)) {
				forcePlayerRoll("Roll " + getQuality(event.key).name + " vs. " + nameDecode(event.name) + "!", event.comment, event.name, event.key, "", event.id, resolveContestedRoll);
			}
			break;
		case "RollPlayerContested":
			eventPane.append(convertEventToHtml(event));

			if (dispatchMessages) {
				if (event.player1 == character.name) {
					forcePlayerRoll("Roll " + getQuality(event.key1).name + " vs. " + nameDecode(event.player2) + "!", event.comment, event.player2, event.key1, "", event.id, resolvePlayerContestedRoll);
				} else if (event.player2 == character.name) {
					forcePlayerRoll("Roll " + getQuality(event.key2).name + " vs. " + nameDecode(event.player1) + "!", event.comment, event.player1, event.key2, "", event.id, resolvePlayerContestedRoll);
				}
			}
			break;
		default:
			if (GM_EVENTS.indexOf(event.eventType) < 0) {
				eventPane.append(convertEventToHtml(event));
			}
	}

	var queue = $("#eventPane");
	queue.scrollTop(queue[0].scrollHeight);
}

function resolveContestedRoll() {
	var npc = $("#rollModal").attr("data-npc");
	var key = $("#rollModal").attr("data-key");
	var parent = $("#rollModal").attr("data-parent");

	dbPushEvent(new EventContestedResponse(character.name, npc, key, character.getRollModifier(key), character.makeRoll(key), $("#forceRollComment").val(), parent));

	hidePopup();
}

function resolvePlayerContestedRoll() {
	var key = $("#rollModal").attr("data-key");
	var parent = $("#rollModal").attr("data-parent");

	dbPushEvent(new EventPlayerContestedRollSubordinate(character.name, key, character.getRollModifier(key), character.makeRoll(key), $("#forceRollComment").val(), parent));

	hidePopup();
}

function resolveNPCAttack() {
	var npc = $("#rollModal").attr("data-npc");
	var key = $("#rollModal").attr("data-key");
	var parent = $("#rollModal").attr("data-parent");

	dbPushEvent(new EventPlayerDefense(npc, character.name, character.getRollModifier(key), character.makeRoll(key), $("#forceRollComment").val(), parent));

	hidePopup();
}

function resolveNPCDamage() {
	var attackType = $("#rollModal").attr("data-type");
	var parent = $("#rollModal").attr("data-parent");
	var resist = character.resistsDamage(SPECIAL_ATTACK_TYPES[attackType]);
	var weak = character.weakToDamage(SPECIAL_ATTACK_TYPES[attackType]);

	var result = character.makeToughnessRoll(SPECIAL_ATTACK_TYPES[attackType]);

	dbPushEvent(new EventPlayerToughnessRoll(character.name, character.getRollModifier("Toughness"), result, attackType, resist, weak, $("#forceRollComment").val(), parent));

	hidePopup();
}

function resolvePlayerDamage() {
	var attackType = $("#rollModal").attr("data-type");
	var parent = $("#rollModal").attr("data-parent");
	var target = $("#rollModal").attr("data-npc");
	var key = $("#rollModal").attr("data-key");
	var modifier;

	if (attributes.find(element => element.key == key)) {
		modifier = character.getAttributeModifier(key);
	} else {
		key = getQuality(key).governing;
		modifier = character.getAttributeModifier(key);
	}

	result = character.makeRoll(key);

	dbPushEvent(new EventPlayerDamageRoll(character.name, target, modifier, result, attackType, $("#forceRollComment").val(), parent));

	hidePopup();
}

function sendConnectEvent() {
	if ((character) && (currentSession)) {
		dbPushEvent(new EventPlayerConnect(character.name));
	}
}

function sendDisconnectEvent() {
	if ((character) && (currentSession)) {
		dbPushEvent(new EventPlayerDisconnect(character.name));
	}
}

function launchCharacterProfile(event) {
	event.preventDefault();
	window.getSelection().removeAllRanges();

	showProfilePopup($(this).text());
}

function loadChar() {
	event.preventDefault();
	var tmpName = $("input[name='charName']").val();
	var tmpPlayer = $("input[name='charPlayer']").val();

	if ((!tmpName) || (!tmpPlayer)) {
		showErrorPopup("Please enter a character name and a player name.");
		return;
	}

	$("#rollTarget").empty();
	$("#rollControls button, #rollControls input, #rollControls select").attr("disabled", "true");
	dbLoadCharacter(tmpName, characterLoaded)
}

function characterLoaded(loadMe) {
	if ((loadMe.val()) && (dbSanitize(loadMe.val().player) == dbSanitize($("input[name='charPlayer']").val()))) {
		character = loadMe.val();
		Object.setPrototypeOf(character, new CharacterSheet());
		localStorage.setItem("ESORP[name]", nameDecode(character.name));
		localStorage.setItem("ESORP[player]", nameDecode(character.player));
		character.print("printout");
		resetRollSelect();

		eventPane.empty();
		dbLoadSessionByParticipant(character.name, loadSessionList);
		
	} else {
		showErrorPopup("Character not found.");
		$("input[name='charName']").val(character.name);
		$("input[name='charPlayer']").val(character.player || localStorage.getItem("ESORP[player]"));
	}
}

function loadSessionList(result) {
	switch (result.length) {
		case 0:
			showErrorPopup("This character is not part of an active roleplaying session.  Check with your Game Master.");
			break;
		case 1:
			dbLoadSessionByOwner(result[0], sessionLoaded);
			break;
		default:
			showSessionSelection(result);
	}
}

function sessionLoaded(loadMe) {
	var result = loadMe.val();

	if (result) {
		var i;
		var dummy;
		eventPane.empty();
		$("#charList, #npcList").empty();
		currentSession = result;
		Object.setPrototypeOf(currentSession, new RoleplaySession());

		dummy = new CharacterStatus("");

		for (i = 0; i < currentSession.statuses.length; i++) {
			addPlayerToList(currentSession.characters[i]);
			Object.setPrototypeOf(currentSession.statuses[i], dummy);
			setPlayerStatus(i, currentSession.statuses[i].injuryLevel);
		}

		dummy = new NPC();

		for (i = 0; i < currentSession.npcs.length; i++) {
			Object.setPrototypeOf(currentSession.npcs[i], dummy);

			if (currentSession.npcs[i].status < INJURY_LEVEL_DISPLAY.length - 1) {
				$("#rollTarget").append("<option>" + currentSession.npcs[i].name + "</option>");
			}

			addNPCToList(currentSession.npcs[i].name);
			setNPCStatus(i, currentSession.npcs[i].status);
		}

		dispatchMessages = false;
		dbLoadEventMessages(currentSession.owner, eventSystemLoaded);
		dbBindCallbackToEventSystem("child_added", eventAddedCallback);
	} else {
		showErrorPopup("Your session failed to load.");
	}
}

function eventSystemLoaded(loadMe) {
	$("#rollControls button, #rollControls input, #rollControls select").removeAttr("disabled");
	dispatchMessages = true;

	sendConnectEvent();
}

function eventAddedCallback(loadMe) {
	if (loadMe.val()) {
		addEventDisplay(loadMe.val());
	}
}

function showErrorPopup(message) {
	$("#modalBG").addClass("show");
	$("#errorModal").addClass("show");
	$("#errorText").text(message);
}

function showSessionSelection(sessionList) {
	$("#sessionList").empty();

	for (var i = 0; i < sessionList.length; i++) {
		$("#sessionList").append("<p><button type='button' value='" + sessionList[i] + "'>" + sessionList[i] + "</button></p>");
	}

	$("#modalBG").addClass("show");
	$("#sessionModal").addClass("show");
}

function performSessionLoad() {
	hidePopup();
	dbLoadSessionByOwner($(this).val(), sessionLoaded);
}

function forcePlayerRoll(message, comment, npc, key, attackType, parent, callback) {
	if (!dispatchMessages) {
		return;
	} else if ($("#modalBG").hasClass("show")) {
		dbPushEvent(new EventPlayerBusy(character.name, parent));
		return;
	}

	// Tack on all the data we'll want to use when we make our roll.
	$("#rollModal").attr("data-npc", npc).attr("data-key", key).attr("data-type", attackType).attr("data-parent", parent);

	if (lazyMode) {
		$("#forceRollComment").val("Lazy mode.");
		callback();
	} else {
		$("#forceRollComment").val("");
		$("#modalBG").addClass("show");
		$("#rollModal").addClass("show");
		$("#forceRollText").text(message);
		$("#forceRollGMComment").text(comment);
		$("#forceRollGMComment").toggleClass("show", !!(comment));
		$("#makeForceRoll").off("click").on("click", callback);
	}
}

function showProfilePopup(name) {
	$("#modalBG").addClass("show");
	$("#profileModal").addClass("show");
	$("#profileModal iframe").attr("src", "profile.html?character=" + name + "&minimal=true");
}

function hidePopup() {
	$("#modalBG").removeClass("show");
	$("#modalBG > div").removeClass("show");
}

$(window).on("online", sendDisconnectEvent);
$(window).on("offline, unload", sendDisconnectEvent);
$("#loadChar").on("click", loadChar);
$("#charList").on("click", "li", launchCharacterProfile);
$("#rollExecute").on("click", performRoll);
$("#attackExecute").on("click", performAttack);
$("#lazyMode").on("click", toggleLazyMode);
$("#printout").on("dblclick", copyOutput);
$("#sessionList").on("click", "button", performSessionLoad);
$("#errorButton, #sessionSelectionCancel, #profileDone").on("click", hidePopup);

initializePage();