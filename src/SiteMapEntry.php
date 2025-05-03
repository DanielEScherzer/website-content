<?php
declare( strict_types = 1 );

namespace DanielWebsite;

use Attribute;

#[Attribute( Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE )]
class SiteMapEntry {

	public readonly string $path;

	public function __construct( string $path ) {
		// Ensure path starts with a /, unless empty
		if ( $path ) {
			$path = '/' . ltrim( $path, '/' );
		}
		$this->path = $path;
	}
}
