<?php
	define('DATA_PATH', __DIR__ . '/../data/professions/');
	foreach (scandir(DATA_PATH) as $node) {
		if ($node === '.' || $node === '..')
			continue;

		$filePath = DATA_PATH . $node;
		$data = json_decode(file_get_contents($filePath));
		foreach ($data->sections as $section) {
			if (substr( $section->name, 0, 9 ) === "Kul Tiran") {
				foreach ($section->recipes as $recipe) {
					if (is_array($recipe->spellID)) {
						sort($recipe->spellID);
					}
				}
			}
		}

		file_put_contents($filePath, json_encode($data));
	}