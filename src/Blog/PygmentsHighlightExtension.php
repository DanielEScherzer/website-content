<?php
declare( strict_types = 1 );

namespace DanielWebsite\Blog;

use League\CommonMark\Environment\EnvironmentBuilderInterface;
use League\CommonMark\Extension\CommonMark\Node\Block\FencedCode;
use League\CommonMark\Extension\ConfigurableExtensionInterface;
use League\Config\ConfigurationBuilderInterface;
use Nette\Schema\Expect;

class PygmentsHighlightExtension implements ConfigurableExtensionInterface {

	public function configureSchema(ConfigurationBuilderInterface $builder): void {
        $builder->addSchema( 'pygments_highlight', Expect::structure( [
			'pygments_path' => Expect::anyOf( Expect::string(), Expect::null() )->default( null ),
			'on_exception' => Expect::anyOf(
				PygmentsHighlightRenderer::ON_EXCEPTION_IGNORE,
				PygmentsHighlightRenderer::ON_EXCEPTION_WARN,
				PygmentsHighlightRenderer::ON_EXCEPTION_THROW
			)->default( PygmentsHighlightRenderer::ON_EXCEPTION_WARN ),
        ] ) );
    }

	public function register( EnvironmentBuilderInterface $environment ): void {
		$environment->addRenderer(
			FencedCode::class,
			new PygmentsHighlightRenderer(),
			// Higher priority than CommonMark
			10
		);
	}
}
