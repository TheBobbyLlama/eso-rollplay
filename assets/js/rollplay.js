const statusClasses = [ "statusUnhurt", "statusInjured", "statusCritical", "statusIncapacitated", "statusHidden" ];
const transformRevertLabel = "End Transformation";
const playerInputSelector = "#charStatus input, #charStatus select, #charStatus button, #rollControls button, #rollControls input, #rollControls select, #summonControls button, #summonControls input, #summonControls select";

var character = new CharacterSheet();
var currentSession;
var dispatchMessages = false;  // Flag used differentiating between archived and freshly received messages.
var forcedRoll; // Holds data for the roll we're making.
var lazyMode = false; // Autoroll all forced rolls.

var markupNPCTargets = "";

var eventPane = $("#eventPane");

function initializePage() {
	initializeDB();

	$("input[name='charName']").val(localStorage.getItem("ESORP[name]"));
	$("input[name='charPlayer']").val(localStorage.getItem("ESORP[player]"));
	for (var i = 0; i < EQUIPPED_WEAPON.length; i++) {
		$("#playerWeapon").append("<option>" + EQUIPPED_WEAPON[i].weapon + "</option>");
	}

	for (var i = 0; i < WORN_ARMOR.length; i++) {
		$("#playerArmor").append("<option>" + getQuality(WORN_ARMOR[i]).name + "</option>");
	}

	$(playerInputSelector).attr("disabled", "true");


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

function changeWeapon(event) {
	var newWeapon = $("#playerWeapon").prop("selectedIndex");
	currentSession.statuses[currentSession.characters.indexOf(character.name)].equippedWeapon = newWeapon;
	$("#rollSelect").val(EQUIPPED_WEAPON[newWeapon].quality);

	if ((event) && (dispatchMessages)) {
		dbPushEvent(new EventPlayerWeapon(character.name, newWeapon));
	}
}

function changeArmor() {
	var newArmor = $("#playerArmor").prop("selectedIndex");
	currentSession.statuses[currentSession.characters.indexOf(character.name)].wornArmor = newArmor;

	if (dispatchMessages) {
		dbPushEvent(new EventPlayerArmor(character.name, newArmor));
	}
}

function requestTransformation() {
	var transformation = $(this).attr("data-key");

	dbPushEvent(new EventPlayerRequestTransform(character.name, transformation));
}

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
			if (npcTemplates[i].allowSummon) {
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

function requestSummon() {
	var template = $("#summonTemplate").val();
	var summonName = $("#summonName").val();

	forcePlayerRoll("Make a Conjuration roll to summon a " + template + ".", "", { key: "Conjuration", playerInitiated: true, summonTemplate: template, summonName, callback: resolveSummonRequest });
	$("#summonName").val("");
}

function resolveSummonRequest() {
	dbPushEvent(new EventPlayerRequestSummon(character.name, forcedRoll));
}

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

function summonDismiss() {
	var playerIndex = currentSession.characters.indexOf(character.name);

	if (currentSession.statuses[playerIndex].summon) {
		dbPushEvent(new EventPlayerSummonDismiss(character.name, currentSession.statuses[playerIndex].summon.template, currentSession.statuses[playerIndex].summon.name));
	} else {
		updatePlayerDisplay();
		setSummonControls();
	}
}

function performRoll() {
	var key = $("#rollSelect").val();

	forcePlayerRoll("Make a roll using " + getQuality(key).name + ".", "", { key, playerInitiated: true, callback: resolveRoll });
}

function resolveRoll() {
	dbPushEvent(new EventRoll(character.name, forcedRoll));
}

function performAttack() {
	var target = nameEncode($("#rollTarget").val());
	var key = $("#rollSelect").val();

	forcePlayerRoll("Make an attack using " + getQuality(key).name + ".", "", { target, key, playerInitiated: true, callback: resolveAttack });
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

function updatePlayerDisplay() {
	if (!currentSession) { return; }

	var charList = $("#charList");

	charList.empty();


	for (var i = 0; i < currentSession.characters.length; i++) {
		var markup = "<li><div class='" + statusClasses[currentSession.statuses[i].injuryLevel] + "' title='Click to view profile'>" + currentSession.characters[i] + "</div>";

		if (currentSession.statuses[i].summon) {
			markup += "<div class='" + statusClasses[currentSession.statuses[i].summon.injuryLevel] + "'" + ((currentSession.statuses[i].summon.name) ? " title='" + currentSession.statuses[i].summon.template + "'" : "") + ">" + (currentSession.statuses[i].summon.name || currentSession.statuses[i].summon.template) + "</div>";
		}

		charList.append(markup + "</li>");
	}
}

function updateNPCDisplay() {
	if (!currentSession) { return; }

	var npcList = $("#npcList");

	npcList.empty();
	markupNPCTargets = "";

	for (var i = 0; i < currentSession.npcs.length; i++) {
		npcList.append("<li class='" + statusClasses[currentSession.npcs[i].status] + "'>" + currentSession.npcs[i].name + "</li>");

		if (currentSession.npcs[i].status < statusClasses.length - 1) {
			markupNPCTargets += "<option>" + currentSession.npcs[i].name + "</option>";
		}
	}

	$("select[npc-target]").html(markupNPCTargets);
}

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
				updatePlayerDisplay();
			}
			break;
		case "Close":
			eventPane[0].textContent = "";
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
					forcePlayerRoll("You hit " + nameDecode(event.target) + "!  Roll for damage!", event.comment, { npc: event.target, key: getQuality(event.key).governing, attackType: event.attackType, parent: event.parent, callback: resolvePlayerDamage });
				}
			} else {
				$("#" + event.parent).append(event.toHTML());
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
				forcePlayerRoll("Roll " + getQuality(event.key).name + "!", event.comment, { key: event.key, parent: event.id, callback: resolveRoll });
			}
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
	var weaponIndex = currentSession.statuses[currentSession.characters.indexOf(character.name)].equippedWeapon;

	if (EQUIPPED_WEAPON[weaponIndex].useBlock) {
		forcedRoll.useBlock = true;
		forcedRoll.blockMod = character.getBlockModifier();
	}

	dbPushEvent(new EventPlayerDefense(character.name, forcedRoll));
}

