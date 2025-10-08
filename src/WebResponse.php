<?php
declare( strict_types = 1 );

namespace DanielWebsite;

/**
 * Representation of a response to a request
 */
class WebResponse {

	public function __construct(
		public readonly string $content,
		public readonly array $headers,
		public readonly int $responseCode,
	) {
	}

	/**
	 * Treat this as the response to a real request - send the headers and
	 * print the content
	 */
	public function applyResponse() {
		foreach ( $this->headers as $header ) {
			header( $header );
		}
		http_response_code( $this->responseCode );
		echo $this->content;
	}

}
