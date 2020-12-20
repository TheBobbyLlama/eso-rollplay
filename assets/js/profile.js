const emptyTemplate = "<div class='nodesc'>No description given.</div>"
const characteristicList = [
	[ "Alignment", "alignment" ],
	[ "Birthsign", "birthsign" ],
	[ "Primary Residence", "residence" ],
	[ "Organizations", "organizations" ],
	[ "Alliances", "alliances" ],
	[ "Relationships", "relationships" ],
];

var character;
var minimal;
var converter = converter = new showdown.Converter();

/// Called on page startup.
function initializePage() {
	var loadChar = new URLSearchParams(window.location.search).get("character");
	minimal = new URLSearchParams(window.location.search).get("minimal");

	initializeDB();

	if (loadChar) {
		if (minimal) {
			$("body").addClass("minimal");
			$("nav").remove();
			$("#charListing, #characteristics, #biography").remove();
		} else {
			$("h1").text("Character Profile");
			$("#charListing select").remove();
		}
		dbLoadCharacter(loadChar, characterLoaded, profileLoaded);
	} else {
		$("section div:first-child select").on("change", selectCharacter);
		dbLoadCharacterList(characterListLoaded);
		$("nav h1").on("click", sendToDashboard);
	}
}

/// Fired when a character is selected from the dropdown.
function selectCharacter() {
	$("#profileText div").empty();
	dbLoadCharacter($(this).val(), characterLoaded, profileLoaded);
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

/// A character has been loaded to display.
function characterLoaded(loadMe) {
	if (loadMe.val()) {
		character = loadMe.val();
		Object.setPrototypeOf(character, CharacterSheet.prototype);
		$("h2").text(nameDecode(character.name));
		character.print("printout");
		$("#loading").remove();
		$("nav, #main").removeClass("hideMe");
	} else {
		showErrorPopup("Character not found.");
	}
}

function fillCharacteristics(myProfile) {
	var found = false;
	var myDiv = $("#characteristics");
	myDiv.empty();

	for (let i = 0; i < characteristicList.length; i++) {
		let tmpVal = myProfile[characteristicList[i][1]];
		
		if (tmpVal) {
			found = true;

			myDiv.append("<div><h4>" + characteristicList[i][0] + ":</h4> " + converter.makeHtml(tmpVal) + "</div>");
		}
	}

	myDiv.toggle(found);
}

/// The current character's profile is ready to display.
function profileLoaded(loadMe) {
	var myProfile = loadMe.val();

	if (myProfile) {
		$("#charImage")[0].style.background =  myProfile.image ? "url('" + myProfile.image + ")" : "";
		$("#charImage").toggle(!!myProfile.image);
		$("#profileShort").empty().append(myProfile.description ? converter.makeHtml(myProfile.description.trim()) : emptyTemplate);

		if (!minimal) {
			fillCharacteristics(myProfile);
			$("#biography").empty().append(converter.makeHtml(myProfile.biography)).toggle(!!myProfile.biography);
		}
	} else {
		$("#charImage, #characteristics").toggle(false);
		$("#profileShort, #biography").empty().append(emptyTemplate);
		$("#biography").toggle(false);
	}
}

/// Send the user back to their dashboard.
function sendToDashboard() {
	window.location.assign("./dashboard.html");
}

initializePage();

// Eat links when in minimal view.
$(".minimal #profileShort").on("click", "a", function(event) { event.preventDefault(); });