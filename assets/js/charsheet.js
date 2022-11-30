const footer = $("footer");

showdown.extension('Rollplay', showdownRollplay);
const shortDescription = createMDE("charBackground");
const oocInfo = createMDE("charOOCInfo", [ "quote", "link", "image" ]);
const biography = createMDE("charBiography");

const converter = new showdown.Converter({ openLinksInNewWindow: true, extensions: ["Rollplay"] });

const ATTRIBUTE_POINT_LIMIT = 10;
const SKILL_POINT_BASE = 10;
let attrSpent = 0;
let skillSpent = 0;
let character = new CharacterSheet();
let profile = {};

let userInfo = null;

/// Called on page startup.
async function initializePage(myUser) {
	if (!myUser) {
		showErrorPopup("User " + firebase.auth().currentUser.displayName + " not found!", divertToLogin);
		return;
	}

	let i;
	const inCharacter = localStorage.getItem("ESORP[character]");

	userInfo = myUser;
	character.player = userInfo.display;

	await localizePage();

	if (userInfo.gameMaster) {
		$("#npcPanel").removeClass("hideMe");
	}

	fillSection("attributes", attributes);
	fillSection("skillsCombat", skillsCombat);
	fillSection("skillsMagic", skillsMagic);
	fillSection("skillsGeneral", skillsGeneral);
	fillSection("skillsCrafting", skillsCrafting);
	fillSection("skillsKnowledge", skillsKnowledge);

	const raceSelect = $("select[name='charRace']");
	const backgroundSelect = $("select[name='charBackground']");
	const superSelect = $("select[name='charSupernatural']");
	const classSelect = $("select[name='charClass']");

	for (i = 0; i < races.length; i++) {
		raceSelect.append("<option value='" + races[i].key + "'>" + localize(races[i].name) + "</option>");
	}

	for (i = 0; i < backgrounds.length; i++) {
		backgroundSelect.append("<option value='" + backgrounds[i].key + "'>" + localize(backgrounds[i].name) + "</option>");
	}

	superSelect.append("<option value=''>" + localize("NOT_APPLICABLE") + "</option>")

	for (i = 1; i < supernaturals.length; i++) {
		superSelect.append("<option value='" + supernaturals[i].plainName +"'>" + localize(supernaturals[i].name) + "</option>")
	}

	for (i = 0; i < classes.length; i++) {
		classSelect.append("<option value='" + classes[i] + "'>" + localize(classes[i] ? "CLASS_" + classes[i].toUpperCase() : "") + "</option>")
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
	shortDescription.codemirror.refresh();
	oocInfo.codemirror.refresh();
	biography.codemirror.refresh();
}

/// Creates skill sliders for a given category.
function fillSection(sectionName, elements) {
	const parent = $("#" + sectionName);

	for (var i = 0; i < elements.length; i++) {
		parent.append("<div data-key='" + elements[i].key + "'>" +
						"<label for='" + elements[i].key + "'" + ((elements[i].difficulty) ? " title='" + localize("LABEL_DIFFICULTY") + " " + localize(skillDifficultyNames[elements[i].difficulty]) + "'" : "") +">" + localize(elements[i].name) + (((elements[i].difficulty === undefined) && (elements[i].governing)) ? " (" + localize(getQuality(elements[i].governing).name + "_ABBR") + ") " : "") + " [<span name='curValue'>" + character.getItem(elements[i].key) + "</span>]</label>" +
						"<input type='range' min='" + elements[i].min + "' max='" + elements[i].max + "' value='0' name='" + elements[i].key + "' />" +
					"</div>");
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

/// Handles name entry.
function changeName() {
	// » is a special character for summons!  Absolutely verboten in character names!
	const charName = $(this).val().trim().replace(/»/g, "");
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

/// Handles upbringing entry.
function changeBackground() {
	const tmpVal = $(this).val();

	if (tmpVal) {
		character.background = tmpVal;
	} else {
		delete character.background;
	}

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
	const itemKey = $(this).closest("*[data-key]").attr("data-key");

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
	for (let idx = 0; idx < masterQualityList.length; idx++) {
		const workingList = masterQualityList[idx];

		for(let i = 0; i < workingList.length; i++) {
			let tmpVal;

			if (attributes.find(element => element.key == workingList[i].key)) {
				tmpVal = character.getItem(workingList[i].key) - character.getItem(workingList[i].key, true);
				$("div[data-key='" + workingList[i].key + "'] input[type='range']").attr("title", tmpVal).val(tmpVal);
				
			} else {
				const costLevel = costForNextSkillRank(workingList[i].key, character.getSkill(workingList[i].key));
				let costClass = "";

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
	$("#printout").toggleClass("hideMe", ((!character.skills) || (!Object.entries(character.skills).length)));
}

/// Sums all skill/attribute points and sets display if they're over the limit.
function calculateTotalPoints() {
	const attrDisplay = $("#attributePoints");
	const skillDisplay = $("#skillPoints");
	
	let i;
	let result = true;
	let total = 0;
	let max = ATTRIBUTE_POINT_LIMIT;
	let workingList = Object.entries(character.attributes || {});

	for (i = 0; i < workingList.length; i++) {
		total += workingList[i][1];
	}

	attrDisplay.text(total + "/" + max);
	attrDisplay.toggleClass("redFlag", (total > max));
	result &= !(total > max);

	total = 0;
	max = SKILL_POINT_BASE + 2 * character.getAttribute("Intelligence");
	workingList = Object.entries(character.skills || {});

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
	const skillObj = getQuality(key);
	const governing = skillObj.governing || "Intelligence";
	const difficulty = skillObj.difficulty || 0;
	
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
	const printout = $("#printout");
	const range = document.createRange();
	range.selectNodeContents(printout[0]);
	const sel = window.getSelection();
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
	let root;

	if (checkMe.target) {
		root = $(checkMe.target);
	} else {
		root = $(checkMe);
	}

	const helpKey = root.closest("*[data-key]").attr("data-key");

	if (helpKey) {
		var item = getQuality(helpKey);
		showFooter(localize(item.name + "_DESCRIPTION") + ((item.difficulty) ? " (" + localize(skillDifficultyNames[item.difficulty]) + ")" : ""));
	} else {
		showFooter(null);
	}
}

/// Shows short description info on helper at the bottom of the screen.
function shortDescriptionHelper() {
	const desc = $(this);

	showFooter(localize("SHORT_DESCRIPTION_HELPER").replace(/CURRENT/, desc.val().length).replace(/MAX/, desc.prop("maxlength")));
}

/// Hides the helper when the short description is no longer being edited.
function leaveShortDescription() {
	const tmpDesc = $("textarea[name='charBackground']");
	showFooter(null);

	if (tmpDesc.val().length <= tmpDesc.prop("maxlength")) {
		tmpDesc.removeClass("redFlag");
		profile.description = htmlCleanup(tmpDesc.val());
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
	return url.match(/^(https?:\/\/)?[A-Za-z0-9-_]+\.[A-Za-z0-9-_.]+[A-Za-z0-9](\/[A-Za-z0-9-_]+)*\/[A-Za-z0-9-_.]+(\.[Bb][Mm][Pp]|\.[Gg][Ii][Ff]|\.[Jj][Pp][Gg]|\.[Pp][Nn][Gg])(\?[\w=&]+)*$/g);
}

function setImageUrl() {
	const urlField = $(this);
	const tmpUrl = urlField.val();
	const tryDisplay = displayImage(tmpUrl);

	if (tryDisplay) {
		profile.image = tmpUrl;
	} else {
		delete profile.image;
	}

	urlField.toggleClass("redFlag", !tryDisplay);
}

function displayImage(url) {
	const test = checkImageUrl(url || "");

	$("#charImage")[0].style.background = (test) ? "url('" + url + "')" : "";

	return !!test;
}

function setProfileField() {
	const tmpEl = $(this);
	const tmpName = tmpEl.attr("name");

	profile[tmpName] = tmpEl.val();
}

function setNPC() {
	const tmpEl = $(this);
	character.npc = tmpEl.prop("checked");
	updateCharacterSheet();
}

/// Shows OOC info helper at the bottom of the screen.
function oocInfoHelper() {
	const desc = $(this);

	showFooter(localize("OOC_INFO_HELPER").replace(/CURRENT/, desc.val().length).replace(/MAX/, desc.prop("maxlength")));
}

function leaveOOCInfo() {
	const tmpOOC = $("textarea[name='charOOCInfo']");
	showFooter(null);

	if (tmpOOC.val().length <= tmpOOC.prop("maxlength")) {
		tmpOOC.removeClass("redFlag");
		profile.oocInfo = htmlCleanup(tmpOOC.val());
	} else {
		tmpOOC.addClass("redFlag");
	}
}

function leaveBiography() {
	profile.biography = htmlCleanup($(this).val());
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

/// Utility function to make a Simple Markdown Editor with our desired configuration.
function createMDE(id, additional = []) {
    const taEl = document.getElementById(id);
    const result = new SimpleMDE({
        forceSync: true,
        hideIcons: [ "strikethrough", "preview", "side-by-side", "fullscreen", "guide", ...additional ],
        element: taEl
    });

    const cm = result.codemirror;
    cm.on("update", function() {
        taEl.value = cm.getValue();
		taEl.dispatchEvent(new Event('change'));
    });

    cm.on("blur", function() {
		taEl.dispatchEvent(new Event("blur"));
    });

    return result;
}

/// Displays the help modal.
function showHelpPopup() {
	$("#modalBG, #helpModal").addClass("show");
}

/// Displays the name selection modal.
function showNamePopup() {
	const myFrame = $("#nameModal iframe");
	const charRace = $("select[name='charRace']").val();

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

function previewHandler() {
	const field = $(this).attr("data-id");
	//showMarkdownPreview($("textarea[name='" + field + "'").val());
	if (field) {
		showMarkdownPreview(profile[field]);
	}
}

/// Displays Markdown preview.
function showMarkdownPreview(text) {
	$("#previewModal div").empty().append(converter.makeHtml(text));
	$("#modalBG, #previewModal").addClass("show");
}

/// Hides all modals.
function hidePopup() {
	$("#modalBG, #modalBG > div").removeClass("show");
}

/// Adds HTML encoding to a given string.
function htmlCleanup(text) {
	return text.replace(/[<>]/g, function(match) {
		switch (match)
		{
			case "<":
				return "&lt;";
			case ">":
				return "&gt;";
			default:
				return "!";
		}
	})
}

/// Saves the character to the database.
function saveChar(event) {
	event.preventDefault();

	if (!character.name) {
		showErrorPopup(localize("ERROR_CHARACTER_NAME"));
		return;
	}

	if (!calculateTotalPoints()) {
		showErrorPopup(localize("ERROR_OVER_POINT_ALOTMENT"));
		return;
	}

	dbLoadCharacter(character.name, checkCharacterSave);
}

function checkCharacterSave(loadMe) {
	const tmpChar = loadMe.val();

	if ((tmpChar) && (dbTransform(tmpChar.player) != dbTransform(userInfo.display))) {
		showErrorPopup(localize("ERROR_CHARACTER_OTHER_PLAYER").replace(/PLAYER/, nameDecode(tmpChar.player)));
	} else {
		dbSaveCharacter(character, profile, charSaveSuccess, showErrorPopup);
	}
}

/// Notifies the user on successful save.
function charSaveSuccess() {
	showFooter(localize("CHARACTER_SAVED_SUCCESSFULLY"));
}

/// Receives a character from the database.
function characterLoaded(loadMe) {
	const tmpChar = loadMe.val();

	if (tmpChar) {
		if (dbTransform(tmpChar.player) == dbTransform(userInfo.display)) {
			character = tmpChar;
			Object.setPrototypeOf(character, CharacterSheet.prototype);

			if (!character.attributes) {
				character.attributes = {};
			}
			
			if (!character.skills) {
				character.skills = {};
			}

			$("input[name='charName']").val(nameDecode(character.name));
			$("#nameDisplay").text(nameDecode(character.name));
			$("select[name='charRace']").val(character.race);
			$("select[name='charBackground']").val(character.background);
			$("select[name='charSex']").prop("selectedIndex", character.sex);
			$("select[name='charSupernatural']").val(character.supernatural);
			$("select[name='charClass']").val(character.class);
			$("textarea[name='charBackground']").val("");
			$("input[id='isNPC']").prop("checked", character.npc);
			updateCharacterSheet();
			finishDraw();
		} else {
			showErrorPopup(localize("ERROR_EDIT_CHARACTER_NOT_YOURS"), divertToDashboard);
		}
	} else {
		showErrorPopup(localize("CHARACTER_NOT_FOUND"), divertToDashboard);
	}
}

/// Receives a character profile from the database.
function profileLoaded(loadMe) {
	const myProfile = loadMe.val();

	if (myProfile) {
		profile = myProfile;
		$("input[name='imageUrl']").val(displayImage(profile.image)? profile.image : "");
		$("#characteristics input[name='aliases']").val(profile.aliases);
		$("#characteristics select[name='alignment']").val(profile.alignment);
		$("#characteristics select[name='birthsign']").val(profile.birthsign);
		$("#characteristics input[name='residence']").val(profile.residence);
		$("#characteristics input[name='organizations']").val(profile.organizations);
		$("#characteristics input[name='alliances']").val(profile.alliances);
		$("#characteristics input[name='enemies']").val(profile.enemies);
		$("#characteristics input[name='relationships']").val(profile.relationships);
		shortDescription.value(profile.description);
		oocInfo.value(profile.oocInfo);
		biography.value(profile.biography);
		showFooter(null);
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
$("select[name='charBackground']").on("change", changeBackground);
$("select[name='charSex']").on("change", changeSex);
$("select[name='charSupernatural']").on("change", changeSupernatural);
$("select[name='charClass']").on("change", changeClass);
$("#saveChar, #saveProfile").on("click", saveChar);
$("section").on("input change", "input[type='range']", changeSlider);
$("#main section > h3").on("click", expandContractSection);
$("#previewOk, #errorButton, #nameCancel, #helpDone").on("click", hidePopup);
$("#printout").on("dblclick", copyOutput);
$("textarea[name='charBackground']").on("focus, keydown, change", shortDescriptionHelper).on("blur", leaveShortDescription);
$("input[name='imageUrl']").on("focus", function() { $(this).removeClass("redFlag"); }).on("blur", setImageUrl);
$("#characteristics input, #characteristics select").on("blur, change", setProfileField);
$("input[id='isNPC']").on("change", setNPC);
$("textarea[name='charOOCInfo']").on("focus, keydown, change", oocInfoHelper).on("blur", leaveOOCInfo);
$("textarea[name='charBiography']").on("blur", leaveBiography);
$("#charBackgroundPreview, #charOOCPreview, #charBiographyPreview").on("click", previewHandler);
$("#main, #main div[id]").on("mouseenter mouseleave", "*", checkHighlight);
$("#nameModal iframe").on("load", bindIframeEvents);
$("#confirmCancel, #errorButton").on("click", hidePopup);