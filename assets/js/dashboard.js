var userInfo = null;
var activeChar;
var characterCache = {};

var taskHolder = $("#taskHolder");

showdown.extension('Rollplay', showdownRollplay);
var converter = converter = new showdown.Converter({ openLinksInNewWindow: true, extensions: ["Rollplay"] });

async function initializePage(myUser) {
	if (!myUser) {
		showErrorPopup("User " + firebase.auth().currentUser.displayName + " not found!", divertToLogin);
		return;
	}

	userInfo = myUser;

	await localizePage();

	if (!userInfo.numericDisplay) {
		showNumericDisplayPopup();
	} else {
		finalizeInitialization();
	}
}

function finalizeInitialization() {
	createWelcomeMessage();
	populateCharacterList();

	fillTaskHolder();

	$("#loading").remove();
	$("#characterCenter, #miscTasks").removeClass("hideMe");
}

function createWelcomeMessage() {
	$("#welcomeHeader").text(localize("WELCOME_MESSAGE").replace(/USER/, userInfo.display.replace(/^@/, "")));
}

function fillTaskHolder() {
	taskHolder.empty();

	if (userInfo.gameMaster) {
		taskHolder.append("<button type='button' id='gmScreen' data-localization-key='GM_SCREEN'>" + localize("GM_SCREEN") + "</button>")
	}

	taskHolder.append("<button type='button' id='rpHelper' data-localization-key='RP_HELPER'>" + localize("RP_HELPER") + "</button>");
	taskHolder.append("<button type='button' id='profileViewer' data-localization-key='BROWSE_CHARACTERS'>" + localize("BROWSE_CHARACTERS") + "</button>");
	taskHolder.append("<button type='button' id='nameGenerator' data-localization-key='GENERATE_LORE_FRIENDLY_NAMES'>" + localize("GENERATE_LORE_FRIENDLY_NAMES") + "</button>");
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

function createStory() {
	localStorage.setItem("ESORP[character]", getActiveCharacterDisplayName());
	location.replace("./write.html");
}

function previewStory() {
	var story = $(this).attr("data-story");

	hidePopup();

	if (findIndex > -1) {
		var storyText = characterCache[activeChar].storyData[dbTransform(story)].text;

		if (storyText) {
			showStoryPreview(story, storyText);
		} else {
			dbLoadStoryText(activeChar + "/" + dbTransform(story), text => {
				characterCache[activeChar].storyData[dbTransform(story)].text = text;
				showStoryPreview(story, text);
			});
		}
	}
}

function editStory() {
	var story = $(this).attr("data-story");
	location.replace("./write.html?story=" + activeChar + "|" + dbTransform(story));
}

function deleteStory() {
	var story = $(this).attr("data-story");

	hidePopup();
	showConfirmPopup("Delete story " + story + "?", function() {
		dbDeleteStory(activeChar + "/" + dbTransform(story), function() {
			hidePopup();

			if (findIndex > -1) {
				delete characterCache[activeChar].storyData[dbTransform(story)];
				showStoryModal();
			}
		}, function(message) {
			hidePopup();
			showErrorPopup(message);
		});
	})
}

function populateCharacterList() {
	var charList = $("#characterList");
	charList.empty();
	setCharacterActive(null);

	if ((userInfo) && (userInfo.characters) && (userInfo.characters.length)) {
		for (var i = 0; i < userInfo.characters.length; i++) {
			charList.append("<li class='charItem' data-key='" + dbTransform(userInfo.characters[i]) + "'>" + userInfo.characters[i] + "</li>");
		}

		charList.append("<li><button type='button' name='createCharacter' data-localization-key='CREATE_A_NEW_CHARACTER'>" + localize("CREATE_A_NEW_CHARACTER") + "</button></li>");

		$("#newUserPrompt").addClass("hideMe");
		$("#charListHolder, #characterInfo").removeClass("hideMe");
	} else {
		$("#newUserPrompt").removeClass("hideMe");
		$("#charListHolder, #characterInfo").addClass("hideMe");
	}
}

function activateCharacter() {
	setCharacterActive($(this).attr("data-key"));
}

function setCharacterActive(charKey) {
	activeChar = charKey;

	$("#characterButtons button").attr("disabled", "true");
	
	if (charKey) {
		$("#characterInfo > *").removeClass("hideMe");
		$("#printout").empty();

		if (characterCache[activeChar]) {
			displayCharacter(characterCache[activeChar]);
		} else {
			dbLoadCharacter(activeChar, characterLoaded, (loadMe) => {
				const result = loadMe.val();

				if (result) {
					if (!characterCache[activeChar]) {
						characterCache.activeChar = {};
					}

					characterCache[activeChar].profile = result;

					displayCharacter(characterCache[activeChar]);
				}
			});
		}
	} else {
		$("#characterInfo > *").addClass("hideMe");
		$("#printout").text(localize("LOADING_CHARACTER"));
	}
}

function characterLoaded(loadMe) {
	if (loadMe.val()) {
		var tmpChar = Object.setPrototypeOf(loadMe.val(), CharacterSheet.prototype);
		var nameKey = dbTransform(tmpChar.name);

		if (characterCache.nameKey) {
			characterCache[nameKey] = {...characterCache[nameKey], ...tmpChar};
		} else {
			characterCache[nameKey] = tmpChar;
		}

		displayCharacter(tmpChar);

		dbLoadStoryData(dbTransform(nameDecode(tmpChar.name)), (data) => {
			characterCache[nameKey].storyData = data.val();
		});
	} else {
		showErrorPopup(localize("THERE_WAS_AN_ERROR_LOADING_THE_CHARACTER"));
	}
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
	}).trim();
}

