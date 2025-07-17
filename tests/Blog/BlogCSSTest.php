<?php
declare( strict_types = 1 );

namespace DanielWebsite\Tests\Blog;

use PHPUnit\Framework\Attributes\CoversNothing;
use PHPUnit\Framework\TestCase;
use Ramsey\Pygments\Pygments;

#[CoversNothing]
class BlogCSSTest extends TestCase {

	public function testCSS() {
		// Not using using $selector parameter for getCss() because that isn't
		// applied to all of the rules
		$pygments = new Pygments();
		$style = $pygments->getCss( 'default' );
		$indentedRules = array_map(
			static fn ( string $r ): string => "\t$r",
			explode( "\n", $style )
		);
		$scopedRules = ".blog-content .pygments-highlighter {\n";
		$scopedRules .= rtrim( implode( "\n", $indentedRules ) );
		$scopedRules .= "\n}";
		$comment = "/* Generated styles from Pygments (default) */\n";
		$css = $comment . $scopedRules;

		$filePath = dirname( __DIR__, 2 ) . '/resources/blog-pygments.css';

		if ( getenv( 'TESTS_UPDATE_EXPECTED' ) === '1' ) {
			file_put_contents( $filePath, $css );
		}
		$this->assertStringEqualsFile( $filePath, $css );
	}

}
