<?php
declare( strict_types = 1 );

namespace DanielWebsite\Pages;

use DanielWebsite\SiteMapEntry;
use FastRoute\RouteCollector;
use LogicException;

#[SiteMapEntry( 'Resume' )]
class RedirectPage extends BasePage {

	private const KNOWN_REDIRECTS = [
		'/Resume' => '/files/Resume.pdf',
	];

	private string $title;

	public function __construct( array $params ) {
		parent::__construct();
		$title = $params['title'];
		$this->title = $title;
	}

	public static function addRoutes( RouteCollector $r ): void {
		foreach ( self::KNOWN_REDIRECTS as $route => $target ) {
			$r->addRoute( 'GET', $route, __CLASS__ );
		}
	}

	protected function build(): never {
		throw new LogicException( "Should not be called" );
	}

	public function getPageOutput(): string {
		$target = self::KNOWN_REDIRECTS[ $this->title ];
		header( 'Location: //' . $_SERVER['HTTP_HOST'] . $target );
		return '';
	}

}
