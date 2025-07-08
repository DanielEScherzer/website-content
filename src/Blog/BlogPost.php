<?php
declare( strict_types = 1 );

namespace DanielWebsite\Blog;

use DateTimeImmutable;
use RuntimeException;

class BlogPost {

	public readonly string $slug;
	public readonly DateTimeImmutable $date;
	public readonly string $markdown;

	private ?string $title = null;

	public function __construct( string $slug, string $markdown ) {
		$this->slug = $slug;
		$date = DateTimeImmutable::createFromFormat(
			'Ymd',
			substr( $slug, 0, 8 )
		);
		// Set as midnight
		$this->date = $date->setTime( 0, 0 );
		$this->markdown = $markdown;
	}

	public function getTitle(): string {
		return $this->title ?? $this->slug;
	}

	public function setTitle( string $title ): void {
		if ( $this->title !== null ) {
			$current = $this->title;
			throw new RuntimeException(
				"Title already set to `$current`, cannot set as `$title`"
			);
		}
		$this->title = $title;
	}

}
