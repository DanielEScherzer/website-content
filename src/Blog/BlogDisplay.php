<?php
declare( strict_types = 1 );

namespace DanielWebsite\Blog;

use League\CommonMark\Environment\Environment;
use League\CommonMark\Event\DocumentParsedEvent;
use League\CommonMark\Extension\CommonMark\CommonMarkCoreExtension;
use League\CommonMark\Extension\CommonMark\Node\Block\ListItem;
use League\CommonMark\Extension\CommonMark\Node\Inline\Link;
use League\CommonMark\Extension\CommonMark\Node\Inline\Strong;
use League\CommonMark\Extension\ExternalLink\ExternalLinkExtension;
use League\CommonMark\Extension\FrontMatter\FrontMatterExtension;
use League\CommonMark\Extension\HeadingPermalink\HeadingPermalinkExtension;
use League\CommonMark\Extension\TableOfContents\Node\TableOfContents;
use League\CommonMark\Extension\TableOfContents\TableOfContentsExtension;
use League\CommonMark\Node\Inline\Text;
use League\CommonMark\Node\Query;

class BlogDisplay {

	/**
	 * Use a BlogPost object to add extra config and real links, false for
	 * when rendering on an index/overview and not needed
	 */
	public static function makeCommonMarkEnv( BlogPost|false $post ): Environment {
		$config = [
			'external_link' => [
				'html_class' => 'external-link',
				'open_in_new_window' => true,
			],
			'heading_permalink' => [
				'symbol' => '',
			],
			'table_of_contents' => [
				'style' => 'ordered',
				'min_heading_level' => 2,
			],
		];

		$env = new Environment( $config );
		$env->addExtension( new CommonMarkCoreExtension() );
		$env->addExtension( new ExternalLinkExtension() );
		// Always gets added to the environment so that the front matter is
		// understood and not shown
		$frontMatterExt = new FrontMatterExtension();
		$env->addExtension( $frontMatterExt );
		if ( $post ) {
			// First parse with front matter to see if extra features are needed
			$parser = $frontMatterExt->getFrontMatterParser();
			$parsed = $parser->parse( $post->markdown );
			$cfg = $parsed->getFrontMatter();

			$extensions = $cfg['extensions'] ?? [];
			if ( $extensions['toc'] ?? false ) {
				$env->addExtension( new HeadingPermalinkExtension() );
				$env->addExtension( new TableOfContentsExtension() );

				$env->addEventListener(
					DocumentParsedEvent::class,
					[ __CLASS__, 'onDocumentParsed' ],
					// Lower priority than the toc generation, to run later
					-160
				);
			}
			if ( $extensions['pygments'] ?? false ) {
				$env->addExtension( new PygmentsHighlightExtension() );
			}
			if ( $cfg['title'] ?? false ) {
				$post->setTitle( $cfg['title'] );
			}
		}
		return $env;
	}

	public static function onDocumentParsed( DocumentParsedEvent $event ): void {
		$doc = $event->getDocument();
		$allTocs = ( new Query() )
			->where( Query::type( TableOfContents::class ) )
			->findAll( $doc );
		foreach ( $allTocs as $toc ) {
			$listItem = new ListItem( $toc->getListData() );
			$link = new Link( '#', '(top)' );
			$listItem->appendChild( $link );
			$toc->prependChild(
				$listItem
			);

			$strong = new Strong();
			$strong->appendChild( new Text( "Table of contents" ) );
			$toc->prependChild( $strong );
		}
	}

}
