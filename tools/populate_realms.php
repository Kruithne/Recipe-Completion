<?php
	require_once(__DIR__ . '/../lib/api.php');

	$api = new API();
	foreach ($api->getRegions() as $regionID) {
		try {
			$api->setRegion($regionID);
			printfln('Retrieving realms for the %s region.', $api->getRegionName());

			$realms = $api->getRealms(true);
			printfln('%d realms imported!', count($realms));
		} catch (Exception $e) {
			printfln('Unable to retrieve realms for `%s` region...', $api->getSelectedRegionID());
			printfln('Exception: %s', $e->getMessage());
		}
	}