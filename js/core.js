$(function() {
	var loadImage = function(url, callback) {
		$('<img/>').attr('src', url).one('load', function() {
			callback(url);
		}).each(function() {
			if (this.complete)
				$(this).trigger('load');
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

	var background = $('#background');
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

	var getProfessionNameSlug = function(professionName) {
		return professionName.replace(/\s+/, '-').toLowerCase();
	};

	var professionDisplay = $('#profession-display');

	var clearProfessions = function() {
		background.animate({ opacity: 0.5 }, 1000);
		professionDisplay.empty();
	};

	var markAsInvalid = function(elem) {
		elem.append($('<div/>').addClass('nope'));
	};

	var renderProfession = function(data, recipes, character) {
		var container = $('<div/>').addClass('profession').appendTo(professionDisplay);
		var header = $('<h1/>').appendTo(container).text(data.name);
		var progressBar = $('<div/>').addClass('profession-pct-bar').appendTo(container);

		var isEngineering = data.name === 'Engineering';
		var hasGoblinEngineering = false;
		var hasGnomishEngineering = false;

		for (var s = 0; s < data.sections.length; s++) {
			var sectionData = data.sections[s];
			var section = $('<div/>').addClass('profession-block').appendTo(container);
			var sectionHeader = $('<h2>').text(sectionData.name).appendTo(section);

			var isGoblinEngineering = isEngineering && sectionData.name === 'Goblin Engineering';
			var isGnomishEngineering = isEngineering && sectionData.name === 'Gnomish Engineering';

			for (var r = 0; r < sectionData.recipes.length; r++) {
				var recipeData = sectionData.recipes[r];
				var recipe = $('<div/>').addClass('icon').appendTo(section);
				var background = $('<div/>').addClass('background').appendTo(recipe);

				recipe.attr('data-tooltip', recipeData.name + '\n' + recipeData.source);

				(function(bg) {
					loadImage('icon.php?id=' + recipeData.icon, function(url) {
						bg.css('background-image', 'url(' + url + ')');
					});
				})(background);

				if (isGoblinEngineering)
					recipe.addClass('goblin-engineering');
				else if (isGnomishEngineering)
					recipe.addClass('gnomish-engineering');

				if ($.inArray(recipeData.spellID, recipes) > -1) {
					recipe.addClass('known');

					if (isGoblinEngineering)
						hasGoblinEngineering = true;
					else if (isGnomishEngineering)
						hasGnomishEngineering = true;
				} else {
					recipe.addClass('unknown');
				}

				var isInvalid = false;
				if (typeof(recipeData.faction) !== 'undefined' && recipeData.faction !== character.faction) {
					// ToDo: Add invalid faction info to tooltip.
					isInvalid = true;
				}

				if (typeof(recipeData.classes) !== 'undefined' && $.inArray(character.class, recipeData.classes) < 0) {
					// ToDo: Add invalid class info to tooltip.
					isInvalid = true;
				}

				if (recipeData.broken) {
					// ToDo: Add broken notice to tooltip.
					isInvalid = true;
				}

				if (isInvalid)
					markAsInvalid(recipe);
			}
		}

		if (isEngineering) {
			if (hasGnomishEngineering)
				$('.goblin-engineering').each(function() { markAsInvalid($(this)); });
			else if (hasGoblinEngineering)
				$('.gnomish-engineering').each(function() { markAsInvalid($(this)); });
		}
	};

	var preparing = 0;
	var prepareProfession = function(data, character) {
		setPendingStatus('Obtaining profession data...');
		preparing++;

		api({
			action: 'profession',
			profession: getProfessionNameSlug(data.name)
		}, function(res) {
			// Render the profession if we have data for it.
			if (res.error === false)
				renderProfession(res.profession, data.recipes, character);

			preparing--;

			// Only hide the pending status if all downloads are done.
			if (preparing === 0)
				hideStatus();
		});
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

	var doc = $(document);

	// Listen for any clicks on .realm-option elements.
	doc.on('mouseenter click touchstart', '.realm-option', function() {
		selectOption($(this));
	});

	// Hook mouse events for recipe tooltips.
	doc.on('mouseenter', '.profession-block .icon', function(e) {
		var icon = $(this).addClass('tooltip');
		var delta = e.clientX / document.body.clientWidth;

		if (delta < 0.2)
			icon.addClass('tooltip-right');
		else if (delta > 0.8)
			icon.addClass('tooltip-left');
		else
			icon.addClass('tooltip-top');
	}).on('mouseleave', '.profession-block .icon', function() {
		var icon = $(this);
		icon.removeClass('tooltip tooltip-top tooltip-left tooltip-right');
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
		// Prevent searching while data is downloading..
		if (preparing > 0)
			return;

		// Ensure the user has selected a realm..
		if (selectedRealm === null) {
			setErrorStatus('Please select a valid realm first.');
			return;
		}

		// Basic validation for the entered character name..
		var characterName = characterField.val().trim().toLowerCase();
		if (characterName.length < 2 || characterName.length > 12) {
			setErrorStatus('Please enter a valid character name first.');
			return;
		}

		setPendingStatus('Obtaining character profession data...');

		api({
			action: 'character',
			region: selectedRealm.region,
			realm: selectedRealm.realm,
			character: characterName
		}, function(data) {
			if (data.error === false) {
				hideStatus();
				clearProfessions();

				var professions = data.character.professions;

				// Prepare primary professions..
				for (var p = 0; p < professions.primary.length; p++)
					prepareProfession(professions.primary[p], data.character);

				// Prepare secondary professions..
				for (var s = 0; s < professions.secondary.length; s++)
					prepareProfession(professions.secondary[s], data.character);
			} else {
				console.error(data.errorMessage);
				setErrorStatus('Unable to retrieve character.');
			}
		});
	});

	// Wait for the background image to load before displaying.
	loadImage('images/recipe-background.jpg', function(url) {
		background.css('background-image', 'url(' + url + ')').fadeIn(1000);
	});

	// Pre-load the default icon for recipe displays.
	loadImage('icon.php?id=inv_misc_questionmark', function() {});
});