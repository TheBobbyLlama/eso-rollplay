const resultDiv = $("#results");
var nameData
var useTag = "p";

function initializePage(data) {
	//console.log(data);
	nameData = data;

	for (let i = 0; i < nameData.length; i++) {
		$("#race").append("<option>" + nameData[i].race + "</option>")
	}

	$("#race").trigger("change");
}

function createFilters() {
	const raceIndex = $(this).prop("selectedIndex");
	const filterList = [];
	const filterDiv = $("#sourceFilters");

	filterDiv.empty().append("<p>Filters:</p>");

	for (let x = 0; x < nameData[raceIndex].subcategories.length; x++) {
		let curSet = nameData[raceIndex].subcategories[x].componentList.components;

		for (let i = 0; i < curSet.length; i++) {
			if (filterList.indexOf(curSet[i].source) < 0) {
				filterList.push(curSet[i].source);
				filterDiv.append("<div>" +
									"<input type='checkbox' name='" + curSet[i].source + "' value='" + curSet[i].source + "' checked></input>" +
									"<label for='" + curSet[i].source + "'>" + curSet[i].source + "</label>" +
								"</div>");
			}
		}
	}
}

function generate(event) {
	event.preventDefault();
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
		var name = generateName(componentBucket).join(" ");

		if (name) {
			resultDiv.append("<li><" + useTag + ">" + name + "</" + useTag + "></li>");
		}
	}
}

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
					if (filter.indexOf(curSet.componentList.components[i].source) > -1) {
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

function generateName(workingList) {
	const result = [];

	for (let i = 0; i < workingList.length; i++) {
		result.push(createNameComponent(workingList[i]));
	}

	return result;
}

function createNameComponent(componentList) {
	var count = 0;
	var random;
	var curList = 0;
	var result = "";

	for (let i = 0; i < componentList.length; i++) {
		count += componentList[i].list.length;
	}

	random = getRandomIndex(count);

	while (componentList[curList].list.length < random) {
		random -= componentList[curList].list.length;
		curList++;
	}

	for (let i = 0; i < componentList[curList].length; i++) {
		var workingList;

		if (i == 0) {
			workingList = componentList[curList].list.filter(element => element[0] != "+");
		} else if (i >= componentList[curList].length -1) {
			workingList = componentList[curList].list.filter(element => element[element.length - 1] != "+");
		} else {
			workingList = componentList[curList].list.filter(element => ((element[0] === "+") && (element[element.length - 1] === "+")));
		}

		result += workingList[getRandomIndex(workingList.length)];
	}

	return result.replace(/\+/g, "");
}

function getRandomIndex(max) {
	return Math.floor(max * Math.random());
}

$.getJSON( "https://thebobbyllama.github.io/eso-roleplay/assets/data/namedata.json?raw=true", initializePage);
$("#race").on("change", createFilters);
$("#generateButton").on("click", generate);