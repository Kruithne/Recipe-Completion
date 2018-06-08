<?php
	error_reporting(0);

	require_once(__DIR__ . '/lib/api.php');

	$api = new API();
	header('Content-type: image/jpeg');
	header("Cache-Control: max-age=2592000");

	$iconName = $_GET['id'];
	if (is_string($iconName))
		$iconName = preg_replace('/[^a-z0-9_]/', '', strtolower($iconName));
	else
		$iconName = 'inv_misc_questionmark';

	echo $api->getIconImage($iconName);