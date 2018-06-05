<?php
	class Response {
		/**
		 * Error code (or false if no error).
		 * @var bool|string
		 */
		private $error = false;

		/**
		 * Error message (or null if no error).
		 * @var null|string
		 */
		private $errorMessage;

		/**
		 * Data contained by this response.
		 * @var array
		 */
		private $data = [];

		/**
		 * Set the error message for this response.
		 * @param $errorCode
		 * @param $errorMessage
		 */
		public function setError($errorCode, $errorMessage) {
			$this->error = $errorCode;
			$this->errorMessage = $errorMessage;
		}

		/**
		 * Set a key/value to be returned with this response.
		 * @param string $name
		 * @param mixed $value
		 */
		public function __set($name, $value) {
			$this->data[$name] = $value;
		}

		/**
		 * Return this response as JSON.
		 */
		public function __toString() {
			$data = ['error' => $this->error];
			if ($this->error === false) {
				$data = array_merge($data, $this->data);
			} else {
				$data['errorMessage'] = $this->errorMessage;
			}

			return json_encode($data);
		}
	}