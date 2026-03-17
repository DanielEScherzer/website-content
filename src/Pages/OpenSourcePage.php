<?php
declare( strict_types = 1 );

namespace DanielWebsite\Pages;

use DanielEScherzer\HTMLBuilder\FluentHTML;
use DanielWebsite\SitemapEntry;

#[SitemapEntry( 'OpenSource' )]
class OpenSourcePage extends BasePage {

	private const OPEN_SOURCE_PRESENTATIONS = [
		'PHP-8.5' => [
			'title' => 'PHP 8.5: New Features from the Source',
			'iterations' => [
				[
					'conf' => 'Longhorn PHP Conference',
					'loc' => 'Austin, Texas',
					'date' => 'October 2025',
					'slides' => '20251025 Longhorn PHP presentation.pdf',
					'blog' => '20251029-longhorn-php#content-my-talk',
				],
				[
					'conf' => 'MergePHP',
					'loc' => 'Remote',
					'date' => 'November 2025',
					'slides' => '20251117 MergePHP presentation.pdf',
					'blog' => '20251118-mergephp-talk',
				],
				[
					'conf' => 'ConFoo Montreal 2026',
					'loc' => 'Montreal, Canada',
					'date' => 'February 2026',
					'slides' => '20260226 ConFoo PHP presentation.pdf',
					'blog' => '20260302-confoo#content-php-85',
				],
			],
		],
		'Intro-Rust-Experience-Devs' => [
			'title' => 'Introduction to Rust for Experienced Software Developers',
			'iterations' => [
				[
					'conf' => 'ConFoo Montreal 2026',
					'loc' => 'Montreal, Canada',
					'date' => 'February 2026',
					'slides' => '20260225 ConFoo Rust presentation.pdf',
					'blog' => '20260302-confoo#content-intro-to-rust',
				],
			],
		],
		'PHP-8.6' => [
			'title' => 'PHP 8.6: The Inside Scoop',
			'iterations' => [
				[
					'conf' => 'PHP Tek 2026',
					'loc' => 'Chicago, Illinois',
					'date' => 'May 2026',
					'upcoming' => true,
				],
			],
		],
		'PHP-SemVer' => [
			'title' => 'Semantic Versioning and the PHP Ecosystem: A Reality Check',
			'iterations' => [
				[
					'conf' => 'PHP Tek 2026',
					'loc' => 'Chicago, Illinois',
					'date' => 'May 2026',
					'upcoming' => true,
				],
			],
		],
	];

	private const PHP_RFCS = [
		'Attributes-on-constants' => [
			'name' => 'Attributes on Constants',
			'link' => 'https://wiki.php.net/rfc/attributes-on-constants',
			'date' => 'November 2024',
			'desc' => 'Adding support for attributes on compile-time constants',
			'status' => 'implemented in PHP 8.5',
		],
		'Final-promoted-properties' => [
			'name' => 'Final Property Promotion',
			'link' => 'https://wiki.php.net/rfc/final_promotion',
			'date' => 'March 2025',
			'desc' => 'Adding support for final modifiers in constructor property promotion',
			'status' => 'implemented in PHP 8.5',
		],
		'#[\DelayedTargetValidation]' => [
			'name' => '#[\DelayedTargetValidation] attribute',
			'link' => 'https://wiki.php.net/rfc/delayedtargetvalidation_attribute',
			'date' => 'June 2025',
			'desc' => 'Delaying compile-time attribute target validation errors with #[\DelayedTargetValidation]',
			'status' => 'implemented in PHP 8.5',
		],
		'FILTER_THROW_ON_FAILURE' => [
			'name' => 'FILTER_THROW_ON_FAILURE',
			'link' => 'https://wiki.php.net/rfc/filter_throw_on_failure',
			'date' => 'July 2025',
			'desc' => 'Add FILTER_THROW_ON_FAILURE flag to the filter extension',
			'status' => 'implemented in PHP 8.5',
		],
		'#[\Deprecated] for traits' => [
			'name' => '#[\Deprecated] for traits',
			'link' => 'https://wiki.php.net/rfc/deprecated_traits',
			'date' => 'July 2025',
			'desc' => 'Support the #[\Deprecated] attribute on traits',
			'status' => 'implemented in PHP 8.5',
		],
		'Debugable Enums' => [
			'name' => 'Debugable Enums',
			'link' => 'https://wiki.php.net/rfc/debugable-enums',
			'date' => 'March 2026',
			'desc' => 'Allow __debugInfo() on enums',
			'status' => 'under discussion',
		],
		'#[\Override] for class constants' => [
			'name' => '#[\Override] for class constants',
			'link' => 'https://wiki.php.net/rfc/override_constants',
			'date' => 'March 2026',
			'desc' => 'Extend #[\Override] to target class constants',
			'status' => 'in draft',
		],
	];

