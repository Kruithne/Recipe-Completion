$(function() {
	var loadImage = function(url, callback) {
		$('<img/>').attr('src', url).one('load', function() {
			callback(url);
		}).each(function() {
			if (this.complete)
				$(this).load();
		});
	};

	// Setup attribute-driven external links.
	$('.link').each(function() {
		var target = $(this);
		target.on('click', function() {
			window.location.href = target.attr('data-link');
		});
	});

	// Wait for the background image to load before displaying.
	loadImage('images/recipe-background.jpg', function(url) {
		$('#background').css('background-image', 'url(' + url + ')').fadeIn(1000);
	});
});