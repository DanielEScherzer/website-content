<?php
declare( strict_types = 1 );

namespace DanielWebsite\Tests\Blog;

/**
 * Tests for blog mention generators
 */
use DanielWebsite\Blog\DisabledMentionGenerator;
use DanielWebsite\Blog\GitHubRepoMentionGenerator;
use DanielWebsite\Blog\PackageMentionGenerator;
use League\CommonMark\Environment\Environment;
use League\CommonMark\Extension\CommonMark\CommonMarkCoreExtension;
use League\CommonMark\Extension\ExternalLink\ExternalLinkExtension;
use League\CommonMark\Extension\Mention\MentionExtension;
use League\CommonMark\Parser\MarkdownParser;
use League\CommonMark\Renderer\HtmlRenderer;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

#[CoversClass( DisabledMentionGenerator::class )]
#[CoversClass( GitHubRepoMentionGenerator::class )]
#[CoversClass( PackageMentionGenerator::class )]
class MentionGeneratorTest extends TestCase {

	private const string INPUT_MARKDOWN = <<<END
I don't anticipate that the
package with my configuration will be useful for anyone else, but in case it is,
you can find the package at package:danielescherzer/common-phpcs on Packagist,
and the source at gh:DanielEScherzer/common-phpcs on GitHub.
END;

	// phpcs:disable Generic.Files.LineLength.TooLong

	private const string EXPECTED_WITH_LINKS = <<<END
<p>I don't anticipate that the
package with my configuration will be useful for anyone else, but in case it is,
you can find the package at <a rel="noopener noreferrer" class="external-link" href="https://packagist.org/packages/danielescherzer/common-phpcs">danielescherzer/common-phpcs</a> on Packagist,
and the source at <a rel="noopener noreferrer" class="external-link" href="https://github.com/DanielEScherzer/common-phpcs">DanielEScherzer/common-phpcs</a> on GitHub.</p>
END;

	// phpcs:enable Generic.Files.LineLength.TooLong

	private const string EXPECTED_NO_LINKS = <<<END
<p>I don't anticipate that the
package with my configuration will be useful for anyone else, but in case it is,
you can find the package at danielescherzer/common-phpcs on Packagist,
and the source at DanielEScherzer/common-phpcs on GitHub.</p>
END;

	public function testRealGenerators() {
		$env = new Environment( [
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
			],
		] );
		$env->addExtension( new CommonMarkCoreExtension() );
		$env->addExtension( new MentionExtension() );
		$env->addExtension( new ExternalLinkExtension() );

		$parser = new MarkdownParser( $env );

		$parsedResult = $parser->parse( self::INPUT_MARKDOWN );
		$renderer = new HtmlRenderer( $env );
		$html = $renderer->renderDocument( $parsedResult )->getContent();

		$this->assertSame(
			self::EXPECTED_WITH_LINKS,
			trim( $html )
		);
	}

	public function testDisabledGenerator() {
		$env = new Environment( [
			'mentions' => [
				'packagist' => [
					'prefix' => 'package:',
					// From the composer spec
					'pattern' => '[a-z0-9]([_.-]?[a-z0-9]+)*\/[a-z0-9](([_.]|-{1,2})?[a-z0-9]+)*',
					// 'https://packagist.org/packages/%s'
					'generator' => new DisabledMentionGenerator(),
				],
				'gh-repo' => [
					'prefix' => 'gh:',
					'pattern' => '[a-z][a-z0-9]*\/[\-a-z0-9]*',
					// 'https://github.com/%s'
					'generator' => new DisabledMentionGenerator(),
				],
			],
			'external_link' => [
				'html_class' => 'external-link',
			],
		] );
		$env->addExtension( new CommonMarkCoreExtension() );
		$env->addExtension( new MentionExtension() );
		$env->addExtension( new ExternalLinkExtension() );

		$parser = new MarkdownParser( $env );

		$parsedResult = $parser->parse( self::INPUT_MARKDOWN );
		$renderer = new HtmlRenderer( $env );
		$html = $renderer->renderDocument( $parsedResult )->getContent();

		$this->assertSame(
			self::EXPECTED_NO_LINKS,
			trim( $html )
		);
	}

}
