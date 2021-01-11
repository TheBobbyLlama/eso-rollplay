// Key obfuscated for Github use.
const dbFragments = [ "AIz", "8dl", "0fr", "DcR", "aSy", "3ix", "Zxt", "N1b", "Ake", "FEM", "cNu", "YPo", "vKU" ];

var database;
var sessionRef;
var eventRef;

/// Called in page startup functions.
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

/// Adds HTML encoding to a given string.
function nameEncode(name) {
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

/// Removes HTML encoding from a given string.
function nameDecode(name) {
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

/// Helper function to send user back to login.
function divertToLogin() {
	location.replace("./");
}

/// Helper function to send user to dashboard.
function divertToDashboard() {
	location.replace("./dashboard.html");
}

/// Strips all non-alphanumeric characters from a string.
function dbTransform(input) {
	return nameDecode(input).replace(/[\s\W]/g, "").toLowerCase();
}

/// Loads info for the given player.
function dbLoadAccountInfo(name, handler) {
	database.ref("accounts/" + dbTransform(name)).once("value").then((loadMe) => {
		var result = loadMe.val();

		if (result) {
			if (!result.characters) {
				result.characters = [];
			}

			// Save language info immediately
			localStorage.setItem("ESORP[language]", result.language || "");

			if (($) && (result.language) && (result.language !== "EN-US")) {
				$("head").append("<link rel='stylesheet' href='./assets/css/" + result.language + ".css' />");
			}
		}

		handler(result);
	});
}

/// Saves info for the given player.
function dbSaveAccountInfo(name, accountInfo, successCallback = undefined, failureCallback = undefined) {
	database.ref("accounts/" + dbTransform(nameDecode(name))).set(accountInfo)
		.then(function() {
			if (successCallback) {
				successCallback();
			}
		})
		.catch(function(error) {
			if (failureCallback) {
				failureCallback(error);
			}
		});
}

/// Saves a character to the database.
function dbSaveCharacter(saveMe, profile, successCallback = undefined, failureCallback = undefined) {
	if ((saveMe.name) && (saveMe.player)) {
		database.ref("characters/" + dbTransform(saveMe.name)).set(saveMe)
			.then(function() {
				// Yay?
			}).catch(function(error) {
				if (failureCallback) {
					failureCallback(error);
				}
			}
		);

		database.ref("profiles/" + dbTransform(saveMe.name)).set(profile)
			.then(function() {
				// Yay?
			}).catch(function(error) {
				if (failureCallback) {
					failureCallback(error);
				}
			}
		);
		
		database.ref("accounts/" + dbTransform(nameDecode(saveMe.player))).once("value").then(function(loadMe) {
			var result = loadMe.val();

			if (result) {
				if (!result.characters) {
					result.characters = [];
				}

				if (result.characters.indexOf(saveMe.name) < 0) {
					result.characters.push(saveMe.name);
					result.characters = result.characters.sort();
					database.ref("accounts/" + dbTransform(nameDecode(saveMe.player))).set(result);
				}
			} else {
				var newAccount = {
					display: saveMe.player,
					characters: [ saveMe.name ]
				};

				database.ref("accounts/" + dbTransform(nameDecode(saveMe.player))).set(newAccount);
			}

			if (successCallback) {
				successCallback();
			}
		}).catch(function(error) {
			if (failureCallback) {
				failureCallback(error);
			}
		});
	}
}

/// Removes a character from the database.
function dbDeleteCharacter(killMe, successCallback = undefined, failureCallback = undefined) {
	killMe = dbTransform(killMe);

	database.ref("characters/" + killMe).remove()
		.then(function() {
			database.ref("profiles/" + killMe).remove()
			.then(function() {
				if (successCallback) {
					successCallback();
				}
			})
			.catch(function(error) {
				if (failureCallback) {
					failureCallback(error);
				}
			});
		})
		.catch(function(error) {
			if (failureCallback) {
				failureCallback(error);
			}
		});
}

/// Returns a list of characters that belong to the given player.
function dbSearchCharacterByPlayerName(name, handler) {
	database.ref("accounts/" + dbTransform(name) + "/characters").once("value").then(handler);
}

/// Loads a character from the database.
function dbLoadCharacter(getMe, handler, profileHandler=null) {
	database.ref("characters/" + dbTransform(getMe)).once("value").then(handler);
	dbLoadCharacterProfile(getMe, profileHandler);
}

/// Loads a character profile from the database.
function dbLoadCharacterProfile(getMe, handler) {
	if (handler) {
		database.ref("profiles/" + dbTransform(getMe)).once("value").then(handler);
	}
}

/// Loads all characters from the database.
function dbLoadCharacterList(handler) {
	database.ref("characters/").orderByChild("name").once("value").then(handler);
}

/// Loads the session being run by the given owner.
function dbLoadSessionByOwner(owner, handler) {
	dbClearSession();

	sessionRef = database.ref("rp_sessions/" + dbTransform(owner));
	sessionRef.once("value").then(handler);

	return ((sessionRef != null) && (sessionRef != undefined));
}

/// Loads all sessions, then returns a list of the ones that the given character are participating in.
function dbLoadSessionByParticipant(participant, handler) {
	dbClearSession();

	database.ref("rp_sessions/").once("value").then(function(returnSet) {
		if ((!returnSet) || (!returnSet.val())) {
			handler(null);
			return;
		}

		var found = [];
		var results = Object.entries(returnSet.val());

		for (var i = 0; i < results.length; i ++) {
			var tryMe = results[i][1];

			if ((!tryMe.inactive) && (tryMe.characters) && (tryMe.characters.indexOf(participant) > -1)) {
				found.push(tryMe.owner);
			}
		}

		handler(found);
	});
}

/// Saves the current session on its reference.
function dbSaveSession(saveMe) {
	if (sessionRef) {
		sessionRef.set(saveMe);
		return true;
	} else {
		return false;
	}
}

/// Deletes the current session in the database.
function dbDeleteSession() {
	if (sessionRef) {
		sessionRef.remove();

		if (eventRef) {
			eventRef.remove();
		}
	}
}

/// Deletes open references to a session.
function dbClearSession() {
	sessionRef = null;

	if (eventRef) {
		eventRef.off();
	}

	eventRef = null;
}

/// Sets a callback on the current session reference.
function dbBindCallbackToSession(eventName, handler) {
	if (sessionRef) {
		sessionRef.on(eventName, handler);
		return true;
	} else {
		return false;
	}
}

/// Sets up an event system on the given owner's session.
function dbLoadEventMessages(owner, handler) {
	eventRef = database.ref("rp_session_events/" + dbTransform(owner));
	eventRef.once("value").then(handler);

	return ((eventRef != null) && (eventRef != undefined));
}

/// Deletes open event system reference.
function dbClearEventSystem() {
	dbClearEventCallbacks();
	eventRef = null;
}

/// Pushes an event to the current event system reference.
function dbPushEvent(event) {
	if (eventRef) {
		eventRef.push(event);
		return true;
	} else {
		return false;
	}
}

/// Sets a callback on the current event system reference.
function dbBindCallbackToEventSystem(eventName, handler) {
	if (eventRef) {
		eventRef.on(eventName, handler);
		return true;
	} else {
		return false;
	}
}

/// Removes all callbacks onthe current event system reference.
function dbClearEventCallbacks() {
	if (eventRef) {
		eventRef.off();
	}
}