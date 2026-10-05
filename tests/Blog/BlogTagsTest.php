<?php
declare( strict_types = 1 );

namespace DanielWebsite\Tests\Blog;

use DanielWebsite\Blog\BlogTags;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

#[CoversClass( BlogTags::class )]
class BlogTagsTest extends TestCase {

	public function testIsKnown() {
		$this->assertTrue( BlogTags::isKnown( 'php' ) );
		$this->assertFalse( BlogTags::isKnown( 'missing' ) );
	}

	public function testDescription() {
		$this->assertSame( BlogTags::KNOWN_TAGS['conferences'], BlogTags::getDescription( 'conferences' ) );
		$this->assertSame(
			BlogTags::KNOWN_TAGS['php']['description'],
			BlogTags::getDescription( 'php' )
		);
		$this->expectException( InvalidArgumentException::class );
		$this->expectExceptionMessage(
			"Unknown tag: missing"
		);
		BlogTags::getDescription( 'missing' );
	}

	public function testListForTag() {
		$this->assertSame(
			'<ul class="blog-tags--list">'
				. '<li class="blog-tags--pill blog-tags--pill-conferences">'
					. '<a href="/Blog?tag=conferences" title="Blog posts about conferences and other events">'
						. '#Conferences</a>'
				. '</li></ul>',
			BlogTags::getListForTags( [ 'conferences' ] )->getHTML()
		);
		$this->assertSame(
			'<ul class="blog-tags--list">'
				. '<li class="blog-tags--pill blog-tags--pill-php">'
					. '<a href="/Blog?tag=php" title="Blog posts about programming with PHP">#PHP</a>'
				. '</li></ul>',
			BlogTags::getListForTags( [ 'php' ] )->getHTML()
		);
		$this->expectException( InvalidArgumentException::class );
		$this->expectExceptionMessage(
			"Unknown tag: missing"
		);
		BlogTags::getListForTags( [ 'missing' ] );
	}

}
