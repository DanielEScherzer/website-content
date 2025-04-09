<?php
declare( strict_types = 1 );

namespace DanielWebsite\Blog;

use League\CommonMark\Extension\Mention\Generator\MentionGeneratorInterface;
use League\CommonMark\Extension\Mention\Mention;
use League\CommonMark\Node\Inline\AbstractInline;

/**
 * Mention generator for packagist packages:
 * - triggered by, e.g., `package:danielescherzer/common-phpcs`
 * - renders as the package name, linked to packagist
 */
class PackageMentionGenerator implements MentionGeneratorInterface {

	public function generateMention( Mention $mention ): ?AbstractInline {
		$package = $mention->getIdentifier();
		$mention->setUrl( "https://packagist.org/packages/$package" );
		$mention->setLabel( $package );

		return $mention;
	}

}
