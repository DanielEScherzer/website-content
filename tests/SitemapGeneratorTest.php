<?php
declare( strict_types = 1 );

namespace DanielWebsite\Tests;

/**
 * Tests that the sitemap is up to date
 */
use DanielWebsite\Blog\BlogPostStore;
use DanielWebsite\Router;
use DanielWebsite\SitemapEntry;
use FastRoute\DataGenerator\MarkBased;
use FastRoute\RouteCollector;
use FastRoute\RouteParser\Std;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use ReflectionClass;
use samdark\sitemap\Sitemap;

#[CoversClass( SitemapEntry::class )]
class SitemapGeneratorTest extends TestCase {

	private const TEST_FILE_LOCATION = __DIR__ . '/sitemap.xml';
	private const URL_BASE = 'https://scherzer.dev';

	protected function tearDown(): void {
		// phpcs:ignore Generic.PHP.NoSilencedErrors.Discouraged
		@unlink( self::TEST_FILE_LOCATION );
		parent::tearDown();
	}

	private function generateSitemap( string $location ): void {
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

	public function testSitemap() {
		$this->generateSitemap( self::TEST_FILE_LOCATION );
		$expected = file_get_contents( self::TEST_FILE_LOCATION );

		$actualSitemapPath = dirname( __DIR__ ) . '/sitemap.xml';
		if ( getenv( 'TESTS_UPDATE_EXPECTED' ) === '1' ) {
			file_put_contents( $actualSitemapPath, $expected );
		}
		$this->assertStringEqualsFile( $actualSitemapPath, $expected );
	}

}
