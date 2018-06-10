<?php
	require_once(__DIR__ . '/../lib/api.php');
	define('DEFAULT_ICON', 'inv_misc_questionmark');
	define('ICON_DIMENSION', 36);
	define('ICON_MATRIX_PATH', __DIR__ . '/../images/%s');

	$api = new API();

	// Ensure the default icon has been downloaded.
	$api->getIconImagePath(DEFAULT_ICON, true);

	// Iterate over all available professions.
	foreach ($api->getProfessions() as $profession) {
		$data = $api->getProfession($profession);

		// DEBUG: Remove this once we're done.
		if (!isset($data->image)) {
			printfln('No image file set for profession %s!', $data->name);
			continue;
		}

		$icons = [];
		printfln('Updating icons for %s...', $data->name);

		// Iterate over all sections within the profession.
		foreach ($data->sections as $section) {
			// Iterate over all recipes in the section.
			foreach ($section->recipes as $recipe) {
				// Obtain icon string from API if missing.
				if (!isset($recipe->icon)) {
					printfln('Updating icon for %s', $recipe->name);

					$recipeData = $api->getSpell(is_array($recipe->spellID) ? $recipe->spellID[0] : $recipe->spellID);
					$recipe->icon = $recipeData->icon;

					// If the icon cannot be downloaded, revert to default icon.
					$icon = $api->getIconImagePath($recipe->icon, true);
					if ($icon === null)
						$recipe->icon = DEFAULT_ICON;
				}

				// Ensure an icon file for this recipe actually exists.
				$iconPath = sprintf(ICON_FILE, $recipe->icon);
				if (!file_exists($iconPath)) {
					$recipe->icon = DEFAULT_ICON;
					$iconPath = sprintf(ICON_FILE, DEFAULT_ICON);
				}

				$key = array_search($iconPath, $icons, true);
				if ($key === false) {
					$recipe->iconIndex = count($icons);
					array_push($icons, $iconPath);
				} else {
					$recipe->iconIndex = $key;
				}
			}
		}

		printfln('Creating icon matrix...');
		$canvasHeight = ICON_DIMENSION;
		$canvasWidth = count($icons) * ICON_DIMENSION;
		$canvas = imagecreatetruecolor($canvasWidth, $canvasHeight);

		$iconIndex = 0;
		foreach ($icons as $iconPath) {
			$icon = imagecreatefromjpeg($iconPath);
			imagecopyresampled($canvas, $icon, $iconIndex * ICON_DIMENSION, 0, 0, 0, ICON_DIMENSION, ICON_DIMENSION, ICON_DIMENSION, ICON_DIMENSION);
			$iconIndex++;
		}

		$outPath = sprintf(ICON_MATRIX_PATH, $data->image);
		imagejpeg($canvas, $outPath, 75);
		printfln('Icon matrix output to %s with %d icons', $outPath, count($icons));

		$api->saveProfession($profession, $data);
	}