<?php
declare( strict_types = 1 );

namespace DanielWebsite\Blog;

use League\CommonMark\Environment\EnvironmentBuilderInterface;
use League\CommonMark\Extension\CommonMark\Node\Block\FencedCode;
use League\CommonMark\Extension\ExtensionInterface;

class PygmentsHighlightExtension implements ExtensionInterface {

	public function register( EnvironmentBuilderInterface $environment ): void {
		$environment->addRenderer(
			FencedCode::class,
			new PygmentsHighlightRenderer(),
			// Higher priority than CommonMark
			10
		);
	}
}
