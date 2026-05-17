<?php
declare( strict_types = 1 );

namespace DanielWebsite\Tests\Blog;

/**
 * Tests that the blog RSS feed is up to date
 */
use DanielWebsite\Blog\BlogPostStore;
use Laminas\Feed\Writer\ExtensionManager;
use Laminas\Feed\Writer\Feed;
use Laminas\Feed\Writer\Writer;
use League\CommonMark\Extension\FrontMatter\FrontMatterExtension;
use PHPUnit\Framework\Attributes\CoversNothing;
use PHPUnit\Framework\TestCase;

#[CoversNothing]
class BlogFeedGeneratorTest extends TestCase {

	private const TEST_FILE_LOCATION = __DIR__ . '/feed.xml';
	private const URL_BASE = 'https://scherzer.dev';

	protected function tearDown(): void {
		// phpcs:ignore Generic.PHP.NoSilencedErrors.Discouraged
		@unlink( self::TEST_FILE_LOCATION );
		parent::tearDown();
	}

	private function generateFeed(): Feed {
		$feed = new Feed();
		$feed->setTitle( 'Daniel Scherzer\'s Blog' );
		$feed->setDescription( 'Entries from Daniel Scherzer\' personal blog' );
		$feed->setLink( self::URL_BASE . '/Blog' );
		$feed->setGenerator( 'https://github.com/DanielEScherzer/website-content' );

		$store = new BlogPostStore();
		$posts = $store->listBlogPosts();

		$feed->setDateModified( $posts[0]->date );

		// Only parse the YAML frontmatter
		$frontMatterExt = new FrontMatterExtension();
		$parser = $frontMatterExt->getFrontMatterParser();

		foreach ( $posts as $post ) {
			$cfg = $parser->parse( $post->markdown )->getFrontMatter();
			$post->setConfig( $cfg ?? [] );

			$entry = $feed->createEntry();
			$entry->setTitle( $post->getTitle() );
			$entry->setLink( self::URL_BASE . '/Blog/' . $post->slug );
			$entry->setDateCreated( $post->date );

			$feed->addEntry( $entry );
		}

		return $feed;
	}

	public function testRSSFeed() {
		// There doesn't seem to be an easy way to disable the Slash extension
		$old = Writer::getExtensionManager();
		$manager = new class( $old ) extends ExtensionManager {
			public function has( $entryName ) {
				if ( $entryName === 'Slash\Renderer\Entry' ) {
					// Needs to return true when checking if the extension
					// exists, otherwise Laminas throws an exception
					$bt = debug_backtrace( DEBUG_BACKTRACE_IGNORE_ARGS, 2 );
					if (
						$bt[1]['class'] === Writer::class
						&& $bt[1]['function'] === 'hasExtension'
					) {
						return true;
					}
					return false;
				}
				return parent::has( $entryName );
			}
		};
		Writer::setExtensionManager( $manager );

		$expected = $this->generateFeed()->export( 'rss' );
		// Easier than trying to reimplement the whole chain to remove the guid
		$expected = preg_replace( "/\n\s+<guid>\S+?<\/guid>/", '', $expected );

		$actualFeedPath = dirname( __DIR__, 2 ) . '/src/Blog/feed-rss.xml';
		if ( getenv( 'TESTS_UPDATE_EXPECTED' ) === '1' ) {
			file_put_contents( $actualFeedPath, $expected );
		}
		$this->assertStringEqualsFile( $actualFeedPath, $expected );
	}

}
