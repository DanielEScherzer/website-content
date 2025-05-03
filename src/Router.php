<?php
declare( strict_types = 1 );

namespace DanielWebsite;

use DanielWebsite\Pages\BasePage;
use DanielWebsite\Pages\BlogIndexPage;
use DanielWebsite\Pages\BlogPostPage;
use DanielWebsite\Pages\Error404Page;
use DanielWebsite\Pages\Error405Page;
use DanielWebsite\Pages\LandingPage;
use DanielWebsite\Pages\OpenSourcePage;
use DanielWebsite\Pages\RedirectPage;
use DanielWebsite\Pages\RobotsTxtPage;
use DanielWebsite\Pages\ThesisPage;
use DanielWebsite\Pages\ToolPage;
use DanielWebsite\Pages\WorkPage;
use FastRoute\Dispatcher;
use FastRoute\RouteCollector;

class Router {

	/**
	 * Entry point
	 */
	public static function pageForRequest(
		string $requestMethod,
		string $requestURI
	): BasePage {
		// Remove any query parameters
		if ( str_contains( $requestURI, '?' ) ) {
			$pos = strpos( $requestURI, '?' );
			$requestURI = substr( $requestURI, 0, $pos );
		}
		$requestURI = rawurldecode( $requestURI );
		$requestURI = trim( $requestURI, '/' );
		// Router is case insensitive
		$requestURI = strtolower( $requestURI );
		// Prefer uppercase first letter in the strings and error messages
		$requestURI = ucfirst( $requestURI );

		// phpcs:ignore MediaWiki.WhiteSpace.SpaceyParenthesis
		$dispatcher = \FastRoute\simpleDispatcher( self::addRoutesCb(...) );
		$routeInfo = $dispatcher->dispatch( $requestMethod, $requestURI );
		switch ( $routeInfo[0] ) {
			case Dispatcher::NOT_FOUND:
				return new Error404Page( $requestURI );
			case Dispatcher::METHOD_NOT_ALLOWED:
				return new Error405Page( $requestURI, $requestMethod, $routeInfo[1] );
			case Dispatcher::FOUND:
				$clazz = $routeInfo[1];
				$matches = $routeInfo[2];
				if ( $clazz === RedirectPage::class ) {
					$matches = [ 'title' => $requestURI ];
				}
				return new $clazz( $matches );
		}
	}

	/**
	 * Callback for FastRoute dispatching
	 */
	public static function addRoutesCb( RouteCollector $r ): void {
		$r->addRoute( 'GET', '', LandingPage::class );
		$r->addRoute( 'GET', 'Robots.txt', RobotsTxtPage::class );
		$r->addRoute( 'GET', 'Home', LandingPage::class );
		$r->addRoute( 'GET', 'Opensource', OpenSourcePage::class );
		$r->addRoute( 'GET', 'Thesis', ThesisPage::class );
		$r->addRoute( 'GET', 'Work', WorkPage::class );
		$r->addRoute( 'GET', 'Blog', BlogIndexPage::class );
		$r->addRoute( 'GET', 'Blog/{title}', BlogPostPage::class );
		$r->addRoute( 'GET', 'Tools', ToolPage::class );
		$r->addRoute( 'GET', 'Tools/{tool}', ToolPage::class );
		RedirectPage::addRoutes( $r );
	}
}
