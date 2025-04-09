<?php
declare( strict_types = 1 );

namespace DanielWebsite\Pages;

use DanielEScherzer\HTMLBuilder\FluentHTML;

class Error405Page extends BasePage {

	private string $requestedPage;
	private string $requestedMethod;
	private array $allowedMethods;

	public function __construct(
		string $requestedPage,
		string $requestedMethod,
		array $allowedMethods
	) {
		parent::__construct();
		$this->head->append(
			FluentHTML::fromTag( 'title' )->addChild( 'Error' )
		);
		$this->requestedPage = $requestedPage;
		$this->requestedMethod = $requestedMethod;
		$this->allowedMethods = $allowedMethods;
	}

	protected function build(): void {
		$this->addStyleSheet( 'error-styles.css' );
		$page = $this->requestedPage;
		$requested = $this->requestedMethod;
		$allowed = implode( ", ", $this->allowedMethods );
		$this->contentWrapper->append(
			FluentHTML::make(
				'div',
				[ 'class' => 'error-box' ],
				[
					FluentHTML::make( 'h1', [], 'Error' ),
					FluentHTML::make(
						'p',
						[],
						"The requested page `$page` does not support the " .
							"HTTP action `$requested`. Allowed actions " .
							"are: $allowed"
					),
				]
			)
		);
	}

}
