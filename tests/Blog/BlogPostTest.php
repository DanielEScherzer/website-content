<?php
declare( strict_types = 1 );

namespace DanielWebsite\Tests\Blog;

use DanielWebsite\Blog\BlogPost;
use DateTimeImmutable;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

#[CoversClass( BlogPost::class )]
class BlogPostTest extends TestCase {

	public function testBlogPost() {
		$p = new BlogPost( '20251201-testing', 'random-content' );
		$this->assertSame( '20251201-testing', $p->title );
		$this->assertEquals(
			new DateTimeImmutable( '2025-12-01' ),
			$p->date
		);
		$this->assertSame( 'random-content', $p->markdown );
	}

}
