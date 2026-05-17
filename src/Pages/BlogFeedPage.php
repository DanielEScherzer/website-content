<?php
declare( strict_types = 1 );

namespace DanielWebsite\Pages;

use DanielEScherzer\HTMLBuilder\FluentHTML;
use DanielWebsite\WebResponse;

class BlogFeedPage extends BasePage {

	private ?string $feedName;

	public function __construct( array $params ) {
		parent::__construct();
		$this->feedName = $params['feed'] ?? null;
		$this->head->append(
			FluentHTML::fromTag( 'title' )->addChild( 'Blog feeds' )
		);
	}

	public function getResponse(): WebResponse {
		if ( $this->feedName === 'rss.xml' ) {
			// Bypass BasePage handling and return raw xml
			$content = file_get_contents( dirname( __DIR__ ) . '/Blog/feed-rss.xml' );
			return new WebResponse(
				$content,
				[ 'Content-Type: application/xml' ],
				200
			);
		}
		return parent::getResponse();
	}

	protected function build(): void {
		if ( $this->feedName === 'rss.xml' ) {
			return;
		}
		if ( $this->feedName !== null ) {
			$this->addStyleSheet( 'error-styles.css' );
			$feed = $this->feedName;
			$this->contentWrapper->append(
				FluentHTML::make(
					'div',
					[ 'class' => 'error-box' ],
					[
						FluentHTML::make( 'h1', [], 'Error' ),
						FluentHTML::make(
							'p',
							[],
							"The requested blog feed `$feed` is not recognized"
						),
					]
				)
			);
			$this->setResponseCode( 404 );
		}
		$this->contentWrapper->append(
			FluentHTML::make( 'h1', [], 'Known feed types' ),
			FluentHTML::make(
				'ul',
				[],
				[
					FluentHTML::make(
						'li',
						[],
						FluentHTML::make(
							'a',
							[ 'href' => '/Blog' ],
							'HTML index of blog posts'
						)
					),
					FluentHTML::make(
						'li',
						[],
						FluentHTML::make(
							'a',
							[ 'href' => '/Blog/feed/rss.xml' ],
							'RSS feed of blog posts'
						)
					),
				]
			)
		);
	}

}
