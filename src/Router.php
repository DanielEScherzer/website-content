<?php
declare( strict_types = 1 );

namespace DanielWebsite;

use DanielWebsite\Pages\AbstractPage;
use DanielWebsite\Pages\BlogFeedPage;
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
use Uri\WhatWg\Url;

class Router {

	/**
	 * Entry point
	 */
	public static function pageForRequest(
		string $requestMethod,
		string $requestURI
	): AbstractPage {
		$url = new Url( $requestURI, new Url( 'https://scherzer.dev' ) );
		$path = $url->getPath()
			|> ( static fn ( string $path ): string => trim( $path, '/' ) )
			|> strtolower( ... )
			|> ucfirst( ... );

		// phpcs:ignore MediaWiki.WhiteSpace.SpaceyParenthesis
		$dispatcher = \FastRoute\simpleDispatcher( self::addRoutesCb(...) );
		$routeInfo = $dispatcher->dispatch( $requestMethod, $path );
		switch ( $routeInfo[0] ) {
			case Dispatcher::NOT_FOUND:
				return new Error404Page( $path );
			case Dispatcher::METHOD_NOT_ALLOWED:
				return new Error405Page( $path, $requestMethod, $routeInfo[1] );
			case Dispatcher::FOUND:
				$clazz = $routeInfo[1];
				$matches = $routeInfo[2];
				$matches['_path'] = $path;
				$matches['_url'] = $url;
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
		$r->addRoute( 'GET', 'Blog/feed', BlogFeedPage::class );
		$r->addRoute( 'GET', 'Blog/feed/{feed}', BlogFeedPage::class );
		$r->addRoute( 'GET', 'Blog/{slug}', BlogPostPage::class );
		$r->addRoute( 'GET', 'Tools', ToolPage::class );
		$r->addRoute( 'GET', 'Tools/{tool}', ToolPage::class );
		RedirectPage::addRoutes( $r );
	}
}
