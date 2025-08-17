class SolutionStep {
	#value;
	#history;
	#needsParens;

	constructor ( value, history, needsParens = false ) {
		this.#value = value;
		this.#history = history;
		this.#needsParens = needsParens;
		if ( value <= 0 ) {
			throw new Error( 'SolutionStep values must be positive, got ' + value );
		}
	}

	getValue () {
		return this.#value;
	}

	getHistory () {
		// Parentheses are added here so that when multiple operations that would
		// need parentheses (addition and subtraction) are chained, they don't
		// have entras, (1+2+3)*5 instead of ((1+2)+3)*5
		if ( this.#needsParens ) {
			return '(' + this.#history + ')';
		}
		return this.#history;
	}

	// Operators for processing the solution
	doAddition ( other ) {
		return new SolutionStep(
			this.#value + other.#value,
			// access history directly to avoid extra parentheses
			this.#history + ' + ' + other.#history,
			// needs parentheses to be correct in order of operations
			true
		);
	}

	doSubtraction ( other ) {
		// Validation of positive values is done in the constructor
		return new SolutionStep(
			this.#value - other.#value,
			// access history directly to avoid extra parentheses
			this.#history + ' - ' + other.#history,
			// needs parentheses to be correct in order of operations
			true
		);
	}

	doMultiplication ( other ) {
		return new SolutionStep(
			this.#value * other.#value,
			// use getHistory() to ensure that parentheses are added if needed
			this.getHistory() + ' * ' + other.getHistory()
		);
	}

	doDivision ( other ) {
		if ( this.#value % other.#value !== 0 ) {
			throw new Error(
				'Cannot divide ' + this.#value + ' by ' + other.#value + ' cleanly'
			);
		}
		return new SolutionStep(
			this.#value / other.#value,
			// use getHistory() to ensure that parentheses are added if needed
			this.getHistory() + ' / ' + other.getHistory()
		);
	}

}

class Solver {

	static #shortestSolutionDistance = 11;
	static #shortestSolutionSteps = false;

	#target;
	#asSteps;

	constructor ( target, asSteps ) {
		this.#target = target;
		this.#asSteps = asSteps;
	}

	static getInitialSolver ( target, inputs ) {
		const asSteps = [];
		for ( let iii = 0; iii < 6; iii++ ) {
			const forValue = new SolutionStep( inputs[iii], String( inputs[iii] ) );
			Solver.updateClosestSolution( forValue, target );
			asSteps.push( forValue );
		}
		return new Solver( target, asSteps );
	}

	trySolve () {
		if ( this.#asSteps.length <= 1 ) {
			// No operations to do
			return false;
		}
		// Might have started off with the target somehow
		if ( Solver.#shortestSolutionDistance === 0 ) {
			return true;
		}
		for ( let iii = 0; iii < this.#asSteps.length; iii++ ) {
			// Try all of the operations, but only if the value at iii
			// is the first such value, eg if we have 3 4 5 3 7 8 there is
			// no need to calculate 3*7 twice
			let shouldContinue = false;
			for ( let jjj = 0; jjj < iii; jjj++ ) {
				if ( this.#asSteps[jjj].getValue() === this.#asSteps[iii].getValue() ) {
					shouldContinue = true;
					break;
				}
			}
			if ( shouldContinue ) {
				continue;
			}
			const inputA = this.#asSteps[iii];
			for ( let jjj = iii + 1; jjj < this.#asSteps.length; jjj++ ) {
				const inputB = this.#asSteps[jjj];
				if ( this.tryReplacement( iii, jjj, inputA.doAddition( inputB ) ) ) {
					return true;
				}
				// Don't multiply by 1
				if ( inputA.getValue() !== 1 && inputB.getValue() !== 1 ) {
					if ( this.tryReplacement( iii, jjj, inputA.doMultiplication( inputB ) ) ) {
						return true;
					}
				}
				// If they are equal, ensure that the division uses different ones
				const aLessThanB = inputA.getValue() < inputB.getValue();
				const largerInput = aLessThanB ? inputB : inputA;
				const smallerInput = aLessThanB ? inputA : inputB;
				// They might be equal, in which case avoid subtraction
				if ( inputA.getValue() !== inputB.getValue() ) {
					if ( this.tryReplacement( iii, jjj, largerInput.doSubtraction( smallerInput ) ) ) {
						return true;
					}
				}
				if ( smallerInput.getValue() !== 1
					&& largerInput.getValue() % smallerInput.getValue() === 0
				) {
					if ( this.tryReplacement( iii, jjj, largerInput.doDivision( smallerInput ) ) ) {
						return true;
					}
				}
			}
		}
		return false;
	}

