<?php
	error_reporting(0);

	require_once(__DIR__ . '/lib/api.php');

	session_cache_limiter(false);
	header('Cache-Control: private');

	$api = new API();
	$iconName = 'inv_misc_questionmark';

	$inputIconName = $_GET['id'];
	if (is_string($inputIconName)) {
		$inputIconName = trim(preg_replace('/[^a-z0-9_]/', '', strtolower($inputIconName)));
		if (strlen($inputIconName) > 0)
			$iconName = $inputIconName;
	}

	$headers = apache_request_headers();
	$icon = $api->getIconImagePath($iconName);
	$iconModified = filemtime($icon);
	$lastModifiedHeader = 'Last-Modified: ' . gmdate('D, d M Y H:i:s', $iconModified) . ' GMT';

	if (isset($headers['If-Modified-Since']) && strtotime($headers['If-Modified-Since']) == $iconModified) {
		header($lastModifiedHeader, true, 304);
	} else {
		header($lastModifiedHeader, true, 200);
		header('Content-Length: ' . filesize($icon));
		header('Content-Type: image/jpeg');

		echo file_get_contents($icon);
	}