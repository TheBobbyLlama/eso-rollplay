// Key obfuscated for Github use.
const dbFragments = [ "AIz", "8dl", "0fr", "DcR", "aSy", "3ix", "Zxt", "N1b", "Ake", "FEM", "cNu", "YPo", "vKU" ];

var database;
var sessionRef;
var eventRef;

function initializeDB() {
	var buildKey = "";

	for (var i = 0; i < dbFragments.length; i++) {
		buildKey += dbFragments[(17 * i) % dbFragments.length];
	}

	var firebaseConfig = {
		apiKey: buildKey,
		authDomain: "eso-roleplay.firebaseapp.com",
		databaseURL: "https://eso-roleplay.firebaseio.com",
		projectId: "eso-roleplay",
		storageBucket: "eso-roleplay.appspot.com",
		messagingSenderId: "119094011178",
		appId: "1:119094011178:web:0954057546a32fda3e6a53"
	  };
	// Initialize Firebase
	firebase.initializeApp(firebaseConfig);
	database = firebase.database();
}

function nameEncode(name) {
	//return name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&apos;").replace(/"/g, "&quot");
	return name.replace(/[&<>'"]/g, function(match) {
		switch (match)
		{
			case "&":
				return "&amp;";
			case "<":
				return "&lt;";
			case ">":
				return "&gt;";
			case "'":
				return "&apos;";
			case "\"":
				return "&quot;";
			default:
				return "[ENCODING ERROR!]"
		}
	})
}

function nameDecode(name) {
	//return name.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&apos;/g, "'").replace(/&amp;/g, "&");
	return name.replace(/&amp;|&lt;|&gt;|&apos;|&quot;/g, function (match) {
		switch (match)
		{
			case "&amp;":
				return "&";
			case "&lt;":
				return "<";
			case "&gt;":
				return ">";
			case "&apos;":
				return "'";
			case "&quot;":
				return "\"";
			default:
				return "[DECODING ERROR!]"
		}
	})
}

function dbSanitize(input) {
	return nameDecode(input).replace(/[\s\W]/g, "").toLowerCase();
}

function dbSaveCharacter(saveMe, description) {
	if ((saveMe.name) && (saveMe.player)) {
		database.ref("characters/" + dbSanitize(saveMe.name)).set(saveMe);
		database.ref("descriptions/" + dbSanitize(saveMe.name)).set(description);
	}
}

function dbLoadCharacter(getMe, handler, descHandler=null) {
	database.ref("characters/" + dbSanitize(getMe)).once("value").then(handler);
	dbLoadCharacterDescription(getMe, descHandler);
}

function dbLoadCharacterDescription(getMe, handler) {
	if (handler) {
		database.ref("descriptions/" + dbSanitize(getMe)).once("value").then(handler);
	}
}

function dbLoadCharacterList(handler) {
	database.ref("characters/").orderByChild("name").once("value").then(handler);
}

function dbSaveSession(saveMe) {
	database.ref("rp_sessions/" + dbSanitize(saveMe.owner)).set(saveMe);
}

function dbLoadSessionByOwner(owner, handler) {
	dbClearSession();

	sessionRef = database.ref("rp_sessions/" + dbSanitize(owner));
	sessionRef.once("value").then(handler);

	return ((sessionRef != null) && (sessionRef != undefined));
}

function dbLoadSessionByParticipant(participant, handler) {
	dbClearSession();

	database.ref("rp_sessions/").once("value").then(function(returnSet) {
		if ((!returnSet) || (!returnSet.val())) {
			handler(null);
			return;
		}

		var results = Object.entries(returnSet.val());

		for (var i = 0; i < results.length; i ++) {
			var tryMe = results[i][1];

			if ((!tryMe.inactive) && (tryMe.characters) && (tryMe.characters.indexOf(participant) > -1)) {
				handler(tryMe);
				return;
			}
		}

		handler(null);
	});
}

function dbSaveSession(saveMe) {
	if (sessionRef) {
		sessionRef.set(saveMe);
		return true;
	} else {
		return false;
	}
}

function dbDeleteSession() {
	if (sessionRef) {
		sessionRef.remove();

		if (eventRef) {
			eventRef.remove();
		}
	}
}

function dbClearSession() {
	sessionRef = null;

	if (eventRef) {
		eventRef.off();
	}

	eventRef = null;
}

function dbBindCallbackToSession(eventName, handler) {
	if (sessionRef) {
		sessionRef.on(eventName, handler);
		return true;
	} else {
		return false;
	}
}

function dbLoadEventMessages(owner, handler) {
	eventRef = database.ref("rp_session_events/" + dbSanitize(owner));
	eventRef.once("value").then(handler);

	return ((eventRef != null) && (eventRef != undefined));
}

function dbClearEventSystem() {
	dbClearEventCallbacks();
	eventRef = null;
}

function dbPushEvent(event) {
	if (eventRef) {
		eventRef.push(event);
		return true;
	} else {
		return false;
	}
}

function dbBindCallbackToEventSystem(eventName, handler) {
	if (eventRef) {
		eventRef.on(eventName, handler);
		return true;
	} else {
		return false;
	}
}

function dbClearEventCallbacks() {
	if (eventRef) {
		eventRef.off();
	}
}