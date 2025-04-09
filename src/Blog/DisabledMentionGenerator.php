<?php
declare( strict_types = 1 );

namespace DanielWebsite\Blog;

use League\CommonMark\Extension\Mention\Generator\MentionGeneratorInterface;
use League\CommonMark\Extension\Mention\Mention;
use League\CommonMark\Node\Inline\AbstractInline;
use League\CommonMark\Node\Inline\Text;

/**
 * Mention generator that is currently disabled - no links
 */
class DisabledMentionGenerator implements MentionGeneratorInterface {

	public function generateMention( Mention $mention ): ?AbstractInline {
		$node = new Text();
		$node->setLiteral( $mention->getIdentifier() );

		return $node;
	}

}
