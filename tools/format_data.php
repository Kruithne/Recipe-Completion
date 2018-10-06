<?php
	$dataString = str_replace("#", " ", ltrim(file_get_contents('input.txt'), ";"));
	$recipes = explode(";", $dataString);

	$sorted = [];

	foreach ($recipes as $recipe) {
		list($name, $id, $rank) = explode(",", $recipe);
		if (!array_key_exists($name, $sorted)) {
			$sorted[$name] = [intval($id)];
		} else {
			array_push($sorted[$name], intval($id));
		}
	}

	$output = [];
	foreach ($sorted as $recipeName => $recipeRanks) {
		$node = ["name" => $recipeName];

		if (count($recipeRanks) > 1) {
			$node["spellID"] = $recipeRanks;
			$node["source"] = ["", "", ""];
		} else {
			$node["spellID"] = $recipeRanks[0];
			$node["source"] = "";
		}

		array_push($output, $node);
	}

	file_put_contents("output.json", json_encode($output));