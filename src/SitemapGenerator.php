<?php
declare( strict_types = 1 );

namespace DanielWebsite;

use DanielWebsite\Blog\BlogPostStore;
use FastRoute\DataGenerator\MarkBased;
use FastRoute\RouteCollector;
use FastRoute\RouteParser\Std;
use samdark\sitemap\Sitemap;

class SitemapGenerator {

	private const URL_BASE = 'https://scherzer.dev';

	public static function generateSitemap( string $location ): void {
		$collector = new RouteCollector( new Std(), new MarkBased() );
		Router::addRoutesCb( $collector );
		$getPaths = array_keys( $collector->getData()[0]['GET'] );

		$sitemap = new Sitemap( $location );
		foreach ( $getPaths as $path ) {
			$sitemap->addItem( self::URL_BASE . $path );
		}

		$blogStore = new BlogPostStore();
		$blogTitles = $blogStore->listBlogTitles();
		// listBlogTitles() will be in reverse order for the blog index page
		sort( $blogTitles );
		foreach ( $blogTitles as $title ) {
			$sitemap->addItem( self::URL_BASE . '/Blog/' . $title );
		}

		$sitemap->write();
	}
}
