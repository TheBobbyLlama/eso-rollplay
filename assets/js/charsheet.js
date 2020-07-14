function createPageSliders() {
	fillSection("attributes", attributes, 20);
}

function fillSection(sectionName, elements) {
	var parent = $("#" + sectionName);

	for (var i = 0; i < elements.length; i++) {
		parent.append("<div>");
		parent.append("<label for='" + elements[i].key + "'>" + elements[i].name + " [1]</label>");
		parent.append("<input type='range' min='1' max='" + elements[i].max + "' value='1' name='" + elements[i].key + "' />")
		parent.append("</div>");
	}
}

createPageSliders();