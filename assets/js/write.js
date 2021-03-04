var userInfo = null;
var curCharacter = "";
showdown.extension('Rollplay', showdownRollplay);
var converter = converter = new showdown.Converter({ openLinksInNewWindow: true, extensions: ["Rollplay"] });
var footerTimer;

var storyText = createMDE("storyText");

var story = {
    title: "",
    text: ""
}

/// Called on page startup.
async function initializePage(myUser) {
	if (!myUser) {
		showErrorPopup("User " + firebase.auth().currentUser.displayName + " not found!", divertToLogin);
		return;
	}

	userInfo = myUser;

    loadStory = new URLSearchParams(window.location.search).get("story");

    if (!userInfo.characters.find(item => dbTransform(item) !== curCharacter)) {
        divertToDashboard();
    }

	await localizePage();

    if (loadStory) {
        curCharacter = loadStory.split("|")[0];
        dbLoadStory(loadStory.replace(/\|/, "/"), storyLoaded);
    } else {
        curCharacter = dbTransform(localStorage.getItem("ESORP[character]"));
        pageReady();
    }
}

function pageReady() {
    if (curCharacter) {
        $("#loading").remove();
	    $("#main").removeClass("hideMe");
    } else {
        divertToDashboard();
    }
}

function titleChanged() {
    story.title = nameEncode($("#storyTitle").val());
}

function textChanged() {
    story.text = $("#storyText").val();
}

function saveStory() {
    var identifier = curCharacter + "/" + dbTransform(story.title);
    dbSaveStory(identifier, story, saveSuccessful, showErrorPopup);
}

function saveSuccessful() {
    clearTimeout(footerTimer);

    $("#main h2").empty().attr("id", "storyTitle").text(story.title);
    $("footer").addClass("shown");

    footerTimer = setTimeout(() => { $("footer").removeClass("shown")}, 5000);
}

function storyLoaded(loadMe) {
    story = loadMe;

    if (story) {
        $("#main h2").empty().attr("id", "storyTitle").text(story.title);
        storyText.value(story.text);
        pageReady();
        storyText.codemirror.refresh();
    } else {
        showErrorPopup("The story could not be loaded.", divertToDashboard);
    }
}

function doLogout() {
	showConfirmPopup(localize("LOGOUT_CONFIRM"), confirmLogout);
}

function confirmLogout() {
	firebase.auth().signOut().then(function() {
		// Sign-out successful.
	  }).catch(function(error) {
		// An error happened.
	  });
}

/// Utility function to make a Simple Markdown Editor with our desired configuration.
function createMDE(id) {
    var taEl = document.getElementById(id);
    var result = new SimpleMDE({
        forceSync: true,
        hideIcons: [ "strikethrough", "preview", "side-by-side", "fullscreen", "guide" ],
        element: taEl
    });

    var cm = result.codemirror;
    cm.on("update", function() {
        taEl.value = cm.getValue();

        if ("createEvent" in document) {
            var evt = document.createEvent("HTMLEvents");
            evt.initEvent("change", false, true);
            taEl.dispatchEvent(evt);
        }
        else
            taEl.fireEvent("onchange");
    });

    return result;
}

/// Displays the error modal.
function showErrorPopup(message, callback=null) {
	$("#modalBG, #errorModal").addClass("show");
	$("#errorText").text(message);
	$("#errorButton").off("click").on("click", hidePopup);
	
	if (callback) {
		$("#errorButton").on("click", callback);
	}
}

/// Displays confirm modal.
function showConfirmPopup(message, callback) {
	$("#modalBG").addClass("show");
	$("#confirmModal").addClass("show");
	$("#confirmText").html(message);
	$("#confirmOk").off("click").on("click", callback);
}

/// Displays Markdown preview modal.
function showStoryPreview() {
	$("#previewModal div").empty().append("<h1>" + story.title + "</h1>" + converter.makeHtml(story.text));
	$("#modalBG, #previewModal").addClass("show");
}

/// Displays the help modal.
function showHelpPopup() {
	$("#modalBG, #helpModal").addClass("show");
}

/// Hides all modals.
function hidePopup() {
	$("#modalBG, #modalBG > div").removeClass("show");
}

initializeDB();
firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		dbLoadAccountInfo(user.displayName, initializePage);
	} else {
		divertToLogin();
	}
});

$("nav h1").on("click", divertToDashboard);
$("#logout").on("click", doLogout);
$("#storyTitle").on("change", titleChanged);
$("#storyText").on("change", textChanged);
$("#btnPreview").on("click", showStoryPreview);
$("#btnSave").on("click", saveStory);
$("#btnHelp").on("click", showHelpPopup);
$("button[closeModal]").on("click", hidePopup);