	private const PHP_PACKAGES = [
		'common-phpcs' => [
			'name' => 'danielescherzer/common-phpcs',
			'link' => 'https://packagist.org/packages/danielescherzer/common-phpcs',
			'desc' => 'Collection of common codesniffer standards for my projects',
		],
		'commonmark-ext-pygments-highlighter' => [
			'name' => 'danielescherzer/commonmark-ext-pygments-highlighter',
			'link' => 'https://packagist.org/packages/danielescherzer/commonmark-ext-pygments-highlighter',
			'desc' => 'CommonMark extension for code highlighting with Pygments',
		],
		'html-builder' => [
			'name' => 'danielescherzer/html-builder',
			'link' => 'https://packagist.org/packages/danielescherzer/html-builder',
			'desc' => 'Tools for building HTML',
		],
	];

	public function __construct() {
		parent::__construct();
		$this->head->append(
			FluentHTML::fromTag( 'title' )->addChild( 'Open source' )
		);
	}

	protected function build(): void {
		$this->contentWrapper->append(
			FluentHTML::make( 'h1', [], 'Open source contributions' ),
			FluentHTML::make(
				'p',
				[],
				[
					'I contribute to open-source projects on GitHub as ',
					FluentHTML::make(
						'a',
						[
							'href' => 'https://github.com/DanielEScherzer',
							'target' => '_blank',
							'class' => 'external-link',
						],
						'@DanielEScherzer'
					),
					'.',
				]
			)
		);
		$this->addTalksSection();
		$this->addPHPSection();
		$this->addPackagesSection();
		$this->addWebsiteSection();
	}

	private function addTalksSection(): void {
		$this->contentWrapper->append(
			FluentHTML::make( 'h3', [ 'class' => 'subsection-header' ], 'Conference Presentations' ),
			FluentHTML::make(
				'p',
				[],
				[
					<<<END
I have given a few presentation at various open-source-related conferences. The
slides and my post-conference write-ups in my blog are listed below. Note that
even when a presentation is given multiple times, the content changes.
END,
				]
			)
		);
		$makeDetails = static fn ( $details ) => [
			FluentHTML::make( 'em', [], $details['conf'] ),
			'. ',
			$details['loc'],
			', ',
			$details['date'],
			...(
				( $details['upcoming'] ?? false ) ? [ '. Upcoming.' ] :
				[
					'. (',
					FluentHTML::make(
						'a',
						[ 'href' => './files/' . $details['slides'] ],
						'Slides'
					),
					', ',
					FluentHTML::make(
						'a',
						[ 'href' => './blog/' . $details['blog'] ],
						'Blog write up'
					),
					')',
				]
			),
		];
		$list = FluentHTML::fromTag( 'ul' );
		foreach ( array_reverse( self::OPEN_SOURCE_PRESENTATIONS ) as $details ) {
			if ( count( $details['iterations'] ) === 1 ) {
				$once = $details['iterations'][0];
				$item = FluentHTML::make(
					'li',
					[],
					[
						'"' . $details['title'] . '," ',
						...( $makeDetails( $details['iterations'][0] ) ),
					]
				);
				$list->append( $item );
				continue;
			}
			$iterations = array_map(
				static fn ( $iter ) => FluentHTML::make( 'li', [], $makeDetails( $iter ) ),
				array_reverse( $details['iterations'] )
			);
			$item = FluentHTML::make(
				'li',
				[],
				[
					'"' . $details['title'] . '"',
					FluentHTML::make( 'ul', [], $iterations ),
				]
			);
			$list->append( $item );
		}
		$this->contentWrapper->append( $list );
	}

