const statusClasses = [ "statusUnhurt", "statusInjured", "statusCritical", "statusIncapacitated", "statusHidden" ];

var character = new CharacterSheet();
var currentSession;
var dispatchMessages = false;  // Flag used differentiating between archived and freshly received messages.
var forcedRoll; // Holds data for the roll we're making.
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

	forcePlayerRoll("Make your roll.", "", { key, playerInitiated: true, callback: resolveRoll });
}

function resolveRoll() {
	dbPushEvent(new EventRoll(character.name, forcedRoll));
}

function performAttack() {
	var target = nameEncode($("#rollTarget").val());
	var key = $("#rollSelect").val();

	forcePlayerRoll("Make your attack roll.", "", { target, key, playerInitiated: true, callback: resolveAttack });
}

function resolveAttack() {
	dbPushEvent(new EventPlayerAttack(character.name, forcedRoll));
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
	event = forceEventType(event);

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
			eventPane.append(event.toHTML());
			dbClearEventSystem();
		case "InjuryPlayer":
			if (dispatchMessages) {
				setPlayerStatus(currentSession.characters.indexOf(event.player), event.status);
			}

			eventPane.append(event.toHTML());
			break;
		case "NPCAttack":
			if ((dispatchMessages) && (event.player == character.name)) {
				forcePlayerRoll("You have been attacked by " + nameDecode(event.name) + "!", event.comment, { npc: event.name, key: "Defense", parent: event.id, callback: resolveNPCAttack} );
			}
			break;
		case "NPCAttackResolution":
			if (event.success) {
				if ((dispatchMessages) && (event.player == character.name)) {
					forcePlayerRoll("You have been hit by " + nameDecode(event.name) + "!", event.comment, { npc: event.name, key: "Toughness", attackType: event.attackType, parent: event.parent, callback: resolveNPCDamage});
				}
			} else {
				eventPane.find("div[data-parent='" + event.parent + "']").append(event.toHTML());
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

				eventPane.append(event.toHTML());
				break;
		case "PlayerAttackResolution":
			if ((dispatchMessages) && (event.success)) {
				if (event.player == character.name) {
					forcePlayerRoll("You hit " + nameDecode(event.target) + "!  Roll for damage!", event.comment, { npc: event.target, key: event.key, attackType: event.attackType, parent: event.parent, callback: resolvePlayerDamage });
				}
			} else {
				$("#" + event.parent).append(event.toHTML());
			}
			break;
		case "PlayerDamage":
		case "RollPlayerContestedSubordinate":
		case "RollSubordinateResolution":
				$("#" + event.parent).append(event.toHTML());
		case "PlayerToughness":
				eventPane.find("div[data-parent='" + event.parent + "']").append(event.toHTML());
			break;
		case "RollContested":
			if ((dispatchMessages) && (event.player == character.name)) {
				forcePlayerRoll("Roll " + getQuality(event.key).name + " vs. " + nameDecode(event.name) + "!", event.comment, { npc: event.name, key: event.key, parent: event.id, callback: resolveContestedRoll });
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
					forcePlayerRoll("Roll " + getQuality(event.key1).name + " vs. " + nameDecode(event.player2) + "!", event.comment, { target: event.player2, key: event.key1, parent: event.id, callback: resolvePlayerContestedRoll });
				} else if (event.player2 == character.name) {
					forcePlayerRoll("Roll " + getQuality(event.key2).name + " vs. " + nameDecode(event.player1) + "!", event.comment, { target: event.player1, key: event.key2, parent: event.id, callback: resolvePlayerContestedRoll });
				}
			}
			break;
		default:
			if (GM_EVENTS.indexOf(event.eventType) < 0) {
				eventPane.append(event.toHTML());
			}
	}

	var queue = $("#eventPane");
	queue.scrollTop(queue[0].scrollHeight);
}

function resolveContestedRoll() {
	dbPushEvent(new EventContestedResponse(character.name, forcedRoll));
}

function resolvePlayerContestedRoll() {
	dbPushEvent(new EventPlayerContestedRollSubordinate(character.name, forcedRoll));
}

function resolveNPCAttack() {
	dbPushEvent(new EventPlayerDefense(character.name, forcedRoll));
}

function resolveNPCDamage() {
	dbPushEvent(new EventPlayerToughnessRoll(character.name, forcedRoll));
}

