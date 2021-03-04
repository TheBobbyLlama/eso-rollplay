var showdownRollplay = function () {
	var Rollplay = {
	  type: 'lang',
	  regex: /{(.+)}/g,
	  replace: "<a href='https://eso-rollplay.net/profile.html?character=$1' target='_blank'>$1</a>"
	};
	return [Rollplay];
}