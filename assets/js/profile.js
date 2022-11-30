const characteristicList = [
	[ "Aliases", "aliases" ],
	[ "Alignment", "alignment" ],
	[ "Birthsign", "birthsign" ],
	[ "Primary Residence", "residence" ],
	[ "Organizations", "organizations" ],
	[ "Alliances", "alliances" ],
	[ "Enemies", "enemies" ],
	[ "Relationships", "relationships" ],
];
const biographyBlock = $("#biography");
const oocBlock = $("#oocInfo");

const characterCache = {};
let characterList = [];
let accountList = [];

let character;
let minimal;
showdown.extension('Rollplay', showdownRollplay);
let converter = new showdown.Converter({ openLinksInNewWindow: true, extensions: ["Rollplay"] });

/// Called on page startup.
function initializePage() {
	const loadChar = new URLSearchParams(window.location.search).get("character");
	minimal = new URLSearchParams(window.location.search).get("minimal");

	initializeDB();

	if (loadChar) {
		if (minimal) {
			$("body").addClass("minimal");
			$("nav").remove();
			$("#charListing, #characteristics, #biography, #storyList").remove();
		} else {
			$("h1 a").text(localize("CHARACTER_PROFILE"));
			$("#charListing select").remove();
		}
		loadCharacter(loadChar);
	} else {
		$("#charListing #accounts").on("change", selectAccount);
		$("#charListing #characters").on("change", selectCharacter);
		$("#printout").addClass("active").on("click", "span[data-account]", chooseAccount);
		dbLoadCharacterList(characterListLoaded);
		$("nav h1").on("click", sendToDashboard);
	}
}

function selectAccount() {
	setCurrentAccount($(this).val());
}

function chooseAccount() {
	const accountSelect = $("#charListing #accounts");
	accountSelect.prop("selectedIndex", accountList.indexOf($(this).attr("data-account")) + 1);
	accountSelect.change();
}

function setCurrentAccount(curAccount) {
	const charSelect = $("#charListing #characters").empty();
	const tmpCharList = (curAccount[0] === "@") ? characterList : characterList.filter(curChar => curChar.player.replace(/^@*/, "") === curAccount);

	tmpCharList.forEach(curChar => {
		charSelect.append("<option>" + curChar.name + "</option>");
	});

	if ((curAccount[0] === "@") || (character.player === curAccount)) {
		charSelect.prop("selectedIndex", tmpCharList.findIndex(curChar => curChar.name === character.name));
	} else {
		charSelect.change();
	}
}

/// Fired when a character is selected from the dropdown.
function selectCharacter() {
	$("#profileText div").empty();
	loadCharacter($(this).val());
}

/// The character list is ready to be used in the selection dropdown.
function characterListLoaded(loadMe) {
	const tmpResult = loadMe.val();

	if (tmpResult) {
		const charSelect = $("#charListing #characters");
		const accountSelect = $("#charListing #accounts");

		characterList = Object.entries(tmpResult).map(item => item[1]);
		
		characterList.forEach(curChar => {
			charSelect.append("<option>" + curChar.name + "</option>");
		});

		accountList = characterList.map(curChar => curChar.player.replace(/^@*/, "")).filter((name, index, self) => (self.indexOf(name) === index));
		accountList.sort(function (a, b) {
			return a.toLowerCase().localeCompare(b.toLowerCase());
		});

		accountList.forEach(curAccount => {
			accountSelect.append("<option>" + curAccount + "</option>");
		});

		charSelect.change();
	}
}

function loadCharacter(name) {
	character = characterCache[dbTransform(name)];

	if (character) {
		setCharacterInfo();
		setCharacterProfile(character.profile);
		checkStoryList();
	} else {
		checkStoryList(true);
		dbLoadCharacter(name, characterLoaded, profileLoaded);
	}
}