function resolveNPCDamage() {
	var armorIndex = currentSession.statuses[currentSession.characters.indexOf(character.name)].wornArmor;

	forcedRoll.armor = armorIndex;
	forcedRoll.armorMod = character.getArmorModifier(armorIndex);

	dbPushEvent(new EventPlayerToughnessRoll(character.name, forcedRoll));
}

function resolvePlayerDamage() {
	var weaponIndex = currentSession.statuses[currentSession.characters.indexOf(character.name)].equippedWeapon;

	if (EQUIPPED_WEAPON[weaponIndex].useBlock) {
		forcedRoll.shieldPenalty = true;
		forcedRoll.shieldMod = -2;
	}

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
	$("#charStatus button").remove();
	$(playerInputSelector).attr("disabled", "true");
	dbLoadCharacter(tmpName, characterLoaded)
}

function characterLoaded(loadMe) {
	if ((loadMe.val()) && (dbSanitize(loadMe.val().player) == dbSanitize($("input[name='charPlayer']").val()))) {
		character = loadMe.val();
		Object.setPrototypeOf(character, CharacterSheet.prototype);
		localStorage.setItem("ESORP[name]", nameDecode(character.name));
		localStorage.setItem("ESORP[player]", nameDecode(character.player));

		var targetTransform = supernaturalTransformations.find(element => element.parent === character.supernatural);

		if (targetTransform) {
			var transformName = targetTransform.template.name;
			$("#charStatus").append("<button type='button' id='transformButton' data-key='" + transformName + "' disabled>Transform into " + transformName + "</button>");
		}

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

function eventSystemLoaded(loadMe) {
	$(playerInputSelector).removeAttr("disabled");
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
		if (forcedRoll.playerInitiated) {
			$("#rollModal h3").text("Make a Roll");
		} else {
			$("#rollModal h3").text("Roll Needed!");
		}

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

	if (navigator.vibrate) {
		navigator.vibrate(200);
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
$("#makeForceRoll").on("click", doForcedRoll);
$("#forceRollContinue").on("click", acceptForcedRoll);
$("#cancelForceRoll").on("click", cancelPlayerRoll);
$("#errorButton, #sessionSelectionCancel, #profileDone").on("click", hidePopup);

initializePage();