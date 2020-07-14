var footer = $("footer");

var character = new CharacterSheet();

function initializePage() {
	fillSection("attributes", attributes);
	fillSection("skillsCombat", skillsCombat);
	fillSection("skillsMagic", skillsMagic);
	fillSection("skillsGeneral", skillsGeneral);
	fillSection("skillsCrafting", skillsCrafting);
	fillSection("skillsKnowledge", skillsKnowledge);

	var raceSelect = $("select[name='charRace']");

	for (var i = 0; i < races.length; i++) {
		raceSelect.append("<option>" + races[i].name + "</option>")
	}
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

function checkHighlight() {
	var helpKey = $(this).closest("div[data-key]").attr("data-key");

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

initializePage();

// TODO - Not quite working right - doesn't trigger help footer on the first item in a section moused over!
$("*").on("mouseenter mouseleave", checkHighlight);