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
		$p->setTitle( 'Example' );
		$this->assertSame( 'Example', $p->getTitle() );

		$this->expectException( RuntimeException::class );
		$this->expectExceptionMessage(
			'Title already set to `Example`, cannot set as `Changed`'
		);
		$p->setTitle( 'Changed' );
	}

}
