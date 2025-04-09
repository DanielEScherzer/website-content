<?php
declare( strict_types = 1 );

/**
 * Generic HTML output
 */

namespace DanielWebsite\Pages;

use DanielEScherzer\HTMLBuilder\FluentHTML;
use DanielEScherzer\HTMLBuilder\RawHTML;

abstract class BasePage {

	protected FluentHTML $head;
	protected FluentHTML $contentWrapper;

	public function __construct() {
		$this->head = FluentHTML::fromTag( 'head' );
		$this->contentWrapper = FluentHTML::fromTag( 'div' )
			->addClass( 'content-wrapper' );
		// Prevent trying to read a favicon that we don't have
		$this->head->append(
			FluentHTML::fromTag( 'link' )
				->setAttribute( 'rel', 'icon' )
				->setAttribute( 'href', 'data:,' )
		);
		$this->addStyleSheet( 'default-styles.css' );
		// Not shown in tests, or in staging
		if ( !defined( 'PHPUNIT_TESTS_RUNNING' ) &&
			!getenv( 'DANIEL_WEBSITE_STAGING' )
		) {
			$this->head->append(
				new RawHTML(
				<<<END
<!-- Matomo -->
<script>
  var _paq = window._paq = window._paq || [];
  /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
  _paq.push(['trackPageView']);
  _paq.push(['enableLinkTracking']);
  (function() {
    var u="//scherzer.dev/matomo/";
    _paq.push(['setTrackerUrl', u+'matomo.php']);
    _paq.push(['setSiteId', '1']);
    var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
    g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
  })();
</script>
<!-- End Matomo Code -->
END
				)
			);
		}
	}

	protected function addStyleSheet( string $fileName ): void {
		$this->head->append(
			FluentHTML::fromTag( 'link' )
				->setAttribute( 'rel', 'stylesheet' )
				->setAttribute( 'type', 'text/css' )
				->setAttribute( 'href', "/resources/{$fileName}" )
		);
	}

	abstract protected function build(): void;

	private function getNavBar(): FluentHTML {
		$knownPages = [
			LandingPage::class => [ 'Home', 'Home' ],
			[ 'files/Resume.pdf', 'Résumé' ],
			OpenSourcePage::class => [ 'OpenSource', 'Open Source' ],
			WorkPage::class => [ 'Work', 'Work' ],
			BlogIndexPage::class => [ 'Blog', 'Blog' ],
		];
		$currentPage = get_class( $this );

		$navBar = FluentHTML::fromTag( 'div' )
			->addClass( 'des-navbar' );
		foreach ( $knownPages as $clazz => $page ) {
			if ( $clazz === $currentPage ) {
				$navBar->append(
					FluentHTML::make(
						'strong',
						[ 'class' => 'des-strong-page-link' ],
						$page[1]
					)
				);
			} else {
				$navBar->append(
					FluentHTML::make(
						'a',
						[ 'href' => '/' . $page[0] ],
						$page[1]
					)
				);
			}
		}
		return $navBar;
	}

	private function getFooter(): FluentHTML {
		return FluentHTML::make(
			'div',
			[ 'class' => 'des-footer' ],
			FluentHTML::make(
				'div',
				[ 'class' => 'des-footer--content' ],
				[ 'Content is © 2025 Daniel Scherzer' ]
			)
		);
	}

	public function getPageOutput(): string {
		$this->build();
		$contents = [
			$this->getNavBar(),
			$this->contentWrapper,
			$this->getFooter(),
		];
		// Not shown in tests, which can be run on the staging site
		// @codeCoverageIgnoreStart
		if ( !defined( 'PHPUNIT_TESTS_RUNNING' ) &&
			getenv( 'DANIEL_WEBSITE_STAGING' )
		) {
			// Inlining the error box styles
			$styles = [
				'background-color' => '#fcdad4',
				'border' => '3px solid #fc9685',
				'padding' => '10px',
				'margin-top' => '20px',
				'margin-left' => 'auto',
				'margin-right' => 'auto',
				'max-width' => '60%',
			];
			$styles = array_map(
				static fn ( $k, $v ) => "$k: $v;",
				array_keys( $styles ),
				$styles
			);
			$style = implode( ' ', $styles );
			$warning = FluentHTML::make(
				'div',
				[ 'style' => $style ],
				'WARNING: THIS IS THE STAGING SITE'
			);
			array_unshift( $contents, $warning );
		}
		// @codeCoverageIgnoreEnd
		$html = FluentHTML::fromTag( 'html' )
			->append( $this->head )
			->append( FluentHTML::make( 'body', [], $contents ) )
			->getHTML();
		$docType = "<!DOCTYPE html>\n";
		return $docType . $html;
	}
}
