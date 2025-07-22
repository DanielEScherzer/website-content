<?php
declare( strict_types = 1 );

namespace DanielWebsite\Tests\Blog;

use DanielEScherzer\CommonMarkPygmentsHighlighter\PygmentsHighlighterExtension;
use DanielWebsite\Blog\BlogDisplay;
use DanielWebsite\Blog\BlogPost;
use DanielWebsite\Tests\TraversableContainsInstanceOf;
use League\CommonMark\Extension\CommonMark\CommonMarkCoreExtension;
use League\CommonMark\Extension\ExternalLink\ExternalLinkExtension;
use League\CommonMark\Extension\Footnote\FootnoteExtension;
use League\CommonMark\Extension\FrontMatter\FrontMatterExtension;
use League\CommonMark\Extension\HeadingPermalink\HeadingPermalinkExtension;
use League\CommonMark\Extension\TableOfContents\TableOfContentsExtension;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

#[CoversClass( BlogDisplay::class )]
class BlogDisplayTest extends TestCase {

	#[DataProvider( 'provideExtensionCases' ) ]
	public function testExtensions( ?string $markdown, array $classes ) {
		$post = false;
		if ( $markdown !== null ) {
			$post = new BlogPost( '20251201-testing', $markdown );
		}
		$env = BlogDisplay::makeCommonMarkEnv( $post );
		$extensions = $env->getExtensions();
		$this->assertSameSize( $classes, $extensions );
		foreach ( $classes as $class ) {
			$this->assertContainsInstanceOf(
				$class,
				$extensions
			);
		}
	}

	public static function provideExtensionCases() {
		$defaultExts = [
			CommonMarkCoreExtension::class,
			ExternalLinkExtension::class,
			FrontMatterExtension::class,
		];
		yield 'Defaults, no post' => [ null, $defaultExts ];
		yield 'Defaults, empty post' => [ '', $defaultExts ];
		yield 'Defaults, no yaml' => [ '# Demo', $defaultExts ];
		yield 'Defaults, yaml with no extensions' => [
			"---\nTitle: Example\n---\n# Demo",
			$defaultExts,
		];
		yield 'YAML loads TOC' => [
			"---\nextensions:\n  toc: true\n---\n# Demo",
			[
				...$defaultExts,
				HeadingPermaLinkExtension::class,
				TableOfContentsExtension::class,
			],
		];
		yield 'YAML loads pygments' => [
			"---\nextensions:\n  pygments: true\n---\n# Demo",
			[ ...$defaultExts, PygmentsHighlighterExtension::class ],
		];
		yield 'YAML loads footnotes' => [
			"---\nextensions:\n  footnotes: true\n---\n# Demo",
			[ ...$defaultExts, FootnoteExtension::class ],
		];
		yield 'YAML loads all' => [
			"---\nextensions:\n  toc: true\n  pygments: true\n  footnotes: true\n---\n# Demo",
			[
				...$defaultExts,
				HeadingPermaLinkExtension::class,
				TableOfContentsExtension::class,
				PygmentsHighlighterExtension::class,
				FootnoteExtension::class,
			],
		];
	}

	public static function assertContainsInstanceOf(
		string $type,
		iterable $haystack,
		string $message = ''
	): void {
		$constraint = new TraversableContainsInstanceOf( $type );

		self::assertThat( $haystack, $constraint, $message );
	}

}