function resolvePlayerDamage() {
	dbPushEvent(new EventPlayerDamageRoll(character.name, forcedRoll));
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

function loadChar(event) {
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
		Object.setPrototypeOf(character, CharacterSheet.prototype);
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
		eventPane.empty();
		$("#charList, #npcList").empty();
		currentSession = result;
		Object.setPrototypeOf(currentSession, RoleplaySession.prototype);

		for (i = 0; i < currentSession.statuses.length; i++) {
			addPlayerToList(currentSession.characters[i]);
			Object.setPrototypeOf(currentSession.statuses[i], CharacterStatus.prototype);
			setPlayerStatus(i, currentSession.statuses[i].injuryLevel);
		}

		for (i = 0; i < currentSession.npcs.length; i++) {
			Object.setPrototypeOf(currentSession.npcs[i], NPC.prototype);

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

function forcePlayerRoll(message, comment, rollInfo) {
	if (!dispatchMessages) {
		return;
	} else if ((forcedRoll) || ($("#modalBG").hasClass("show"))) {
		dbPushEvent(new EventPlayerBusy(character.name, rollInfo.parent));
		return;
	}

	/* npc, key, attackType, parent, callback */
	forcedRoll = rollInfo;

	character.makeRoll(forcedRoll);

	if (lazyMode) {
		forcedRoll.comment = "Lazy mode.";
		acceptForcedRoll();
	} else {
		$("#forceRollComment").val("");
		$("#modalBG").addClass("show");
		$("#rollModal").addClass("show");
		$("#forceRollText").text(message);
		$("#forceRollGMComment").text(comment);
		$("#forceRollGMComment").toggleClass("show", !!(comment));
		$("#rollModal button, #rollModal input").removeAttr("disabled");
		$("#cancelForceRoll").toggle(!!forcedRoll.playerInitiated);
		$("#forceRollContinue").hide();
	}
}

function doForcedRoll(event) {
	event.preventDefault();
	var rollPanel = $("#forceRollPanel");
	var chosenRoll = 0;

	$(this).parent().find("button, input").attr("disabled", "true");
	forcedRoll.comment = $("#forceRollComment").val();

	rollPanel.append("<div><div>" + forcedRoll.rolls[0] + "</div></div>");

	if (forcedRoll.rolls.length > 1) {
		var curRoll = 1;

		if (forcedRoll.resist) {
			rollPanel.append("<div class='good resist'><div>" + forcedRoll.rolls[curRoll] + "</div></div>");
			curRoll++;
		}

		if (forcedRoll.lucky) {
			rollPanel.append("<div class='good lucky'><div>" + forcedRoll.rolls[curRoll] + "</div></div>");
			curRoll++;
		}

		if (forcedRoll.weak) {
			rollPanel.append("<div class='bad weak'><div>" + forcedRoll.rolls[curRoll] + "</div></div>");
			curRoll++;
		}

		if (forcedRoll.unlucky) {
			rollPanel.append("<div class='bad unlucky'><div>" + forcedRoll.rolls[curRoll] + "</div></div>");
			curRoll++;
		}

		setTimeout(function() { rollPanel.addClass("double"); }, 1000);

		if (forcedRoll.rolls.length > 2) {
			setTimeout(function() { rollPanel.addClass("triple"); }, 3000);
		}

		chosenRoll = forcedRoll.rolls.indexOf(forcedRoll.result);
		setTimeout(finalizeForcedRoll, 2000 * forcedRoll.rolls.length - 500);
	} else {
		setTimeout(finalizeForcedRoll, 1000);
	}

	if (chosenRoll > -1) {
		$("#forceRollPanel > div:nth-of-type(" + (chosenRoll + 1) + ")").attr("chosen", "true");
	}

	
}

function finalizeForcedRoll() {
	$("#forceRollPanel > div:not([chosen])").addClass("discarded");
	$("#forceRollContinue").show();
}

function acceptForcedRoll() {
	forcedRoll.callback();
	forcedRoll = null;
	hidePopup();
	$("#forceRollPanel").removeClass("double triple").empty();
}

function cancelPlayerRoll() {
	forcedRoll = null;
	hidePopup();
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
$("#makeForceRoll").on("click", doForcedRoll);
$("#forceRollContinue").on("click", acceptForcedRoll);
$("#cancelForceRoll").on("click", cancelPlayerRoll);
$("#errorButton, #sessionSelectionCancel, #profileDone").on("click", hidePopup);

initializePage();