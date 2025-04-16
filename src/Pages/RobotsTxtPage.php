<?php
declare( strict_types = 1 );

namespace DanielWebsite\Pages;

use LogicException;

/**
 * Virtual page for serving robots.txt
 */
class RobotsTxtPage extends BasePage {

	protected function build(): never {
		throw new LogicException( "Should not be called" );
	}

	public function getPageOutput(): string {
		header( 'Content-Type: text/plain' );
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
