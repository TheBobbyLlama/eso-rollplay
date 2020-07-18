var character;

function initializePage() {
	var loadChar = new URLSearchParams(window.location.search).get("character");
	var minimal = new URLSearchParams(window.location.search).get("minimal");


	initializeDB();

	if (loadChar) {
		if (minimal) {
			$("h1").remove();
			$("section div:first-child").remove();
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

function selectCharacter() {
	$("#profileText div").text("");
	dbLoadCharacter($(this).val(), characterLoaded, descriptionLoaded);
}

function characterLoaded(loadMe) {
	if (loadMe.val()) {
		character = loadMe.val();
		Object.setPrototypeOf(character, new CharacterSheet());
		$("#profileText h2").text(nameDecode(character.name));
		character.print("printout");
	} else {
		showErrorPopup("Character not found.");
	}
}

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

function descriptionLoaded(loadMe) {
	if (loadMe.val()) {
		$("#profileText div").append(formatDescription(loadMe.val()));
	}
}

initializePage();