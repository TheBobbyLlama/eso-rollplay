var authUI;
var initializingUser = null;

/// Called on page startup.
function initializePage() {
	authUI = new firebaseui.auth.AuthUI(firebase.auth());

	authUI.start("#auth-panel", {
		signInSuccessUrl: "./dashboard.html",
		signInOptions: [
			{
				provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
			}
		],
		credentialHelper: firebaseui.auth.CredentialHelper.NONE,
		callbacks: {
			uiShown: function() {
				$("#loading").hide();
			},
			signInSuccessWithAuthResult: function(authResult, redirectUrl) {
				if (authResult.additionalUserInfo.isNewUser) {
					initializingUser = authResult.user;
					dbLoadAccountInfo(authResult.user.displayName, checkAccountInfo);
					return false;
				} else {
					return true;
				}
			},
		}
	});
}

function checkAccountInfo(result) {
	if (result) {
		showErrorPopup("The " + initializingUser.displayName + " account already exists!  Your new account is now linked.", divertToDashboard);
		// TODO - Error handling!  This should delete the account and make the user start over.
	} else {
		result = {
			display: initializingUser.displayName
		}

		dbSaveAccountInfo(initializingUser.displayName, result, divertToDashboard, showErrorPopup);
	}
}

/// Displays confirm modal.
function showConfirmPopup(message, callback) {
	$("#modalBG").addClass("show");
	$("#confirmModal").addClass("show");
	$("#confirmText").html(message);
	$("#confirmOk").off("click").on("click", callback);
}

/// Displays error modal.
function showErrorPopup(message, callback=null) {
	$("#modalBG").addClass("show");
	$("#errorModal").addClass("show");
	$("#errorText").text(message);
	$("#errorButton").off("click");
	
	if (callback) {
		$("#errorButton").on("click", callback);
	}
}

/// Hides all modals.
function hidePopup() {
	$("#modalBG").removeClass("show");
	$("#modalBG > div").removeClass("show");
}

initializeDB();
firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		if (!initializingUser) {
			location.replace("./dashboard.html");
		}
	} else {
		initializePage();
	}
});
