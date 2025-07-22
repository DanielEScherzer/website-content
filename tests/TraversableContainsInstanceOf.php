<?php
declare( strict_types = 1 );

namespace DanielWebsite\Tests;

use PHPUnit\Framework\Constraint\TraversableContains;

class TraversableContainsInstanceOf extends TraversableContains {

	private string $type;

	public function __construct( string $type ) {
		$this->type = $type;
	}

	protected function matches( mixed $other ): bool {
		foreach ( $other as $element ) {
			if ( $element instanceof $this->type ) {
				return true;
			}
		}

		return false;
	}

	public function toString(): string {
		return 'contains an instance of "' . $this->type . '"';
	}
}
