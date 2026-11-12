<?php
declare( strict_types = 1 );

namespace DanielWebsite\Blog;

use League\CommonMark\Environment\EnvironmentBuilderInterface;
use League\CommonMark\Extension\CommonMark\Node\Inline\Image;
use League\CommonMark\Extension\ConfigurableExtensionInterface;
use League\Config\ConfigurationBuilderInterface;
use Nette\Schema\Expect;

class EmbedSVGsExtension implements ConfigurableExtensionInterface {

	public function configureSchema(
		ConfigurationBuilderInterface $builder
	): void {
		$builder->addSchema( 'embed_svgs', Expect::structure( [
			'base_path' => Expect::string()->required( true ),
		] ) );
	}

	public function register( EnvironmentBuilderInterface $environment ): void {
		$environment->addRenderer(
			Image::class,
			new EmbedSVGsRenderer(),
			// Higher priority than CommonMark
			10
		);
	}
}
