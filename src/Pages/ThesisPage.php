<?php
declare( strict_types = 1 );

namespace DanielWebsite\Pages;

use DanielEScherzer\HTMLBuilder\FluentHTML;

class ThesisPage extends BasePage {

	public function __construct() {
		parent::__construct();
		$this->head->append(
			FluentHTML::fromTag( 'title' )->addChild( 'Thesis' )
		);
	}

	protected function build(): void {
		$this->contentWrapper->append(
			FluentHTML::make( 'h1', [], 'Thesis' ),
			FluentHTML::make(
				'p',
				[],
				[
					<<<END
During my senior year as an undergraduate student at Tufts University, I chose
to work on an honors thesis in the Computer Science department. The thesis
is available online 
END,
					FluentHTML::make(
						'a',
						[
							'href' => 'http://hdl.handle.net/10427/3X817284K',
							'target' => '_blank',
							'class' => 'external-link',
						],
						'in the Tufts archives'
					),
					'.',
				]
			),
		);
		$this->contentWrapper->append(
			FluentHTML::make( 'h3', [ 'class' => 'subsection-header' ], 'Abstract' ),
			FluentHTML::make(
				'blockquote',
				[],
				<<<END
A Turing machine is capable of computing anything that a modern computer can,
but how? A high-level algorithm is fine as a demonstration, but the higher-level
the algorithm given is, the harder it is to translate into specific states and
transitions needed to configure a Turing machine to perform the same
computation. I first present a series of shortcuts to make a Turing machine
easier to program, proving at each step that no new computational functionality
is added by showing how to simulate the shortcut. I then demonstrate how a
single-taped Turing machine can be used to simulate a multi-taped Turing
machine, and how a multi-taped Turing machine allows a program to keep track of
additional internal state in a simple manner. Finally, I present a detailed
explanation of how to configure a Turing machine, and how to identify the
specific states and transitions needed, so that when the input to the machine is
code in the programming language Brainfuck, the machine executes that code.
END
			)
		);
		$pdfBullet = FluentHTML::make(
			'li',
			[],
			[
				'A copy of my final thesis is available ',
				FluentHTML::make(
					'a',
					[ 'href' => '/files/Thesis/Thesis.pdf' ],
					'here'
				),
				'.',
			]
		);
		$simulatorBullet = FluentHTML::make(
			'li',
			[],
			[
				<<<END
In addition to the thesis itself, I also created an interactive frontend for
testing out Turing Machines. A copy of the final version of that frontend is
available 
END,
				FluentHTML::make(
					'a',
					[ 'href' => '/files/Thesis/Simulator.html' ],
					'here'
				),
				'.',
			]
		);
		$this->contentWrapper->append(
			FluentHTML::make( 'h3', [ 'class' => 'subsection-header' ], 'Files' ),
			FluentHTML::make(
				'ul',
				[],
				[ $pdfBullet, $simulatorBullet ]
			),
			FluentHTML::make( 'h3', [ 'class' => 'subsection-header' ], 'Errata' ),
			FluentHTML::make(
				'p',
				[],
				'Please let me know if you find any mistakes.'
			)
		);
	}

}
