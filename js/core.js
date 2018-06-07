$(function() {
	var loadImage = function(url, callback) {
		$('<img/>').attr('src', url).one('load', function() {
			callback(url);
		}).each(function() {
			if (this.complete)
				$(this).load();
		});
	};

	var api = function(req, callback) {
		$.ajax({
			url: 'endpoint.php',
			type: 'POST',
			contentType: 'application/json',
			dataType: 'json',
			async: true,
			data: JSON.stringify(req),
			success: callback
		});
	};

	var statusElement = $('#status');
	var statusText = statusElement.find('span').first();

	var setStatus = function(text) {
		statusText.text(text);
		return statusElement.removeClass('pending error').show().css('display', 'flex');
	};

	var setPendingStatus = function(text) {
		setStatus(text).addClass('pending');
	};

	var setErrorStatus = function(text) {
		setStatus(text).addClass('error');
	};

	var hideStatus = function() {
		statusElement.hide();
	};

	var selectedRealm = null;

	var realmDropDown = $('#realm-drop');
	var realmField = $('#field-realm');
	var realmContainers = [];

	var characterField = $('#field-character');

	var selectOption = function(option) {
		selectedRealm = { region: option.attr('data-region'), realm: option.attr('data-slug') };
		realmField.val(option.text() + ' (' + selectedRealm.region.toUpperCase() + ')');
	};

	var hideRealmDropDown = function() {
		realmDropDown.hide();
		realmField.removeClass('activated');

		var filter = realmField.val().trim().toLowerCase();
		if (selectedRealm === null && filter.length > 0) {
			$('.realm-option').each(function() {
				var option = $(this);
				if (option.attr('data-name').startsWith(filter)) {
					selectOption(option);
					return false;
				}
			});
		}
	};

	var showRealmDropDown = function(filter) {
		filter = filter.trim().toLowerCase();
		selectedRealm = null;

		if (filter.length > 0) {
			realmDropDown.show();
			realmField.addClass('activated');

			for (var i = 0; i < realmContainers.length; i++) {
				var realmContainer = realmContainers[i];
				var displayCount = 0;

				realmContainer.children('.realm-option').each(function() {
					var option = $(this);

					if (option.attr('data-name').startsWith(filter)) {
						option.show();
						displayCount++;
					} else {
						option.hide();
					}
				});

				displayCount > 0 ? realmContainer.show() : realmContainer.hide();
			}
		} else {
			hideRealmDropDown();
		}
	};

	// Populate realm list.
	api({ action: 'regions' }, function(res) {
		if (!res.error) {
			var regions = res.regions;
			for (var regionID in regions) {
				if (regions.hasOwnProperty(regionID)) {
					var region = regions[regionID];
					var container = $('<div/>').addClass('realm-container').appendTo(realmDropDown);
					$('<div/>').addClass('realm-header').text(region.name).appendTo(container);

					var realms = region.realms;
					for (var realmSlug in realms) {
						if (realms.hasOwnProperty(realmSlug))
							$('<div/>')
								.addClass('realm-option')
								.text(realms[realmSlug])
								.attr('data-region', regionID)
								.attr('data-name', realms[realmSlug].toLowerCase() + ' (' + regionID + ')')
								.attr('data-slug', realmSlug)
								.appendTo(container);
					}

					realmContainers.push(container);
				}
			}
		} else {
			console.error('Encountered API error when retrieving realms: %o', res);
		}

		// Invoked once the realm data is obtained to validate any cached
		// value the user's browser has added to the input field.
		hideRealmDropDown();
	});

	// Listen for any clicks on .realm-option elements.
	$(document).on('mouseenter click touchstart', '.realm-option', function() {
		selectOption($(this));
	});

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

	// Set-up realm selection list.
	realmField.on('focus input', function() {
		showRealmDropDown($(this).val());
	}).on('blur', function() {
		hideRealmDropDown();
	});

	// Register a click listener for the search button.
	$('#button-search').on('click', function() {
		// Ensure the user has selected a realm..
		if (selectedRealm === null) {
			setErrorStatus('Please select a valid realm first.');
			return;
		}

		// Basic validation for the entered character name..
		var characterName = characterField.val().trim().toLowerCase();
		if (characterName.length === 0 || characterName.length > 12) {
			setErrorStatus('Please enter a valid character name first.');
			return;
		}

		setPendingStatus('Obtaining character profession data...');

		api({
			action: 'character',
			region: selectedRealm.region,
			realm: selectedRealm.realm,
			character: characterName
		}, function() {
			hideStatus();
		});
	});

	// Wait for the background image to load before displaying.
	loadImage('images/recipe-background.jpg', function(url) {
		$('#background').css('background-image', 'url(' + url + ')').fadeIn(1000);
	});
});