function displayCharacter(character) {
	character.print("printout");

	$("#characterProfile > h3").empty().append(character.name);

	$("#characterImage")[0].style.background =  character.profile?.image ? "url('" + character.profile.image + "')" : "";
	$("#characterImage").toggle(!!character.profile?.image);

	if (character.profile?.description) {
		$("#characterProfile #characterDescription").removeClass("hideMe").empty().append(converter.makeHtml(htmlCleanup(character.profile.description)));
	} else {
		$("#characterProfile #characterDescription").addClass("hideMe");
	}

	$("#characterLink a").attr("href", `profile.html?character=${character.name}`);

	$("#characterButtons button").removeAttr("disabled");
}

function createNewCharacter() {
	localStorage.setItem("ESORP[character]", "");
	location.replace("./charsheet.html");
}

function getActiveCharacterDisplayName() {
	return userInfo.characters.find(name => dbTransform(name) === activeChar);
}

function goToRollplay() {
	localStorage.setItem("ESORP[character]", getActiveCharacterDisplayName());
	location.replace("./rollplay.html");
}

function editCharacter() {
	localStorage.setItem("ESORP[character]", getActiveCharacterDisplayName());
	location.replace("./charsheet.html");
}

function deleteCharacter() {
	showConfirmPopup(localize("CONFIRM_DELETE_CHARACTER").replace(/CHARACTER/, getActiveCharacterDisplayName()), confirmDeleteCharacter);
}

function confirmDeleteCharacter() {
	var findIndex = userInfo.characters.findIndex(element => dbTransform(element) == activeChar);
	dbDeleteCharacter(activeChar, populateCharacterList);
	userInfo.characters.splice(findIndex, 1);
	dbSaveAccountInfo(userInfo.display, userInfo);
	hidePopup();
}

function goToRPHelper() {
	window.open("./helper.html", "_blank");
}

function goToNameGenerator() {
	location.replace("./namegenerator.html");
}

function goToProfileViewer() {
	location.replace("./profile.html");
}

function goToGMSCreen() {
	location.replace("./gmscreen.html");
}

function checkPasswordEntries() {
	var match = ($("#newPassword").val() === $("#confirmPassword").val());

	$("#newPassword, #confirmPassword").toggleClass("invalid", !match);

	if (match) {
		$("#settingsOk").removeAttr("disabled");
	} else {
		$("#settingsOk").attr("disabled", "true");
	}
}

