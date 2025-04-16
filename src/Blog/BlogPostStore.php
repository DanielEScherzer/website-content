<?php
declare( strict_types = 1 );

namespace DanielWebsite\Blog;

class BlogPostStore {

	public function __construct() {
	}

	public function listBlogTitles(): array {
		$entries = scandir( __DIR__ . '/posts/' );
		$files = array_filter(
			$entries,
			static fn ( string $path ) => str_ends_with( $path, '.md' )
		);
		$titles = array_map(
			static fn ( string $title ) => substr( $title, 0, -3 ),
			$files
		);
		rsort( $titles );
		return $titles;
	}

	public function listBlogPosts(): array {
		$titles = $this->listBlogTitles();
		$posts = array_map(
			fn ( string $title ) => $this->getBlogPost( $title ),
			$titles
		);
		return $posts;
	}

	public function getBlogPost( string $title ): ?BlogPost {
		$path = __DIR__ . '/posts/' . $title . '.md';
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
			$title,
			$content
		);
	}
}
