var userInfo = null;
var activeChar;
var characterCache = [];

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

	var findIndex = characterCache.findIndex(element => dbTransform(element.name) == activeChar);
	hidePopup();

	if (findIndex > -1) {
		var storyText = characterCache[findIndex].storyData[dbTransform(story)].text;

		if (storyText) {
			showStoryPreview(story, storyText);
		} else {
			dbLoadStoryText(activeChar + "/" + dbTransform(story), text => {
				characterCache[findIndex].storyData[dbTransform(story)].text = text;
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
			var findIndex = characterCache.findIndex(element => dbTransform(element.name) == activeChar);

			if (findIndex > -1) {
				delete characterCache[findIndex].storyData[dbTransform(story)];
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
		$("#charListHolder, #characterCommands").removeClass("hideMe");
	} else {
		$("#newUserPrompt").removeClass("hideMe");
		$("#charListHolder, #characterCommands").addClass("hideMe");
	}
}

function activateCharacter() {
	setCharacterActive($(this).attr("data-key"));
}

function setCharacterActive(charKey) {
	activeChar = charKey;

	$("#characterButtons button").attr("disabled", "true");
	
	if (charKey) {
		var testIndex = characterCache.findIndex(element => dbTransform(element.name) == charKey);

		$("#printout").empty();

		if (testIndex > -1) {
			displayCharacter(characterCache[testIndex]);
		} else {
			dbLoadCharacter(activeChar, characterLoaded);
		}
	} else {
		$("#printout").text(localize("PLEASE_SELECT_A_CHARACTER"));
	}
}

function characterLoaded(loadMe) {
	if (loadMe.val()) {
		var tmpChar = Object.setPrototypeOf(loadMe.val(), CharacterSheet.prototype);
		characterCache.push(tmpChar);
		displayCharacter(tmpChar);

		dbLoadStoryData(dbTransform(nameDecode(tmpChar.name)), (data) => {
			tmpChar.storyData = data.val();
		});
	} else {
		showErrorPopup(localize("THERE_WAS_AN_ERROR_LOADING_THE_CHARACTER"));
	}
}

function displayCharacter(character) {
	character.print("printout", true);
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
	$("#newPassword, #confirmPassword").val("");
	checkPasswordEntries(); // Reset formatting.
	$("#modalBG, #settingsModal").addClass("show");
}

function showStoryModal() {
	var testIndex = characterCache.findIndex(element => dbTransform(element.name) == activeChar);

	if (testIndex > -1) {
		var storyList = $("#storyModal ul");
		storyList.empty();

		if (characterCache[testIndex].storyData) {
			var charStories = Object.entries(characterCache[testIndex].storyData);

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
$("#storyModal ul").on("click", "button[name='previewStory']", previewStory);
$("#storyModal ul").on("click", "button[name='editStory']", editStory);
$("#storyModal ul").on("click", "button[name='deleteStory']", deleteStory);
$("#createStory").on("click", createStory);
$("#confirmCancel, #errorButton, #settingsCancel, #storyCancel, #previewOk").on("click", hidePopup);