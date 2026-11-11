<?php
declare( strict_types = 1 );

namespace DanielWebsite\Tests\Blog;

use PHPUnit\Framework\Attributes\CoversNothing;
use PHPUnit\Framework\TestCase;
use Ramsey\Pygments\Pygments;
use Sabberworm\CSS\CSSList\Document;
use Sabberworm\CSS\OutputFormat;
use Sabberworm\CSS\Property\Selector;
use Sabberworm\CSS\Value\Value as CSSValue;

#[CoversNothing]
class BlogCSSTest extends TestCase {

	private function cssToDocument( string $css ): Document {
		$rules = array_map(
			static fn ( string $r ): string => preg_replace(
				'/^(\.\S+ {.+}) (\/\* .*? \*\/)$/',
				'$2 $1',
				$r,
			),
			explode( "\n", $css )
		);
		$style = implode( "\n", $rules );
		$parser = new \Sabberworm\CSS\Parser( $style );
		return $parser->parse();
	}

	private function documentToMap( Document $document ): array {
		$map = [];
		foreach ( $document->getAllDeclarationBlocks() as $block ) {
			$selector = implode(
				' ',
				array_map(
					static fn ( Selector $s ): string => $s->getSelector(),
					$block->getSelectors()
				)
			);
			$map[ $selector ] = $block->getRuleSet();
		}
		return $map;
	}

	public function testCSS() {
		// Not using using $selector parameter for getCss() because that isn't
		// applied to all of the rules
		$pygments = new Pygments();
		$lightStyle = $pygments->getCss( 'default' );
		$document = $this->cssToDocument( $lightStyle );
		$map = $this->documentToMap( $document );

		$darkStyle = $pygments->getCss( 'monokai' );
		$darkDocument = $this->cssToDocument( $darkStyle );
		$darkMap = $this->documentToMap( $darkDocument );
		$compactFormatter = OutputFormat::createCompact();
		foreach ( $map as $selector => $ruleset ) {
			$darkRules = $darkMap[ $selector ];
			$assoc = $ruleset->getDeclarationsAssociative();
			$darkAssoc = $darkRules->getDeclarationsAssociative();
			foreach ( $assoc as $prop => $decl ) {
				if ( !isset( $darkAssoc[ $prop ] ) ) {
					continue;
				}
				$light = $decl->render( $compactFormatter );
				$dark = $darkAssoc[ $prop ]->render( $compactFormatter );
				if ( $light === $dark ) {
					continue;
				}

				$lightValue = $decl->getValue();
				if ( $lightValue instanceof CSSValue ) {
					$lightValue = $lightValue->render( $compactFormatter );
				}
				$darkValue = $darkAssoc[ $prop ]->getValue();
				if ( $darkValue instanceof CSSValue ) {
					$darkValue = $darkValue->render( $compactFormatter );
				}
				$decl->setValue( "light-dark($lightValue, $darkValue)" );
			}
		}

		$style = $document->render( OutputFormat::createPretty() );

		$indentedRules = array_map(
			static fn ( string $r ): string => $r ? "\t$r" : "",
			explode( "\n", $style )
		);
		$scopedRules = ".blog-content .pygments-highlighter {\n";
		$scopedRules .= rtrim( implode( "\n", $indentedRules ) );
		$scopedRules .= "\n}";
		$comment = "/* Generated styles from Pygments (default + monokai) */\n";
		$css = $comment . $scopedRules;

		$filePath = dirname( __DIR__, 2 ) . '/resources/blog-pygments.css';

		if ( getenv( 'TESTS_UPDATE_EXPECTED' ) === '1' ) {
			file_put_contents( $filePath, $css );
		}
		$this->assertStringEqualsFile( $filePath, $css );
	}

}
