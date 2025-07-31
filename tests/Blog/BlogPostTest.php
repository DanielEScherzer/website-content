<?php
declare( strict_types = 1 );

namespace DanielWebsite\Tests\Blog;

use DanielWebsite\Blog\BlogPost;
use DateTimeImmutable;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use RuntimeException;

#[CoversClass( BlogPost::class )]
class BlogPostTest extends TestCase {

	public function testBlogPost() {
		$p = new BlogPost( '20251201-testing', 'random-content' );
		$this->assertSame( '20251201-testing', $p->slug );
		$this->assertEquals(
			new DateTimeImmutable( '2025-12-01' ),
			$p->date
		);
		$this->assertSame( 'random-content', $p->markdown );

		$this->assertSame( '20251201-testing', $p->getTitle() );
		$this->assertSame( [], $p->getExtraClasses() );

		$p->setConfig( [
			'title' => 'Example',
			'extensions' => [
				'toc' => true,
			],
			'extra-classes' => [ 'foo' ]
		] );
		$this->assertSame( 'Example', $p->getTitle() );
		$this->assertSame(
			[ 'foo', 'blog-page--has-toc' ],
			$p->getExtraClasses()
		);

		$this->expectException( RuntimeException::class );
		$this->expectExceptionMessage(
			"Configuration cannot be set as `array (\n)`, already set to"
		);
		$p->setConfig( [] );
	}

}
