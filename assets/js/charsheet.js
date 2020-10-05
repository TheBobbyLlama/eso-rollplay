var footer = $("footer");

const ATTRIBUTE_POINT_LIMIT = 10;
const SKILL_POINT_BASE = 10;
var attrSpent = 0;
var skillSpent = 0;
var character = new CharacterSheet();

/// Called on page startup.
function initializePage() {
	var i;
	var tmpVal;

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
	changePlayer();

	for (i = 0; i < races.length; i++) {
		raceSelect.append("<option>" + races[i].name + "</option>")
	}

	superSelect.append("<option value=''>N/A</option>")

	for (i = 1; i < supernaturals.length; i++) {
		superSelect.append("<option>" + supernaturals[i].name + "</option>")
	}

	for (i = 0; i < classes.length; i++) {
		classSelect.append("<option>" + classes[i] + "</option>")
	}

	// Event handler isn't catching our default race, so force it!
	raceSelect.trigger("change");
}

/// Creates skill sliders for a given category.
function fillSection(sectionName, elements) {
	var parent = $("#" + sectionName);

	for (var i = 0; i < elements.length; i++) {
		parent.append("<div data-key='" + elements[i].key + "'>" +
						"<label for='" + elements[i].key + "'" + ((elements[i].difficulty) ? " title='Difficulty: " + skillDifficultyNames[elements[i].difficulty] + "'" : "") +">" + elements[i].name + (((elements[i].difficulty === undefined) && (elements[i].governing)) ? " (" + elements[i].governing.substring(0, 3) + ") " : "") + " [<span name='curValue'>" + character.getItem(elements[i].key) + "</span>]</label>" +
						"<input type='range' min='" + elements[i].min + "' max='" + elements[i].max + "' value='0' name='" + elements[i].key + "' />" +
					"</div>");
	}
}

/// Handles name entry.
function changeName() {
	// » is a special character for summons!  Absolutely verboten in character names!
	var charName = $(this).val().trim().replace(/»/g, "");
	$(this).val(charName);
	character.name = nameEncode(charName);
	updateCharacterSheet();
}

/// Handles player entry.
function changePlayer() {
	character.player = nameEncode($(this).val().trim().replace(/@/g, ""));
	localStorage.setItem("ESORP[player]", character.player);
	updateCharacterSheet();
}

/// Handles race entry.
function changeRace() {
	character.race = $(this).val();
	updateCharacterSheet();
}

/// Handles sex entry.
function changeSex() {
	character.sex = $(this).prop("selectedIndex");
	updateCharacterSheet();
}

/// Handles supernatural entry.
function changeSupernatural() {
	character.supernatural = $(this).val();
	updateCharacterSheet();
}

/// Handles class entry.
function changeClass() {
	character.class = $(this).val();
	updateCharacterSheet();
}

/// Handles slider movement.
function changeSlider() {
	var itemKey = $(this).closest("*[data-key]").attr("data-key");

	if (attributes.find(element => element.key == itemKey)) {
		character.attributes[itemKey] = parseInt($(this).val());

		if (!character.attributes[itemKey]) {
			delete character.attributes[itemKey];
		}
	} else {
		character.skills[itemKey] = parseInt($(this).val()) - character.getSkill(itemKey, true);

		if ((character.skills) && (!character.skills[itemKey])) {
			delete character.skills[itemKey];
		}
	}

	updateCharacterSheet();
	checkHighlight(this);
}

/// Tabulates character info and displays it.
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

/// Sums all skill/attribute points and sets display if they're over the limit.
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

/// Helper function to calculate skill cost as ranks increase.
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

/// Hooks events into name selection iframe.
function bindIframeEvents() {
	$(this).contents().find("#results").on("click", "button", selectGeneratedName);
}

/// Inserts name selection into character sheet.
function selectGeneratedName() {
	$("input[name='charName']").val($(this).text());
	changeName();
	hidePopup();
}

/// Hides or expands skill sections - only exposed on mobile.
function expandContractSection() {
	if (screen.width <= 575) {
		$(this).closest("section").toggleClass("expanded");
	}
}

