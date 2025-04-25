<?php
declare( strict_types = 1 );

namespace DanielWebsite\Pages;

use DanielEScherzer\HTMLBuilder\FluentHTML;

class ToolPage extends BasePage {

	private ?string $tool;

	private const TOOL_MAPPING = [
		'dvorak' => true,
	];

	public function __construct( array $params ) {
		parent::__construct();
		$this->tool = $params['tool'] ?? null;
		$this->head->append(
			FluentHTML::fromTag( 'title' )->addChild( 'Tools' )
		);
	}

	protected function build(): void {
		if ( $this->tool === null ) {
			$this->addIndex();
			return;
		}
		if ( !isset( self::TOOL_MAPPING[ $this->tool ] ) ) {
			$this->addStyleSheet( 'error-styles.css' );
			$tool = $this->tool;
			$this->contentWrapper->append(
				FluentHTML::make(
					'div',
					[ 'class' => 'error-box' ],
					[
						FluentHTML::make( 'h1', [], 'Error' ),
						FluentHTML::make(
							'p',
							[],
							"The requested tool `$tool` is not recognized"
						),
					]
				)
			);
			$this->addIndex();
			return;
		}
		$this->contentWrapper->append(
			FluentHTML::make( 'h1', [], 'Tool: ' . $this->tool ),
			FluentHTML::make( 'div', [ 'id' => 'tool-target' ], [] )
		);
		$this->addScript( 'tools/' . $this->tool . '.js' );
		$this->addStyleSheet( 'tools/' . $this->tool . '.css' );
	}

	private function addIndex(): void {
		$list = FluentHTML::make( 'ul', [], [] );
		foreach ( self::TOOL_MAPPING as $k => $_ ) {
			$link = FluentHTML::make(
				'a',
				[ 'href' => "/Tools/$k" ],
				$k
			);
			$list->append(
				FluentHTML::make( 'li', [], $link )
			);
		}
		$this->contentWrapper->append(
			FluentHTML::make( 'h1', [], 'Known tools' ),
			$list
		);
		$this->contentWrapper->append(
			FluentHTML::make(
				'p',
				[],
				<<<END
These are just some JavaScript utilities for Daniel, though anyone who wants to
is obviously free to use them.
END
			)
		);
	}

}
