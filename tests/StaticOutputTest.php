<?php
declare( strict_types = 1 );

namespace DanielWebsite\Tests;

/**
 * Tests that each URI has the expected static output, so that changes are
 * intentional.
 */
use DanielWebsite\Blog\BlogDisplay;
use DanielWebsite\Pages\BasePage;
use DanielWebsite\Pages\BlogIndexPage;
use DanielWebsite\Pages\BlogPostPage;
use DanielWebsite\Pages\Error404Page;
use DanielWebsite\Pages\Error405Page;
use DanielWebsite\Pages\LandingPage;
use DanielWebsite\Pages\OpenSourcePage;
use DanielWebsite\Pages\RedirectPage;
use DanielWebsite\Pages\ThesisPage;
use DanielWebsite\Pages\ToolPage;
use DanielWebsite\Pages\WorkPage;
use DanielWebsite\Router;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

#[CoversClass( BlogDisplay::class )]
#[CoversClass( BasePage::class )]
#[CoversClass( BlogIndexPage::class )]
#[CoversClass( BlogPostPage::class )]
#[CoversClass( Error404Page::class )]
#[CoversClass( Error405Page::class )]
#[CoversClass( LandingPage::class )]
#[CoversClass( OpenSourcePage::class )]
#[CoversClass( RedirectPage::class )]
#[CoversClass( ThesisPage::class )]
#[CoversClass( ToolPage::class ) ]
#[CoversClass( WorkPage::class )]
#[CoversClass( Router::class )]
class StaticOutputTest extends TestCase {

	#[DataProvider( 'providePages' ) ]
	public function testPageOutput(
		string $method,
		string $request,
		string $fileName
	) {
		$page = Router::pageForRequest( $method, $request );
		$filePath = __DIR__ . '/data/' . $fileName;
		$output = $page->getPageOutput();
		if ( getenv( 'TESTS_UPDATE_EXPECTED' ) === '1' ) {
			file_put_contents( $filePath, $output );
		}
		$this->assertStringEqualsFile( $filePath, $output );
	}

	public static function providePages() {
		yield 'Home' => [ 'GET', '/', 'Home.html' ];
		yield 'Home - title' => [ 'GET', '/Home', 'Home.html' ];
		yield 'Home - extra /' => [ 'GET', '/Home/', 'Home.html' ];
		yield 'Home - params' => [ 'GET', '/?foo=bar', 'Home.html' ];
		yield 'Open source' => [ 'GET', '/OpenSource', 'OpenSource.html' ];
		yield 'Thesis' => [ 'GET', '/Thesis', 'Thesis.html' ];
		yield 'Work' => [ 'GET', '/Work', 'Work.html' ];
		yield 'Blog - exists' => [ 'GET', '/Blog/20250409-website-launch', 'blog-launch.html' ];
		yield 'Blog - missing' => [ 'GET', '/Blog/missing', 'blog-missing.html' ];
		yield 'Blog - index' => [ 'GET', '/Blog', 'blog-index.html' ];
		yield 'Tools - index' => [ 'GET', '/Tools', 'tools-index.html' ];
		yield 'Tools - missing' => [ 'GET', '/Tools/missing', 'tools-missing.html' ];
		yield 'Tools - dvorak' => [ 'GET', '/Tools/dvorak', 'tools-dvorak.html' ];
		yield 'Blog - pygments highlight' => [
			'GET',
			'/Blog/20250429-attributes-on-constants',
			'blog-highlighting.html',
		];

		// Router is case insensitive
		yield 'Case insensitive' => [ 'GET', '/oPEnSouRcE', 'OpenSource.html' ];

		// Error 404
		yield 'Missing' => [ 'GET', '/Missing', 'Missing.html' ];

		// Error 405
		yield 'POST work page' => [ 'POST', '/Work', 'NoPost.html' ];
	}

	public function testRedirect() {
		$page = Router::pageForRequest( 'GET', '/Resume' );
		$this->assertInstanceOf( RedirectPage::class, $page );
	}

}
