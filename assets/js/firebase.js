// Key obfuscated for Github use.
const dbFragments = [ "AIz", "8dl", "0fr", "DcR", "aSy", "3ix", "Zxt", "N1b", "Ake", "FEM", "cNu", "YPo", "vKU" ];

var database;

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

function dbSanitize(input) {
	return input.replace(/[\s\/]/g, "");
}

function dbSaveCharacter(saveMe, description) {
	if ((saveMe.name) && (saveMe.player)) {
		database.ref("characters/" + dbSanitize(saveMe.name)).set(saveMe);
		database.ref("descriptions/" + dbSanitize(saveMe.name)).set(description);
	}
}

function dbLoadCharacter(getMe, handler, descHandler) {
	database.ref("characters/" + dbSanitize(getMe)).once("value").then(handler);
	dbLoadCharacterDescription(getMe, descHandler);
}

function dbLoadCharacterDescription(getMe, handler) {
	database.ref("descriptions/" + dbSanitize(getMe)).once("value").then(handler);
}

function dbSaveSession(saveMe) {
	database.ref("rp_sessions/" + dbSanitize(saveMe.owner)).set(saveMe);
}

function dbLoadSessionByOwner(owner, handler) {
	var result = database.ref("rp_sessions/" + dbSanitize(owner));
	result.once("value").then(handler);
	return result;
}

function dbLoadSessionByParticipant(participant, handler) {
	database.ref("rp_sessions/").once("value").then(function(returnSet) {
		results = returnSet.val();

		if (results) {
			for (var i = 0; i < results.length; i++) {
				if ((results[i].characters) && (results[i].characters.find(participant))) {
					handler(results[i]);
				}
			}
		}
	});
}