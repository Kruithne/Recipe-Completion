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

	// Dynamic highlighting and tab-indexing.
	$('.input-field').each(function() {
		var field = $(this);
		var label = $('label[for=' + field.attr('id') + ']');
		var next = $('#' + field.attr('data-tab'));

		field.on('focus', function() {
			label.addClass('selected');
		}).on('blur', function() {
			label.removeClass('selected');
		}).on('keypress', function(e) {
			if (e.which === 13) {
				if (next.is('input[type=button]')) {
					next.click();
				} else {
					next.focus();
					setTimeout(function() { next.select(); }, 0);
				}
			}
		});
	});

	// Wait for the background image to load before displaying.
	loadImage('images/recipe-background.jpg', function(url) {
		$('#background').css('background-image', 'url(' + url + ')').fadeIn(1000);
	});
});