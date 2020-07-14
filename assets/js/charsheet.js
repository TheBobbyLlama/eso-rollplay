var footer = $("footer");

var character = new CharacterSheet();

function initializePage() {
	var i;

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

	for (i = 0; i < supernaturals.length; i++) {
		superSelect.append("<option>" + supernaturals[i].name + "</option>")
	}

	for (i = 0; i < classes.length; i++) {
		classSelect.append("<option>" + classes[i] + "</option>")
	}

	// Event handler isn't catching our default race, so force it!
	raceSelect.trigger("change");
}

function fillSection(sectionName, elements) {
	var parent = $("#" + sectionName);

	for (var i = 0; i < elements.length; i++) {
		parent.append("<div data-key='" + elements[i].key + "'>" +
						"<label for='" + elements[i].key + "'>" + elements[i].name + " [" + character.getItem(elements[i].key) + "]</label>" +
						"<input type='range' min='" + elements[i].min + "' max='" + elements[i].max + "' value='0' name='" + elements[i].key + "' />" +
					"</div>");
	}
}

function changeName() {
	character.name = $(this).val();
	UpdateCharacterSheet();
}

function changeRace() {
	character.race = $(this).val();
	UpdateCharacterSheet();
}

function changeSex() {
	character.sex = $(this).prop("selectedIndex");
	UpdateCharacterSheet();
}

function changeSupernatural() {
	character.supernatural = $(this).val();
	UpdateCharacterSheet();
}

function changeClass() {
	character.class = $(this).val();
	UpdateCharacterSheet();
}

function UpdateCharacterSheet() {
	// TODO!
	character.print("printout");
}

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

function checkHighlight() {
	var helpKey = $(this).closest("*[data-key]").attr("data-key");

	if (helpKey) {
		footer.text(findDescForKey(helpKey));
		footer.addClass("shown");
	} else {
		footer.removeClass("shown");
	}
}

function findDescForKey (findKey) {
	for (var i = 0; i < masterQualityList.length; i++) {
		var findIndex = masterQualityList[i].findIndex(element => element.key == findKey);

		if (findIndex > -1) {
			return masterQualityList[i][findIndex].description;
		}
	}

	return "";
}

$("input[name='charName']").on("change", changeName);
$("select[name='charRace']").on("change", changeRace);
$("select[name='charSex']").on("change", changeSex);
$("select[name='charSupernatural']").on("change", changeSupernatural);
$("select[name='charClass']").on("change", changeClass);
$("#printout").on("dblclick", copyOutput);

initializePage();

// TODO - Not quite working right - doesn't trigger help footer on the first item in a section moused over!
$("*").on("mouseenter mouseleave", checkHighlight);