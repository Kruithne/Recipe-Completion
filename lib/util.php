<?php
	/**
	 * Get the contents of a file decoded as JSON.
	 * @param string $file
	 * @return mixed
	 */
	function file_get_json($file) {
		return json_decode(file_get_contents($file));
	}

	/**
	 * Write data encoded as JSON to a file.
	 * @param string $file
	 * @param mixed $data
	 */
	function file_put_json($file, $data) {
		file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
	}

	/**
	 * Print a formatted line terminated by a newline.
	 * @param string $line
	 * @param array ...$params
	 */
	function printfln($line, ...$params) {
		printf($line . PHP_EOL, ...$params);
	}

	/**
	 * Returns a string variable trimmed and lower-case.
	 * Will return null if the given variable is not a string type.
	 * @param string $value
	 * @return null|string
	 */
	function validate_input_string($value) {
		if (!is_string($value))
			return null;

		// Remove invalid characters.
		$value = preg_replace('/[^\p{L}-]/', '', $value);

		return strtolower(trim($value));
	}