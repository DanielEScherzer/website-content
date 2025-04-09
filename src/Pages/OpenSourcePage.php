<?php
declare( strict_types = 1 );

namespace DanielWebsite\Pages;

use DanielEScherzer\HTMLBuilder\FluentHTML;

class OpenSourcePage extends BasePage {

	private const PHP_RFCS = [
		'Attributes-on-constants' => [
			'name' => 'Attributes on Constants',
			'link' => 'https://wiki.php.net/rfc/attributes-on-constants',
			'date' => 'November 2024',
			'desc' => 'Adding support for attributes on compile-time constants',
			'status' => 'Pending implementation',
		],
		'Never-parameters' => [
			'name' => 'Never Parameters (v2)',
			'link' => 'https://wiki.php.net/rfc/never-parameters-v2',
			'date' => 'March 2025',
			'desc' => 'Adding support for never-typed parameters',
			'status' => 'Under discussion',
		],
		'Final-promoted-properties' => [
			'name' => 'Final Property Promotion',
			'link' => 'https://wiki.php.net/rfc/final_promotion',
			'date' => 'March 2025',
			'desc' => 'Adding support for final modifiers in constructor property promotion',
			'status' => 'Under discussion',
		],
	];

	private const PHP_PACKAGES = [
		'common-phpcs' => [
			'name' => 'danielescherzer/common-phpcs',
			'link' => 'https://packagist.org/packages/danielescherzer/common-phpcs',
			'desc' => 'Collection of common codesniffer standards for my projects',
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
					'I contribute to open-source libraries on GitHub as ',
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
		$this->addPHPSection();
		$this->addPackagesSection();
		$this->addWebsiteSection();
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
 and various cleanup. In March 2025, I requested and was granted access to made
direct direct changes (and approve others' changes) to PHP. I also became the
official maintainer of the reflection extension.
END,
				]
			),
			FluentHTML::make(
				'p',
				[],
				<<<END
PHP uses a process of requests for comment when proposing and implementing major
changes; I have proposed the following RFCs:
END
			),
		);
		$list = FluentHTML::fromTag( 'ul' );
		foreach ( self::PHP_RFCS as $details ) {
			$item = FluentHTML::make(
				'li',
				[],
				[
					$details['date'] . ': ',
					$makeLink( $details['link'], $details['name'] ),
					' - ',
					$details['desc'],
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
		$reflectionLink = $makeLink(
			'https://www.php.net/manual/en/book.reflection.php',
			'Reflection extension'
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
