<?php
declare( strict_types = 1 );

namespace DanielWebsite\Pages;

use DanielEScherzer\HTMLBuilder\FluentHTML;
use DanielEScherzer\HTMLBuilder\RawHTML;
use DanielWebsite\Blog\BlogDisplay;
use DanielWebsite\Blog\BlogPostStore;
use DanielWebsite\SiteMapEntry;
use League\CommonMark\Extension\CommonMark\Node\Block\Heading;
use League\CommonMark\Node\Block\Paragraph;
use League\CommonMark\Node\Query;
use League\CommonMark\Parser\MarkdownParser;
use League\CommonMark\Renderer\HtmlRenderer;

#[SiteMapEntry( '' )]
#[SiteMapEntry( 'Home' )]
class LandingPage extends BasePage {

	public function __construct() {
		parent::__construct();
		$this->head->append(
			FluentHTML::fromTag( 'title' )->addChild( 'Home' )
		);
	}

	protected function build(): void {
		$this->contentWrapper->append(
			FluentHTML::make( 'h1', [], 'Home' ),
			FluentHTML::make(
				'p',
				[],
				[
					<<<END
I am a software engineer with experience working in PHP, JavaScript, Python, C,
and other languages. I completed my undergraduate education at Tufts University,
double majoring in Computer Science and Political Science and graduating 
END,
					FluentHTML::make( 'em', [], 'magna cum laude' ),
					<<<END
 in 2024 with a Bachelor of Science degree. As part of my
work in Computer Science, I chose to write an honors thesis in my senior year,
see 
END,
					FluentHTML::make(
						'a',
						[ 'href' => './Thesis' ],
						'here'
					),
					' for details.',
				]
			),
			FluentHTML::make(
				'p',
				[],
				<<<END
I am currently pursuing a Master of Science in Computer Science, also through
Tufts. I will be graduating in August of 2025.
END
			),
			FluentHTML::make(
				'p',
				[],
				<<<END
See the links in the navigation bar above for more information about my
experience.
END
			),
		);

		$linkedinLink = FluentHTML::make(
			'a',
			[
				'href' => 'https://www.linkedin.com/in/daniel-scherzer-520539263/',
				'target' => '_blank',
				'class' => 'external-link',
			],
			'LinkedIn'
		);
		$list = FluentHTML::make(
			'ul',
			[],
			[
				FluentHTML::make( 'li', [], $linkedinLink ),
				FluentHTML::make(
					'li',
					[],
					[
						'Email: ',
						FluentHTML::make(
							'code',
							[],
							'daniel.e.scherzer@gmail.com'
						),
					]
				),
			]
		);
		$this->contentWrapper->append(
			FluentHTML::make( 'h2', [ 'class' => 'subsection-header' ], 'Contact' ),
			$list
		);

		$store = new BlogPostStore();
		$posts = $store->listBlogPosts();
		$latestPost = reset( $posts );

		// Use `League\CommonMark` library for parsing, since I write all of
		// the blog posts no need to escape unsecure stuff
		$env = BlogDisplay::makeCommonMarkEnv( false );

		$parser = new MarkdownParser( $env );
		$renderer = new HtmlRenderer( $env );

		$parsedResult = $parser->parse( $latestPost->markdown );

		$firstHeading = ( new Query() )
			->where( Query::type( Heading::class ) )
			->findOne( $parsedResult );
		$firstHeading = $renderer->renderNodes( $firstHeading->children() );

		$firstParagraph = ( new Query() )
			->where( Query::type( Paragraph::class ) )
			->findOne( $parsedResult );
		$firstParagraph = $renderer->renderNodes( $firstParagraph->children() );

		$this->addStyleSheet( 'blog-styles.css' );
		$this->contentWrapper->append(
			FluentHTML::make( 'h2', [ 'class' => 'subsection-header' ], 'Blog' ),
			FluentHTML::make(
				'p',
				[],
				[
					'I also have a blog. You can see a full index of my posts ',
					FluentHTML::make( 'a', [ 'href' => '/Blog' ], 'here' ),
					'. My latest blog post is: ',
				]
			)
		);

		$this->contentWrapper->append(
			FluentHTML::make(
				'div',
				[ 'class' => 'blog-preview' ],
				[
					FluentHTML::make( 'h3', [], new RawHTML( $firstHeading ) ),
					FluentHTML::make(
						'span',
						[ 'class' => 'blog-preview-date' ],
						$latestPost->date->format( 'l, d F Y' )
					),
					FluentHTML::make(
						'p',
						[],
						[
							new RawHTML( $firstParagraph ),
							' ',
							FluentHTML::make(
								'a',
								[ 'href' => '/Blog/' . $latestPost->title ],
								'Continue reading...'
							),
						]
					),
				]
			)
		);
	}

}
