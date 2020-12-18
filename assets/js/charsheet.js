var userInfo = null;
var footer = $("footer");

const ATTRIBUTE_POINT_LIMIT = 10;
const SKILL_POINT_BASE = 10;
var attrSpent = 0;
var skillSpent = 0;
var character = new CharacterSheet();
var profile = {};

/// Called on page startup.
function initializePage(myUser) {
	if (!myUser) {
		showErrorPopup("User " + firebase.auth().currentUser.displayName + " not found!", divertToLogin);
		return;
	}

	var i;
	var inCharacter = localStorage.getItem("ESORP[character]");

	userInfo = myUser;
	character.player = userInfo.display;

	fillSection("attributes", attributes);
	fillSection("skillsCombat", skillsCombat);
	fillSection("skillsMagic", skillsMagic);
	fillSection("skillsGeneral", skillsGeneral);
	fillSection("skillsCrafting", skillsCrafting);
	fillSection("skillsKnowledge", skillsKnowledge);

	var raceSelect = $("select[name='charRace']");
	var superSelect = $("select[name='charSupernatural']");
	var classSelect = $("select[name='charClass']");

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

	raceSelect.trigger("change");

	if (inCharacter) {
		$("#nameEntry").remove();
		$("#saveChar").removeAttr("disabled");
		dbLoadCharacter(inCharacter, characterLoaded, profileLoaded);
	} else {
		$("#nameDisplay").remove();
		$("#nameEntry").removeClass("hideMe");
		finishDraw();
	}
}

