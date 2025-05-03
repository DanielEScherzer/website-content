<?php
declare( strict_types = 1 );

namespace DanielWebsite\Pages;

use DanielEScherzer\HTMLBuilder\FluentHTML;
use DanielWebsite\SiteMapEntry;

#[SiteMapEntry( 'Work' )]
class WorkPage extends BasePage {

	private const WIKITEQ_EXTENSIONS = [
		'HoneyPot' => [
			'https://gerrit.wikimedia.org/g/mediawiki/extensions/HoneyPot',
			'Implementation of a honey pot during account creation [created]',
		],
		'MinimalExample' => [
			'https://github.com/WikiTeq/mediawiki-extension-MinimalExample',
			'Demonstration of the process of building an extension [created]',
		],
		'PagePort' => [
			'https://gerrit.wikimedia.org/g/mediawiki/extensions/PagePort/',
			'Extension for exporting and importing groups of wiki pages [significant improvements]',
		],
	];

	private const WIKITEQ_PRESENTATIONS = [
		[
			'title' => 'Introduction to Enterprise MediaWiki',
			'conf' => 'Enterprise MediaWiki Conference, Spring 2023',
			'loc' => 'Austin, TX',
			'date' => 'April 2023',
			'video' => 'https://www.youtube.com/watch?v=nZQZyPfEiUI',
		],
		[
			'title' => 'Orchestration with Puppet',
			'conf' => 'MediaWiki Users and Developers Conference, Spring 2024',
			'loc' => 'Portland, OR',
			'date' => 'April 2024',
			'video' => 'https://www.youtube.com/watch?v=8H0AHc7Ou4U',
		],
		[
			'title' => 'Considerations when targeting LTS releases',
			'conf' => 'MediaWiki Users and Developers Conference, Fall 2024',
			'loc' => 'Vienna, Austria',
			'date' => 'November 2024',
			'video' => 'https://www.youtube.com/watch?v=hGYbXkfbkuU',
		],
	];

	public function __construct() {
		parent::__construct();
		$this->head->append(
			FluentHTML::fromTag( 'title' )->addChild( 'Work' )
		);
	}

	protected function build(): void {
		$this->contentWrapper->append(
			FluentHTML::make( 'h1', [], 'Work experience' ),
		);
		$this->addWikiTeqSection();
	}

	private function addWikiTeqSection(): void {
		$makeLink = static fn ( $href, $text ) => FluentHTML::make(
			'a',
			[
				'href' => $href,
				'target' => '_blank',
				'class' => 'external-link',
			],
			$text
		);
		$this->contentWrapper->append(
			FluentHTML::make( 'h3', [ 'class' => 'subsection-header' ], 'WikiTeq' ),
			FluentHTML::make(
				'p',
				[],
				[
					<<<END
I first joined WikiTeq in January 2023 as a Technical Project Manager, working
with a team of developers around the world to support clients that use
MediaWiki. As part of my work at WikiTeq, I have worked with multiple MediaWiki
extensions, though most of them are private. My contributions made as part of
my work at WikiTeq are all available under the account 
END,
					$makeLink( 'https://github.com/DanielWTQ', '@DanielWTQ' ),
					<<<END
 on GitHub. Some public extension contributions include:
END,
				]
			),
		);
		$list = FluentHTML::fromTag( 'ul' );
		foreach ( self::WIKITEQ_EXTENSIONS as $name => $details ) {
			$item = FluentHTML::make(
				'li',
				[],
				[
					$makeLink( $details[0], $name ),
					': ' . $details[1],
				]
			);
			$list->append( $item );
		}
		$this->contentWrapper->append( $list );
		$this->contentWrapper->append(
			FluentHTML::make(
				'p',
				[],
				<<<END
I also gave talks at multiple MediaWiki-related conferences on behalf of
WikiTeq. Those talks were recorded and are available publicly:
END
			)
		);

		$list = FluentHTML::fromTag( 'ul' );
		foreach ( self::WIKITEQ_PRESENTATIONS as $details ) {
			$item = FluentHTML::make(
				'li',
				[],
				[
					'"' . $details['title'] . '," ',
					FluentHTML::make( 'em', [], $details['conf'] ),
					'. ' . $details['loc'] . ', ' . $details['date'] . '.',
					' Available online at ',
					$makeLink( $details['video'], $details['video'] ),
					'.',
				]
			);
			$list->append( $item );
		}
		$this->contentWrapper->append( $list );
	}

}
