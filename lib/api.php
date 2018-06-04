<?php
	require_once(__DIR__ . '/util.php');

	define('API_URL', 'https://%s.api.battle.net/wow/%%s?locale=en_GB&apikey=%s');
	define('API_CONFIG_FILE', __DIR__ . '/../data/api.conf.json');
	define('REGION_FILE', __DIR__ . '/../data/regions.json');

	/**
	 * Represents an exception thrown by the API class.
	 * @class APIException
	 */
	class APIException extends Exception {
		/**
		 * APIException constructor.
		 * @param string $message
		 * @param array $params
		 */
		public function __construct($message = '', ...$params) {
			parent::__construct('[API] ' . sprintf($message, ...$params));
		}
	}

	/**
	 * Represents a connection to a regional API.
	 * @class API
	 */
	class API {
		/**
		 * Contains the data for all regions.
		 * @var object
		 */
		private $regionData;

		/**
		 * Contains all available region IDs.
		 * @var string[]
		 */
		private $regions;

		/**
		 * Private API key.
		 * @var string
		 */
		private $apiKey;

		/**
		 * Currently selected region ID.
		 * @var string
		 */
		private $selectedRegionID;

		/**
		 * Currently selected region data.
		 * @var object
		 */
		private $selectedRegion;

		/**
		 * URL formatted for the current region.
		 * @var string
		 */
		private $selectedRegionURL;

		/**
		 * API constructor.
		 * @throws APIException
		 */
		public function __construct() {
			$this->loadConfig();
			$this->loadRegionData();
		}

		/**
		 * Set the region to use for requests.
		 * @param string $regionID
		 */
		public function setRegion($regionID) {
			$this->selectedRegionID = $regionID;
			$this->selectedRegion = &$this->regionData->$regionID;
			$this->selectedRegionURL = sprintf(API_URL, $regionID, $this->apiKey);
		}

		/**
		 * Return all available region IDs.
		 * @return string[]
		 */
		public function getRegions() {
			return $this->regions;
		}

		/**
		 * Get the represented region ID.
		 * @return string
		 */
		public function getSelectedRegionID() {
			return $this->selectedRegionID;
		}

		/**
		 * Get the represented region name.
		 * @return string
		 */
		public function getRegionName() {
			return $this->selectedRegion->name;
		}

		/**
		 * Obtain the realm list for this region.
		 * @param bool $updateCache If true, cache will be updated from remote API. Defaults to false.
		 * @return mixed
		 */
		public function getRealms($updateCache = false) {
			if ($updateCache) {
				$realmStack = [];
				$realms = $this->requestEndpoint('realm/status')->realms;

				foreach ($realms as $realm)
					$realmStack[$realm->slug] = $realm->name;

				$this->selectedRegion->realms = $realmStack;
				file_put_json(REGION_FILE, $this->regionData);
			}

			return $this->selectedRegion->realms;
		}

		/**
		 * Request endpoint from the API.
		 * @param string $endpoint
		 * @return mixed
		 */
		private function requestEndpoint($endpoint) {
			return json_decode(file_get_contents($this->formatEndpointURL($endpoint)));
		}

		/**
		 * Format an endpoint URL for this API.
		 * @param string $endpoint
		 * @return string
		 */
		private function formatEndpointURL($endpoint) {
			return sprintf($this->selectedRegionURL, $endpoint);
		}

		/**
		 * Load the configuration data from file.
		 * @throws APIException
		 */
		private function loadConfig() {
			if (!file_exists(API_CONFIG_FILE))
				throw new APIException('Unable to locate API configuration file %s', API_CONFIG_FILE);

			$config = file_get_json(API_CONFIG_FILE);
			if (!isset($config->key))
				throw new APIException('Configuration file does not define API key property `key`');

			$this->apiKey = $config->key;
		}

		/**
		 * Load region data from file.
		 * @throws APIException
		 */
		private function loadRegionData() {
			if (!file_exists(REGION_FILE))
				throw new APIException('Unable to locate region data file %s', REGION_FILE);

			// Load region data from file.
			$this->regionData = file_get_json(REGION_FILE);

			// Ensure the data file has at least one region.
			if (count($this->regionData) === 0)
				throw new APIException('Region data file does not define any regions');

			// Prepare a list of all region IDs.
			$this->regions = [];
			foreach ($this->regionData as $regionID => $region)
				array_push($this->regions, $regionID);

			// Default to first region in config.
			$this->setRegion($this->regions[0]);
		}
	}