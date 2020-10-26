var userInfo = null;
var activeChar = -1;
var characterCache = [];

var taskHolder = $("#taskHolder");

function initializePage(myUser) {
	if (!myUser) {
		showErrorPopup("User " + firebase.auth().currentUser.displayName + " not found!", divertToLogin);
		return;
	}

	userInfo = myUser;
	$("#welcomeHeader").text("Welcome, " + userInfo.display + "!");
	populateCharacterList();

	fillTaskHolder();

	$("#loading").remove();
	$("#characterCenter, #miscTasks").removeClass("hideMe");
}

function fillTaskHolder() {
	taskHolder.empty();

	if (userInfo.gameMaster) {
		taskHolder.append("<button type='button' id='gmScreen'>GM Screen</button>")
	}

	taskHolder.append("<button type='button' id='profileViewer'>Browse Characters</button>");
	taskHolder.append("<button type='button' id='nameGenerator'>Generate Lore Friendly Names</button>");
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

function populateCharacterList() {
	var charList = $("#characterList");
	charList.empty();
	setCharacterActive(-1);

	if ((userInfo) && (userInfo.characters) && (userInfo.characters.length)) {
		for (var i = 0; i < userInfo.characters.length; i++) {
			charList.append("<li class='charItem' data-index='" + i + "'>" + userInfo.characters[i] + "</li>");
		}

		charList.append("<li><button type='button' name='createCharacter'>Create a New Character</button></li>");

		$("#newUserPrompt").addClass("hideMe");
		$("#charListHolder, #characterCommands").removeClass("hideMe");
	} else {
		$("#newUserPrompt").removeClass("hideMe");
		$("#charListHolder, #characterCommands").addClass("hideMe");
	}
}

function activateCharacter() {
	setCharacterActive($(this).attr("data-index"));
}

function setCharacterActive(newIndex) {
	activeChar = newIndex;

	$("#characterButtons button").attr("disabled", "true");
	
	if (activeChar > -1) {
		var testIndex = characterCache.findIndex(element => element.name == userInfo.characters[activeChar]);

		if (testIndex > -1) {
			displayCharacter(characterCache[testIndex]);
		} else {
			dbLoadCharacter(userInfo.characters[activeChar], characterLoaded);
		}

		$("#printout").empty();
	} else {
		$("#printout").text("Please select a character.");
	}
}

function characterLoaded(loadMe) {
	if (loadMe.val()) {
		var tmpChar = Object.setPrototypeOf(loadMe.val(), CharacterSheet.prototype);
		characterCache.push(tmpChar);
		displayCharacter(tmpChar);
	} else {
		showErrorPopup("There was an error loading the character.");
	}
}

function displayCharacter(character) {
	character.print("printout");
	$("#characterButtons button").removeAttr("disabled");
}

function createNewCharacter() {
	localStorage.setItem("ESORP[character]", "");
	location.replace("./charsheet.html");
}

function goToRollplay() {
	localStorage.setItem("ESORP[character]", userInfo.characters[activeChar]);
	location.replace("./rollplay.html");
}

function editCharacter() {
	localStorage.setItem("ESORP[character]", userInfo.characters[activeChar]);
	location.replace("./charsheet.html");
}

function deleteCharacter() {
	showConfirmPopup("Are you sure you want to delete the character " + userInfo.characters[activeChar] + "?", confirmDeleteCharacter);
}

function confirmDeleteCharacter() {
	dbDeleteCharacter(userInfo.characters[activeChar], userInfo.display, populateCharacterList);
	userInfo.characters.splice(activeChar, 1);
	dbSaveAccountInfo(userInfo.display, userInfo);
	hidePopup();
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

function confirmSettingsChange() {
	var shouldSave = false;

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
	$("#optVolume").val(userInfo.alertVolume || 1.0);
	$("#optGM").prop("checked", userInfo.gameMaster);
	$("#newPassword, #confirmPassword").val("");
	checkPasswordEntries(); // Reset formatting.
	$("#modalBG, #settingsModal").addClass("show");
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
$("#miscTasks").on("click", "#nameGenerator", goToNameGenerator)
	.on("click", "#profileViewer", goToProfileViewer)
	.on("click", "#gmScreen", goToGMSCreen);
$("#newPassword, #confirmPassword").on("change", checkPasswordEntries);
$("#settingsOk").on("click", confirmSettingsChange);
$("#confirmCancel, #errorButton, #settingsCancel").on("click", hidePopup);