var footer = $("footer");

const ATTRIBUTE_POINT_LIMIT = 10;
const SKILL_POINT_BASE = 10;
var attrSpent = 0;
var skillSpent = 0;
var character = new CharacterSheet();

function initializePage() {
	var i;

	initializeDB();

	fillSection("attributes", attributes);
	fillSection("skillsCombat", skillsCombat);
	fillSection("skillsMagic", skillsMagic);
	fillSection("skillsGeneral", skillsGeneral);
	fillSection("skillsCrafting", skillsCrafting);
	fillSection("skillsKnowledge", skillsKnowledge);

	var raceSelect = $("select[name='charRace']");
	var superSelect = $("select[name='charSupernatural']");
	var classSelect = $("select[name='charClass']");

	character.player = localStorage.getItem("ESORP[player]");
	$("input[name='charPlayer']").val(character.player);

	for (i = 0; i < races.length; i++) {
		raceSelect.append("<option>" + races[i].name + "</option>")
	}

	for (i = 0; i < supernaturals.length; i++) {
		superSelect.append("<option>" + supernaturals[i].name + "</option>")
	}

	for (i = 0; i < classes.length; i++) {
		classSelect.append("<option>" + classes[i] + "</option>")
	}

	// Event handler isn't catching our default race, so force it!
	raceSelect.trigger("change");
}

function fillSection(sectionName, elements) {
	var parent = $("#" + sectionName);

	for (var i = 0; i < elements.length; i++) {
		parent.append("<div data-key='" + elements[i].key + "'>" +
						"<label for='" + elements[i].key + "'" + ((elements[i].difficulty) ? " title='Difficulty: " + skillDifficultyNames[elements[i].difficulty] + "'" : "") +">" + elements[i].name + (((elements[i].difficulty === undefined) && (elements[i].governing)) ? " (" + elements[i].governing.substring(0, 3) + ") " : "") + " [<span name='curValue'>" + character.getItem(elements[i].key) + "</span>]</label>" +
						"<input type='range' min='" + elements[i].min + "' max='" + elements[i].max + "' value='0' name='" + elements[i].key + "' />" +
					"</div>");
	}
}

function changeName() {
	character.name = nameEncode($(this).val().trim());
	updateCharacterSheet();
}

function changePlayer() {
	character.player = nameEncode($(this).val().trim().replace(/@/g, ""));
	localStorage.setItem("ESORP[player]", character.player);
	updateCharacterSheet();
}

function changeRace() {
	character.race = $(this).val();
	updateCharacterSheet();
}

function changeSex() {
	character.sex = $(this).prop("selectedIndex");
	updateCharacterSheet();
}

function changeSupernatural() {
	character.supernatural = $(this).val();
	updateCharacterSheet();
}

function changeClass() {
	character.class = $(this).val();
	updateCharacterSheet();
}

function changeSlider() {
	var itemKey = $(this).closest("*[data-key]").attr("data-key");

	if (attributes.find(element => element.key == itemKey)) {
		character.attributes[itemKey] = parseInt($(this).val());

		if (!character.attributes[itemKey]) {
			delete character.attributes[itemKey];
		}
	} else {
		character.skills[itemKey] = parseInt($(this).val()) - character.getSkill(itemKey, true);

		if (!character.skills[itemKey]) {
			delete character.skills[itemKey];
		}
	}

	updateCharacterSheet();
}

function updateCharacterSheet() {
	for (var idx = 0; idx < masterQualityList.length; idx++) {
		var workingList = masterQualityList[idx];

		for(var i = 0; i < workingList.length; i++) {
			var tmpVal;

			if (attributes.find(element => element.key == workingList[i].key)) {
				tmpVal = character.getItem(workingList[i].key) - character.getItem(workingList[i].key, true);
				$("div[data-key='" + workingList[i].key + "'] input[type='range']").attr("title", tmpVal).val(tmpVal);
				
			} else {
				var costLevel = costForNextSkillRank(workingList[i].key, character.getSkill(workingList[i].key));
				var costClass = "";

				if (costLevel === 2) {
					costClass = "costIncreased";
				} else if ((costLevel === 3) || (costLevel === 4)) {
					costClass = "costHigh";
				} else if (costLevel > 4) {
					costClass = "costExtreme";
				}

				tmpVal = character.getItem(workingList[i].key);

				// Correct value overflows.
				if (tmpVal > workingList[i].max) {
					character.skills[workingList[i].key] = workingList[i].max - character.getItem(workingList[i].key, true);
					tmpVal = workingList[i].max;
				}

				$("div[data-key='" + workingList[i].key + "'] input[type='range']").attr("min", character.getItem(workingList[i].key, true)).val(tmpVal);
				$("div[data-key='" + workingList[i].key + "'] label[for='" + workingList[i].key + "']").attr("class", costClass);
			}

			$("div[data-key='" + workingList[i].key + "'] span[name='curValue']").text(character.getItem(workingList[i].key));
		}
	}

	calculateTotalPoints();
	character.print("printout");
}

