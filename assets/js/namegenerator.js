const resultDiv = $("#results");
var nameData
var useTag = "p";

/// Called on page startup, once the data JSON has been loaded.
function initializePage(data) {
	// console.log(data);
	var setRace = new URLSearchParams(window.location.search).get("race");
	var setSex = new URLSearchParams(window.location.search).get("sex");
	nameData = data;

	for (let i = 0; i < nameData.length; i++) {
		$("#race").append("<option value='" + nameData[i].race + "'>" + localize(nameData[i].race) + "</option>")
	}

	$("#race").trigger("change");

	if ((setRace) && (setSex)) {
		$("#race").val("RACE_" + setRace.toUpperCase());
		setSex = setSex.toLowerCase().split("_").reduce((_, name) => name[0].toUpperCase() + name.substring(1));
		$("#sex").val(setSex);
		$("form > div:first-child").addClass("hideMe");
		$("h2, nav").remove();
		useTag = "button";
		generate(null);
	}

	$("#loading").remove();
	$("h2, nav, section").removeClass("hideMe");
}

/// Dynamically create filter checkboxes based on what's available for the chosen race.
function createFilters() {
	var addedAny = false;
	const raceIndex = $(this).prop("selectedIndex");
	const filterList = [];
	const filterDiv = $("#sourceFilters");

	filterDiv.empty().append("<p>Filters:</p>");

	for (let x = 0; x < nameData[raceIndex].subcategories.length; x++) {
		let curSet = nameData[raceIndex].subcategories[x].componentList.components;

		for (let i = 0; i < curSet.length; i++) {
			if ((curSet[i].source) && (filterList.indexOf(curSet[i].source) < 0)) {
				filterList.push(curSet[i].source);
				filterDiv.append("<div>" +
									"<input type='checkbox' name='" + curSet[i].source + "' value='" + curSet[i].source + "' checked></input>" +
									"<label for='" + curSet[i].source + "'>" + curSet[i].source + "</label>" +
								"</div>");
				addedAny = true;
			}
		}
	}

	if (!addedAny) {
		filterDiv.empty();
	}
}

/// Collects filters and uses them to generate names.
function generate(event) {
	if (event) {
		event.preventDefault();
	}

	const count = $("#resultCount").val();
	const filters = $("#sourceFilters input:checked");
	const selectedFilters = [];
	var componentBucket;

	resultDiv.empty();
	
	for (let i = 0; i < filters.length; i++) {
		selectedFilters.push(filters[i].value);
	}

	componentBucket = getComponentLists(selectedFilters);
	
	for (let i = 0; i < count; i++) {
		var name = generateName(componentBucket).join(" ").replace(/- /g, "-");

		if (name) {
			resultDiv.append("<li><" + useTag + ">" + name + "</" + useTag + "></li>");
		}
	}
}

/// Applies our filters and returns an array valid component lists for each possible word in the name.
function getComponentLists(filter) {
	var result = [];
	var componentIndex = 1;
	const raceIndex = $("#race").prop("selectedIndex");

	while (true) {
		let tmpResults = [];

		for (let x = 0; x < nameData[raceIndex].subcategories.length; x++) {
			let curSet = nameData[raceIndex].subcategories[x];

			if ((curSet.componentList.index == componentIndex) && ((!curSet.name) || (curSet.name == $("#sex").val()))) {
				for (let i = 0; i < curSet.componentList.components.length; i++) {
					if ((!curSet.componentList.components[i].source) || (filter.indexOf(curSet.componentList.components[i].source) > -1)) {
						tmpResults.push(curSet.componentList.components[i]);
					}
				}
			}
		}

		if (tmpResults.length > 0) {
			result.push(tmpResults);
			componentIndex++;
		} else {
			return result;
		}
	}
}

/// Generates an individual name.
function generateName(workingList) {
	const result = [];

	for (let i = 0; i < workingList.length; i++) {
		result.push(createNameComponent(workingList[i]));
	}

	return result;
}

/// The heavy lifting of name generation - Chooses a component list and then builds a word from it.
function createNameComponent(componentList) {
	var count = 0;
	var random;
	var curList = 0;
	var curLength;
	var result = "";

	for (let i = 0; i < componentList.length; i++) {
		count += componentList[i].list.length;
	}

	random = getRandomIndex(count);

	while (componentList[curList].list.length < random) {
		random -= componentList[curList].list.length;
		curList++;
	}

	if (typeof(componentList[curList].length) === "string") {
		var tmpVals = componentList[curList].length.split("-").map(element => parseInt(element));
		// Extra Math.random() is there to create a bias toward lower end of the scale!
		curLength = tmpVals[0] + Math.floor((((tmpVals[1] - tmpVals[0]) * Math.random()) + 1) * Math.random());
	} else {
		curLength = componentList[curList].length;
	}

	for (let i = 0; i < curLength; i++) {
		var workingList;

		if (i == 0) {
			workingList = componentList[curList].list.filter(element => element[0] != "+");
		} else if (i >= curLength - 1) {
			workingList = componentList[curList].list.filter(element => element[element.length - 1] != "+");
		} else {
			workingList = componentList[curList].list.filter(element => ((element[0] === "+") && (element[element.length - 1] === "+")));
		}

		result += workingList[getRandomIndex(workingList.length)];
	}

	return result.replace(/\+/g, "");
}

/// Helper function for random numbers.
function getRandomIndex(max) {
	return Math.floor(max * Math.random());
}

/// Send the user back to their dashboard.
function sendToDashboard(event) {
	event.preventDefault();
	window.location.assign("./dashboard.html");
}

/// Event registration.
$.getJSON( "./assets/data/namedata.json", initializePage);
//initializePage([]); // LOCAL TESTING ONLY!!!
$("nav h1").on("click", sendToDashboard);
$("#race").on("change", createFilters);
$("#generateButton").on("click", generate);