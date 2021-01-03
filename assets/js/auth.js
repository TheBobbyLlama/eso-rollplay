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
		var accountName = initializingUser.displayName;

		initializingUser.delete().then(() => {
			showErrorPopup("The ESO Username " + accountName + " is already in use.", divertToLogin);
		}).catch(function(error) {
			showErrorPopup(error, divertToLogin);
		})
	} else {
		// Don't let new users use '@' at the beginning of their account name.
		result = {
			display: initializingUser.displayName.replace(/^@/, "")
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
