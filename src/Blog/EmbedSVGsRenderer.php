<?php
declare( strict_types = 1 );

namespace DanielWebsite\Blog;

use League\CommonMark\Extension\CommonMark\Renderer\Inline\ImageRenderer;
use League\CommonMark\Node\Node;
use League\CommonMark\Renderer\ChildNodeRendererInterface;
use League\CommonMark\Renderer\NodeRendererInterface;
use League\CommonMark\Util\HtmlElement;
use League\CommonMark\Xml\XmlNodeRendererInterface;
use League\Config\ConfigurationAwareInterface;
use League\Config\ConfigurationInterface;
use Stringable;

class EmbedSVGsRenderer implements
	NodeRendererInterface,
	XmlNodeRendererInterface,
	ConfigurationAwareInterface
{

	private ImageRenderer $base;
	private ConfigurationInterface $config;

	public function __construct() {
		$this->base = new ImageRenderer();
	}

	public function setConfiguration( ConfigurationInterface $config ): void {
		$this->base->setConfiguration( $config );
		$this->config = $config;
	}

	/**
	 * Use base renderer unless we can embed
	 */
	public function render(
		Node $node,
		ChildNodeRendererInterface $childRenderer
	): Stringable {
		// Base renderer will enforce that $node is an Image
		$fallback = $this->base->render( $node, $childRenderer );

		$url = $node->getUrl();
		if ( !str_starts_with( $url, '/' ) || !str_ends_with( $url, '.svg' ) ) {
			return $fallback;
		}
		$directory = $this->config->get( 'embed_svgs/base_path' );
		$target = $directory . $url;
		$target = realpath( $target );
		if ( !str_starts_with( $target, "$directory/" ) ) {
			return $fallback;
		}
		if ( !file_exists( $target ) ) {
			return $fallback;
		}
		return new HtmlElement(
			'span',
			[ 'class' => 'inlined-svg-image' ],
			file_get_contents( $target )
		);
	}

	/**
	 * Can't extend ImageRenderer, so manually delegate
	 */
	public function getXmlTagName( Node $node ): string {
		return $this->base->getXmlTagName( $node );
	}

	/**
	 * Can't extend ImageRenderer, so manually delegate
	 */
	public function getXmlAttributes( Node $node ): array {
		return $this->base->getXmlAttributes( $node );
	}
}
