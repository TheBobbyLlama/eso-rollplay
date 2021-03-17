var SLIDESHOW = [
	{
		image: "./assets/images/slideshow/CharSheet.jpg",
		caption: "Create Your Characters!"
	},
	{
		image: "./assets/images/slideshow/Profile.jpg",
		caption: "Take Your Profiles to ESO!"
	},
	{
		image: "./assets/images/slideshow/Rollplay.jpg",
		caption: "Roll the Dice!"
	},
	{
		image: "./assets/images/slideshow/Adventure.jpg",
		caption: "Make RP an Adventure!"
	},
];

var curSlide = -1;
var slides = $(".slideshow .slide");
var listener;

function advanceSlide() {
	curSlide = (curSlide + 1) % SLIDESHOW.length;

	slides[curSlide % 2].className = "slide shown";
	slides[(curSlide + 1) % 2].className = "slide";

	$(".slideshow .caption p").removeClass("shown");

	listener = setTimeout(queueNextSlide, 2000);
}

function queueNextSlide() {
	var nextSlide = (curSlide + 1) % SLIDESHOW.length;

	$(".slideshow .caption p").addClass("shown").text(SLIDESHOW[curSlide].caption);
	slides[nextSlide % 2].style.background = "url('" + SLIDESHOW[nextSlide].image + "')";
	slides[nextSlide % 2].className = "slide waiting";
	listener = setTimeout(advanceSlide, 5000);
}

advanceSlide();
// Override the normal event cycle and queue the next slide immediately.
clearTimeout(listener);
listener = setTimeout(queueNextSlide, 100);