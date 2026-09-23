<?php
declare( strict_types = 1 );

namespace DanielWebsite\Blog;

use DanielEScherzer\HTMLBuilder\FluentHTML;
use InvalidArgumentException;

class BlogTags {

	// Descriptions are prefixed with 'Blog posts about'
	// If display is not set it is ucfirst() on the key
	public const array KNOWN_TAGS = [
		'conferences' => 'conferences and other events',
		'php' => [
			'description' => 'programming with PHP',
			'display' => 'PHP',
		],
		'php-rm' => [
			'description' => 'being a PHP release manager',
			'display' => 'PHP-RM',
		],
		'php-rm-85' => [
			'description' => 'being a PHP 8.5 rookie release manager',
			'display' => 'PHP-RM-8.5',
		],
		'php-rm-86' => [
			'description' => 'being the PHP 8.6 veteran release manager',
			'display' => 'PHP-RM-8.6',
		],
		'php-dev' => [
			'description' => 'development of PHP',
			'display' => 'PHP-dev',
		],
		'rust' => 'programming with Rust',
		'website' => 'my website',
	];

	public static function isKnown( string $tag ): bool {
		return array_key_exists( $tag, self::KNOWN_TAGS );
	}

	public static function getDescription( string $tag ): string {
		if ( !self::isKnown( $tag ) ) {
			throw new InvalidArgumentException( "Unknown tag: $tag" );
		}
		$info = self::KNOWN_TAGS[$tag];
		if ( is_string( $info ) ) {
			return $info;
		}
		return $info[ 'description' ];
	}

	private static function getPillForTag( string $tag ): FluentHTML {
		if ( !self::isKnown( $tag ) ) {
			throw new InvalidArgumentException( "Unknown tag: $tag" );
		}
		$info = self::KNOWN_TAGS[$tag];
		if ( is_string( $info ) ) {
			$description = $info;
			$display = ucfirst( $tag );
		} else {
			$description = $info[ 'description' ];
			$display = $info[ 'display' ];
		}

		return FluentHTML::make(
			'li',
			[ 'class' => [ 'blog-tags--pill', "blog-tags--pill-$tag" ] ],
			FluentHTML::make(
				'a',
				[
					'href' => "/Blog?tag=$tag",
					'title' => "Blog posts about $description",
				],
				"#$display",
			)
		);
	}

	public static function getListForTags( array $tags ): FluentHTML {
		return FluentHTML::make(
			'ul',
			[ 'class' => 'blog-tags--list' ],
			array_map( self::getPillForTag( ... ), $tags ),
		);
	}

}
