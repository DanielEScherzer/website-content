<?php
declare( strict_types = 1 );

namespace DanielWebsite\Pages;

use DanielEScherzer\HTMLBuilder\FluentHTML;
use DanielEScherzer\HTMLBuilder\RawHTML;
use DanielWebsite\Blog\BlogDisplay;
use DanielWebsite\Blog\BlogPostStore;
use League\CommonMark\Extension\CommonMark\Node\Block\FencedCode;
use League\CommonMark\Extension\CommonMark\Node\Block\Heading;
use League\CommonMark\Extension\CommonMark\Node\Inline\Emphasis;
use League\CommonMark\Extension\TableOfContents\Node\TableOfContents;
use League\CommonMark\Node\Inline\Text;
use League\CommonMark\Node\Node;
use League\CommonMark\Node\Query;
use League\CommonMark\Parser\MarkdownParser;
use League\CommonMark\Renderer\HtmlRenderer;

class BlogPostPage extends BasePage {

	private string $title;

	public function __construct( array $params ) {
		parent::__construct();
		$title = $params['title'];
		$this->title = $title;
		$this->head->append(
			FluentHTML::fromTag( 'title' )->addChild( 'Blog: ' . $title )
		);
	}

	protected function build(): void {
		$store = new BlogPostStore();
		$post = $store->getBlogPost( $this->title );
		if ( $post === null ) {
			$this->addStyleSheet( 'error-styles.css' );
			$title = $this->title;
			$this->contentWrapper->append(
				FluentHTML::make(
					'div',
					[ 'class' => 'error-box' ],
					[
						FluentHTML::make( 'h1', [], 'Error' ),
						FluentHTML::make(
							'p',
							[],
							"The requested blog post `$title` is not recognized"
						),
					]
				)
			);
			return;
		}
		$this->addStyleSheet( 'blog-styles.css' );
		// Use `League\CommonMark` library for parsing, since I write all of
		// the blog posts no need to escape unsecure stuff
		$env = BlogDisplay::makeCommonMarkEnv( $post );

		$parser = new MarkdownParser( $env );

		$parsedResult = $parser->parse( $post->markdown );

		$firstHeading = ( new Query() )
			->where( Query::type( Heading::class ) )
			->findOne( $parsedResult );
		$dateDisplay = new Text();
		$dateDisplay->setLiteral( $post->date->format( 'l, d F Y' ) );
		$dateWrapper = new Emphasis();
		$dateWrapper->appendChild( $dateDisplay );
		$firstHeading->insertAfter( $dateWrapper );

		$renderer = new HtmlRenderer( $env );

		// Check if we should load the extra styles for highlighting
		$code = ( new Query() )
			->where( Query::type( FencedCode::class ) )
			->where(
				static function ( Node $node ): bool {
					$infoWords = $node->getInfoWords();
					return $infoWords && $infoWords[0] !== '';
				}
			)
			->findAll( $parsedResult );
		if ( iterator_count( $code ) ) {
			$this->addStyleSheet( 'blog-pygments.css' );
		}

		// Extract TOC
		$toc = ( new Query() )
			->where( Query::type( TableOfContents::class ) )
			->findAll( $parsedResult );
		$tocRender = $renderer->renderNodes( $toc );
		// Need a new traversable
		$toc = ( new Query() )
			->where( Query::type( TableOfContents::class ) )
			->findAll( $parsedResult );
		$hadToc = false;
		foreach ( $toc as $t ) {
			$hadToc = true;
			$t->detach();
		}
		$html = $renderer->renderDocument( $parsedResult )->getContent();

		if ( $hadToc ) {
			$this->contentWrapper->append(
				FluentHTML::make(
					'div',
					[ 'class' => 'blog-toc' ],
					new RawHTML( $tocRender )
				)
			);
			$this->contentWrapper->addClass( 'blog-page--has-toc' );
		}

		$this->contentWrapper->append(
			FluentHTML::make(
				'div',
				[ 'class' => 'blog-content' ],
				new RawHTML( $html )
			)
		);
		$this->contentWrapper->addClass( 'blog-page' );
	}

}
