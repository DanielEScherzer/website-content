<?php
declare( strict_types = 1 );

namespace DanielWebsite\Tests\Blog;

use DanielWebsite\Blog\BlogPost;
use DanielWebsite\Blog\BlogPostStore;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

#[CoversClass( BlogPostStore::class )]
class BlogPostStoreTest extends TestCase {

	public function testGetPost() {
		$store = new BlogPostStore();
		$post = $store->getBlogPost( '20250409-website-launch' );
		$this->assertInstanceOf( BlogPost::class, $post );

		$post = $store->getBlogPost( 'missing' );
		$this->assertNull( $post );
	}

	public function testGetList() {
		$store = new BlogPostStore();
		$list = $store->listBlogPosts();
		$this->assertNotEmpty( $list );
		$this->assertContainsOnlyInstancesOf( BlogPost::class, $list );
	}

}
