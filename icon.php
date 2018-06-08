<?php
	error_reporting(0);

	require_once(__DIR__ . '/lib/api.php');

	if (isset($_SERVER['HTTP_IF_MODIFIED_SINCE'])) {
		header('HTTP/1.1 304 Not Modified');
		die();
	}

	$api = new API();
	header('Content-type: image/jpeg');

	$iconName = $_GET['id'];
	if (is_string($iconName))
		$iconName = preg_replace('/[^a-z0-9_]/', '', strtolower($iconName));
	else
		$iconName = 'inv_misc_questionmark';

	echo $api->getIconImage($iconName);