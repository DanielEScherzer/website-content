<?php
declare( strict_types = 1 );

namespace DanielWebsite\Pages;

use DanielEScherzer\CommonMarkPygmentsHighlighter\PygmentsHighlighterExtension;
use DanielEScherzer\HTMLBuilder\FluentHTML;
use DanielEScherzer\HTMLBuilder\RawHTML;
use League\CommonMark\Environment\Environment;
use League\CommonMark\Extension\CommonMark\CommonMarkCoreExtension;
use League\CommonMark\Extension\InlinesOnly\InlinesOnlyExtension;
use League\CommonMark\MarkdownConverter;

class ReferencePage extends BasePage {

	private ?string $reference;

	private const REFERENCE_MAPPING = [
		'programming-languages' => [
			'title' => 'Programming Languages',
			'callback' => 'documentProgrammingLanguages',
		],
	];

	public function __construct( array $params ) {
		parent::__construct();
		$this->reference = $params['reference'] ?? null;
		$this->head->append(
			FluentHTML::fromTag( 'title' )->addChild( 'References' )
		);
	}

	protected function build(): void {
		if ( $this->reference === null ) {
			$this->addIndex();
			return;
		}
		if ( !isset( self::REFERENCE_MAPPING[ $this->reference ] ) ) {
			$this->addStyleSheet( 'error-styles.css' );
			$ref = $this->reference;
			$this->contentWrapper->append(
				FluentHTML::make(
					'div',
					[ 'class' => 'error-box' ],
					[
						FluentHTML::make( 'h1', [], 'Error' ),
						FluentHTML::make(
							'p',
							[],
							"The requested reference page `$ref` is not recognized"
						),
					]
				)
			);
			$this->addIndex();
			$this->setResponseCode( 404 );
			return;
		}
		$this->addStyleSheet( 'references/' . $this->reference . '.css' );
		$refData = self::REFERENCE_MAPPING[ $this->reference ];
		$this->contentWrapper->append(
			FluentHTML::make( 'h1', [], 'Reference: ' . $refData[ 'title' ] ),
		);
		$fn = $refData[ 'callback' ];
		$this->$fn();
	}

	private function documentProgrammingLanguages(): void {
		$data = file_get_contents( dirname( __DIR__ ) . '/References/ProgrammingLanguages.json' );
		$data = json_decode( $data, true );

		$heading = FluentHTML::fromTag( 'tr' );
		foreach ( $data['_columns'] as $idx => $col ) {
			$heading->append(
				FluentHTML::make( 'th', [], $col )
			);
		}

		$environment = new Environment( [] );
		$environment->addExtension( new InlinesOnlyExtension() );
		$converter = new MarkdownConverter( $environment );
		$makeCell = static function ( string $text ) use ( $converter ): string|RawHTML {
			if ( str_contains( $text, '*' ) || str_contains( $text, '`' ) ) {
				return new RawHTML( $converter->convert( $text )->getContent() );
			}
			return $text;
		};

		$body = FluentHTML::fromTag( 'tbody' );
		$popovers = [];
		$codeEnv = new Environment( [] );
		$codeEnv->addExtension( new CommonMarkCoreExtension() );
		$codeEnv->addExtension( new PygmentsHighlighterExtension() );
		$codeConverter = new MarkdownConverter( $codeEnv );
		foreach ( $data['rows'] as $rowData ) {
			// var_dump( $row );
			$row = FluentHTML::fromTag( 'tr' );
			$rowData = array_values( $rowData );
			$label = $rowData[0];
			foreach ( $rowData as $idx => $val ) {
				if ( str_starts_with( $val, '```' ) ) {
					$id = "example-$label-" . $data['_columns'][$idx];
					$id = strtr( $id, ' ', '_' );
					$row->append(
						FluentHTML::make(
							'td',
							[],
							FluentHTML::make(
								'button',
								[ 'popovertarget' => $id ],
								'Show'
							)
						)
					);
					$popovers[] = FluentHTML::make(
						'div',
						[ 'id' => $id, 'popover' => 'auto' ],
						new RawHTML( $codeConverter->convert( $val )->getContent() )
					);
				} else {
					$row->append( FluentHTML::make( 'td', [], $makeCell( $val ) ) );
				}
			}
			$body->append( $row );
		}

		$table = FluentHTML::make(
			'table',
			[],
			[
				FluentHTML::make( 'thead', [], $heading ),
				$body,
			]
		);
		$this->contentWrapper->append( $table );
		if ( $popovers ) {
			$this->contentWrapper->append(
				FluentHTML::make( 'div', [ 'id' => 'reference-popovers' ], $popovers )
			);
		}
	}

	private function addIndex(): void {
		$list = FluentHTML::make( 'ul', [], [] );
		foreach ( self::REFERENCE_MAPPING as $k => $d ) {
			$link = FluentHTML::make(
				'a',
				[ 'href' => "/References/$k" ],
				$d['title']
			);
			$list->append(
				FluentHTML::make( 'li', [], $link )
			);
		}
		$this->contentWrapper->append(
			FluentHTML::make( 'h1', [], 'Known reference pages' ),
			$list
		);
		$this->contentWrapper->append(
			FluentHTML::make(
				'p',
				[],
				<<<END
These are just some reference pages for Daniel, though anyone who wants to
is obviously free to use them.
END
			)
		);
	}

}
