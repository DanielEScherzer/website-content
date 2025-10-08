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
use League\CommonMark\Extension\CommonMark\Node\Inline\Image;
use League\CommonMark\Extension\TableOfContents\Node\TableOfContents;
use League\CommonMark\Node\Inline\Text;
use League\CommonMark\Node\Node;
use League\CommonMark\Node\Query;
use League\CommonMark\Parser\MarkdownParser;
use League\CommonMark\Renderer\HtmlRenderer;

class BlogPostPage extends BasePage {

	private string $slug;

	public function __construct( array $params ) {
		parent::__construct();
		$slug = $params['slug'];
		$this->slug = $slug;
	}

	protected function build(): void {
		$store = new BlogPostStore();
		$post = $store->getBlogPost( $this->slug );
		if ( $post === null ) {
			$this->addStyleSheet( 'error-styles.css' );
			$slug = $this->slug;
			$this->head->append(
				FluentHTML::fromTag( 'title' )->addChild( 'Blog: ' . $slug )
			);
			$this->contentWrapper->append(
				FluentHTML::make(
					'div',
					[ 'class' => 'error-box' ],
					[
						FluentHTML::make( 'h1', [], 'Error' ),
						FluentHTML::make(
							'p',
							[],
							"The requested blog post `$slug` is not recognized"
						),
					]
				)
			);
			$this->setResponseCode( 404 );
			return;
		}
		$this->head->append(
			FluentHTML::fromTag( 'meta' )
				->setAttribute( 'property', 'og:type' )
				->setAttribute( 'content', 'article' )
		);
		$this->head->append(
			FluentHTML::fromTag( 'meta' )
				->setAttribute( 'property', 'article:author' )
				->setAttribute( 'content', 'Daniel Scherzer' )
		);
		$this->head->append(
			FluentHTML::fromTag( 'meta' )
				->setAttribute( 'property', 'article:published_time' )
				->setAttribute( 'content', $post->date->format( 'Y-m-d' ) )
		);
		$this->addStyleSheet( 'blog-styles.css' );
		// Use `League\CommonMark` library for parsing, since I write all of
		// the blog posts no need to escape unsecure stuff
		$env = BlogDisplay::makeCommonMarkEnv( $post );

		$this->head->append(
			FluentHTML::fromTag( 'title' )->addChild( 'Blog: ' . $post->getTitle() )
		);
		foreach ( $post->getExtraClasses() as $class ) {
			$this->contentWrapper->addClass( $class );
		}

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

		// Identify an image
		$image = ( new Query() )
			->where( Query::type( Image::class ) )
			->findOne( $parsedResult );
		if ( $image !== null ) {
			$url = $image->getUrl();
			if ( str_starts_with( $url, '/' ) ) {
				// Relative, convert to absolute
				$host = getenv( 'DEPLOYMENT_HOST_NAME' );
				if ( $host === false || defined( 'PHPUNIT_TESTS_RUNNING' ) ) {
					$host = 'scherzer.dev';
				}
				$url = 'https://' . $host . $url;
			}
			$this->head->append(
				FluentHTML::fromTag( 'meta' )
					->setAttribute( 'property', 'og:image' )
					->setAttribute( 'content', $url )
			);
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
