<?php
declare( strict_types = 1 );

namespace DanielWebsite;

use DanielWebsite\Blog\BlogPostStore;
use FastRoute\DataGenerator\MarkBased;
use FastRoute\RouteCollector;
use FastRoute\RouteParser\Std;
use ReflectionClass;
use samdark\sitemap\Sitemap;

class SitemapGenerator {

	private const URL_BASE = 'https://scherzer.dev';

	public static function generateSitemap( string $location ): void {
		$collector = new RouteCollector( new Std(), new MarkBased() );
		Router::addRoutesCb( $collector );
		$getPaths = $collector->getData()[0]['GET'];
		$pages = array_unique( $getPaths );

		$sitemap = new Sitemap( $location );
		foreach ( $pages as $class ) {
			$ref = new ReflectionClass( $class );
			$attribs = $ref->getAttributes( SitemapEntry::class );
			foreach ( $attribs as $attrib ) {
				$instance = $attrib->newInstance();
				$sitemap->addItem( self::URL_BASE . $instance->path );
			}
		}

		$blogStore = new BlogPostStore();
		$blogSlugs = $blogStore->listBlogSlugs();
		// listBlogSlugs() will be in reverse order for the blog index page
		sort( $blogSlugs );
		foreach ( $blogSlugs as $slug ) {
			$sitemap->addItem( self::URL_BASE . '/Blog/' . $slug );
		}

		$sitemap->write();
	}
}
