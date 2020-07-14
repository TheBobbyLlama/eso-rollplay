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
		parent.append("<div>");
		parent.append("<label for='" + elements[i].key + "'>" + elements[i].name + "</label>");
		parent.append("<input type='range' min='" + elements[i].min + "' max='" + elements[i].max + "' value='0' name='" + elements[i].key + "' />")
		parent.append("</div>");
	}
}

initializePage();