async function confirmSettingsChange() {
	var shouldSave = false;

	if ($("#optLanguage").val() != userInfo.language) {
		userInfo.language = $("#optLanguage").val();
		localStorage.setItem("ESORP[language]", userInfo.language || "");
		await localizePage();
		createWelcomeMessage();
		setCharacterActive(activeChar);
		shouldSave = true;
	}

	if ($("#optVolume").val() != userInfo.alertVolume) {
		userInfo.alertVolume = $("#optVolume").val();
		shouldSave = true;
	}

	if ($("#optGM").prop("checked") != userInfo.gameMaster) {
		if (userInfo.gameMaster) {
			delete userInfo.gameMaster;
		} else {
			userInfo.gameMaster = true;
		}

		fillTaskHolder();

		shouldSave = true;
	}

	if ($("#optNumeric").prop("checked") !== (userInfo.numericDisplay === "numeric")) {
		userInfo.numericDisplay = $("#optNumeric").prop("checked") ? "numeric" : "descriptive";

		saveNumericDisplayType(userInfo.numericDisplay);

		setCharacterActive(activeChar);

		shouldSave = true;
	}

	var pw1 = $("#newPassword").val();
	var pw2 = $("#confirmPassword").val();

	if ((pw1 !== "") && (pw1 === pw2)) {
		var user = firebase.auth().currentUser;

		user.updatePassword(pw1).then(function() {
			console.log("Password successfully changed.");
		}).catch(function(error) {
			showErrorPopup("Password " + error);
		});
	}

	if (shouldSave) {
		dbSaveAccountInfo(userInfo.display, userInfo, null, showErrorPopup);
	}

	$("#newPassword, #confirmPassword").val("");
	hidePopup();
}

/// Fired when the user selects a numeric display type on the corresponding modal.
function selectNumericDisplayType() {
	userInfo.numericDisplay = $(this).attr("data-key");
	saveNumericDisplayType(userInfo.numericDisplay);
	dbSaveAccountInfo(userInfo.display, userInfo, null, showErrorPopup);
	hidePopup();
	finalizeInitialization();
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

function showSettingsPopup() {
	$("#optLanguage").val(userInfo.language || "EN-US");
	$("#optVolume").val(userInfo.alertVolume || 1.0);
	$("#optGM").prop("checked", userInfo.gameMaster);
	$("#optNumeric").prop("checked", userInfo.numericDisplay === "numeric");
	$("#newPassword, #confirmPassword").val("");
	checkPasswordEntries(); // Reset formatting.
	$("#modalBG, #settingsModal").addClass("show");
}

function showNumericDisplayPopup() {
	$("#modalBG, #numericDisplayModal").addClass("show");
}

function showStoryModal() {
	if (characterCache[activeChar]) {
		var storyList = $("#storyModal ul");
		storyList.empty();

		if (characterCache[activeChar].storyData) {
			var charStories = Object.entries(characterCache[activeChar].storyData);

			for (var i = 0; i < charStories.length; i++) {
				storyList.append("<li>" +
					"<strong>" + charStories[i][1].title + "</strong>" +
					"<div>" +
						"<button name='previewStory' type='button' data-story='" + charStories[i][1].title + "' data-localization-key='PREVIEW'>Preview</button>" +
						"<button name='editStory' type='button' data-story='" + charStories[i][1].title + "' data-localization-key='BUTTON_EDIT'>Edit</button>" +
						"<button name='deleteStory' type='button' data-story='" + charStories[i][1].title + "' data-localization-key='BUTTON_DELETE'>Delete</button>" +
					"</div>" +
				"</li>");
			}
		}

		$("#modalBG, #storyModal").addClass("show");
	}
}

function showStoryPreview(title, text) {
	$("#storyPreviewModal h1").empty().append(title);
	$("#storyPreviewModal div").empty().append(converter.makeHtml(text));
	$("#modalBG, #storyPreviewModal").addClass("show");
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

/// Event registration
$("#userOptions").on("click", showSettingsPopup);
$("#logout").on("click", doLogout);
$("#characterCenter").on("click", "button[name='createCharacter']", createNewCharacter);
$("#characterList").on("click", "li.charItem", activateCharacter);
$("#playCharacter").on("click", goToRollplay);
$("#editCharacter").on("click", editCharacter);
$("#deleteCharacter").on("click", deleteCharacter);
$("#manageStories").on("click", showStoryModal);
$("#miscTasks").on("click", "#rpHelper", goToRPHelper)
	.on("click", "#nameGenerator", goToNameGenerator)
	.on("click", "#profileViewer", goToProfileViewer)
	.on("click", "#gmScreen", goToGMSCreen);
$("#newPassword, #confirmPassword").on("change", checkPasswordEntries);
$("#settingsOk").on("click", confirmSettingsChange);
$("#numericDisplayNumeric, #numericDisplayDescriptive").on("click", selectNumericDisplayType);
$("#storyModal ul").on("click", "button[name='previewStory']", previewStory);
$("#storyModal ul").on("click", "button[name='editStory']", editStory);
$("#storyModal ul").on("click", "button[name='deleteStory']", deleteStory);
$("#createStory").on("click", createStory);
$("#confirmCancel, #errorButton, #settingsCancel, #storyCancel, #previewOk").on("click", hidePopup);