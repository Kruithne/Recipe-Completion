$(function() {
	var loadImage = function(url, callback) {
		$('<img/>').attr('src', url).one('load', function() {
			if (typeof(callback) === 'function')
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
		exportBox.val('');
		background.animate({ opacity: 0.5 }, 1000);
		professionDisplay.empty();
	};

	var markAsInvalid = function(elem) {
		elem.append($('<div/>').addClass('nope'));
	};

	var recipeIsKnown = function(recipeID, recipes) {
		return $.inArray(recipeID, recipes) > -1;
	};

	var renderProfession = function(data, recipes, character) {
		var container = $('<div/>').addClass('profession').appendTo(professionDisplay);
		var header = $('<h1/>').appendTo(container).text(data.name);
		var progressBar = $('<div/>').addClass('profession-pct-bar').appendTo(container);
		var progressBarInner = $('<div/>').addClass('inner').appendTo(progressBar);
		var progressBarText = $('<div/>').addClass('shadow').appendTo(progressBar);

		container.attr('data-name', data.name);

		var isEngineering = data.name === 'Engineering';
		var hasGoblinEngineering = false;
		var hasGnomishEngineering = false;

		var totalAvailableCount = 0;
		var totalObtainedCount = 0;

		for (var s = 0; s < data.sections.length; s++) {
			var sectionData = data.sections[s];
			var section = $('<div/>').addClass('profession-block').appendTo(container);
			var sectionHeader = $('<h2>').text(sectionData.name).appendTo(section);

			var isGoblinEngineering = isEngineering && sectionData.name === 'Goblin Engineering';
			var isGnomishEngineering = isEngineering && sectionData.name === 'Gnomish Engineering';

			section.attr('data-name', sectionData.name);

			for (var r = 0; r < sectionData.recipes.length; r++) {
				var recipeData = sectionData.recipes[r];
				var recipe = $('<div/>').addClass('icon').appendTo(section);
				var background = $('<div/>').addClass('background').appendTo(recipe);

				background.html('<a class="icon-link" href="http://www.wowhead.com/spell=' + recipeData.spellID + '"></a>');

				var recipeName = recipeData.name;
				var recipeWorth = 1;

				background.css('background-image', 'url(images/' + data.image + ')');
				background.css('background-position', '-' + (recipeData.iconIndex * 36) + 'px 0');

				if (isGoblinEngineering)
					recipe.addClass('goblin-engineering');
				else if (isGnomishEngineering)
					recipe.addClass('gnomish-engineering');

				var spellID = recipeData.spellID;
				if (Array.isArray(spellID)) {
					var knownRanks = 0;

					for (var i = 0; i < spellID.length; i++) {
						if (recipeIsKnown(spellID[i], recipes)) {
							knownRanks = i + 1;
							break;
						}
					}

					var displayRank = Math.min(knownRanks, spellID.length - 1);
					recipeName = recipeData.name + ' (Rank ' + (displayRank + 1 ) + ')';
					recipe.attr('data-tooltip', recipeName + '\n' + recipeData.source[displayRank]);
					totalObtainedCount += knownRanks;
					recipeWorth = knownRanks;

					if (knownRanks === spellID.length) {
						// Player has all ranks of this recipe.
						recipe.addClass('known');
					} else if (knownRanks > 0) {
						// Player has some ranks of this recipe.
						recipe.addClass('incomplete');
					} else {
						// Player does not have any ranks of this recipe.
						recipe.addClass('unknown');
					}
				} else {
					recipe.attr('data-tooltip', recipeName + '\n' + recipeData.source);

					if (recipeIsKnown(spellID, recipes)) {
						recipe.addClass('known');
						totalObtainedCount++;

						if (isGoblinEngineering)
							hasGoblinEngineering = true;
						else if (isGnomishEngineering)
							hasGnomishEngineering = true;
					} else {
						recipe.addClass('unknown');
					}
				}

				recipe.attr('data-name', recipeName);

				var isInvalid = false;
				if (typeof(recipeData.faction) !== 'undefined' && recipeData.faction !== character.faction)
					isInvalid = true;

				if (typeof(recipeData.classes) !== 'undefined' && $.inArray(character.class, recipeData.classes) < 0)
					isInvalid = true;

				if (recipeData.broken)
					isInvalid = true;

				if (isInvalid)
					markAsInvalid(recipe);
				else
					totalAvailableCount += recipeWorth;
			}
		}

		if (isEngineering) {
			if (hasGnomishEngineering)
				$('.goblin-engineering').each(function() { markAsInvalid($(this)); totalAvailableCount--; });
			else if (hasGoblinEngineering)
				$('.gnomish-engineering').each(function() { markAsInvalid($(this)); totalAvailableCount--; });
		}

		var pct = (totalObtainedCount / totalAvailableCount) * 100;
		progressBarText.text(totalObtainedCount + ' / ' + totalAvailableCount + ' (' + Math.floor(pct) + '%)');
		progressBarInner.animate({ width: pct + '%' }, 500);
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

				if (data.character !== null) {
					var professions = data.character.professions;

					// Prepare primary professions..
					for (var p = 0; p < professions.primary.length; p++)
						prepareProfession(professions.primary[p], data.character);

					// Prepare secondary professions..
					for (var s = 0; s < professions.secondary.length; s++)
						prepareProfession(professions.secondary[s], data.character);
				} else {
					setErrorStatus('Character not found');
				}
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

	// Register click listener for the export navigation button
	var exportWindow = $('#export-panel');
	var exportBox = $('#export');
	$('#nav-export').on('click', function() {
		var exportText = '';

		$('.profession').each(function() {
			var profession = $(this);
			exportText += profession.attr('data-name') + '\n';

			profession.find('.profession-block').each(function() {
				var section = $(this);
				var recipes = section.find('.icon.unknown,.icon.incomplete');

				if (recipes.length > 0) {
					exportText += '\t' + section.attr('data-name') + '\n';
					recipes.each(function() {
						var recipe = $(this);
						if (!recipe.hasClass('invalid'))
							exportText += '\t\t' + $(this).attr('data-name') + '\n';
					});
				}
			});
		});

		exportBox.val(exportText);
		exportWindow.show().css('display', 'flex');
	});

	// Register click listener for the export 'Close' button
	$('#export-close').on('click', function() {
		exportWindow.hide();
	});
});