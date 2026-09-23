<?php
declare( strict_types = 1 );

namespace DanielWebsite\Pages;

use DanielEScherzer\HTMLBuilder\FluentHTML;
use DanielEScherzer\HTMLBuilder\RawHTML;
use DanielWebsite\Blog\BlogDisplay;
use DanielWebsite\Blog\BlogPostStore;
use DanielWebsite\Blog\BlogTags;
use DanielWebsite\SitemapEntry;
use League\CommonMark\Extension\CommonMark\Node\Block\Heading;
use League\CommonMark\Extension\CommonMark\Node\Inline\Link;
use League\CommonMark\Node\Block\Paragraph;
use League\CommonMark\Node\Query;
use League\CommonMark\Parser\MarkdownParser;
use League\CommonMark\Renderer\HtmlRenderer;

#[SitemapEntry( 'Blog' )]
class BlogIndexPage extends BasePage {

	private readonly ?string $tag;

	public function __construct( array $matches ) {
		$query = $matches['_url']->getQuery();
		$tag = null;
		if ( $query ) {
			$params = [];
			parse_str( $query, $params );
			if ( isset( $params['tag'] ) ) {
				$tag = strtolower( $params['tag'] );
			}
		}
		$this->tag = $tag;
		parent::__construct( $tag !== null );
		$this->head->append(
			FluentHTML::fromTag( 'title' )->addChild( 'Blog index' )
		);
	}

	protected function build(): void {
		$this->contentWrapper->addClass( 'blog-index' );
		$this->addStyleSheet( 'blog-styles.css' );
		$tagFilter = $this->checkTagFilter();

		$heading = 'Blog index';
		if ( $tagFilter ) {
			$desc = BlogTags::getDescription( $this->tag );
			$heading = "Blog posts about $desc";
		}
		$this->contentWrapper->append(
			FluentHTML::make( 'h1', [], $heading )
		);
		if ( $tagFilter ) {
			$this->contentWrapper->append(
				FluentHTML::make(
					'span',
					[ 'class' => 'blog-index--clear-filter' ],
					[
						'(',
						FluentHTML::make( 'a', [ 'href' => '/Blog' ], 'clear filter' ),
						')',
					]
				)
			);
		}
		$store = new BlogPostStore();
		$posts = $store->listBlogPosts();

		foreach ( $posts as $post ) {
			$env = BlogDisplay::makeCommonMarkEnv( $post );

			$tags = $post->getTags();
			if ( $tagFilter && !in_array( $this->tag, $tags, true ) ) {
				continue;
			}

			$parser = new MarkdownParser( $env );
			$renderer = new HtmlRenderer( $env );

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

			$tags = $post->getTags();
			$previewClasses = [ 'blog-preview' ];
			if ( $tags ) {
				$tags = FluentHTML::make(
					'div',
					[ 'class' => 'blog-tags' ],
					BlogTags::getListForTags( $tags ),
				);
				$previewClasses[] = 'blog-preview--has-tags';
			}
			$this->contentWrapper->append(
				FluentHTML::make(
					'div',
					[ 'class' => $previewClasses ],
					[
						FluentHTML::make( 'h2', [], new RawHTML( $firstHeading ) ),
						FluentHTML::make(
							'span',
							[ 'class' => 'blog-preview-date' ],
							$post->date->format( 'l, d F Y' )
						),
						$tags ? $tags : [],
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

	/**
	 * Returns whether to filter for only posts with the requested tag, and
	 * adds a warning if an unknown tag is requested.
	 */
	private function checkTagFilter(): bool {
		if ( !$this->tag ) {
			return false;
		}
		if ( BlogTags::isKnown( $this->tag ) ) {
			return true;
		}

		$tag = $this->tag;
		$this->addStyleSheet( 'error-styles.css' );
		$this->contentWrapper->append(
			FluentHTML::make(
				'div',
				[ 'class' => 'warning-box' ],
				[
					FluentHTML::make(
						'p',
						[],
						"The requested blog tag '$tag' is not recognized; no filtering is applied"
					),
				]
			)
		);
		return false;
	}

}
