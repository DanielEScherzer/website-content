<?php
declare( strict_types = 1 );

namespace DanielWebsite\Blog;

use League\CommonMark\Extension\Mention\Generator\MentionGeneratorInterface;
use League\CommonMark\Extension\Mention\Mention;
use League\CommonMark\Node\Inline\AbstractInline;

/**
 * Mention generator for GitHub repositories:
 * - triggered by, e.g., `gh:DanielEScherzer/common-phpcs`
 * - renders as the repo name, linked to GitHub
 */
class GitHubRepoMentionGenerator implements MentionGeneratorInterface {

	public function generateMention( Mention $mention ): ?AbstractInline {
		$repo = $mention->getIdentifier();
		$mention->setUrl( "https://github.com/$repo" );
		$mention->setLabel( $repo );

		return $mention;
	}

}
