<?php
declare( strict_types = 1 );

namespace DanielWebsite\Blog;

class BlogPostStore {

	public function __construct() {
	}

	public function listBlogSlugs(): array {
		$entries = scandir( __DIR__ . '/posts/' );
		$files = array_filter(
			$entries,
			static fn ( string $path ) => str_ends_with( $path, '.md' )
		);
		$slugs = array_map(
			static fn ( string $title ) => substr( $title, 0, -3 ),
			$files
		);
		rsort( $slugs );
		return $slugs;
	}

	public function listBlogPosts(): array {
		$slugs = $this->listBlogSlugs();
		$posts = array_map(
			fn ( string $slug ) => $this->getBlogPost( $slug ),
			$slugs
		);
		return $posts;
	}

	public function getBlogPost( string $slug ): ?BlogPost {
		$path = __DIR__ . '/posts/' . $slug . '.md';
		if ( !file_exists( $path ) ) {
			return null;
		}
		$content = file_get_contents( $path );
		if ( $content === false ) {
			// @codeCoverageIgnoreStart
			return null;
			 // @codeCoverageIgnoreEnd
		}
		return new BlogPost(
			$slug,
			$content
		);
	}
}
