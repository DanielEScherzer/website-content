<?php
declare( strict_types = 1 );

namespace DanielWebsite\Pages;

use DanielEScherzer\HTMLBuilder\FluentHTML;
use Throwable;

class InternalErrorPage extends BasePage {

	private Throwable $error;

	public function __construct( Throwable $error ) {
		parent::__construct();
		$this->head->append(
			FluentHTML::fromTag( 'title' )->addChild( 'Internal Error' )
		);
		$this->error = $error;
		$this->setResponseCode( 500 );
	}

	protected function build(): void {
		$this->addStyleSheet( 'error-styles.css' );
		$this->head->append(
			FluentHTML::make(
				'style',
				[],
				[
					'pre { overflow-x: auto; padding-bottom: 10px; }',
					'.error-box { width: fit-content; max-width: 100%; }',
				]
			)
		);
		$error = $this->error;
		$file = $error->getFile();
		if ( str_starts_with( $file, '/var/www/html/' ) ) {
			$file = '.../' . substr( $file, strlen( '/var/www/html/' ) );
		}
		$this->contentWrapper->append(
			FluentHTML::make(
				'div',
				[ 'class' => 'error-box' ],
				[
					FluentHTML::make( 'h1', [], 'Internal Error' ),
					FluentHTML::make(
						'p',
						[],
						'[' . get_class( $error ) . '] ' . $error->getMessage(),
					),
					FluentHTML::make(
						'p',
						[],
						[
							'From ',
							FluentHTML::make( 'code', [], $file ),
							' line ',
							FluentHTML::make( 'code', [], (string)$error->getLine() ),
						]
					),
					FluentHTML::make( 'p', [], 'Backtrace:' ),
					FluentHTML::make(
						'pre',
						[],
						self::formatTrace( $error )
					),
				]
			)
		);
	}

	public static function handleException( Throwable $error ) {
		try {
			$page = new InternalErrorPage( $error );
			$page->getResponse()->applyResponse();
		} catch ( Throwable $error2 ) {
			self::handleManually( $error, $error2 );
		}
	}

	public static function handleManually( Throwable $error1, Throwable $error2 ) {
		http_response_code( 500 );
		echo "<!DOCTYPE html>\n";
		echo "<html lang='en'>\n";
		echo "<head>\n";
		echo "<title>Internal Error</title>\n";
		echo "<style> .content-wrapper { margin: auto; width: 80%; } </style>\n";
		echo "</head>\n<body>\n";
		echo "<div class='content-wrapper'>\n";

		echo "<h1>Internal Error</h1>\n";
		echo '<p>[' . get_class( $error1 ) . '] ' . $error1->getMessage() . "</p>\n";
		$file = $error1->getFile();
		if ( str_starts_with( $file, '/var/www/html/' ) ) {
			$file = '.../' . substr( $file, strlen( '/var/www/html/' ) );
		}
		echo "<p>From: <code>$file</code> line " . $error1->getLine() . "</p>\n";
		echo "<p>Backtrace:</p>\n";
		echo "<pre>" . self::formatTrace( $error1 ) . "</pre>\n";

		echo "<p><b>While trying to handle that error, the handler also had an error:</b></p>\n";
		echo '<p>[' . get_class( $error2 ) . '] ' . $error2->getMessage() . "</p>\n";
		$file = $error2->getFile();
		if ( str_starts_with( $file, '/var/www/html/' ) ) {
			$file = '.../' . substr( $file, strlen( '/var/www/html/' ) );
		}
		echo "<p>From: <code>$file</code> line " . $error2->getLine() . "</p>\n";
		echo "<p>Backtrace:</p>\n";
		echo "<pre>" . self::formatTrace( $error2 ) . "</pre>\n";

		echo "</div></body></html>";
	}

	/**
	 * Like Exception::getTraceAsString() but
	 * - the `/var/www/html/` is removed from the start of files
	 */
	private static function formatTrace( Throwable $error ): string {
		// Don't want to try and reimplement the entirety of the exception
		// formatting
		$trace = $error->getTraceAsString();
		$lines = explode( "\n", $trace );
		$betterLines = array_map(
			static fn ( $line ) => preg_replace(
				"/^(#\d+) \/var\/www\/html\/([^\(]+\(\d+\): .*$)/",
				"$1 .../$2",
				$line
			),
			$lines
		);
		return implode( "\n", $betterLines );
	}

}