/// Used on mouseover for helpers at the bottom of the screen.
function checkHighlight(checkMe) {
	var root;

	if (checkMe.target) {
		root = $(checkMe.target);
	} else {
		root = $(checkMe);
	}

	var helpKey = root.closest("*[data-key]").attr("data-key");

	if (helpKey) {
		var item = getQuality(helpKey);
		showFooter(item.description + ((item.difficulty) ? " (" + skillDifficultyNames[item.difficulty] + ")" : ""));
	} else {
		showFooter(null);
	}
}

/// Shows description info on helper at the bottom of the screen.
function descriptionHelper() {
	var desc = $(this);

	showFooter("This is only a summary.  Please be brief! (" + desc.val().length + "/" + desc.prop("maxlength") + " characters)")
}

/// Hides the helper when the description is no longer being edited.
function leaveDescription() {
	showFooter(null);
}

/// Shows a message in the helper at the bottom of the screen.
function showFooter(message) {
	if (message) {
		footer.text(message);
		footer.addClass("shown");
	} else {
		footer.removeClass("shown");
	}
}

/// Displays the help modal.
function showHelpPopup() {
	$("#modalBG, #helpModal").addClass("show");
}

/// Displays the name selection modal.
function showNamePopup() {
	const myFrame = $("#nameModal iframe");
	const url = "namegenerator.html?race=" + $("select[name='charRace']").val() + "&sex=" + $("select[name='charSex']").val();

	if (myFrame.attr("src") != url) {
		myFrame.attr("src", url);
	}

	$("#modalBG, #nameModal").addClass("show");
}

/// Displays the error modal.
function showErrorPopup(message) {
	$("#modalBG, #errorModal").addClass("show");
	$("#errorText").text(message);
}

/// Hides all modals.
function hidePopup() {
	$("#modalBG, #modalBG > div").removeClass("show");
}

/// Saves the character to the database.
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

/// Notifies the user on successful save.
function charSaveSuccess() {
	showFooter("Character saved successfully!");
}

/// Requests a character from the database.
function loadChar(event) {
	event.preventDefault();

	if ((!character.name) || (!character.player)) {
		showErrorPopup("Please enter a character name and a player name.");
		return;
	}

	dbLoadCharacter(nameDecode(character.name), characterLoaded, descriptionLoaded);
}

/// Receives a character from the database.
function characterLoaded(loadMe) {
	if ((loadMe.val()) && (dbTransform(nameEncode(loadMe.val().player)) == dbTransform(character.player))) {
		character = loadMe.val();
		Object.setPrototypeOf(character, CharacterSheet.prototype);
		$("input[name='charName']").val(nameDecode(character.name));
		$("input[name='charPlayer']").val(nameDecode(character.player));
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

/// Receives a character description from the database.
function descriptionLoaded(loadMe) {
	if (loadMe.val()) {
		$("textarea[name='charBackground']").val(loadMe.val());
	}
}

/// Event registration.
$("#buttonHelp").on("click", showHelpPopup);
$("input[name='charName']").on("change", changeName);
$("#generateName").on("click", showNamePopup);
$("input[name='charPlayer']").on("change", changePlayer);
$("select[name='charRace']").on("change", changeRace);
$("select[name='charSex']").on("change", changeSex);
$("select[name='charSupernatural']").on("change", changeSupernatural);
$("select[name='charClass']").on("change", changeClass);
$("#saveChar").on("click", saveChar);
$("#loadChar").on("click", loadChar);
$("section").on("input change", "input[type='range']", changeSlider);
$("#main section > h3").on("click", expandContractSection);
$("#errorButton, #nameCancel, #helpDone").on("click", hidePopup);
$("#printout").on("dblclick", copyOutput);
$("textarea[name='charBackground']").on("focus, keydown", descriptionHelper);
$("textarea[name='charBackground']").on("blur", leaveDescription);
$("#main, #main div[id]").on("mouseenter mouseleave", "*", checkHighlight);
$("#nameModal iframe").on("load", bindIframeEvents);

initializePage();