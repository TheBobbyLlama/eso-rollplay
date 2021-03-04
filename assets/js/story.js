var story;
showdown.extension('Rollplay', showdownRollplay);
var converter = converter = new showdown.Converter({ openLinksInNewWindow: true, extensions: ["Rollplay"] });

/// Called on page startup.
function initializePage() {
	var loadStory = new URLSearchParams(window.location.search).get("s");
    var minimal = new URLSearchParams(window.location.search).get("minimal");

    initializeDB();

    $("nav").toggleClass("hideMe", !!minimal);

    if (loadStory) {
        dbLoadStory(loadStory.replace(/\|/, "/"), storyLoaded);
    } else {
        showErrorPopup("No story specified", divertToDashboard);
    }
}

function storyLoaded(data) {
    story = data;

    document.title = story.title + " - ESO Rollplay";
    $("#main").append("<h1>" + story.title + "</h1>" + converter.makeHtml(story.text));
    $("#loading").remove();
	$("#main").removeClass("hideMe");
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