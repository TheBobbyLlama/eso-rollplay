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

function dbSaveCharacter(saveMe) {
	if ((saveMe.name) && (saveMe.player)) {
		database.ref(("characters/" + saveMe.name).replace(/ /g, "")).set(saveMe);
	}
}

function dbLoadCharacter(getMe, handler) {
	getMe = getMe.replace(/ /g, "");
	firebase.database().ref('characters/' + getMe).once('value').then(handler);
}