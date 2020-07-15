var character = new CharacterSheet();

function initializePage() {
	initializeDB();

	$("input[name='charName']").val(localStorage.getItem("ESORP[name]"));
	$("input[name='charPlayer']").val(localStorage.getItem("ESORP[player]"));

	resetRollSelect();
}

function resetRollSelect() {
	var i;
	var rollSelector = $("#rollSelect");
	var charItems = Object.entries(character.skills);
	
	rollSelector.text("");

	for (i = 0; i < charItems.length; i++) {
		var curQuality = getQuality(charItems[i][0]);

		rollSelector.append("<option value='" + curQuality.key +"'>" + curQuality.name + "</option>")
	}

	for(i = 0; i < masterQualityList.length; i++) {
		var workingList = masterQualityList[i];

		for (var idx = 0; idx < workingList.length; idx++) {
			if (!charItems.find(element => element[0] == workingList[idx].key)) {
				rollSelector.append("<option value='" + workingList[idx].key +"'>" + workingList[idx].name + "</option>")
			}
		}
	}
		
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

function loadChar() {
	event.preventDefault();
	var tmpName = $("input[name='charName']").val();
	var tmpPlayer = $("input[name='charPlayer']").val();

	if ((!tmpName) || (!tmpPlayer)) {
		showErrorPopup("Please enter a character name and a player name.");
		return;
	}

	dbLoadCharacter(tmpName + "@" + tmpPlayer, characterLoaded)
}

function characterLoaded(loadMe) {
	if (loadMe.val()) {
		character.loadValueHandler(loadMe.val());
		localStorage.setItem("ESORP[name]", character.name);
		character.print("printout");
		resetRollSelect();
	} else {
		showErrorPopup("Character not found.");
		$("input[name='charName']").val(character.name);
		$("input[name='charPlayer']").val(character.player);
	}
}

function showErrorPopup(message) {
	$("#modalBG").addClass("show");
	$("#errorModal").addClass("show");
	$("#errorText").text(message);
}

function hideErrorPopup() {
	$("#modalBG").removeClass("show");
	$("#erorModal").removeClass("show");
}

$("#loadChar").on("click", loadChar);
$("#printout").on("dblclick", copyOutput);
$("#errorButton").on("click", hideErrorPopup);

initializePage();