<?php
declare( strict_types = 1 );

namespace DanielWebsite\Blog;

use DateTimeImmutable;
use RuntimeException;

class BlogPost {

	public readonly string $slug;
	public readonly DateTimeImmutable $date;
	public readonly string $markdown;

	private ?array $config = null;

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
		return $this->config['title'] ?? $this->slug;
	}

	public function getExtraClasses(): array {
		if ( $this->config !== null ) {
			$extraClasses = $this->config['extra-classes'] ?? [];
			if ( $this->config['extensions']['toc'] ?? false ) {
				$extraClasses[] = 'blog-page--has-toc';
			}
			return $extraClasses;
		}
		return [];
	}

	public function setConfig( array $config ): void {
		if ( $this->config !== null ) {
			$current = var_export( $this->config, true );
			$new = var_export( $config, true );
			throw new RuntimeException(
				"Configuration cannot be set as `$new`, already set to `$current`"
			);
		}
		$this->config = $config;
	}

}
