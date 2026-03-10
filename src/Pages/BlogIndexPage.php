<?php
declare( strict_types = 1 );

namespace DanielWebsite\Pages;

use DanielEScherzer\HTMLBuilder\FluentHTML;
use DanielEScherzer\HTMLBuilder\RawHTML;
use DanielWebsite\Blog\BlogDisplay;
use DanielWebsite\Blog\BlogPostStore;
use DanielWebsite\SitemapEntry;
use League\CommonMark\Extension\CommonMark\Node\Block\Heading;
use League\CommonMark\Extension\CommonMark\Node\Inline\Link;
use League\CommonMark\Node\Block\Paragraph;
use League\CommonMark\Node\Query;
use League\CommonMark\Parser\MarkdownParser;
use League\CommonMark\Renderer\HtmlRenderer;

#[SitemapEntry( 'Blog' )]
class BlogIndexPage extends BasePage {

	public function __construct() {
		parent::__construct();
		$this->head->append(
			FluentHTML::fromTag( 'title' )->addChild( 'Blog index' )
		);
	}

	protected function build(): void {
		$this->addStyleSheet( 'blog-styles.css' );
		$this->contentWrapper->append(
			FluentHTML::make( 'h1', [], 'Blog index' )
		);
		$store = new BlogPostStore();
		$posts = $store->listBlogPosts();

		// Use `League\CommonMark` library for parsing, since I write all of
		// the blog posts no need to escape unsecure stuff
		$env = BlogDisplay::makeCommonMarkEnv( false );

		$parser = new MarkdownParser( $env );
		$renderer = new HtmlRenderer( $env );

		foreach ( $posts as $post ) {
			$parsedResult = $parser->parse( $post->markdown );

			// For any links in the first paragraph of a blog post that are
			// relative to the blog post, adjust the paths
			$links = ( new Query() )
				->where( Query::type( Link::class ) )
				->findAll( $parsedResult );
			foreach ( $links as $link ) {
				$url = $link->getUrl();
				if ( str_starts_with( $url, './' ) ) {
					$link->setUrl( './Blog/' . substr( $url, 2 ) );
				}
			}

			$firstHeading = ( new Query() )
				->where( Query::type( Heading::class ) )
				->findOne( $parsedResult );
			$firstHeading = $renderer->renderNodes( $firstHeading->children() );

			$firstParagraph = ( new Query() )
				->where( Query::type( Paragraph::class ) )
				->findOne( $parsedResult );
			$firstParagraph = $renderer->renderNodes( $firstParagraph->children() );

			$this->contentWrapper->append(
				FluentHTML::make(
					'div',
					[ 'class' => 'blog-preview' ],
					[
						FluentHTML::make( 'h2', [], new RawHTML( $firstHeading ) ),
						FluentHTML::make(
							'span',
							[ 'class' => 'blog-preview-date' ],
							$post->date->format( 'l, d F Y' )
						),
						FluentHTML::make(
							'p',
							[],
							[
								new RawHTML( $firstParagraph ),
								' ',
								FluentHTML::make(
									'a',
									[ 'href' => '/Blog/' . $post->slug ],
									'Continue reading...'
								),
							]
						),
					]
				)
			);
		}
	}

}
