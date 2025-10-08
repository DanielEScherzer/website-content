<?php
declare( strict_types = 1 );

namespace DanielWebsite\Pages;

use DanielEScherzer\HTMLBuilder\FluentHTML;

class Error404Page extends BasePage {

	private string $requestedPage;

	public function __construct( string $requestedPage ) {
		parent::__construct();
		$this->head->append(
			FluentHTML::fromTag( 'title' )->addChild( 'Error' )
		);
		$this->requestedPage = $requestedPage;
		$this->setResponseCode( 404 );
	}

	protected function build(): void {
		$this->addStyleSheet( 'error-styles.css' );
		$page = $this->requestedPage;
		$this->contentWrapper->append(
			FluentHTML::make(
				'div',
				[ 'class' => 'error-box' ],
				[
					FluentHTML::make( 'h1', [], 'Error' ),
					FluentHTML::make(
						'p',
						[],
						"The requested page `$page` is not recognized"
					),
				]
			)
		);
	}

}
