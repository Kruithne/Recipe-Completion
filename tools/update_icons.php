<?php
	require_once(__DIR__ . '/../lib/api.php');

	$api = new API();

	foreach ($api->getProfessions() as $profession) {
		$data = $api->getProfession($profession);
		printfln('Updating icons for %s...', $data->name);

		foreach ($data->sections as $section) {
			foreach ($section->recipes as $recipe) {
				if (!isset($recipe->icon)) {
					printfln('Updating icon for %s', $recipe->name);

					$recipeData = $api->getSpell($recipe->spellID);
					$recipe->icon = $recipeData->icon;

					$api->getIconImage($recipe->icon, true);
				}
			}
		}

		$api->saveProfession($profession, $data);
	}