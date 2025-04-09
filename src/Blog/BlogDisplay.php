<?php
declare( strict_types = 1 );

namespace DanielWebsite\Blog;

use League\CommonMark\Environment\Environment;
use League\CommonMark\Extension\CommonMark\CommonMarkCoreExtension;
use League\CommonMark\Extension\ExternalLink\ExternalLinkExtension;
use League\CommonMark\Extension\Mention\MentionExtension;

class BlogDisplay {

	public static function makeCommonMarkEnv( bool $realLinks ): Environment {
		$config = [
			'mentions' => [
				'packagist' => [
					'prefix' => 'package:',
					// From the composer spec
					'pattern' => '[a-z0-9]([_.-]?[a-z0-9]+)*\/[a-z0-9](([_.]|-{1,2})?[a-z0-9]+)*',
					// 'https://packagist.org/packages/%s'
					'generator' => new PackageMentionGenerator(),
				],
				'gh-repo' => [
					'prefix' => 'gh:',
					'pattern' => '[a-z][a-z0-9]*\/[\-a-z0-9]*',
					// 'https://github.com/%s'
					'generator' => new GitHubRepoMentionGenerator(),
				],
			],
			'external_link' => [
				'html_class' => 'external-link',
				'open_in_new_window' => true,
			],
		];
		if ( !$realLinks ) {
			$config['mentions']['packagist']['generator'] = new DisabledMentionGenerator();
			$config['mentions']['gh-repo']['generator'] = new DisabledMentionGenerator();
		}

		$env = new Environment( $config );
		$env->addExtension( new CommonMarkCoreExtension() );
		$env->addExtension( new MentionExtension() );
		$env->addExtension( new ExternalLinkExtension() );
		return $env;
	}

}