function calculateTotalPoints() {
	var i;
	var result = true;
	var total = 0;
	var max = ATTRIBUTE_POINT_LIMIT;
	var attrDisplay = $("#attributePoints");
	var skillDisplay = $("#skillPoints");
	var workingList = Object.entries(character.attributes);

	for (i = 0; i < workingList.length; i++) {
		total += workingList[i][1];
	}

	attrDisplay.text(total + "/" + max);
	attrDisplay.toggleClass("redFlag", (total > max));
	result &= !(total > max);

	total = 0;
	max = SKILL_POINT_BASE + 2 * character.getAttribute("Intelligence");
	workingList = Object.entries(character.skills);

	for (i = 0; i < workingList.length; i++) {
		var curRank = character.getSkill(workingList[i][0]);

		for (var x = character.getSkill(workingList[i][0], true); x < curRank; x++) {
			total += costForNextSkillRank(workingList[i][0], x);
		}
	}

	skillDisplay.text(total + "/" + max);
	skillDisplay.toggleClass("redFlag", (total > max));
	result &= !(total > max);

	return result;
}

function costForNextSkillRank(key, rank) {
	var skillObj = getQuality(key);
	var governing = skillObj.governing || "Intelligence";
	var difficulty = skillObj.difficulty || 0;
	
	rank -= character.getSkill(key, true);

	if (rank < 0) {
		return 0;
	} else {
		return (1 << Math.max(Math.floor((rank - character.getAttributeSkillModifier(governing) + difficulty) / 3), 0));
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

function checkHighlight() {
	var helpKey = $(this).closest("*[data-key]").attr("data-key");

	if (helpKey) {
		var item = getQuality(helpKey);
		showFooter(item.description + ((item.difficulty) ? " (" + skillDifficultyNames[item.difficulty] + ")" : ""));
	} else {
		showFooter(null);
	}
}

function descriptionHelper() {
	var desc = $(this);

	showFooter("This is only a summary.  Please be brief! (" + desc.val().length + "/" + desc.prop("maxlength") + " characters)")
}

function leaveDescription() {
	showFooter(null);
}

function showFooter(message) {
	if (message) {
		footer.text(message);
		footer.addClass("shown");
	} else {
		footer.removeClass("shown");
	}
}

function showHelpPopup() {
	$("#modalBG").addClass("show");
	$("#helpModal").addClass("show");
}

function showErrorPopup(message) {
	$("#modalBG").addClass("show");
	$("#errorModal").addClass("show");
	$("#errorText").text(message);
}

function hideErrorPopup() {
	$("#modalBG").removeClass("show");
}

function saveChar() {
	if ((!character.name) || (!character.player)) {
		showErrorPopup("Please enter a character name and a player name.");
		return;
	}

	if (!calculateTotalPoints()) {
		showErrorPopup("You are over your point allotment.");
		return;
	}

	dbSaveCharacter(character, $("textarea[name='charBackground']").val(), charSaveSuccess, showErrorPopup);
}

function charSaveSuccess() {
	showFooter("Character saved successfully!");
}

function loadChar(event) {
	event.preventDefault();

	if ((!character.name) || (!character.player)) {
		console.log("bad");
		showErrorPopup("Please enter a character name and a player name.");
		return;
	}

	dbLoadCharacter(nameDecode(character.name), characterLoaded, descriptionLoaded);
}

function characterLoaded(loadMe) {
	if ((loadMe.val()) && (nameEncode(loadMe.val().player) == character.player)) {
		character = loadMe.val();
		Object.setPrototypeOf(character, new CharacterSheet());
		$("select[name='charRace']").val(character.race);
		$("select[name='charSex']").prop("selectedIndex", character.sex);
		$("select[name='charSupernatural']").val(character.supernatural);
		$("select[name='charClass']").val(character.class);
		$("textarea[name='charBackground']").val("");
		updateCharacterSheet();
	} else {
		showErrorPopup("Character not found.");
	}
}

function descriptionLoaded(loadMe) {
	if (loadMe.val()) {
		$("textarea[name='charBackground']").val(loadMe.val());
	}
}

$("#buttonHelp").on("click", showHelpPopup);
$("input[name='charName']").on("change", changeName);
$("input[name='charPlayer']").on("change", changePlayer);
$("select[name='charRace']").on("change", changeRace);
$("select[name='charSex']").on("change", changeSex);
$("select[name='charSupernatural']").on("change", changeSupernatural);
$("select[name='charClass']").on("change", changeClass);
$("#saveChar").on("click", saveChar);
$("#loadChar").on("click", loadChar);
$("section").on("input change", "input[type='range']", changeSlider);
$("#errorButton, #helpDone").on("click", hideErrorPopup);
$("#printout").on("dblclick", copyOutput);
$("textarea[name='charBackground']").on("focus, keydown", descriptionHelper);
$("textarea[name='charBackground']").on("blur", leaveDescription);
$("#main, #main div[id]").on("mouseenter mouseleave", "*", checkHighlight);

initializePage();