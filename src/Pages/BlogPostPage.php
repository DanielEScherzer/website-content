<?php
declare( strict_types = 1 );

namespace DanielWebsite\Pages;

use DanielEScherzer\HTMLBuilder\FluentHTML;
use DanielEScherzer\HTMLBuilder\RawHTML;
use DanielWebsite\Blog\BlogDisplay;
use DanielWebsite\Blog\BlogPostStore;
use League\CommonMark\Extension\CommonMark\Node\Block\Heading;
use League\CommonMark\Extension\CommonMark\Node\Inline\Emphasis;
use League\CommonMark\Node\Inline\Text;
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
		$env = BlogDisplay::makeCommonMarkEnv( true );

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
		$html = $renderer->renderDocument( $parsedResult )->getContent();

		$this->contentWrapper->append(
			new RawHTML( $html ),
		);
		$this->contentWrapper->addClass( 'blog-content' );
	}

}