	static getSolution () {
		return Solver.#shortestSolutionSteps;
	}

	static updateClosestSolution ( steps, targetVal ) {
		let distance = steps.getValue() - targetVal;
		if ( distance < 0 ) {
			distance *= -1;
		}
		if ( distance < Solver.#shortestSolutionDistance ) {
			Solver.#shortestSolutionDistance = distance;
			Solver.#shortestSolutionSteps = steps;
			if ( distance === 0 ) {
				return true;
			}
		}
		return false;
	}

	tryReplacement ( indexA, indexB, replacement ) {
		// If this operation just got the solution, no need to keep going
		if ( Solver.updateClosestSolution( replacement, this.#target ) ) {
			return true;
		}
		const newSteps = [...this.#asSteps];
		newSteps[indexA] = replacement;
		const filteredSteps = newSteps.filter( ( _, idx ) => idx !== indexB );

		const withReplacement = new Solver( this.#target, filteredSteps );
		return withReplacement.trySolve();
	}
}

/**
 * Return the overall <div> that holds the elements
 */
const makeControls = () => {
	const wrapper = document.createElement( 'div' );
	wrapper.setAttribute( 'id', 'countdown-controls' );

	const targetLabel = document.createElement( 'label' );
	targetLabel.setAttribute( 'for', 'countdown-input--target' );
	targetLabel.innerText = 'Target:';
	wrapper.append( targetLabel );

	const targetElem = document.createElement( 'input' );
	targetElem.setAttribute( 'type', 'number' );
	targetElem.setAttribute( 'min', '101' );
	targetElem.setAttribute( 'max', '999' );
	targetElem.setAttribute( 'id', 'countdown-input--target' );

	wrapper.append( targetElem );

	const makeNumInput = ( _, idx ) => {
		const inputElem = document.createElement( 'input' );
		inputElem.setAttribute( 'type', 'number' );
		inputElem.classList.add( 'countdown-input--num' );
		inputElem.setAttribute( 'min', '1' );
		inputElem.setAttribute( 'max', '100' );
		inputElem.setAttribute( 'id', 'countdown-input--num-' + ( idx + 1 ) );
		return inputElem;
	};
	const inputs = Array(6).fill(0).map( makeNumInput );

	const inputsLabel = document.createElement( 'label' );
	inputsLabel.innerText = 'Numbers: ';
	wrapper.append( inputsLabel );

	// So that the CSS grid works
	const divForInputs = document.createElement( 'div' );
	divForInputs.append( ...inputs );
	wrapper.append( divForInputs );

	const getConfiguration = () => {
		return {
			numbers: inputs.map( ( e ) => Number( e.value ) ),
			target: Number( targetElem.value )
		};
	};

	const solveBtn = document.createElement( 'button' );
	solveBtn.innerText = 'Solve';

	solveBtn.addEventListener(
		'click',
		() => {
			const newEvent = new CustomEvent(
				'do-solve',
				{
					detail: {
						config: getConfiguration()
					}
				}
			);
			wrapper.dispatchEvent( newEvent );
		}
	);

	wrapper.append( solveBtn );

	return wrapper;
};

const onLoad = () => {
	// Popup to avoid accidental reloads
	window.onbeforeunload = () => false;

	const target = document.getElementById( 'tool-target' );

	const controls = makeControls();
	target.append( controls );

	const outputElem = document.createElement( 'pre' );
	outputElem.setAttribute( 'id', 'countdown-solution' );
	target.append( outputElem );

	controls.addEventListener(
		'do-solve',
		( e ) => {
			// console.log( e.detail.config );
			const targetVal = e.detail.config.target;
			const inputs = e.detail.config.numbers;

			const solver = Solver.getInitialSolver( targetVal, inputs );
			solver.trySolve();
			const result = Solver.getSolution();

			if ( result === false ) {
				outputElem.innerText = 'NO SOLUTIONS WITHIN 10 OF ANSWER!';
			} else {
				outputElem.innerText = 'Found: ' + result.getValue();
				outputElem.innerText += '\n= ' + result.getHistory();
			}
		}
	);
};

document.addEventListener( 'DOMContentLoaded', onLoad );
