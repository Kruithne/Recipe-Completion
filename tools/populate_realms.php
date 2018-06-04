<?php
	require_once(__DIR__ . '/../lib/api.php');
	$regionData = file_get_json(REGION_FILE);

	foreach (API::getRegions() as $regionID) {
		$region = new API($regionID);

		try {
			printfln('Retrieving realms for the %s region.', $region->getRegionName());
			$realms = $region->getRealms(true);

			printfln('%d realms imported!', count($realms));
		} catch (Exception $e) {
			printfln('Unable to retrieve realms for `%s` region...', $region->getRegionID());
			printfln('Exception: %s', $e->getMessage());
		}
	}

	printfln('Writing new region data..');
	file_put_json(REGION_FILE, $regionData);