	private function addPHPSection(): void {
		$makeLink = static fn ( $href, $text ) => FluentHTML::make(
			'a',
			[
				'href' => $href,
				'target' => '_blank',
				'class' => 'external-link',
			],
			$text
		);
		$reflectionLink = $makeLink(
			'https://www.php.net/manual/en/book.reflection.php',
			'Reflection extension'
		);
		$blogLink = FluentHTML::make(
			'a',
			[ 'href' => '/Blog/20250417-php85-release-manager' ],
			'my blog post'
		);
		$this->contentWrapper->append(
			FluentHTML::make( 'h3', [ 'class' => 'subsection-header' ], 'PHP' ),
			FluentHTML::make(
				'p',
				[],
				[
					<<<END
I started contributing to the PHP source in August 2024, working primarily on
bug fixes, improvements to the 
END,
					$reflectionLink,
					<<<END
 and various cleanup. In March 2025, I requested and was granted access to make
direct changes (and approve others' changes) to PHP. I also became the official
maintainer of the reflection extension.
END,
				]
			),
			FluentHTML::make(
				'p',
				[],
				[
					<<<END
Also in March 2025, I volunteered to serve as one of the release managers for
the then-subsequent version of PHP, PHP 8.5. In April, the community voted to
decide between the volunteers (luckily there were plenty of candidates) and I
was one of the two "rookie" candidates chosen to help with the release. You can
read more in 
END,
					$blogLink,
					'.',
				]
			),
			FluentHTML::make(
				'p',
				[],
				<<<END
PHP uses a process of requests for comment when proposing and implementing major
changes; my RFCs include:
END
			),
		);
		$list = FluentHTML::fromTag( 'ul' );
		foreach ( array_reverse( self::PHP_RFCS ) as $details ) {
			$item = FluentHTML::make(
				'li',
				[],
				[
					$details['date'] . ': ',
					$makeLink( $details['link'], $details['name'] ),
					' - ',
					$details['desc'],
					' (',
					$details['status'],
					')',
				]
			);
			$list->append( $item );
		}
		$this->contentWrapper->append( $list );
	}

	private function addPackagesSection(): void {
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
			FluentHTML::make( 'h3', [ 'class' => 'subsection-header' ], 'Packages' ),
			FluentHTML::make(
				'p',
				[],
				<<<END
I also wrote multiple open-source PHP packages - though they are currently
primarily used by me, I am a firm supporter of open-source code and figured that
they might be useful to others. The packages that I have created so far are:
END,
			),
		);
		$list = FluentHTML::fromTag( 'ul' );
		foreach ( self::PHP_PACKAGES as $details ) {
			$item = FluentHTML::make(
				'li',
				[],
				[
					$makeLink( $details['link'], $details['name'] ),
					' - ',
					$details['desc'],
				]
			);
			$list->append( $item );
		}
		$this->contentWrapper->append( $list );
	}

	private function addWebsiteSection(): void {
		$this->contentWrapper->append(
			FluentHTML::make( 'h3', [ 'class' => 'subsection-header' ], 'Website' ),
			FluentHTML::make(
				'p',
				[],
				[
					<<<END
The source code for my website is also public, in case the code is useful to
others. The actual text about me is probably not going to be relevant, but my
setup, configuration, and style pages may be useful. See the code 
END,
					FluentHTML::make(
						'a',
						[
							'href' => 'https://github.com/DanielEScherzer/website-content',
							'target' => '_blank',
							'class' => 'external-link',
						],
						'here'
					),
					'.',
				]
			),
		);
	}

}
