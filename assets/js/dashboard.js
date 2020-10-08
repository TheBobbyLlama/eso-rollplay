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

	taskHolder.empty();

	if (userInfo.gameMaster) {
		taskHolder.append("<button type='button' id='gmScreen'>GM Screen</button>")
	}

	taskHolder.append("<button type='button' id='nameGenerator'>Generate Lore Friendly Names</button>");

	$("#loading").remove();
	$("#characterCenter, #miscTasks").removeClass("hideMe");
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

	$("#printout").empty();
	$("#characterButtons button").attr("disabled", "true");
	
	if (activeChar > -1) {
		var testIndex = characterCache.findIndex(element => element.name == userInfo.characters[activeChar]);

		if (testIndex > -1) {
			displayCharacter(characterCache[testIndex]);
		} else {
			dbLoadCharacter(userInfo.characters[activeChar], characterLoaded);
		}
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

function goToGMSCreen() {
	location.replace("./gmscreen.html");
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
$("#logout").on("click", doLogout);
$("#characterCenter").on("click", "button[name='createCharacter']", createNewCharacter);
$("#characterList").on("click", "li.charItem", activateCharacter);
$("#playCharacter").on("click", goToRollplay);
$("#editCharacter").on("click", editCharacter);
$("#deleteCharacter").on("click", deleteCharacter);
$("#miscTasks").on("click", "#nameGenerator", goToNameGenerator)
	.on("click", "#gmScreen", goToGMSCreen);
$("#confirmCancel, #errorButton").on("click", hidePopup);