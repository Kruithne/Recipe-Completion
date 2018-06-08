<?php
	error_reporting(0);

	require_once(__DIR__ . '/lib/api.php');

	header('Pragma: public');
	header('Cache-Control: max-age=86400');
	header('Expires: '. gmdate('D, d M Y H:i:s \G\M\T', time() + 86400));
	header('Content-type: image/jpeg');

	$api = new API();

	$iconName = $_GET['id'];
	if (is_string($iconName))
		$iconName = preg_replace('/[^a-z0-9_]/', '', strtolower($iconName));
	else
		$iconName = 'inv_misc_questionmark';

	echo $api->getIconImage($iconName);