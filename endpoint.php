<?php
	error_reporting(0);
	
	require_once(__DIR__ . '/lib/api.php');
	require_once(__DIR__ . '/lib/response.php');

	$response = new Response();

	if ($_SERVER['CONTENT_TYPE'] === 'application/json') {
		$raw = file_get_contents('php://input');
		$decoded = json_decode($raw);

		if ($decoded !== null) {
			switch ($decoded->action) {
				case 'regions':
					$response->regions = (new API())->getCompleteRegionData();
					break;

				default:
					$response->setError('ERR_INV_ACTION', 'Invalid request action.');
					break;
			}
		} else {
			$response->setError('ERR_INV_PAYLOAD', 'Invalid JSON payload.');
		}
	} else {
		$response->setError('ERR_CONTENT_TYPE', 'Invalid payload content type.');
	}

	header('Content-type: application/json');
	echo $response->__toString();