function checkStoryList(forceOff = false) {
	const storyList = $("#charStories");
	storyList.empty();

	if ((!forceOff) && (character.storyData)) {
		const charStories = Object.entries(character.storyData);

		for (var i = 0; i < charStories.length; i++) {
			storyList.append("<li>" +
				"<a href='story.html?s=" + dbTransform(character.name) + "|" + dbTransform(charStories[i][1].title) + "' target='_blank'>" + charStories[i][1].title + "</a>" +
			"</li>");
		}

		$("#storyList").removeClass("hideMe");
	} else {
		$("#storyList").addClass("hideMe");
	}
}

/// A character has been loaded to display.
function characterLoaded(loadMe) {
	if (loadMe.val()) {
		character = loadMe.val();
		characterCache[dbTransform(nameDecode(character.name))] = character;
		setCharacterInfo();

		if (!minimal) {
			tmpChar = character;

			dbLoadStoryData(dbTransform(nameDecode(tmpChar.name)), (data) => {
				tmpChar.storyData = data.val();

				if (character.name === tmpChar.name) {
					checkStoryList();
				}
			});
		}
	} else {
		showErrorPopup(localize("CHARACTER_NOT_FOUND"), event => {
			event.preventDefault();
			window.location.assign("./profile.html");
		});
		$("#loading").remove();
	}
}

function setCharacterInfo() {
	Object.setPrototypeOf(character, CharacterSheet.prototype);
	$("h2").text(nameDecode(character.name));
	character.print("printout");
	$("#printout").toggleClass("hideMe", !character.skills);
	$("#loading").remove();
	$("nav, #main").removeClass("hideMe");	
}

function fillCharacteristics(myProfile) {
	let found = false;
	const myDiv = $("#characteristics");
	myDiv.empty();

	for (let i = 0; i < characteristicList.length; i++) {
		let tmpVal = localize(myProfile[characteristicList[i][1]]);
		
		if (tmpVal) {
			found = true;

			myDiv.append("<div><h4>" + localize("LABEL_" + characteristicList[i][0].toUpperCase().replace(/\s+/g, "_")) + "</h4> " + converter.makeHtml(tmpVal) + "</div>");
		}
	}

	myDiv.toggle(found);
}

/// The current character's profile is ready to display.
function profileLoaded(loadMe) {
	const myProfile = loadMe.val();

	if (myProfile) {
		characterCache[dbTransform(nameDecode(character.name))].profile = myProfile;
	}

	setCharacterProfile(myProfile);
}

function setCharacterProfile(profile) {
	if (profile) {
		$("#charImage")[0].style.background =  profile.image ? "url('" + profile.image + "')" : "";
		$("#charImage").toggle(!!profile.image);
		$("#profileShort").empty().append(profile.description ? converter.makeHtml(htmlCleanup(profile.description)) : "<div class='nodesc'>" + localize("NO_DESCRIPTION_GIVEN") + "</div>");
		
		oocBlock.empty();
		
		if (profile.oocInfo) {
			oocBlock.append(converter.makeHtml(htmlCleanup(profile.oocInfo)));
		}

		oocBlock.toggle(!!profile.oocInfo);

		if (!minimal) {
			fillCharacteristics(profile);
			biographyBlock.empty();
			
			if (profile.biography) {
				biographyBlock.append(converter.makeHtml(htmlCleanup(profile.biography)));
			}

			biographyBlock.toggle(!!profile.biography);
		}
	} else {
		$("#charImage, #characteristics").toggle(false);
		$("#profileShort").empty().append("<div class='nodesc'>" + localize("NO_DESCRIPTION_GIVEN") + "</div>");
		$("#biography, #oocInfo").empty();
		biographyBlock.toggle(false);
		oocBlock.toggle(false);
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

/// Send the user back to their dashboard.
function sendToDashboard(event) {
	event.preventDefault();
	window.location.assign("./dashboard.html");
}

initializePage();

// Eat links when in minimal view.
$(".minimal #profileShort").on("click", "a", function(event) { event.preventDefault(); });
$("#errorButton").on("click", hidePopup);