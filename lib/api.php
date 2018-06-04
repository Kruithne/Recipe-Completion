<?php
	require_once('util.php');

	define('API_URL', 'https://%s.api.battle.net/wow/%%s?locale=en_GB&apikey=%s');
	define('REGION_FILE', '../data/regions.json');

	$API_CONFIG = file_get_json('../data/api.conf.json');
	$REGION_DATA = file_get_json(REGION_FILE);

	/**
	 * Represents an exception thrown by the API class.
	 * @class APIException
	 */
	class APIException extends Exception {
		/**
		 * APIException constructor.
		 * @param string $message
		 */
		public function __construct($message = '') {
			parent::__construct('[API] ' . $message);
		}
	}

	/**
	 * Represents a connection to a regional API.
	 * @class API
	 */
	class API {
		/**
		 * Region ID.
		 * @var string
		 */
		private $regionID;

		/**
		 * Region data.
		 * @var object
		 */
		private $regionData;

		/**
		 * URL formatted with tag and API key.
		 * @var string
		 */
		private $url;

		/**
		 * API constructor.
		 * @param string $regionID
		 * @throws APIException
		 */
		public function __construct($regionID) {
			global $REGION_DATA;
			global $API_CONFIG;

			$this->regionID = $regionID;

			if (!array_key_exists($this->regionID, $REGION_DATA))
				throw new APIException('Unsupported region: ' . $regionID);

			$this->regionData = $REGION_DATA->$regionID;
			$this->url = sprintf(API_URL, $regionID, $API_CONFIG->key);
		}

		/**
		 * Get the represented region ID.
		 * @return string
		 */
		public function getRegionID() {
			return $this->regionID;
		}

		/**
		 * Get the represented region name.
		 * @return string
		 */
		public function getRegionName() {
			return $this->regionData->name;
		}

		/**
		 * Request realm data from the API.
		 * @return mixed
		 */
		public function getRealms() {
			return $this->requestEndpoint('realm/status');
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
			return sprintf($this->url, $endpoint);
		}

		/**
		 * Get an array containing all available region IDs.
		 * @return array
		 */
		public static function getRegions() {
			global $REGION_DATA;

			$regions = [];
			foreach ($REGION_DATA as $regionID => $region)
				array_push($regions, $regionID);

			return $regions;
		}
	}