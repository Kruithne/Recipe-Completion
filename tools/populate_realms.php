<?php
	require_once('../lib/api.php');

	$regionData = file_get_json('../data/regions.json');

	foreach (API::getRegions() as $regionID) {
		$region = new API($regionID);

		try {
			printfln('Retrieving realms for the %s region.', $region->getRegionName());
			$realms = $region->getRealms()->realms;

			printfln('%d realms found, importing data..', count($realms));

			$realmStack = [];
			foreach ($realms as $realm)
				$realmStack[$realm->slug] = $realm->name;

			$regionData->$regionID->realms = $realmStack;
		} catch (Exception $e) {
			printfln('Unable to retrieve realms for `%s` region...', $region->getRegionID());
			printfln('Exception: %s', $e->getMessage());
		}
	}

	printfln('Writing new region data..');
	file_put_json(REGION_FILE, $regionData);