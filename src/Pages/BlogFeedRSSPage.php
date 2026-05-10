<?php
declare( strict_types = 1 );

namespace DanielWebsite\Pages;

use DanielWebsite\WebResponse;

class BlogFeedRSSPage extends AbstractPage {

	public function getResponse(): WebResponse {
		return new WebResponse(
			$this->getContent(),
			[ 'Content-Type: application/xml' ],
			200
		);
	}

	private function getContent(): string {
		return file_get_contents( dirname( __DIR__ ) . '/Blog/feed-rss.xml' );
	}

}
