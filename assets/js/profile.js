var character;

/// Called on page startup.
function initializePage() {
	var loadChar = new URLSearchParams(window.location.search).get("character");
	var minimal = new URLSearchParams(window.location.search).get("minimal");

	initializeDB();

	if (loadChar) {
		if (minimal) {
			$("h1").remove();
			$("section div:first-child").remove();
			$("body").addClass("minimal");
		} else {
			$("h1").text("Character Profile");
			$("section div:first-child select").remove();
		}
		dbLoadCharacter(loadChar, characterLoaded, descriptionLoaded);
	} else {
		$("section div:first-child select").on("change", selectCharacter);
		dbLoadCharacterList(characterListLoaded);
	}
}

/// Fired when a character is selected from the dropdown.
function selectCharacter() {
	$("#profileText div").empty();
	dbLoadCharacter($(this).val(), characterLoaded, descriptionLoaded);
}

/// A character has been loaded to display.
function characterLoaded(loadMe) {
	if (loadMe.val()) {
		character = loadMe.val();
		Object.setPrototypeOf(character, CharacterSheet.prototype);
		$("#profileText h2").text(nameDecode(character.name));
		character.print("printout");
		$("#loading").remove();
		$("h1, #main").removeClass("hideMe");
	} else {
		showErrorPopup("Character not found.");
	}
}

/// The character list is ready to be used in the selection dropdown.
function characterListLoaded(loadMe) {
	if (loadMe.val()) {
		var results = Object.entries(loadMe.val());
		var list = $("section div:first-child select");
		
		for (var i = 0; i < results.length; i++) {
			list.append("<option>" + results[i][1].name + "</option>");
		}

		list.change();
	}
}

/// The current character's description is ready to display.
function descriptionLoaded(loadMe) {
	if (loadMe.val()) {
		$("#profileText div").append(formatDescription(loadMe.val()));
	}
}

initializePage();