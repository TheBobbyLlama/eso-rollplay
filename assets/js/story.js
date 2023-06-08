var story;
showdown.extension('Rollplay', showdownRollplay);
var converter = converter = new showdown.Converter({ openLinksInNewWindow: true, extensions: ["Rollplay"] });

/// Called on page startup.
function initializePage() {
	const loadStory = new URLSearchParams(window.location.search).get("s");
    const minimal = new URLSearchParams(window.location.search).get("minimal");

    initializeDB();

    $("nav").toggleClass("hideMe", !!minimal);

    if (loadStory) {
		const charName = loadStory.split("|")[0];

		dbLoadSingleItem("characters/" + charName + "/name", nameLoaded);
		dbLoadSingleItem("profiles/" + charName + "/image", imageLoaded);
        dbLoadStory(loadStory.replace(/\|/, "/"), storyLoaded);
    } else {
        showErrorPopup("No story specified", divertToDashboard);
    }
}

function nameLoaded(data) {
	const charName = data.val();

	if (charName) {
		$("#header a").attr("href", "./profile.html?character=" + charName).attr("title", charName);
	}
}

function storyLoaded(data) {
    story = data;

    document.title = nameDecode(story.title) + " - ESO Rollplay";
	$("#header h1").empty().append(htmlCleanup(story.title));
    $("#main").append(converter.makeHtml(htmlCleanup(story.text)));
    $("#loading").remove();
	$("#body, #header").removeClass("hideMe");
}

function imageLoaded(data) {
	const image = data.val();
	
	if (image) {
		$("#header img").attr("src", image);
		$("#header img").removeClass("hideMe");
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

initializePage();