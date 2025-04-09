<?php
declare( strict_types = 1 );

namespace DanielWebsite\Blog;

use DateTimeImmutable;

class BlogPost {

	public readonly string $title;
	public readonly DateTimeImmutable $date;
	public readonly string $markdown;

	public function __construct( string $title, string $markdown ) {
		$this->title = $title;
		$date = DateTimeImmutable::createFromFormat(
			'Ymd',
			substr( $title, 0, 8 )
		);
		// Set as midnight
		$this->date = $date->setTime( 0, 0 );
		$this->markdown = $markdown;
	}

}
