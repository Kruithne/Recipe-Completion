<?php
	require_once(__DIR__ . '/../../../blizzard_api/lib/util.php');
	define('PROF_DATA_DIR', __DIR__ . '/../data/professions');
	define('PROF_DATA_FILE', PROF_DATA_DIR . '/%s.json');

	class Professions {
		/**
		 * Contains all available professions.
		 * @var string[]
		 */
		private $professions;

		/**
		 * Professions constructor.
		 * @throws Exception
		 */
		public function __construct() {
			if (!file_exists(PROF_DATA_DIR))
				throw new Exception('Unable to location profession data directory ' . PROF_DATA_DIR);

			// Create an array to hold the profession names.
			$this->professions = [];

			// Grab a list of files in the directory.
			foreach (scandir(PROF_DATA_DIR) as $file) {
				// Skip over directory level entries.
				if ($file === '.' || $file === '..')
					continue;

				// Only care for entries that end wit the .json suffix.
				if (endsWith($file, '.json'))
					array_push($this->professions, basename($file, '.json'));
			}
		}

		/**
		 * Obtain profession roster from the data files.
		 * @param string $professionID
		 * @return mixed
		 * @throws Exception
		 */
		public function getProfession($professionID) {
			$file = sprintf(PROF_DATA_FILE, $professionID);
			if (!file_exists($file))
				throw new Exception('Unable to locate profession file ' . $file);

			return file_get_json($file);
		}

		/**
		 * Persist changed profession data to disk.
		 * @param string $professionID
		 * @param object $data
		 */
		public function saveProfession($professionID, $data) {
			file_put_json(sprintf(PROF_DATA_FILE, $professionID), $data);
		}

		/**
		 * Verifies if a profession ID is valid.
		 * @param string $professionID
		 * @return bool
		 */
		public function isValidProfession($professionID) {
			if (!is_string($professionID))
				return false;

			return in_array($professionID, $this->professions);
		}

		/**
		 * Returns all available professions.
		 * @return string[]
		 */
		public function getProfessions() {
			return $this->professions;
		}
	}