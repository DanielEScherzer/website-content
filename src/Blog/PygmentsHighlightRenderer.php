<?php
declare( strict_types = 1 );

namespace DanielWebsite\Blog;

use League\CommonMark\Extension\CommonMark\Renderer\Block\FencedCodeRenderer;
use League\CommonMark\Node\Node;
use League\CommonMark\Renderer\ChildNodeRendererInterface;
use League\CommonMark\Renderer\NodeRendererInterface;
use League\CommonMark\Util\HtmlElement;
use League\CommonMark\Xml\XmlNodeRendererInterface;
use Ramsey\Pygments\Pygments;
use Stringable;

class PygmentsHighlightRenderer implements
	NodeRendererInterface,
	XmlNodeRendererInterface
{

	private FencedCodeRenderer $base;

	public function __construct() {
		$this->base = new FencedCodeRenderer();
	}

	/**
	 * Use base renderer unless we can highlight
	 */
	public function render(
		Node $node,
		ChildNodeRendererInterface $childRenderer
	): Stringable {
		// Base renderer will enforce that $node is FencedCode
		$fallback = $this->base->render( $node, $childRenderer );

		$infoWords = $node->getInfoWords();
		if ( $infoWords && $infoWords[0] !== '' ) {
			$lang = $infoWords[0];
			if ( str_starts_with( $lang, 'language-' ) ) {
				$lang = substr( $lang, strlen( 'language-' ) );
			}
			$pygments = new Pygments();
			$rendered = $pygments->highlight(
				$node->getLiteral(),
				$lang,
				'html'
			);
			return new HTMLElement(
				'div',
				[ 'class' => 'pygments-highlight' ],
				$rendered
			);
		}

		return $fallback;
	}

	/**
	 * Can't extend FencedCodeRenderer, so manually delegate
	 */
	public function getXmlTagName( Node $node ): string {
		return $this->base->getXmlTagName( $node );
	}

	/**
	 * Can't extend FencedCodeRenderer, so manually delegate
	 */
	public function getXmlAttributes( Node $node ): array {
		return $this->base->getXmlAttributes( $node );
	}
}