function finishDraw() {
	$("#loading").remove();
	$("body > *").removeClass("hideMe");
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

/// Handles name entry.
function changeName() {
	// » is a special character for summons!  Absolutely verboten in character names!
	var charName = $(this).val().trim().replace(/»/g, "");
	$(this).val(charName);
	character.name = nameEncode(charName);

	if (charName) {
		$("#saveChar").removeAttr("disabled");
	} else {
		$("#saveChar").attr("disabled", "true");
	}

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

/// Shows short description info on helper at the bottom of the screen.
function shortDescriptionHelper() {
	var desc = $(this);

	showFooter("This is only a summary.  Please be brief! (" + desc.val().length + "/" + desc.prop("maxlength") + " characters)")
}

/// Hides the helper when the short description is no longer being edited.
function leaveShortDescription() {
	var tmpDesc = $("textarea[name='charBackground']");
	showFooter(null);

	if (tmpDesc.val().length <= tmpDesc.prop("maxlength")) {
		tmpDesc.removeClass("redFlag");
		profile.description = tmpDesc.val();
	} else {
		tmpDesc.addClass("redFlag");
	}
}

/// Checks image url vs. a regex.
function checkImageUrl(url) {
	// Supports:
	// - http: or https: prefix
	// - BMP, GIF, JPG, or PNG (case insensitive)
	// - Query params (might be there if coming from Github)
	return url.match(/^(https?:\/\/)?[A-Za-z0-9-_]+\.[A-Za-z0-9-_.]+[A-Za-z0-9]+\/[A-Za-z0-9-_/]+(\.[Bb][Mm][Pp]|\.[Gg][Ii][Ff]|\.[Jj][Pp][Gg]|\.[Pp][Nn][Gg])(\?[\w=&]+)*$/g);
}

function setImageUrl() {
	var tmpUrl = $(this).val();
	profile.image = displayImage(tmpUrl) ? tmpUrl : profile.image;
}

function displayImage(url) {
	var test = checkImageUrl(url);

	$("#charImage")[0].style.background = (test) ? "url('" + url + "')" : "";
	$("input[name='imageUrl']").toggleClass("redFlag", !test);

	return !!test;
}

function setProfileField() {
	var tmpEl = $(this);
	var tmpName = tmpEl.attr("name");

	profile[tmpName] = tmpEl.val();
}

function leaveBiography() {
	profile.biography = $(this).val();
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
	var charRace = $("select[name='charRace']").val();

	if (charRace.indexOf(" (") > -1) {
		charRace = charRace.substring(0, charRace.indexOf(" ("));
	}

	const url = "namegenerator.html?race=" + charRace + "&sex=" + $("select[name='charSex']").val();

	if (myFrame.attr("src") != url) {
		myFrame.attr("src", url);
	}

	$("#modalBG, #nameModal").addClass("show");
}

/// Displays the error modal.
function showErrorPopup(message, callback=null) {
	$("#modalBG, #errorModal").addClass("show");
	$("#errorText").text(message);
	$("#errorButton").off("click").on("click", hidePopup);
	
	if (callback) {
		$("#errorButton").on("click", callback);
	}
}

/// Displays confirm modal.
function showConfirmPopup(message, callback) {
	$("#modalBG, #confirmModal").addClass("show");
	$("#confirmText").html(message);
	$("#confirmOk").off("click").on("click", callback);
}

/// Hides all modals.
function hidePopup() {
	$("#modalBG, #modalBG > div").removeClass("show");
}

/// Saves the character to the database.
function saveChar(event) {
	event.preventDefault();

	if (!character.name) {
		showErrorPopup("Please enter a character name.");
		return;
	}

	if (!calculateTotalPoints()) {
		showErrorPopup("You are over your point allotment.");
		return;
	}

	dbLoadCharacter(character.name, checkCharacterSave);
}

function checkCharacterSave(loadMe) {
	var tmpChar = loadMe.val();

	if ((tmpChar) && (dbTransform(tmpChar.player) != dbTransform(userInfo.display))) {
		showErrorPopup("This character has already been created by another player! (" + nameDecode(tmpChar.player) + ")");
	} else {
		dbSaveCharacter(character, profile, charSaveSuccess, showErrorPopup);
	}
}

/// Notifies the user on successful save.
function charSaveSuccess() {
	showFooter("Character saved successfully! You may return to the dashboard.");
}

/// Receives a character from the database.
function characterLoaded(loadMe) {
	var tmpChar = loadMe.val();
	if (tmpChar) {
		if (dbTransform(tmpChar.player) == dbTransform(userInfo.display)) {
			character = tmpChar;
			Object.setPrototypeOf(character, CharacterSheet.prototype);
			$("input[name='charName']").val(nameDecode(character.name));
			$("#nameDisplay").text(nameDecode(character.name));
			$("select[name='charRace']").val(character.race);
			$("select[name='charSex']").prop("selectedIndex", character.sex);
			$("select[name='charSupernatural']").val(character.supernatural);
			$("select[name='charClass']").val(character.class);
			$("textarea[name='charBackground']").val("");
			updateCharacterSheet();
			finishDraw();
		} else {
			showErrorPopup("You cannot edit a character that is not yours!", divertToDashboard);
		}
	} else {
		showErrorPopup("Character not found.", divertToDashboard);
	}
}

/// Receives a character profile from the database.
function profileLoaded(loadMe) {
	var myProfile = loadMe.val();

	if (myProfile) {
		profile = myProfile;
		$("textarea[name='charBackground']").val(profile.description);
		$("input[name='imageUrl']").val(displayImage(profile.image)? profile.image : "");
		$("#characteristics select[name='alignment']").val(profile.alignment);
		$("#characteristics select[name='birthsign']").val(profile.birthsign);
		$("#characteristics input[name='residence']").val(profile.residence);
		$("#characteristics input[name='organizations']").val(profile.organizations);
		$("#characteristics input[name='alliances']").val(profile.alliances);
		$("#characteristics input[name='relationships']").val(profile.relationships);
		$("textarea[name='charBiography']").val(profile.biography);
	}
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
$("#buttonHelp").on("click", showHelpPopup);
$("input[name='charName']").on("change", changeName);
$("#generateName").on("click", showNamePopup);
$("select[name='charRace']").on("change", changeRace);
$("select[name='charSex']").on("change", changeSex);
$("select[name='charSupernatural']").on("change", changeSupernatural);
$("select[name='charClass']").on("change", changeClass);
$("#saveChar, #saveProfile").on("click", saveChar);
$("section").on("input change", "input[type='range']", changeSlider);
$("#main section > h3").on("click", expandContractSection);
$("#errorButton, #nameCancel, #helpDone").on("click", hidePopup);
$("#printout").on("dblclick", copyOutput);
$("textarea[name='charBackground']").on("focus, keydown", shortDescriptionHelper).on("blur", leaveShortDescription);
$("input[name='imageUrl']").on("focus", function() { $(this).removeClass("redFlag"); }).on("blur", setImageUrl);
$("#characteristics input, #characteristics select").on("blur, change", setProfileField);
$("textarea[name='charBiography']").on("blur", leaveBiography);
$("#main, #main div[id]").on("mouseenter mouseleave", "*", checkHighlight);
$("#nameModal iframe").on("load", bindIframeEvents);
$("#confirmCancel, #errorButton").on("click", hidePopup);