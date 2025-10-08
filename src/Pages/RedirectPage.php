<?php
declare( strict_types = 1 );

namespace DanielWebsite\Pages;

use DanielWebsite\SitemapEntry;
use DanielWebsite\WebResponse;
use FastRoute\RouteCollector;

#[SitemapEntry( 'Resume' )]
class RedirectPage extends AbstractPage {

	private const KNOWN_REDIRECTS = [
		'Resume' => '/files/Resume.pdf',
	];

	private string $title;

	public function __construct( array $params ) {
		$title = $params['title'];
		$this->title = $title;
	}

	public static function addRoutes( RouteCollector $r ): void {
		foreach ( self::KNOWN_REDIRECTS as $route => $target ) {
			$r->addRoute( 'GET', $route, __CLASS__ );
		}
	}

	public function getResponse(): WebResponse {
		$target = self::KNOWN_REDIRECTS[ $this->title ];
		return new WebResponse(
			'',
			[ 'Location: //' . $_SERVER['HTTP_HOST'] . $target ],
			302
		);
	}

}
