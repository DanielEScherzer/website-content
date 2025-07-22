<?php
declare( strict_types = 1 );

namespace DanielWebsite\Tests;

/**
 * Tests that the sitemap is up to date
 */
use DanielWebsite\SitemapEntry;
use DanielWebsite\SitemapGenerator;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

#[CoversClass( SitemapGenerator::class )]
#[CoversClass( SitemapEntry::class )]
class SitemapGeneratorTest extends TestCase {

	private const TEST_FILE_LOCATION = __DIR__ . '/sitemap.xml';

	protected function tearDown(): void {
		// phpcs:ignore Generic.PHP.NoSilencedErrors.Discouraged
		@unlink( self::TEST_FILE_LOCATION );
		parent::tearDown();
	}

	public function testSitemap() {
		SitemapGenerator::generateSitemap( self::TEST_FILE_LOCATION );
		$expected = file_get_contents( self::TEST_FILE_LOCATION );

		$actualSitemapPath = dirname( __DIR__ ) . '/sitemap.xml';
		if ( getenv( 'TESTS_UPDATE_EXPECTED' ) === '1' ) {
			file_put_contents( $actualSitemapPath, $expected );
		}
		$this->assertStringEqualsFile( $actualSitemapPath, $expected );
	}

}
