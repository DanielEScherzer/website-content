<?php
declare( strict_types = 1 );

namespace DanielWebsite\Pages;

use DanielWebsite\WebResponse;

/**
 * Virtual page for serving robots.txt
 */
class RobotsTxtPage extends AbstractPage {

	public function getResponse(): WebResponse {
		return new WebResponse(
			$this->getContent(),
			[ 'Content-Type: text/plain' ],
			200
		);
	}

	private function getContent(): string {
		if ( getenv( 'DANIEL_WEBSITE_STAGING' ) ) {
			return "User-agent: *\nDisallow: /\n";
		}
		return <<<END
User-agent: *
Allow: /

Sitemap: https://scherzer.dev/sitemap.xml
END;
	}

}
