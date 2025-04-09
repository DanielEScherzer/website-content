// Stuff defined outside of the DOMContentLoaded callback so that it can
// be used on the test page too

// Known cell values
const EMPTY_CELL = Symbol.for( 'empty-cell' );
const NO_CHANGE = Symbol.for( 'no-change' );
const WILDCARD = Symbol.for( 'wildcard' );

// For multi-tape simulation
const MULTITAPE_REAL_START = Symbol.for( 'multitape-real-start' );
const MULTITAPE_BOUND_L = Symbol.for( 'multitape-bound-l' );
const MULTITAPE_BOUND_R = Symbol.for( 'multitape-bound-r' );
const MULTITAPE_AFTER_LAST = Symbol.for( 'multitape-after-last' );

const STATE_ACCEPT = 'ACCEPT';
const STATE_REJECT = 'REJECT';

const OMEGA = '\u03A9';

/** Common interface for objects that override how they render in Latex */
class LatexDisplayable {
    /** @return {string} normal latex */
    asLtx() {
        // Sometimes omitting it is intentional, e.g. for classes that should
        // only have asLtxParam() called on them and override that instead
        throw new Error( 'Subclass did not implement asLtx()' );
    }
    /** @return {string} latex for one or more parameters, includes {} */
    asLtxParam() {
        return '{' + this.asLtx() + '}';
    }
    toString() {
        return this.asLtx();
    }
    /**
     * @param {string|LatexDisplayable} value
     * @returns {string} either the overridden latex display, or the value
     */
    static asStringable( value ) {
        if ( value instanceof LatexDisplayable ) {
            return value.asLtx();
        }
        return value;
    }
    /**
     * Convert a state name to the Latex that should be used to render it
     * @param {string} devName the internal name of the state
     */
    static stateName( devName ) {
        switch ( devName ) {
            case 'qstart':
                return '\\qSTART';
            case STATE_ACCEPT:
                return '\\qACCEPT';
            case STATE_REJECT:
                return '\\qREJECT';
        }
        if ( devName[0] === 'q' ) {
            devName = devName.slice( 1 );
        }
        devName = devName.replaceAll( '\u03A9', '\\textomega{}' );
        devName = devName.replaceAll( /\{([e*<>$^]+)\}/g, '\\{$1\\}' );
        devName = devName.replaceAll( '^', '\\^{}' );
        devName = devName.replaceAll( '$', '\\$' );
        return devName.replaceAll( '_', '\\_' );
    }
}

/**
 * Utility functions for use in defining multi-match transitions for multiple
 * tapes.
 */
class MTapeMultiMatch {

    /**
     * Given *exactly 2* arrays of values, where each value is itself an array,
     * return the cartesian product of the two arrays, except that instead of
     * the resulting values in the array holding 2 arrays (the array from the
     * first input and the array from the second input) the resulting values are
     * the concatenated overall array from those two parts of the inputs.
     *
     * The actual arrays provided are not modified
     */
    static #cartesianProductTwo( first, second ) {
        // Use iteration instead of recursion to avoid call stack being too
        // deep
        const results = [];
        for ( let iii = 0; iii < first.length; iii++ ) {
            for ( let jjj = 0; jjj < second.length; jjj++ ) {
                results.push( [].concat( first[iii], second[jjj] ) );
            }
        }
        return results;
    }

    /**
     * Given multiple arrays, get the cartesian product of them all except that
     * the individual ordered tuples, instead of containing arrays from the inputs,
     * are the results of spreading those input arrays out
     *
     * @param {Array} first
     * @param {Array} [second]
     * @param {...Array} [others]
     */
    static #cartesianProductAll( first, second, ...others ) {
        // If no second array, then we have already handled everything
        if ( second === undefined ) {
            return first;
        }
        // Have a second array, merge the first two and then recursively handle
        // any additional ones
        return MTapeMultiMatch.#cartesianProductAll(
            MTapeMultiMatch.#cartesianProductTwo( first, second ),
            ...others
        );
    }

    /**
     * Given an array of `CellContent`s that we want to target, one object for each
     * tape, where the underlying real content is either a single symbol or an
     * array of symbols, return the set of cartesian product of all targetted sets
     * of symbols, where the produced `CellContent`s hold only individual symbols
     *
     * @param {CellContent[]} fromPerTape
     */
    static getTargetCombinations( fromPerTape ) {
        // Convert *all* targeted tape symbols to arrays - for the tapes
        // where we target just 1 symbol this is needed for the cartesian
        // product code; if the tape targets multiple symbols its already
        // an array so that is fine. Here we need to get the underlying
        // contents back
        const asArray = ( v ) => Array.isArray( v ) ? v : [ v ];
        // Need to access the real contents
        const fromArrays = fromPerTape.map(
            ( fromThisTape ) => asArray( fromThisTape.realContent )
        );
        // Get the list of combinations of targeted symbols; each value in
        // this array is an array of specific individual symbols
        return MTapeMultiMatch.#cartesianProductAll( ...fromArrays );
    }

    /**
     * For a given combination of targeted symbols and the set of desired
     * `to` symbols, return the array of desired `to` symbols, substituting
     * any NO_CHANGE as needed.
     *
     * @param {RawCellContent[]} combination
     * @param {(RawCellContent|NO_CHANGE)[]} to
     * @return {RawCellContent[]}
     */
    static getCombinationTo( combination, to ) {
        return combination.map(
            ( indivTarget, indivIndex ) => to[indivIndex] === NO_CHANGE
                ? indivTarget : to[indivIndex]
        );
    }
}

/**
 * Utility for building state names for the simulation of multi-tape transitions
 */
class MTapeSimulationBuilder {
    /** @type {string} */
    #lookStatePrefix;
    /** @type {string} */
    #applyStatePrefix;
    /** @type {number} */
    #numTapes;
    /** @type {CellContent[]} */
    #targetSymbols;
    /** @type {CellContent[]} */
    #writeSymbols;
    /** @type {Movement[]} */
    #tapeMoves;
    /** @type {string} */
    #omega;

    /**
     * @param {string} fromState
     * @param {string} toState
     * @param {CellContent[]} targetSymbols
     * @param {CellContent[]} writeSymbols
     * @param {Movement[]} tapeMoves
     * @param {string} omega
     */
    constructor( fromState, toState, targetSymbols, writeSymbols, tapeMoves, omega ) {
        this.#lookStatePrefix = `${omega}s_${fromState}${omega}`;
        this.#applyStatePrefix = `${omega}a_${toState}${omega}`;
        const numTapes = targetSymbols.length;
        if ( numTapes !== writeSymbols.length ) {
            throw new Error(
                'Cannot target ' + numTapes + ' symbols but write ' + writeSymbols.length
            );
        } else if ( numTapes !== tapeMoves.length ) {
            throw new Error(
                'Cannot target ' + numTapes + ' symbols but have ' + tapeMoves.length + ' moves'
            );
        }
        this.#numTapes = numTapes;
        this.#targetSymbols = targetSymbols;
        this.#writeSymbols = writeSymbols;
        this.#tapeMoves = tapeMoves;
        this.#omega = omega;
    }

    /**
     * Combine the first `tapeLimit + 1` tape updates (from index 0 to
     * index `tapeLimit`) into the name of the state that performs the
     * application for the `tapeLimit` number tape
     *
     * @param {number} tapeLimit
     */
    getApplicationState( tapeLimit ) {
        // When we have finished applying the last tape update to
        // tape #0, the next one is the end
        if ( tapeLimit === -1 ) {
            return this.#applyStatePrefix;
        }
        // Here we INCLUDE the tape at tapeLimit
        const OMG = this.#omega;
        return `${this.#applyStatePrefix}_p`
            + this.#writeSymbols.map(
                ( s, i ) => ( i <= tapeLimit ? ( '_' + OMG + s.toString() + ',' + this.#tapeMoves[i].toString() ) + OMG : '' )
            ).join( '' );
    }

    /**
     * Shortcut for the state when we have finished applying everything
     */
    get applicationStateBase() {
        // Could just return this.#applyStatePrefix directly but calling the
        // method to ensure that we are consistent
        return this.getApplicationState( -1 );
    }

    /**
     * Combine the first `tapeLimit` tape target symbols (from index 0
     * to index `tapeLimit`) into the name of the state that performs
     * the searches for the `tapeLimit + 1` number tape; if the
     * `tapeLimit` is the number of tapes, however, we have finished
     * finding the symbols and instead return the state to apply the
     * updates to the last tape.
     *
     * @param {number} tapeLimit
     * @return {string}
     */
    getFindingState( tapeLimit ) {
        if ( tapeLimit === 0 ) {
            // No _f for the initial state
            return this.#lookStatePrefix;
        }
        if ( tapeLimit === this.#numTapes ) {
            // We finished
            return this.getApplicationState( this.#numTapes - 1 );
        }
        const OMG = this.#omega;
        return `${this.#lookStatePrefix}_f`
            + this.#targetSymbols.map(
                ( s, i ) => ( i < tapeLimit ? ( '_' + OMG + s.toString() + OMG ) : '' )
            ).join( '' );
    }

    /**
     * After applying the update to the `tapeLimit` tape there will need to be
     * a dedicated state for marking the new head of the tape; this method
     * gets the name of that state.
     *
     * @param {number} tapeLimit
     * @return {string}
     */
    getMarkHeadState( tapeLimit ) {
        return this.getApplicationState( tapeLimit ) + '-markHead';
    }

    /**
     * Static utility for use when filtering WILDCARD-expanded options - get
     * the finding state for the last tape, which is set if and only if there
     * is an exact transition from this state on this combination of symbols.
     *
     * @param {string} fromState
     * @param {CellContent[]} targetCombination
     * @param {string} omega
     * @return {string}
     */
    static getLastFindState( fromState, targetCombination, omega ) {
        const builder = new MTapeSimulationBuilder(
            fromState,
            'UNUSED-MTapeSimulationBuilder-getLastFindState',
            targetCombination,
            targetCombination.map( () => undefined ), // just need right size array
            targetCombination.map( () => undefined ), // just need right size array
            omega
        );
        return builder.getFindingState( targetCombination.length - 1 );
    }
}

/**
 * Holds knowledge of what set of features is enabled; all features start
 * disabled and can be enabled either via enable() or by including in the
 * constructor call.
 */
class FeatureSet {
    // Public static constants for the different names
    static MULTIMATCH = 'feature-multimatch';
    static MULTIMATCH_NC = 'feature-multimatch-no-change';
    static WILDCARD = 'feature-wildcard';
    static MOVE_NONE = 'feature-move-none';
    static MOVE_MULTI = 'feature-move-multi';
    static GADGET_SHIFT = 'feature-gadget-shift';
    static GADGET_FIRST_CELL_MARKER = 'feature-gadget-first-cell-marker';
    static GADGET_INSERT_AFTER_MARKER = 'feature-gadget-insert-after-marker';
    static MULTI_TAPE = 'feature-multi-tape';

    /**
     * List of all known feature names for validation
     * @type {string[]}
     */
    #validFeatures;

    /**
     * Map of feature names to being enabled or not
     * @type {Object.<string, boolean>}
     */
    #enabledFeatures = {};

    /**
     * Create a feature set, all features disabled by default
     * @param {string[]} [toEnable]
     */
    constructor( toEnable ) {
        this.#validFeatures = Object.values( FeatureSet );
        this.#validFeatures.forEach(
            ( f ) => { this.#enabledFeatures[ f ] = false; }
        );
        if ( toEnable ) {
            toEnable.map( ( f ) => this.enable( f ) );
        }
    }

    /**
     * Enable a feature
     * @param {string|string[]} feature
     * @return {this{}}
     */
    enable( feature ) {
        if ( Array.isArray( feature ) ) {
            feature.forEach( f => this.enable( f ) );
            return this;
        }
        if ( this.#enabledFeatures[ feature ] === undefined ) {
            throw new Error( 'Cannot enable unknown feature: ' + feature );
        } else if ( this.#enabledFeatures[ feature ] === true ) {
            throw new Error( 'Already enabled feature: ' + feature );
        } else {
            this.#enabledFeatures[ feature ] = true;
            return this;
        }
    }

    /**
     * Check if a feature is enabled
     * @param {string} feature
     * @return {boolean}
     */
    isEnabled( feature ) {
        if ( this.#enabledFeatures[ feature ] === undefined ) {
            throw new Error( 'Cannot check unknown feature: ' + feature );
        }
        // Prerequisite: multi-tape machines MUST support move-none to be
        // used to avoid needing ugly logic about using every other cell
        if ( feature === FeatureSet.MULTI_TAPE &&
            !this.isEnabled( FeatureSet.MOVE_NONE )
        ) {
            return false;
        }
        return this.#enabledFeatures[ feature ];
    }

    /**
     * @param {Movement} moveNormal
     * @return {bool} Whether the features for the movement are enabled
     */
    supportsMovement( moveNormal ) {
        // Movement of 1 cell to the right or left are always supported
        if ( moveNormal.tapeOffset === 1 || moveNormal.tapeOffset === -1 ) {
            return true;
        }
        // Check movement of 0
        if ( moveNormal.tapeOffset === 0 ) {
            return this.isEnabled( FeatureSet.MOVE_NONE );
        }
        // Movement must be multiple cells
        return this.isEnabled( FeatureSet.MOVE_MULTI );
    }
}

/**
 * Logger class to help with both debugging and testing.
 */
class Logger {
    /** @param {...Mixed} content */
    warn() {
        console.trace( '[Warn] ', ...arguments );
    }
    /** @param Mixed errorVal */
    error( errorVal ) {
        console.trace( '[Error] ', ...arguments );
        debugger;
    }
    /** @param {...Mixed} */
    debug() {
        console.log( ...arguments );
    }
}

/**
 * User-visible logger for when the developer is setting things up
 */
class UserVisibleLogger extends Logger {
    /** @type {HTMLDivElement} */
    #errorDisplay;
    /** @type {HTMLPreElement} */
    #errorText;

    constructor() {
        super();

        const errorLabel = document.createElement( 'strong' );
        errorLabel.innerText = 'Error!'

        // So the "Error!" can be centered but the trace isn't
        const errorLabelWrapper = document.createElement( 'div' );
        errorLabelWrapper.setAttribute( 'id', 'popup-error-label-wrapper' );
        errorLabelWrapper.append( errorLabel );

        const errorText = document.createElement( 'pre' );
        errorText.setAttribute( 'id', 'popup-error-text' );
        this.#errorText = errorText;

        const closeBtn = document.createElement( 'button' );
        closeBtn.setAttribute( 'id', 'popup-error-close-btn' );
        closeBtn.innerText = 'Close';

        const errorDialog = document.createElement( 'div' );
        errorDialog.setAttribute( 'id', 'popup-error-dialog' );
        errorDialog.append( errorLabelWrapper, errorText, closeBtn );
        const errorWrapper = document.createElement( 'div' );
        errorWrapper.setAttribute( 'id', 'popup-error-wrapper' );
        errorWrapper.append( errorDialog );
        this.#errorDisplay = errorWrapper;

        closeBtn.addEventListener('click', () => errorWrapper.remove() );
    }
    /** @param {Mixed} errorVal */
    error( errorVal ) {
        if ( errorVal && errorVal.stack ) {
            this.#errorText.innerText = errorVal.stack;
        } else {
            this.#errorText.innerText = errorVal.toString();
        }
        document.querySelector('body').append( this.#errorDisplay );
        console.trace( '[Error] ', errorVal );
    }
}

/** @typedef {string | Symbol | CellContent} RawCellContent */

class Renderer {
    /**
     * @param {string} currState
     * @param {MachineTape[]} tapes
     */
    renderStep( currState, tapes ) {
        throw new Error( 'Renderer subclass needs to define renderStep()' );
    }
    /** @param {number} numTapes */
    setNumTapes( numTapes ) {
        throw new Error( 'Renderer subclass needs to define setNumTapes()' );
    }
    /** @return {boolean} */
    get canRestorePriorState() {
        // Only used for MemoryRenderer but added here for a common interface
        return false;
    }
    /** @param {RealMachine} machine */
    doRestorePriorState( machine ) {
        // Must be defined if canRestorePriorState() is true
        throw new Error( 'Renderer subclass cannot restore prior state' );
    }
}

/**
 * Run multiple renderers at once (e.g. so that we can generate the LaTeX
 * stepthrough while still confirming the display)
 */
class MultiRenderer extends Renderer {
    /** @type {Renderer[]} */
    #renderers;

    /** @param {Renderer[]} renderers */
    constructor( renderers ) {
        super();
        this.#renderers = renderers;
    }

    /**
     * @param {string} currState
     * @param {MachineTape[]} tapes
     */
    renderStep( currState, tapes ) {
        this.#renderers.forEach(
            ( r ) => r.renderStep( currState, tapes )
        );
    }

    /** @param {number} numTapes */
    setNumTapes( numTapes ) {
        this.#renderers.forEach(
            ( r ) => r.setNumTapes( numTapes )
        );
    }

    /** @return {boolean} */
    get canRestorePriorState() {
        return this.#renderers.some( ( r ) => r.canRestorePriorState );
    }

    /** @param {RealMachine} machine */
    doRestorePriorState( machine ) {
        // use a normal for loop to allow early return
        for ( let iii = 0; iii < this.#renderers.length; iii++ ) {
            if ( this.#renderers[iii].canRestorePriorState ) {
                this.#renderers[iii].doRestorePriorState( machine );
                return;
            }
        }
        // None support, use consistent error message
        super.doRestorePriorState( machine );
    }
}

/** Utility for DisplayRenderer that shows a single tape */
class SingleTapeDisplay {
    /** @type {HTMLSpanElement[]} Display for each cell */
    #cellElements = [];
    /** @type {HTMLDivElement} */
    #tapeDOM;
    /** @param {HTMLDivElement} tapeDOM */
    constructor( tapeDOM ) {
        this.#tapeDOM = tapeDOM;
    }
    /** @param {MachineTape} tape */
    renderTape( tape ) {
        const cells = tape.cellContents;
        const currIdx = tape.currentCellIndex;
        while ( this.#cellElements.length < cells.length ) {
            this.#addCell();
        }
        cells.forEach(
            ( c, i ) => this.#setCell( c, i, currIdx )
        );
        // Clear any extra cells, needed for when restoring from memory
        this.#shrinkTo( cells.length );
    }
    /**
     * Shrink to eliminate any extra cells that are from a previous tape
     * rendering before being reloaded
     *
     * @param {number} cellsToKeep
     */
    #shrinkTo( cellsToKeep ) {
        if ( this.#cellElements.length <= cellsToKeep ) {
            return;
        }
        this.#cellElements.slice( cellsToKeep ).forEach(
            ( e ) => this.#tapeDOM.removeChild( e )
        );
        this.#cellElements.splice( cellsToKeep );
    }
    /**
     * @param {CellContent} cellContent
     * @param {number} cellIdx
     * @param {number} currIdx
     */
    #setCell( cellContent, cellIdx, currIdx ) {
        const cellElem = this.#cellElements[ cellIdx ];
        cellElem.innerText = cellContent.formatCellDisplay();
        cellElem.classList.toggle(
            'machine-tape-cell--empty',
            cellElem.innerText === ''
        );
        cellElem.classList.toggle(
            'machine-tape-cell--current',
            cellIdx === currIdx
        );
    }
    #addCell() {
        const newCell = document.createElement( 'span' );
        newCell.classList.add( 'machine-tape-cell' );
        // always starts empty...
        newCell.classList.add( 'machine-tape-cell--empty' );
        this.#tapeDOM.appendChild( newCell );
        this.#cellElements.push( newCell );
    }
    /** Get the overall wrapping <div>, should not be modified through this */
    get tapeDOM() {
        return this.#tapeDOM;
    }
}

class DisplayRenderer extends Renderer {
    /** @type {HTMLSpanElement} Display of the current state name */
    #stateNameDisplay;
    /** @type {HTMLDivElement} */
    #tapesWrapper;
    /** @type {SingleTapeDisplay[]} */
    #tapeDisplays;
    /**
     * @param {HTMLSpanElement} stateNameDisplay
     * @param {HTMLDivElement} tapesWrapper
     */
    constructor( stateNameDisplay, tapesWrapper ) {
        super();
        this.#stateNameDisplay = stateNameDisplay;
        this.#tapesWrapper = tapesWrapper;
        this.#tapeDisplays = [];
    }
    /**
     * @param {string} currState
     * @param {MachineTape[]} tapes
     */
    renderStep( currState, tapes ) {
        this.#stateNameDisplay.innerText = currState;
        this.#tapeDisplays.forEach(
            ( renderer, idx ) => renderer.renderTape( tapes[idx ] )
        );
    }
    /** @param {number} */
    setNumTapes( numTapes ) {
        // If this renderer is being reused drop any old stuff by using
        // replaceChildren() at the end; so we cannot add as they are build
        const newTapeElems = [];
        this.#tapeDisplays = [];
        for (let iii = 0; iii < numTapes; iii++) {
            const newTapeElem = document.createElement('div');
            newTapeElem.classList.add('machine-tape');
            newTapeElems.push( newTapeElem );
            this.#tapeDisplays.push( new SingleTapeDisplay( newTapeElem ) );
        }
        this.#tapesWrapper.replaceChildren( ...newTapeElems );
    }
}

/**
 * NOTE: this renderer does not support "undo" operations and will just keep
 * adding new steps even if they were already executed; this is not a problem
 * since it is expected that only Daniel will use this renderer when generating
 * the examples in the thesis document. The renderer is only active if there is
 * an element with the ID `latex-execution-rendering`.
 */
class LaTeXRenderer extends Renderer {
    /** @type {HTMLPreElement|null} Display of the execution, or null if not used */
    #executionDisplay;
    /** @type {string} Current steps */
    #executionSteps;

    /** @param {HTMLPreElement|null} executionDisplay */
    constructor( executionDisplay ) {
        super();
        this.#executionDisplay = executionDisplay;
        this.#executionSteps = '';
    }
    /**
     * @param {string} currState
     * @param {MachineTape[]} tapes
     */
    renderStep( currState, tapes ) {
        if ( this.#executionDisplay === null ) {
            // Latex display is not being output, no need to compute
            return;
        }
        const latexState = LatexDisplayable.stateName( currState );
        if ( tapes.length === 1 ) {
            const showTapeCells = tapes.map( ( t ) => this.#getShowTapeCells( t, ',', '\\showTapeCells' ) );
            this.#executionSteps += `\\showExecutionStep{${latexState}}{${showTapeCells[0]}}\n`;
            this.#executionDisplay.innerText = '\\execution{\n' + this.#executionSteps + "}";
            return;
        }
        const showTapeCells = tapes.map( ( t ) => this.#getShowTapeCells( t, '~', '\\showTapeCellsTilde' ) );
        // Prevent `Package listofitems Error: Empty list ignored, nothing to do.`
        // if the last {} is empty
        // But put that comment after the \\
        const allTapeCells = showTapeCells.join('\\\\\n');
        const fixedTapeCells = allTapeCells.replaceAll(
            /}{}((\\\\)?)/g,
            '}{~}$1 % ~ so its not an empty list but still isn\'t shown'
        );

        this.#executionSteps += `\\showMTapeExec{${latexState}}{\n${fixedTapeCells}\n}\n`;
        this.#executionDisplay.innerText = this.#executionSteps;
        // NOTE: needs manual adjustment so that entries all show the same number
        // of cells, might be worth doing that automatically
    }

    /** @param {number} numTapes */
    setNumTapes( numTapes ) {
        // We restarted the execution
        this.#executionSteps = '';
    }

    /**
     * Get the `\showTapeCells` LaTeX command for a tape state
     * @param {MachineTape} tape
     * @param {string} joiner
     * @param {string} command
     * @return {string}
     */
    #getShowTapeCells( tape, joiner, command ) {
        const allCells = tape.cellContents;
        const currCell = tape.currentCellIndex;
        const length = allCells.length;
        const getCellsDisplay = ( start, end ) => {
            const cells = allCells.slice( start, end );
            return '{' + ( cells.map( c => c.asLtx() ).join( joiner ) ) + '}';
        };
        const beforeHeadDisplay = getCellsDisplay( 0, currCell );
        const atHeadDisplay = getCellsDisplay( currCell, currCell + 1 );
        const afterHeadDisplay = getCellsDisplay( currCell + 1, length );
        return command + beforeHeadDisplay + atHeadDisplay + afterHeadDisplay;
    }
}

/**
 * Class for remembering past states and tape contents to be able to
 * go back - does not actually render anything but uses the same interface
 */
class MemoryRenderer extends Renderer {
    /**
     * @type {Object[]}
     * - Array indices: overall order of steps
     * - Array values: object with
     *   - `state` -> the name of the state
     *   - `tapes` -> an array of tape objects, each of which holds
     *      - `index` -> the cell index
     *      - `cells` -> the contents of cells
     */
    #tapeMemory;

    constructor() {
        super();
        this.#tapeMemory = [];
    }

    /**
     * @param {string} currState
     * @param {MachineTape[]} tapes
     */
    renderStep( currState, tapes ) {
        const tapesSettings = tapes.map(
            ( tape ) => {
                return {
                    cells: [ ...tape.cellContents ],
                    index: tape.currentCellIndex
                };
            }
        );
        this.#tapeMemory.push( {
            state: currState,
            tapes: tapesSettings
        } );
    }
    /** @param {number} */
    setNumTapes( numTapes ) {
        // Execution is starting
        this.#tapeMemory = [];
    }

    /** @param {RealMachine} machine */
    doRestorePriorState( machine ) {
        if ( this.#tapeMemory.length === 0 ) {
            throw new Error( 'No prior steps!' );
        }
        // the most recent entry in #tapeMemory is the *current* step, we want
        // to apply the one before that
        this.#tapeMemory.pop();
        const last = this.#tapeMemory.pop();
        machine.setCurrentState( last.state );
        machine.machineTapes.forEach(
            ( tape, idx ) => tape.setTape(
                [ ...last.tapes[idx].cells ],
                last.tapes[idx].index
            )
        );
        machine.renderStep();
    }

    /**
     * Only able to restore a prior state if there is one
     * @return {boolean}
     */
    get canRestorePriorState() {
        // If the length is 1 we only have the current step
        return this.#tapeMemory.length > 1;
    }
}

/**
 * Testing renderer
 */
class ConsoleRenderer extends Renderer {
    /**
     * @param {CellContent[]} cells
     * @param {number} currIdx
     */
    setContents( cells, currIdx ) {
        console.log( cells, currIdx );
    }
    /** @param {number} numTapes */
    setNumTapes( numTapes ) {
        console.log( 'Now rendering: ' + numTapes + ' tapes' );
    }
}

/** Represents the contents of a single real machine tape */
class MachineTape {
    /** @type {number} */
    #currentCellIndex = 0;
    /** @type {CellContent[]} Contents of each cell */
    #cellContents = [];
    constructor() {
        this.initializeWithContent( '' );
    }
    /** @param {string} tapeInput */
    initializeWithContent( tapeInput ) {
        this.#cellContents = tapeInput.split('').map( CellContent.fromRaw );
        this.#cellContents.push( new CellContent( EMPTY_CELL ) );
        this.#currentCellIndex = 0;
    }
    /**
     * Overwrite the entire tape, for use by MemoryRenderer to go back a
     * step in the history
     * @param {CellContent[]} allContents
     * @param {number} newCellIndex
     */
    setTape( allCells, newCellIndex ) {
        this.#cellContents = [ ...allCells ];
        this.#currentCellIndex = newCellIndex;
    }
    /** @param {CellContent} content */
    setCurrentCellContent( content ) {
        this.#cellContents[ this.#currentCellIndex ] = content;
    }
    /** @return {CellContent} */
    getCurrentCellContent() {
        const index = this.#currentCellIndex;
        if ( index < 0 || index > this.#cellContents.length ) {
            // Should never happen since all setters are checked
            throw new Error(
                `index ${index} is out of bounds [0..${this.#cellContents.length}]`
            );
        }
        return this.#cellContents[ index ];
    }
    /** @param {Movement} move */
    applyMove( move ) {
        let index = this.#currentCellIndex + move.tapeOffset;
        // Too many left shifts
        if ( index < 0 ) {
            index = 0;
        }
        // arbitrary number of right shifts; index + 1 so that we always have
        // an empty cell at the end
        while ( this.#cellContents.length <= index + 1 ) {
            this.#cellContents.push( new CellContent( EMPTY_CELL ) );
        }
        this.#currentCellIndex = index;
    }
    /**
     * Getters for use by the renderers - do NOT use this to manipulate the
     * contents of the cells (since the array is returned by reference)
     */
    get cellContents() {
        return this.#cellContents;
    }
    get currentCellIndex() {
        return this.#currentCellIndex;
    }
}

/**
 * Movement of a tape as part of a transition. Instances are immutable - once
 * created the offset (and thus display) can never change, so instances can
 * be reused for multiple separate transitions if needed.
 */
class Movement extends LatexDisplayable {
    /** @type {string} */
    #moveDisplay;
    /** @type {string} */
    #moveLtx;
    /** @type {number} Positive for moving right, negative for moving left */
    #cellsMoved;

    /**
     * @param {number} cellsMoved
     */
    constructor( cellsMoved ) {
        super();
        this.#cellsMoved = cellsMoved;
        // Compute the string representation a single time at the start
        // For the prose version of the LaTeX we want to spell out the numbers
        // 2-9; the multi-move command has 2 parameters, the first is only
        // used for the code version and the second is only used for the prose
        // version (easier than needing two different interfaces...)
        const proseNumDisplay = ( num ) => {
            // Must be >=2
            if ( num >= 10 ) {
                return num;
            }
            return [ 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine' ][ num - 2 ];
        };
        if ( cellsMoved < 0 ) {
            this.#moveDisplay = `${-cellsMoved}L`;
            if ( cellsMoved === -1 ) {
                this.#moveLtx = `\\cMoveL`;
            } else {
                this.#moveLtx = `\\cMoveLMulti{${-cellsMoved}}{${proseNumDisplay(-cellsMoved)}}`;
            }
        } else if ( cellsMoved === 0 ) {
            this.#moveDisplay = 'N';
            this.#moveLtx = `\\cMoveN`;
        } else {
            this.#moveDisplay = `${cellsMoved}R`;
            if ( cellsMoved === 1 ) {
                this.#moveLtx = `\\cMoveR`;
            } else {
                this.#moveLtx = `\\cMoveRMulti{${cellsMoved}}{${proseNumDisplay(cellsMoved)}}`;
            }
        }
    }
    toString() {
        return this.#moveDisplay;
    }
    asLtx() {
        return this.#moveLtx;
    }
    get tapeOffset() {
        return this.#cellsMoved;
    }

    /**
     * Split up a movement into the first part (moving a single cell) and the
     * rest (however much is needed); either part can always be a no-move
     * Movement if the original movement is none (both) or just a single cell
     * (second part is none)
     */
    splitMovement() {
        if ( this.#cellsMoved === 0 ) {
            return [ this, this ];
        } else if ( this.#cellsMoved < 0 ) {
            return [ Movement.left(), new Movement( this.#cellsMoved + 1 ) ];
        } else {
            return [ Movement.right(), new Movement( this.#cellsMoved - 1 ) ];
        }
    }

    /**
     * Moving left
     * @param {number} count
     * @return {Movement}
     */
    static left( count ) {
        return new Movement( count === undefined ? -1 : -count );
    }
    /**
     * Moving right
     * @param {number} count
     * @return {Movement}
     */
    static right( count ) {
        return new Movement( count === undefined ? 1 : count );
    }
    /**
     * No move at all
     * @return {Movement}
     */
    static none() {
        return new Movement( 0 );
    }
    /**
     * Normalize a potential movement, so that we can use both `R` and `R(2)`
     * @param {Movement|Function} original
     * @return {Movement}
     */
    static normalize( original ) {
        if ( original instanceof Movement ) {
            return original;
        }
        // Call the right or left function for moving 1 cell in that direction;
        // also works with none() since the argument is just ignored
        return original( 1 );
    }
}

/**
 * Content of a tape cell, holding a string or Symbol. Instances are immutable
 * - once created the content can never change, so instances can be reused for
 * multiple separate transitions if needed.
 */
class CellContent extends LatexDisplayable {
    /** @type {string | Symbol | CellContent[]} */
    #realContent;
    /** @type {boolean} */
    #isSimulatedHead;
    /**
     * @param {string | Symbol | CellContent[]} realContent
     * @param {boolean} isSimulatedHead
     */
    constructor( realContent, isSimulatedHead ) {
        super();
        this.#realContent = realContent;
        this.#isSimulatedHead = isSimulatedHead;
    }
    /**
     * @param {string | Symbol | CellContent} maybeRaw
     * @return {CellContent}
     */
    static fromRaw( maybeRaw ) {
        if ( maybeRaw instanceof CellContent ) {
            return maybeRaw;
        }
        return new CellContent( maybeRaw );
    }
    /**
     * @param {RawCellContent[]} maybeRaw
     * @return {CellContent}
     */
    static forArray( maybeRaw ) {
        return new CellContent( maybeRaw.map( CellContent.fromRaw ) );
    }
    /**
     * Format a cell to be displayed in the tape
     * @return {string}
     */
    formatCellDisplay() {
        // over bar goes after the character if its a simulated head
        const overBar = String.fromCharCode( 0x0305 );
        const maybeBar = this.#isSimulatedHead ? overBar : '';
        if ( typeof this.#realContent === 'string' ) {
            return ( this.#realContent + maybeBar )
        }
        if ( Array.isArray( this.#realContent ) ) {
            // Never set on the tape
            return 'ERROR-ARRAY';
        }
        switch ( this.#realContent ) {
            case EMPTY_CELL:
                return maybeBar;
            case WILDCARD:
                return 'ERROR-WILDCARD';
            case MULTITAPE_REAL_START:
                return `{^${maybeBar}^${maybeBar}}`;
            case MULTITAPE_BOUND_L:
                return `{<${maybeBar}}`;
            case MULTITAPE_BOUND_R:
                return `{>${maybeBar}}`
            case MULTITAPE_AFTER_LAST:
                return `{$${maybeBar}$${maybeBar}}`;
        }
        return 'UNKNOWN';
    }
    /**
     * Unlike formatCellDisplay(), this is intended for showing transitions
     * and thus includes wildcards, multimatch, and showing empty values. This
     * is also used when CellContent is used as object keys
     */
    toString() {
        const maybeHead = this.#isSimulatedHead ? '-{HEAD}' : '';
        if ( typeof this.#realContent === 'string' ) {
            // Prevent conflicts with display of user-provided symbols that
            // look like ours and are long enough to match ours (3+)
            if ( this.#realContent.length >= 3 &&
                this.#realContent[0] === '{' &&
                this.#realContent[ this.#realContent.length - 1 ] === '}'
            ) {
                return ( 'S:' + this.#realContent + maybeHead );
            }
            return ( this.#realContent + maybeHead );
        }
        if ( Array.isArray( this.#realContent ) ) {
            // Never set on the tape
            const byContent = this.#realContent.map( CellContent.fromRaw ).map( ( c ) => c.toString() );
            return '<' + byContent + '>';
        }
        switch ( this.#realContent ) {
            case EMPTY_CELL:
                return '{e}' + maybeHead;
            case WILDCARD:
                return '{*}' + maybeHead;
            case MULTITAPE_REAL_START:
                return '{^^}' + maybeHead;
            case MULTITAPE_BOUND_L:
                return '{<}' + maybeHead;
            case MULTITAPE_BOUND_R:
                return '{>}' + maybeHead;
            case MULTITAPE_AFTER_LAST:
                return '{$$}' + maybeHead;
        }
        return '{UNKNOWN SYMBOL}';
    }
    /**
     * Unlike toString() this is used when multiple cell values should be
     * shown as an ARRAY (i.e. for multi-match) rather than as a tuple
     * (for multi-tape)
     */
    toArrayString( isNotLast ) {
        if ( isNotLast === undefined ) {
            isNotLast = true;
        }
        if ( Array.isArray( this.#realContent ) ) {
            const asCells = this.#realContent.map( CellContent.fromRaw );
            const byContent = asCells.map( ( c ) => c.toArrayString( false ) );
            if ( isNotLast ) {
                return '<' + byContent + '>';
            }
            return '[' + byContent + ']';
        } else {
            return this.toString();
        }
    }
    /**
     * Version of toArrayString() but with the LaTeX representation
     */
    toArrayLatexString( isNotLast ) {
        if ( isNotLast === undefined ) {
            isNotLast = true;
        }
        if ( Array.isArray( this.#realContent ) ) {
            const asCells = this.#realContent.map( CellContent.fromRaw );
            const byContent = asCells.map( ( c ) => c.toArrayLatexString( false ) );
            if ( isNotLast ) {
                return '{' + byContent.join( '~' ) + '}';
            }
            return '[' + byContent + ']';
        } else {
            const ltx = this.asLtx();
            if ( ltx[0] === '\\' && ltx !== '\\$' ) {
                return ltx;
            }
            return `'${ltx}'`;
        }
    }
    /**
     * Format a cell to be shown with others in the code version of LaTeX
     */
    asLtx() {
        const NEVER = 'NEVER-USED-BEING-REMOVED';
        const forLaTeX = ( sym ) => {
            // Special case: custom command for the right end of a simulated
            // tape that is temporarily being marked as the head of the tape
            if ( sym === '\\symTapeBoundR' && this.#isSimulatedHead ) {
                return  '\\textFakeHeadSymTapeBoundR{}';
            }
            return this.#isSimulatedHead ? `\\textFakeHead{${sym}}` : sym;
        };
        if ( this.#realContent === '$' ) {
            // Special handling for $
            return forLaTeX( '\\$' );
        }
        if ( typeof this.#realContent === 'string' ) {
            return forLaTeX( this.#realContent );
        }
        if ( Array.isArray( this.#realContent ) ) {
            // Never set on the tape
            const asCells = this.#realContent.map( CellContent.fromRaw );
            return asCells.map( ( c ) => c.asLtx() );
        }
        switch ( this.#realContent ) {
            case EMPTY_CELL:
                return forLaTeX( '\\symEmpty' );
            case WILDCARD:
                return forLaTeX( '\\cOnWildcard' );
            case MULTITAPE_REAL_START:
                return forLaTeX( '\\symMultiTapeStart' );
            case MULTITAPE_BOUND_L:
                return forLaTeX( '\\symTapeBoundL' );
            case MULTITAPE_BOUND_R:
                return forLaTeX( '\\symTapeBoundR' );
            case MULTITAPE_AFTER_LAST:
                return forLaTeX( '\\symMultiTapeEnd' );
        }
        return 'UNKNOWN';
    }
    /**
     * When used as Map keys or otherwise need identity comparisons we want to
     * use the underlying real content
     */
    get realContent() {
        // Prevent manipulation of the array if returned by reference
        if ( Array.isArray( this.#realContent ) ) {
            return [ ...this.#realContent ];
        }
        return this.#realContent;
    }
    /**
     * When used as Map keys or otherwise need identity comparisons we want to
     * use the underlying real content disambiguated by tape head
     */
    get transitionKey() {
        if ( !this.#isSimulatedHead ) {
            if ( Array.isArray( this.#realContent ) ) {
                return '<' + this.#realContent.join( ',' ) + '>';
            }
            return this.#realContent;
        }
        if ( typeof this.#realContent === 'string' ) {
            return this.#realContent + String.fromCharCode( 0x0305 );
        }
        // Must be a symbol, need a new symbol to represent the head-ness
        return Symbol.for(
            Symbol.keyFor( this.#realContent ) + '-head'
        );
    }
}

/**
 * Indicates that we are representing the name of a state and should bypass
 * the normal changes to display of cell contents with {}
 */
class StateNameContent extends CellContent {
    /**
     * @param {string} stateName
     */
    constructor( stateName ) {
        super( stateName, false );
        if ( typeof stateName !== 'string' ) {
            throw new Error( 'StateNameContent constructed with ' + String(stateName) );
        }
    }
    /**
     * Format a cell to be displayed in the tape
     * @return {string}
     */
    formatCellDisplay() {
        // Never a simulated tape head
        return 'Q:{' + this.realContent + '}';
    }
    /**
     * Unlike formatCellDisplay(), this is intended for showing transitions
     * and thus includes wildcards, multimatch, and showing empty values. This
     * is also used when CellContent is used as object keys
     */
    toString() {
        // Never a simulated tape head
        return 'Q:{' + this.realContent + '}';
    }
    /**
     * Unlike toString() this is used when multiple cell values should be
     * shown as an ARRAY (i.e. for multi-match) rather than as a tuple
     * (for multi-tape)
     */
    toArrayString( isNotLast ) {
        throw new Error( 'StateNameContent.toArrayString()' );
    }
    /**
     * Version of toArrayString() but with the LaTeX representation
     */
    toArrayLatexString( isNotLast ) {
        throw new Error( 'StateNameContent.toArrayLatexString()' );
    }
    /**
     * Format a cell to be shown with others in the code version of LaTeX
     */
    asLtx() {
        // Never a simulated tape head
        return 'Q:\\{' + LatexDisplayable.stateName( this.realContent ) + '\\}';
    }
    /**
     * When used as Map keys or otherwise need identity comparisons we want to
     * use the underlying real content disambiguated by tape head
     */
    get transitionKey() {
        return this.toString();
    }
}

/**
 * Updates for a specific tape as the result of a transition, includes the
 * new content and movement but not the new state. Instances of
 * TapeUpdate and all of its subclasses are immutable - once created
 * they can only be applied to tapes, not changed, so instances can be reused
 * for multiple separate transitions if needed.
 */
class TapeUpdate extends LatexDisplayable {
    /** @type {CellContent} */
    #newContent;
    /** @type {Movement} */
    #movement;

    /**
     * @param {CellContent} content
     * @param {Movement} movement
     */
    constructor( content, movement ) {
        super();
        this.#newContent = content;
        this.#movement = movement;
    }
    /** @param {MachineTape} targetTape */
    applyToTape( targetTape ) {
        targetTape.setCurrentCellContent( this.#newContent );
        targetTape.applyMove( this.#movement );
    }
    toString() {
        return `${this.#newContent} [move ${this.#movement}]`;
    }
    asLtxParam( flag ) {
        return this.getLatexDisplayParts().map( ( p ) => p.asLtxParam() ).join( '' );
    }
    getLatexDisplayParts() {
        return [ this.#newContent, this.#movement ];
    }
}



/**
 * Tape update that doesn't change the symbol
 */
class NCTapeUpdate extends TapeUpdate {
    /** @type {Movement} */
    #movement;

    /**
     * @param {Movement} movement
     */
    constructor( movement ) {
        super( undefined, movement );
        this.#movement = movement;
    }
    /** @param {MachineTape} targetTape */
    applyToTape( targetTape ) {
        targetTape.applyMove( this.#movement );
    }
    toString() {
        return `[no change] [move ${this.#movement}]`;
    }
    getLatexDisplayParts( forMultiTape ) {
        // No inclusion of the (unchanged) new content, latex just uses a
        // different formatting command entirely (except when doing multi-tape
        // transitions)
        if ( forMultiTape ) {
            return [ '\\cNoChange', this.#movement ];
        }
        return [ this.#movement ];
    }
}

/**
 * Tape update that moves the current symbol to the right, leaving the old cell
 * blank, and from there moves more based on configuration.
 */
class GadgetShiftUpdate extends TapeUpdate {
    /** @type {Movement} */
    #extraMovement;

    /**
     * @param {Movement} extraMovement
     */
    constructor( extraMovement ) {
        super( new CellContent( EMPTY_CELL ), Movement.right() );
        this.#extraMovement = extraMovement;
    }
    /** @param {MachineTape} targetTape */
    applyToTape( targetTape ) {
        // TapeUpdate.applyToTape() will do the blank and the move right,
        // but first we need to identify the current symbol
        const pasteContent = targetTape.getCurrentCellContent();
        super.applyToTape( targetTape );
        // Now apply the paste (regardless of the symbol in the cell we are
        // overwriting) and then move again
        targetTape.setCurrentCellContent( pasteContent );
        targetTape.applyMove( this.#extraMovement );
    }
    toString() {
        const extra = ` [paste matched symbol] [move ${this.#extraMovement}]`;
        return super.toString() + extra;
    }
    getLatexDisplayParts() {
        // The only latex parameter is the subsequent movement
        return [ this.#extraMovement ];
    }
}

/**
 * Tape update that inserts a symbol at the start, moving everything right, and
 * then ends on the second symbol.
 */
class GadgetFirstCellMarkerUpdate extends TapeUpdate {
    /** @type {CellContent} */
    #markerContent;

    /**
     * @param {CellContent} markerContent
     */
    constructor( markerContent ) {
        // TapeUpdate stuff is not used at all
        super( undefined, undefined );
        this.#markerContent = markerContent;
    }
    /** @param {MachineTape} targetTape */
    applyToTape( targetTape ) {
        const moveRight = Movement.right();
        const moveLeft = Movement.left();
        const moveLeft2 = Movement.left(2);
        // Match exactly the behavior of the fallback version:
        // Move right and switch to <finding the end>
        targetTape.applyMove( moveRight );

        // When we get to an empty symbol, move left and switch to <do shifts>,
        // otherwise keep moving right
        while ( targetTape.getCurrentCellContent().realContent !== EMPTY_CELL ) {
            targetTape.applyMove( moveRight );
        }
        targetTape.applyMove( moveLeft );

        // Do the shifts
        let pasteContent = targetTape.getCurrentCellContent();
        const emptyCellContent = new CellContent( EMPTY_CELL );
        while ( pasteContent.realContent !== EMPTY_CELL ) {
            targetTape.setCurrentCellContent( emptyCellContent );
            targetTape.applyMove( moveRight );
            targetTape.setCurrentCellContent( pasteContent );
            targetTape.applyMove( moveLeft2 );
            pasteContent = targetTape.getCurrentCellContent();
        }
        // Got to the empty cell
        targetTape.setCurrentCellContent( this.#markerContent );
        targetTape.applyMove( moveRight );
    }
    toString() {
        return `[insert ${this.#markerContent}, shifting to the next empty cell, then move 1R]`;
    }
    getLatexDisplayParts() {
        // The only latex parameter is the pasted marker
        return [ this.#markerContent ];
    }
}

/**
 * Tape update that insert a symbol right after a marker, moving everything
 * right, and then ends to the right of the inserted symbol
 */
class GadgetAfterMarkerUpdate extends TapeUpdate {
    /** @type {CellContent} */
    #markerContent;
    /** @type {CellContent} */
    #toInsert;

    /**
     * @param {CellContent} markerContent
     * @param {CellContent} toInsert
     */
    constructor( markerContent, toInsert ) {
        // TapeUpdate stuff is not used at all
        super( undefined, undefined );
        this.#markerContent = markerContent;
        this.#toInsert = toInsert;
    }
    /** @param {MachineTape} targetTape */
    applyToTape( targetTape ) {
        const moveRight = Movement.right();
        const moveLeft = Movement.left();
        const moveLeft2 = Movement.left(2);
        // Match exactly the behavior of the fallback version:
        // Move right and switch to <finding the end>
        targetTape.applyMove( moveRight );

        // When we get to an empty symbol, move left and switch to <do shifts>,
        // otherwise keep moving right
        while ( targetTape.getCurrentCellContent().realContent !== EMPTY_CELL ) {
            targetTape.applyMove( moveRight );
        }
        targetTape.applyMove( moveLeft );

        // Do the shifts
        let pasteContent = targetTape.getCurrentCellContent();
        const emptyCellContent = new CellContent( EMPTY_CELL );
        // Use `transitionKey` so that simulated heads don't match non-simulated
        while ( pasteContent.transitionKey !== this.#markerContent.transitionKey ) {
            targetTape.setCurrentCellContent( emptyCellContent );
            targetTape.applyMove( moveRight );
            targetTape.setCurrentCellContent( pasteContent );
            targetTape.applyMove( moveLeft2 );
            pasteContent = targetTape.getCurrentCellContent();
        }
        // Got to the first cell marker, do not change anything and move right
        targetTape.applyMove( moveRight );
        // Insert our new symbol, and then move right
        targetTape.setCurrentCellContent( this.#toInsert );
        targetTape.applyMove( moveRight );
    }
    toString() {
        return `[insert ${this.#toInsert} after ${this.#markerContent}, then move 1R]`;
    }
    getLatexDisplayParts() {
        return [ this.#markerContent, this.#toInsert ];
    }
}

/**
 * The change to the overall status of the machine as a result of a transition,
 * i.e. the updates to the tapes and the new state to go to. This is a smart
 * object that applies the changes itself so that subclasses can be used for
 * for the various gadgets. It is *NOT* immutable, since the target state name
 * might be changed by updateForOmega()
 */
class TransitionResult extends LatexDisplayable {
    /** @type {TapeUpdate[]} */
    #updates;
    /** @type {string} */
    #newState;

    /**
     * @param {TapeUpdate[]} updates
     * @param {string|Symbol} newState
     */
    constructor( updates, newState ) {
        super();
        this.#updates = updates;
        this.#newState = newState.toString();
    }
    /** @param {RealMachine} targetMachine */
    applyToMachine( targetMachine ) {
        const allTapes = targetMachine.machineTapes;
        this.#updates.forEach(
            ( update, idx ) => update.applyToTape( allTapes[ idx ] )
        );
        targetMachine.setCurrentState( this.#newState );
    }
    toString() {
        let updatesStr = this.#updates[0].toString();
        if ( this.#updates.length > 1 ) {
            updatesStr = this.#updates.map( ( u ) => u.toString() )
                .join( ', ' );
            updatesStr = '<' + updatesStr + '>';
        }
        return `${updatesStr} [next state: ${this.#newState}]`;
    }
    asLtxParam( flag ) {
        const newStateLtx = LatexDisplayable.stateName( this.#newState );
        if ( this.#updates.length === 1 ) {
            // Simple case - all parameters are in order
            const updatesStr = this.#updates[0].asLtxParam();
            return `${updatesStr}{${newStateLtx}}`;
        }

        const forArray = ( flag === 'toArrayLatexString' );
        const partToLatex = ( part ) => {
            if ( forArray && part instanceof CellContent ) {
                return part.toArrayLatexString();
            }
            return LatexDisplayable.asStringable( part );
        }

        const updateParts = this.#updates.map( ( u ) => u.getLatexDisplayParts( true ) );
        const valueJoin = forArray ? '~' : ',';
        const newValues = updateParts.map( ( p ) => p[0] ).map( partToLatex ).join( valueJoin );
        const movements = updateParts.map( ( p ) => p[1] ).map( partToLatex ).join( ',' );
        const updateStr = `{${newValues}}{${movements}}`;
        return `${updateStr}{${newStateLtx}}`;
    }

    /** @param {string} forTarget One of 'Single', 'Multimatch', 'Wildcard */
    getLatexCommand( forTarget ) {
        const FOR_WILDCARD = 2;
        const targetIdx = [ 'Single', 'Multimatch', 'Wildcard' ].indexOf( forTarget );
        if ( targetIdx === -1 ) {
            throw new Error( 'getLatexCommand() with invalid target :' + forTarget );
        }
        if ( this.#updates.length > 1 ) {
            const byFor = [
                `\t\\cAddMTapeTransition`,
                '\t\\cAddMTapeMultiMatchTransition',
                `\t\\cAddMTapeWildcardTransition`,
            ];
            return byFor[ targetIdx ];
        }
        const firstUpdate = this.#updates[0];
        if ( firstUpdate instanceof GadgetShiftUpdate ) {
            const byFor = [
                `\t\\cAddGadgetShift`,
                `\t\\cAddMultiMatchGadgetShift`,
                `\t\\cAddWildcardGadgetShift`,
            ];
            return byFor[ targetIdx ];
        } else if ( firstUpdate instanceof NCTapeUpdate ) {
            // Doesn't make sense for FOR_SINGLE
            const byFor = [
                'NCTapeUpdate-FOR_SINGLE-wrong',
                `\t\\cAddMultiMatchNCTransition`,
                `\t\\cAddWildcardNCTransition`,
            ];
            return byFor[ targetIdx ];
        } else if ( targetIdx === FOR_WILDCARD
            && firstUpdate instanceof GadgetFirstCellMarkerUpdate
        ) {
            return `\t\\cAddWildcardGadgetFirstCellMarker`;
        } else if ( targetIdx === FOR_WILDCARD
            && firstUpdate instanceof GadgetAfterMarkerUpdate
        ) {
            return `\t\\cAddWildcardGadgetInsertAfterMarker`;
        }
        // Defaults
        const byFor = [
            `\t\\cAddTransition`,
            `\t\\cAddMultiMatchTransition`,
            `\t\\cAddWildcardTransition`,
        ];
        return byFor[ targetIdx ];
    }
    updateForOmega( oldOmega, newOmega ) {
        // If the state name already has the `newOmega` then this transition
        // result object was stored for multiple transitions in the
        // TransitionSet and doesn't need to be updated again
        if ( this.#newState.includes( newOmega ) ) {
            return;
        }
        const oldState = this.#newState;
        this.#newState = this.#newState.replaceAll( oldOmega, newOmega );
    }
}

/**
 * A state is just a proxy for calling methods on the underlying machine while
 * also specifying the name of the state to go from. It does not hold any logic
 * of the state itself other than the name.
 */
class ProxyState {
    /** @type {string} */
    #name;
    /** @type {MachineSimulator} */
    #tm;

    /**
     * @param {string} name
     * @param {MachineSimulator} tm
     */
    constructor( name, tm ) {
        this.#name = name;
        this.#tm = tm;
    }

    /**
     * @param {RawCellContent|RawCellContent[]|WILDCARD} from
     * @param {RawCellContent|NO_CHANGE} to
     * @param {Movement|Function} move
     * @param {string} newState
     * @return {this}
     */
    addTransition( from, to, move, newState ) {
        this.#tm.addTransition( this.#name, from, to, move, newState );
        return this;
    }
    /**
     * @param {RawCellContent|RawCellContent[]|WILDCARD} from
     * @param {string} gadgetName
     * @param {...Mixed} gadgetParams
     */
    addTransitionGadget( from, gadgetName, ...gadgetParams ) {
        this.#tm.addTransitionGadget( this.#name, from, gadgetName, ...gadgetParams );
        return this;
    }
    /**
     * @param {RawCellContent[]} from
     * @param {RawCellContent[]} to
     * @param {(Movement|Function)} move
     * @param {string} newState
     * @return {this}
     */
    addMTapeTransition( from, to, move, newState ) {
        this.#tm.addMTapeTransition( this.#name, from, to, move, newState );
        return this;
    }
}

/**
 * Class to show the transition configurations, either for the developer to
 * debug or to generate the LaTeX version
 */
class TransitionDisplay {
    /**
     * All of the transitions as a multi-dimensional object. The first level
     * is the name of the state, the second level is a `TransitionSet` that
     * holds the transitions.
     *
     * @type {Object.<string, TransitionSet>}
     */
    #transitions;

    /**
     * @param {Object} transitions
     */
    constructor( transitions ) {
        this.#transitions = transitions;
    }

    /**
     * Format for the developer to view
     */
    getDeveloperDisplay() {
        return Object.entries( this.#transitions )
            .filter( ( [ stateName, transitions ] ) => !transitions.isEmpty )
            .map( ( [ stateName, transitions ] ) => {
                const transitionRulesStrs = transitions.getDeveloperDisplay();
                return stateName + '\n' + transitionRulesStrs.join( '\n' );
            } )
            .join( '\n\n' );
    }

    /**
     * Format for the code-version of the LaTeX (replace the \c with \w for
     * the prose version)
     */
    getLaTeXDisplay() {
        return Object.entries( this.#transitions )
            .filter( ( [ stateName, transitions ] ) => !transitions.isEmpty )
            .map( ( [ stateName, transitions ] ) => {
                const latexState = LatexDisplayable.stateName( stateName );
                const transitionRulesStrs = transitions.getLaTeXDisplay();
                return `\\cAddState{${latexState}}{\n` +
                    transitionRulesStrs.join( '\n' ) + '\n}';
            } )
            .join( '\n\\\\\n' );
    }
}

/**
 * Represents the two different alphabets that a machine has - the input
 * alphabet and the tape alphabet.
 */
class MachineAlphabets {
    /** @type {CellContent[]} */
    #inputAlphabet;
    /** @type {CellContent[]} */
    #extraTapeAlphabet;
    /** @type {(string|Symbol)[]} */
    #allRawSymbols;
    /** @type {boolean} */
    #forMultiTape;
    /** @type {CellContent[]} */
    #allDevSpecifiedAlphabet;
    /** @type {CellContent[]} */
    #allMachineAlphabet;
    /** @type {CellContent[]|false} */
    #validTapeHeads;

    /**
     * @param {RawCellContent[]} inputAlphabet
     * @param {RawCellContent[]} extraTapeAlphabet
     */
    constructor( inputAlphabet, extraTapeAlphabet ) {
        this.#inputAlphabet = inputAlphabet.map( CellContent.fromRaw );
        this.#extraTapeAlphabet = extraTapeAlphabet.map( CellContent.fromRaw );
        if ( !extraTapeAlphabet.some(
            ( sym ) => sym.realContent === EMPTY_CELL
        ) ) {
            this.#extraTapeAlphabet.push(
                new CellContent( EMPTY_CELL )
            );
        }
        this.#forMultiTape = false;
        this.#allDevSpecifiedAlphabet = this.#inputAlphabet.concat( this.#extraTapeAlphabet );
        this.#allMachineAlphabet = this.#inputAlphabet.concat( this.#extraTapeAlphabet );
        this.#validTapeHeads = false;
        this.#allRawSymbols = this.wholeTapeAlphabet.map(
            ( c ) => c.realContent
        );
    }

    enableMultiTapeSimulation() {
        if ( this.#forMultiTape ) {
            throw new Error( 'Multi tape already enabled!' );
        }
        this.#forMultiTape = true;
        this.#validTapeHeads = this.#allDevSpecifiedAlphabet.map(
            ( c ) => new CellContent( c.realContent, true )
        );
        this.#allMachineAlphabet = this.#allMachineAlphabet.concat( this.#validTapeHeads );
        const extraForMultiTape = [
            MULTITAPE_REAL_START,
            MULTITAPE_BOUND_L,
            MULTITAPE_BOUND_R,
            MULTITAPE_AFTER_LAST
        ];
        const extraAsCells = extraForMultiTape.map( CellContent.fromRaw );

        // Only BOUND_R can also sometimes be a head
        extraAsCells.push( new CellContent( MULTITAPE_BOUND_R, true ) );
        this.#allMachineAlphabet = this.#allMachineAlphabet.concat( extraAsCells );

        // Regenerate raw symbols
        this.#allRawSymbols = this.wholeTapeAlphabet.map(
            ( c ) => c.transitionKey
        );
    }

    get wholeTapeAlphabet() {
        // Prevent modification
        return this.#allMachineAlphabet.concat( [] );
    }

    get developerAlphabet() {
        // Prevent modification
        return this.#allDevSpecifiedAlphabet.concat( [] );
    }

    get validTapeHeads() {
        // PRevent modification
        return this.#validTapeHeads.concat( [] );
    }

    /** @param {string} stateName */
    addStateSymbol( stateName ) {
        if ( this.#forMultiTape === false ) {
            throw new Error( 'addStateSymbol() is for use with multiple tapes!' );
        }
        const asContent = new StateNameContent( stateName );
        this.#allMachineAlphabet.push( asContent );
        this.#allRawSymbols.push( asContent.toString() );
    }

    /**
     * Check if a specific symbol is valid in the tape alphabet, or an array
     * of symbols (all stored within a single CellContent) are all valid
     *
     * @param {CellContent} content
     * @return {bool}
     */
    isValid( content ) {
        if ( Array.isArray( content.realContent ) ) {
            return content.realContent.every(
                ( innerContent ) => this.isValid( innerContent )
            );
        }
        const symbol = content.transitionKey;
        if ( typeof symbol !== 'string' && typeof symbol !== 'symbol' ) {
            console.log( content );
            throw new Error(
                "Invalid symbol check: " + String(symbol)
            );
        }
        return this.#allRawSymbols.includes( symbol );
    }
}

/**
 * Set of transitions from a specific state - has knowledge of both which
 * features are enabled, and what the valid alphabet to match against is.
 */
class TransitionSet {
    static #MULTIMATCH_DEFINED = 'multimatch-defined';

    /**
     * @type {Map} Map from CellContent#realContent to an array, where the first
     * element is one of
     * - TransitionResult
     * - #MULTIMATCH_DEFINED if there is an entry in #multimatches
     * and the second is a CellContent that can be used to determine the
     * rendering of the key, since the different renderers need different
     * displays for the same CellContent key
     */
    #transitions;

    /**
     * @type {Map} Map from arrays of CellContent#realContent to arrays with
     * TransitionResult instances and CellContent[] that represent the keys.
     * Since these are arrays we have to check the contents of each so
     * multimatches are also identified by each cell content in #transitions as
     * MULTIMATCH_DEFINED so we only search here when needed.
     */
    #multimatches;

    /** @type {MachineAlphabets} */
    #alphabets;

    /** @type {FeatureSet} */
    #features;

    /** @type {TransitionResult|false} */
    #wildcard;

    /**
     * @param {FeatureSet} features
     * @param {MachineAlphabets} alphabets
     */
    constructor( features, alphabets ) {
        this.#transitions = new Map();
        this.#multimatches = new Map();
        this.#wildcard = false;
        this.#features = features;
        this.#alphabets = alphabets;
    }

    /**
     * Sometimes (specifically when simulating multiple tapes) a state is
     * added/exists, but isn't actually used directly; in that case it should
     * generally not be shown in the list of states and transitions, so make
     * it easier to filter out.
     *
     * @return {boolean}
     */
    get isEmpty() {
        return this.#transitions.size === 0 &&
                this.#multimatches.size === 0 &&
                this.#wildcard === false;
    }

    /**
     * @param {CellContent} from
     * @param {TransitionResult|TransitionSet.#MULTIMATCH_DEFINED} result
     */
    #addTransition( from, result ) {
        if ( this.#wildcard !== false ) {
            throw new Error(
                'Attempting to define transition from ' + String(from.transitionKey) +
                ' after setting wildcard'
            );
        }
        if ( this.#transitions.has( from.transitionKey ) ) {
            throw new Error(
                'Attempting to redefine transition from ' + String(from.transitionKey)
            );
        }
        if ( !this.#alphabets.isValid( from ) ) {
            throw new Error(
                'Attempting to define transition on invalid target ' + String(from.transitionKey)
            );
        }

        this.#transitions.set( from.transitionKey, [ result, from ] );
    }

    /**
     * Feature usage should already have been checked
     * @param {CellContent[]} from
     * @param {TransitionResult} result
     * @param {CellContent} [originalFrom] Used for multi-tape multimatch
     *   rendering to store the original targeted combination
     */
    #addMultiMatch( from, result, originalFrom ) {
        // Wildcard checking done in #addTransition()
        from.forEach( ( fromSingle ) =>
            this.#addTransition( fromSingle, TransitionSet.#MULTIMATCH_DEFINED )
        );
        this.#multimatches.set( from, [ result, from, originalFrom ] );
    }

    /**
     * Feature usage should already have been checked
     * @param {TransitionResult} result
     */
    #setWildcard( result ) {
        if ( this.#wildcard !== false ) {
            throw new Error( 'Attempting to redefine wildcard' );
        }
        this.#wildcard = result;
    }

    /**
     * Define multiple transitions, one for each of the cell contents in
     * `from`, each going to `to` (which, if it is NO_CHANGE, gets replaced
     * with the correct individual cell content). This *PERFORMS FEATURE
     * CHECKS FOR MULTIMATCH AND MULTIMATCH_NC* and will use #addMultiMatch()
     * if allowed and otherwise define the transitions manually.
     *
     * @param {RawCellContent[]} from
     * @param {RawCellContent|NO_CHANGE} to
     * @param {Movement} supportedMove (already checked to be supported)
     * @param {string} newState
     */
    #createMultiMatchTransitions( from, to, supportedMove, newState ) {
        const fromCells = from.map( CellContent.fromRaw );

        if ( !this.#features.isEnabled( FeatureSet.MULTIMATCH )
            || ( to === NO_CHANGE &&
                !this.#features.isEnabled( FeatureSet.MULTIMATCH_NC )
            )
        ) {
            let getIndividualResult;
            if ( to === NO_CHANGE ) {
                getIndividualResult = ( symbol ) => {
                    return new TransitionResult(
                        [ new TapeUpdate( symbol, supportedMove ) ],
                        newState
                    );
                }
            } else {
                const singleResult = new TransitionResult(
                    [ new TapeUpdate( CellContent.fromRaw( to ), supportedMove ) ],
                    newState
                );
                getIndividualResult = ( symbol ) => singleResult;
            }
            fromCells.forEach(
                ( fromSingle ) => this.#addTransition(
                    fromSingle,
                    getIndividualResult( fromSingle )
                )
            )
            return;
        }

        let tapeUpdate;
        if ( to === NO_CHANGE ) {
            tapeUpdate = new NCTapeUpdate( supportedMove );
        } else {
            const toContent = CellContent.fromRaw( to );
            tapeUpdate = new TapeUpdate( toContent, supportedMove );
        }
        this.#addMultiMatch(
            fromCells,
            new TransitionResult( [ tapeUpdate ], newState )
        );
    }

    /**
     * Define multiple transitions, one for each of the alphabet symbols that
     * does not yet have a transition defined, each going to `to` (which, if it
     * is NO_CHANGE, gets replaced with the correct individual cell content).
     * This *PERFORMS FEATURE CHECKS FOR WILDCARD* and will use #setWildcard()
     * if allowed and otherwise define the transitions manually.
     *
     * @param {RawCellContent|NO_CHANGE} to
     * @param {Movement} supportedMove (already checked to be supported)
     * @param {string} newState
     */
    #createWildcardTransitions( to, supportedMove, newState ) {
        if ( !this.#features.isEnabled( FeatureSet.WILDCARD ) ) {
            const toTarget = this.#alphabets.wholeTapeAlphabet.filter(
                ( symbol ) => this.getTransition( symbol ) === undefined
            );
            this.#createMultiMatchTransitions(
                toTarget,
                to,
                supportedMove,
                newState
            );
            return;
        }

        let tapeUpdate;
        if ( to === NO_CHANGE ) {
            tapeUpdate = new NCTapeUpdate( supportedMove );
        } else {
            const toContent = CellContent.fromRaw( to );
            tapeUpdate = new TapeUpdate( toContent, supportedMove );
        }
        const result = new TransitionResult( [ tapeUpdate ], newState );
        this.#setWildcard( result );
    }
    /**
     * Add a transition for a movement that must be enabled, either
     * - a single cell left or right
     * - no movement, if MOVE_NONE is enabled
     * - multiple cells, if MOVE_MULTI is enabled
     *
     * This function exists separate from MachineSimulator#addTransition()
     * because it is dedicated specifically to adding transitions that do NOT
     * require additional states, as this class does not have access to the
     * overall machine simulator instance. This *PERFORMS FEATURE CHECKS FOR
     * MULTIMATCH, MULTIMATCH_NC, WILDCARD* but the movement should already
     * have been checked as supported.
     *
     * @param {RawCellContent|RawCellContent[]|WILDCARD} from
     * @param {RawCellContent|NO_CHANGE} to
     * @param {Movement} supportedMove
     * @param {string} newState
     */
    createSupportedMoveTransition( from, to, supportedMove, newState ) {
        if ( Array.isArray( from ) ) {
            this.#createMultiMatchTransitions( from, to, supportedMove, newState );
            return;
        }
        if ( from === WILDCARD ) {
            this.#createWildcardTransitions( to, supportedMove, newState );
            return;
        }
        // When using NO_CHANGE with a single value just automatically use a
        // normal tape update
        if ( to === NO_CHANGE ) {
            to = from;
        }
        const result = new TransitionResult(
            [ new TapeUpdate( CellContent.fromRaw( to ), supportedMove ) ],
            newState
        );
        this.#addTransition( CellContent.fromRaw( from ), result );
    }
    /**
     * @param {(RawCellContent|RawCellContent[])[]} from
     * @param {(RawCellContent|NO_CHANGE)[]} to
     * @param {Movement[]} supportedMoves
     * @param {string} newState
     */
    createSupportedMTapeMoveTransitions( from, to, supportedMoves, newState ) {
        if ( from === WILDCARD ) {
            // Global wildcard for all tapes, hopefully we can store it in
            // the dedicated field
            this.#addMTapeWildcard( to, supportedMoves, newState );
            return;
        }
        // Normalize so that we can assume values are CellContent for from
        const fromNormal = from.map( CellContent.fromRaw );
        const usesWildcard = fromNormal.some(
            ( c ) => c.realContent === WILDCARD
        );
        if ( usesWildcard ) {
            // Here, "using a wildcard" means that the transition targets
            // a WILDCARD on one or more tapes, which gets expanded to the
            // supported alphabet
            const fromExpanded = fromNormal.map(
                ( c ) => c.realContent === WILDCARD
                    ? this.#alphabets.wholeTapeAlphabet
                    : c
            );
            // Wrap them in CellContent
            const fromExpandedContents = fromExpanded.map( CellContent.fromRaw );
            const allCombos = MTapeMultiMatch.getTargetCombinations( fromExpandedContents );
            // Filter for the wildcard
            const targetCombos = allCombos.filter(
                ( combination ) =>
                    this.getTransition( CellContent.forArray( combination ) ) === undefined
            );
            this.#addMTapeMultiMatch(
                targetCombos,
                to,
                supportedMoves,
                newState,
                CellContent.forArray( fromNormal )
            );
            return;
        }
        const usesMultiMatch = fromNormal.some(
            ( c ) => Array.isArray( c.realContent )
        );
        if ( usesMultiMatch ) {
            this.#addMTapeMultiMatch(
                MTapeMultiMatch.getTargetCombinations( fromNormal ),
                to,
                supportedMoves,
                newState,
                CellContent.forArray( fromNormal )
            );
            return;
        }
        const toNormal = to.map( CellContent.fromRaw );
        const updates = toNormal.map(
            ( toSingle, idx ) => new TapeUpdate(
                toSingle,
                supportedMoves[ idx ]
            )
        );
        this.#addTransition(
            CellContent.forArray( fromNormal ),
            new TransitionResult( updates, newState )
        );
    }
    /**
     * @param {(CellContent[])} allTargetedCombinations
     * @param {(RawCellContent|NO_CHANGE)[]} to
     * @param {Movement[]} supportedMoves
     * @param {string} newState
     * @param {CellContent} fromOriginal
     */
    #addMTapeMultiMatch(
        allTargetedCombinations,
        to,
        supportedMoves,
        newState,
        fromOriginal
    ) {
        const usesNoChange = to.some( ( t ) => t === NO_CHANGE );

        if ( !this.#features.isEnabled( FeatureSet.MULTIMATCH )
            || ( usesNoChange &&
                !this.#features.isEnabled( FeatureSet.MULTIMATCH_NC )
            )
        ) {
            // Add each of the targeted combinations as an individual
            // multi-tape transition; ignoring `fromOriginal` since the
            // transitions will be stored and rendered individually
            allTargetedCombinations.forEach(
                ( targetCombination ) => {
                    this.createSupportedMTapeMoveTransitions(
                        targetCombination,
                        MTapeMultiMatch.getCombinationTo( targetCombination, to ),
                        supportedMoves,
                        newState
                    );
                }
            );
            return;
        }
        // Get the update for a specific tape
        const getTapeUpdate = ( toSingle, idx ) => {
            if ( toSingle === NO_CHANGE ) {
                return new NCTapeUpdate( supportedMoves[ idx ] );
            }
            return new TapeUpdate(
                CellContent.fromRaw( toSingle ),
                supportedMoves[ idx ]
            );
        };
        // Wrap each targeted combination in a CellContent for storage
        const combinationContents = allTargetedCombinations.map( CellContent.forArray );
        const updates = to.map( getTapeUpdate );
        this.#addMultiMatch(
            combinationContents,
            new TransitionResult( updates, newState ),
            fromOriginal
        );
    }
    /**
     * @param {(RawCellContent|NO_CHANGE)[]} to
     * @param {Movement[]} supportedMoves
     * @param {string} newState
     */
    #addMTapeWildcard( to, supportedMoves, newState ) {
        // Global wildcard for all tapes, hopefully we can store it in
        // the dedicated field.
        if ( this.#features.isEnabled( FeatureSet.WILDCARD ) ) {
            // Get the update for a specific tape
            const getTapeUpdate = ( toSingle, idx ) => {
                if ( toSingle === NO_CHANGE ) {
                    return new NCTapeUpdate( supportedMoves[ idx ] );
                }
                return new TapeUpdate(
                    CellContent.fromRaw( toSingle ),
                    supportedMoves[ idx ]
                );
            };
            // Wrap each targeted combination in a CellContent for storage
            const updates = to.map( getTapeUpdate );
            this.#setWildcard(
                new TransitionResult( updates, newState )
            );
            return;
        }
        this.createSupportedMTapeMoveTransitions(
            // Use multi-match for WILDCARD*WILDCARD*...
            to.map( () => WILDCARD ),
            to,
            supportedMoves,
            newState
        );
    }

    /**
     * Set the TransitionResult for the targeted symbol(s), taking into account
     * if MULTIMATCH and/or WILDCARD features are enabled, but NOT whether
     * the feature needed for the specific gadget is enabled, that should be
     * checked by the caller.
     *
     * @param {RawCellContent|RawCellContent[]|WILDCARD} targets
     * @param {TransitionResult} result
     */
    addTransitionForTargets( targets, result ) {
        let targetOptions = targets;
        if ( targets === WILDCARD ) {
            if ( this.#features.isEnabled( FeatureSet.WILDCARD ) ) {
                this.#setWildcard( result );
                return;
            }
            targetOptions = this.#alphabets.wholeTapeAlphabet.filter(
                ( symbol ) => this.getTransition( symbol ) === undefined
            );
        }
        if ( Array.isArray( targetOptions ) ) {
            targetOptions = targetOptions.map( CellContent.fromRaw );
            if ( this.#features.isEnabled( FeatureSet.MULTIMATCH ) ) {
                this.#addMultiMatch( targetOptions, result );
                return;
            }
        } else {
            targetOptions = [ CellContent.fromRaw( targets ) ];
        }
        // If we get here, then either we want to multimatch (including via
        // wildcard) but the needed features are not enabled, or we are just
        // matching a single symbol. Either way, add individual transitions:
        targetOptions.forEach(
            ( target ) => this.#addTransition( target, result )
        );
    }

    /**
     * @param {CellContent} from
     * @return {TransitionResult|undefined}
     */
    getTransition( from ) {
        const fromReal = from.transitionKey;
        const individualResult = this.#transitions.get( fromReal );
        const individualTransition = individualResult ? individualResult[0] : false;
        if ( individualTransition instanceof TransitionResult ) {
            return individualTransition;
        } else if ( individualTransition === TransitionSet.#MULTIMATCH_DEFINED ) {
            const multimatchKey = Array.from( this.#multimatches.keys() ).find(
                ( cells ) => cells.some( ( cell ) => cell.transitionKey === fromReal )
            );
            if ( multimatchKey === undefined ) {
                throw new Error(
                    'MULTIMATCH_DEFINED but not found for ' + fromReal
                );
            }
            return this.#multimatches.get( multimatchKey )[0];
        } else if ( this.#wildcard !== false ) {
            return this.#wildcard;
        } else {
            return undefined;
        }
    }

    /**
     * Format for the developer to view
     */
    getDeveloperDisplay() {
        const resultSep = ' ' + String.fromCharCode( 0x27F6 ) + ' ';
        const indivTransitions = Array.from( this.#transitions.values() )
            .filter( ( [ v, k ] ) => v !== TransitionSet.#MULTIMATCH_DEFINED )
            .map( ( [ v, k ] ) => k.toString() + resultSep + v.toString() );
        const multimatchTransitions = Array.from( this.#multimatches.values() )
            .map( ( [ v, k, o ] ) => {
                let from = k.toString();
                if ( o ) {
                    // Multi-tape multi-match
                    from = o.toArrayString();
                }
                return from + resultSep + v.toString()
            } );
        const wildcardTrans = [];
        if ( this.#wildcard !== false ) {
            wildcardTrans.push(
                CellContent.fromRaw( WILDCARD ).toString() + resultSep + this.#wildcard.toString()
            );
        }
        return indivTransitions.concat( multimatchTransitions ).concat( wildcardTrans );
    }

    /**
     * Format for the code-version of the LaTeX (replace the \c with \w for
     * the prose version)
     */
    getLaTeXDisplay() {
        const indivTransitions = Array.from( this.#transitions.values() )
            .filter( ( [ v, k ] ) => v !== TransitionSet.#MULTIMATCH_DEFINED )
            .map( ( [ v, k ] ) => {
                const latexCmd = v.getLatexCommand( 'Single' );
                return latexCmd + k.asLtxParam() + v.asLtxParam();
            } );

        const multimatchTransitions = Array.from( this.#multimatches.values() )
            .map( ( [ v, k, o ] ) => {
                const latexCmd = v.getLatexCommand( 'Multimatch' );
                if ( Array.isArray( k ) ) {
                    k = CellContent.forArray( k );
                }
                let from = k.asLtxParam();
                if ( latexCmd === '\t\\cAddMTapeMultiMatchTransition' ) {
                    // Output can be confusing but this is only for Daniel
                    // when generating the examples in the Thesis
                    from = o.toArrayLatexString();
                }
                return latexCmd + from + v.asLtxParam( 'toArrayLatexString' );
            } );
        const wildcardTrans = [];
        if ( this.#wildcard !== false ) {
            let latexCmd = this.#wildcard.getLatexCommand( 'Wildcard' );
            if ( latexCmd === `\t\\cAddWildcardNCTransition`
                && indivTransitions.length === 0
                && multimatchTransitions.length === 0
            ) {
                latexCmd = `\t\\cAddOnlyWildcardNCTransition`;
            }
            if ( latexCmd === '\t\\cAddWildcardTransition'
                && indivTransitions.length === 0
                && multimatchTransitions.length === 0
            ) {
                latexCmd = '\t\\cAddOnlyWildcardTransition';
            }
            wildcardTrans.push( latexCmd + this.#wildcard.asLtxParam() );
        }
        return indivTransitions.concat( multimatchTransitions ).concat( wildcardTrans );
    }

    /**
     * For each transition defined, call updateForOmega() with these parameters
     * @param {string} oldOmega
     * @param {string} newOmega
     */
    updateForOmega( oldOmega, newOmega ) {
        this.#transitions.forEach(
            ( [ transitionResult ] ) => {
                if ( transitionResult !== TransitionSet.#MULTIMATCH_DEFINED ) {
                    transitionResult.updateForOmega( oldOmega, newOmega );
                }
            }
        );
        this.#multimatches.forEach(
            ( [ transitionResult ] ) => {
                transitionResult.updateForOmega( oldOmega, newOmega );
            }
        )
        if ( this.#wildcard !== false ) {
            this.#wildcard.updateForOmega( oldOmega, newOmega );
        }
    }
}

/**
 * This class represents the actual underlying machine. It has no concept of
 * if a feature is enabled or not, and does not identify transitions for itself.
 * Instead, it actually gets given a transition function to call to determine
 * what to do - if that function fails to prove a transition, and error is
 * *thrown*, not just logged.
 */
class RealMachine {
    /** @type {Renderer} */
    #renderer;
    /** @type {Logger} */
    #logger;
    /** @type {string} */
    #startState = '';
    /** @type {string} */
    #currentState = '';
    /** @type {Function} */
    #transitionCb;
    /** @type {MachineTape[]} */
    machineTapes;
    /**
     * @param {Renderer} renderer
     * @param {Logger} logger
     * @param {string} startState
     * @param {Function} getTransitionCb
     * @param {number} numTapes
     */
    constructor( renderer, logger, startState, getTransitionCb, numTapes ) {
        this.#renderer = renderer;
        renderer.setNumTapes( numTapes );
        this.#logger = logger;
        this.#startState = startState;
        this.#currentState = startState;
        this.#transitionCb = getTransitionCb;
        // Create the needed number of tapes; need to fill the array to be
        // able to map it
        const arrNumTapes = ( new Array( numTapes ) ).fill( 0 );
        this.machineTapes =  arrNumTapes.map( () => new MachineTape() );
    }

    /** @param {string} newState */
    setCurrentState( newState ) {
        this.#currentState = newState;
        // does NOT call renderStep() - caller is responsible for making sure
        // that happens
    }
    /** @param {string} machineInputStr */
    loadWithContent( machineInputStr ) {
        this.#logger.debug( machineInputStr );
        // Content goes into the first tape, all others are blank
        this.machineTapes[0].initializeWithContent( machineInputStr );
        this.machineTapes.slice( 1 ).forEach(
            ( tape ) => tape.initializeWithContent( '' )
        );
        // Restore to starting state
        this.setCurrentState( this.#startState );
        this.#renderer.renderStep( this.#currentState, this.machineTapes );
    }
    performNextStep() {
        if ( this.#currentState === STATE_ACCEPT || this.#currentState === STATE_REJECT ) {
            this.#logger.debug( 'Not performing anything, in a halting state' );
            return false;
        }
        let currentContent;
        if ( this.machineTapes.length === 1) {
            currentContent = this.machineTapes[0].getCurrentCellContent();
        } else {
            currentContent = this.machineTapes.map(
                ( tape ) => tape.getCurrentCellContent()
            );
            currentContent = CellContent.forArray( currentContent );
        }
        const transition = ( this.#transitionCb )( this.#currentState, currentContent );
        if ( transition === undefined ) {
            throw new Error( 'performNextStep() did not get a transition!' );
        }
        transition.applyToMachine( this );
        this.#renderer.renderStep( this.#currentState, this.machineTapes );
        return true;
    }
    renderStep() {
        // Useful for MemoryRenderer changing everything
        this.#renderer.renderStep( this.#currentState, this.machineTapes );
    }
}

/** Overall representation of the TM simulator */
class MachineSimulator {
    /** @type {string} */
    #startState = '';
    /** @type {Object.<string, ProxyState>} */
    #knownStates = {};
    /**
     * All of the transitions as a multi-dimensional object. The first level
     * is the name of the state, the second level is a `TransitionSet` that
     * holds the transitions.
     *
     * @type {Object.<string, TransitionSet>}
     */
    #transitions = {};
    /** @type {Logger} */
    #logger;
    /** @type {FeatureSet} */
    #features;
    /** @type {MachineAlphabets} */
    #machineAlphabets;
    /** @type {number} */
    #numTapes = -1;
    /** @type {string} internal state indicator */
    #omega;
    /**
     * @type {number}
     * Indicate that we are building internal states and thus that we do not
     * want to rename states every time the `#omega` value is used. If 0, we
     * are not building internal states, otherwise it refers to the depth of
     * the internal state name building so that if one feature uses another
     * the end of the second doesn't prevent the first from using internal
     * state names.
     */
    #buildingInternal;
    /**
     * @param {Logger} logger
     * @param {string} startState
     * @param {FeatureSet} features
     * @param {RawCellContent[]} inputAlphabet
     * @param {RawCellContent[]} extraTapeAlphabet
     */
    constructor( logger, startState, features, inputAlphabet, extraTapeAlphabet ) {
        this.#startState = startState;
        this.#logger = logger;
        this.#features = features;
        this.#machineAlphabets = new MachineAlphabets( inputAlphabet, extraTapeAlphabet );
        this.#omega = OMEGA;
        this.#buildingInternal = 0;
    }
    /**
     * @param {string} statename
     */
    #maybeUpdateOmega( stateName ) {
        if ( this.#buildingInternal > 0 ) {
            // We want to allow omegas
            return;
        }
        if ( !stateName.includes( this.#omega ) ) {
            // No change needed
            return;
        }
        let newOmega = this.#omega + OMEGA;
        while ( stateName.includes( newOmega ) ) {
            newOmega += OMEGA;
        }
        this.#logger.debug( 'Omega: from ' + this.#omega + ', to ' + newOmega );
        // Copy the keys before we iterate so that the changes don't mess
        // with things
        const knownStateNames = Object.keys( this.#knownStates );
        knownStateNames.forEach( ( oldName ) => {
            if ( !oldName.includes( this.#omega ) ) {
                return;
            }
            const newName = oldName.replaceAll( this.#omega, newOmega );
            console.log( oldName, newName );
            this.#knownStates[ newName ] = new ProxyState( newName, this );
            delete this.#knownStates[ oldName ];

            this.#transitions[ newName ] = this.#transitions[ oldName ];
            this.#transitions[ newName ].updateForOmega( this.#omega, newOmega );
            delete this.#transitions[ oldName ];
        } );
        this.#omega = newOmega;
    }
    /**
     * @param {number} numTapes
     * @param {string} firstState
     */
    setNumTapes( numTapes, firstState ) {
        if ( numTapes <= 1 ) {
            throw new Error( 'setNumTapes() should be used for multiple tapes' );
        }
        if ( this.#numTapes === 1 ) {
            throw new Error( 'setNumTapes() called after adding single-transitions!' );
        } else if ( this.#numTapes !== -1 ) {
            throw new Error( 'setNumTapes() can only be called once' );
        }
        this.#numTapes = numTapes;

        if ( this.#features.isEnabled( FeatureSet.MULTI_TAPE ) ) {
            // Multi-tape machines start in whatever state the developer says
            // in the setNumTapes() call
            this.#startState = firstState;
            return;
        }
        this.#machineAlphabets.enableMultiTapeSimulation();
        this.#buildingInternal++;

        this.#logger.debug( 'Number of tapes: ' + numTapes );
        const initPre = `${this.#omega}_init_`;
        this.getState( 'qstart' )
            .addTransitionGadget( WILDCARD, 'FIRST-CELL-MARKER', MULTITAPE_REAL_START, initPre + 'insertLeftBound' );
        this.getState( initPre + 'insertLeftBound' )
            .addTransitionGadget( WILDCARD, 'INSERT-AFTER-MARKER', MULTITAPE_REAL_START, MULTITAPE_BOUND_L, initPre + 'insertEmpty' );
        this.getState( initPre + 'insertEmpty' )
            .addTransitionGadget( WILDCARD, 'INSERT-AFTER-MARKER', MULTITAPE_REAL_START, EMPTY_CELL, initPre + 'findEnd' );
        this.getState( initPre + 'findEnd' )
            .addTransition( EMPTY_CELL, EMPTY_CELL, Movement.right(), initPre + 'afterEnd' )
            .addTransition( WILDCARD, NO_CHANGE, Movement.right(), initPre + 'findEnd' );
        this.getState( initPre + 'afterEnd' )
            .addTransition( EMPTY_CELL, MULTITAPE_BOUND_R, Movement.right( ( numTapes - 1 ) * 3 + 1 ), initPre + 'afterLast' );
        this.getState( initPre + 'afterLast' )
            .addTransition( EMPTY_CELL, MULTITAPE_AFTER_LAST, Movement.left(), initPre + 'atBoundR' );
        this.getState( initPre + 'atBoundR' )
            .addTransition( EMPTY_CELL, MULTITAPE_BOUND_R, Movement.left(), initPre + 'atExtraHead' )
            .addTransition( MULTITAPE_BOUND_R, MULTITAPE_BOUND_R, Movement.left(), initPre + 'findStart' );
        this.getState( initPre + 'atExtraHead' )
            .addTransition( EMPTY_CELL, new CellContent( EMPTY_CELL, true ), Movement.left(), initPre + 'atBoundL' );
        this.getState( initPre + 'atBoundL' )
            .addTransition( EMPTY_CELL, MULTITAPE_BOUND_L, Movement.left(), initPre + 'atBoundR' );
        this.getState( initPre + 'findStart' )
            .addTransition( MULTITAPE_REAL_START, MULTITAPE_REAL_START, Movement.right(), initPre + 'atStart' )
            .addTransition( WILDCARD, NO_CHANGE, Movement.left(), initPre + 'findStart' );
        this.getState( initPre + 'atStart' )
            .addTransition( EMPTY_CELL, new StateNameContent( firstState ), Movement.right( 2 ), initPre + 'markFirstHead' );
        const markerState = this.getState( initPre + 'markFirstHead' );
        this.#machineAlphabets.developerAlphabet.forEach(
            ( c ) => markerState.addTransition(
                c,
                new CellContent( c.realContent, true ),
                Movement.left( 2 ),
                this.#omega + '_process'
            )
        );

        this.getState( this.#omega + '_process' );

        // Inserting empty cells - _doEmptyCellInsertions starts on the first
        // {<} and returns control to _process *on* the cell with the state
        // name
        const insertPre = this.#omega + '_doEmptyCellInsertions';
        const searchStateName = insertPre + '-search';
        this.getState( insertPre )
            .addTransition(
                MULTITAPE_BOUND_L,
                MULTITAPE_BOUND_L,
                Movement.right(),
                searchStateName
            );
        const searchState = this.getState( searchStateName );
        const doneStateName = insertPre + '-done';
        searchState.addTransition(
            [
                ...this.#machineAlphabets.developerAlphabet,
                ...this.#machineAlphabets.validTapeHeads,
                MULTITAPE_BOUND_L, MULTITAPE_BOUND_R,
            ],
            NO_CHANGE,
            Movement.right(),
            searchStateName
        );
        searchState.addTransition(
            MULTITAPE_AFTER_LAST,
            MULTITAPE_AFTER_LAST,
            Movement.left(),
            doneStateName
        );

        const tapeBoundRHead = new CellContent( MULTITAPE_BOUND_R, true );
        const findGrabStateName = insertPre + '-findToGrab';
        searchState.addTransition(
            tapeBoundRHead,
            tapeBoundRHead,
            Movement.right(),
            findGrabStateName
        );
        // We cannot just use INSERT-AFTER-MARKER here since that will
        // grab the *next* EMPTY_CELL and we want the EMPTY_CELL after the
        // MULTITAPE_AFTER_LAST. But, once we get there, we can call it there
        // since it'll move the empty cell all the way to the correct place
        const findGrabState = this.getState( findGrabStateName );
        findGrabState.addTransition(
            [
                ...this.#machineAlphabets.developerAlphabet,
                ...this.#machineAlphabets.validTapeHeads,
                MULTITAPE_BOUND_L, MULTITAPE_BOUND_R, tapeBoundRHead,
            ],
            NO_CHANGE,
            Movement.right(),
            findGrabStateName
        );
        findGrabState.addTransition(
            MULTITAPE_AFTER_LAST,
            MULTITAPE_AFTER_LAST,
            Movement.none(),
            insertPre + '-foundToGrab'
        );
        this.getState( insertPre + '-foundToGrab' )
            .addTransitionGadget(
                WILDCARD,
                'INSERT-AFTER-MARKER',
                tapeBoundRHead,
                MULTITAPE_BOUND_R,
                insertPre + '-justInserted'
            );
        // We get to -justInserted pointing at the left bound in
        // [right marked head][right bound][left bound]
        // or if this was for the last tape, the MULTITAPE_AFTER_LAST
        this.getState( insertPre + '-justInserted' )
            .addTransition(
                [ MULTITAPE_BOUND_L, MULTITAPE_AFTER_LAST ],
                NO_CHANGE,
                Movement.left( 2 ),
                insertPre + '-nowMakeEmptyHead'
            );
        this.getState( insertPre + '-nowMakeEmptyHead' )
            .addTransition(
                tapeBoundRHead,
                new CellContent( EMPTY_CELL, true ),
                Movement.left(),
                doneStateName // assume done
            );


        // Done state
        const doneState = this.getState( doneStateName );
        doneState.addTransition(
            [
                ...this.#machineAlphabets.developerAlphabet,
                ...this.#machineAlphabets.validTapeHeads,
                MULTITAPE_BOUND_L, MULTITAPE_BOUND_R,
            ],
            NO_CHANGE,
            Movement.left(),
            doneStateName
        );
        // We just replaced the leftmost one, but what about others?
        doneState.addTransition(
            tapeBoundRHead,
            tapeBoundRHead,
            Movement.right(),
            findGrabStateName
        );

        // Accept and reject need to be written in manually, all other -done
        // specific state symbols are added as the transitions get defined
        this.#machineAlphabets.addStateSymbol( STATE_ACCEPT );
        this.#machineAlphabets.addStateSymbol( STATE_REJECT );
        const accContent = new StateNameContent( STATE_ACCEPT );
        const rejContent = new StateNameContent( STATE_REJECT );
        this.getState( this.#omega + '_doEmptyCellInsertions-done' )
            .addTransition( accContent, accContent, Movement.none(), STATE_ACCEPT )
            .addTransition( rejContent, rejContent, Movement.none(), STATE_REJECT );

        this.#buildingInternal--;
    }
    /**
     * @param {string} callerFn
     * @param {(RawCellContent|RawCellContent[]|WILDCARD)[]|WILDCARD} from
     * @param {RawCellContent[]} to
     * @param {(Movement|Function)} move
     * @param {string} newState
     */
    #verifyMultiTape( callerFn, from, to, move ) {
        if ( this.#numTapes <= 1 ) {
            throw new Error( 'Trying to use ' + callerFn + ' with single tape' );
        }
        const baseErrorMsg = callerFn + ' for ' + this.#numTapes + ' tapes, called with: ';
        if ( from !== WILDCARD && this.#numTapes !== from.length ) {
            throw new Error( baseErrorMsg + from.length + ' `from` targets' );
        } else if ( this.#numTapes !== to.length ) {
            throw new Error( baseErrorMsg + to.length + ' `to` values' );
        } else if ( this.#numTapes !== move.length ) {
            throw new Error( baseErrorMsg + move.length + ' `move` values' );
        }
    }
    /**
     * @param {string} callerFn
     */
    #verifySingleTape( callerFn ) {
        if ( this.#buildingInternal ) {
            // When we have multiple simulated tapes internally we need to
            // be able to use single-tape transitions
            return;
        }
        if ( this.#numTapes === -1 ) {
            // First transition
            this.#numTapes = 1;
            return;
        }
        if ( this.#numTapes === 1 ) {
            // Single-tape machine
            return;
        }
        throw new Error( 'Cannot use `' + callerFn + '` with multiple tapes!' );
    }

    /**
     * Throw a nice error if a parameter is missing
     * @param {string} fnName
     * @param {string} paramName
     * @param {Mixed} paramValue
     */
    #requireParameter( fnName, paramName, paramValue ) {
        if ( paramValue === undefined ) {
            throw new Error( `Function '${fnName}' missing parameter '${paramName}'` );
        }
    }
    /**
     * @param {string} stateName
     * @return {ProxyState}
     */
    getState( stateName ) {
        this.#requireParameter( 'getState', 'stateName', stateName );
        this.#maybeUpdateOmega( stateName );
        if ( this.#knownStates[ stateName ] === undefined ) {
            this.#knownStates[ stateName ] = new ProxyState( stateName, this );
            this.#transitions[ stateName ] = new TransitionSet(
                this.#features,
                this.#machineAlphabets
            );
        }
        return this.#knownStates[ stateName ];
    }

    /**
     * @param {string} oldState
     * @param {RawCellContent|RawCellContent[]|WILDCARD} from
     * @param {RawCellContent|NO_CHANGE} to
     * @param {Movement|Function} move
     * @param {string} newState
     */
    addTransition( oldState, from, to, move, newState ) {
        this.#verifySingleTape( 'addTransition' );
        this.#requireParameter( 'addTransition', 'oldState', oldState );
        this.#requireParameter( 'addTransition', 'from', from );
        this.#requireParameter( 'addTransition', 'to', to );
        this.#requireParameter( 'addTransition', 'move', move );
        this.#requireParameter( 'addTransition', 'newState', newState );
        this.#maybeUpdateOmega( newState );
        // In case this got called without getState()
        this.#maybeUpdateOmega( oldState );
        const moveNormal = Movement.normalize( move );
        if ( this.#features.supportsMovement( moveNormal ) ) {
            this.#transitions[ oldState ].createSupportedMoveTransition(
                from,
                to,
                moveNormal,
                newState
            );
            return;
        }
        this.#buildingInternal++;
        this.#handleMove( oldState, from, to, moveNormal, newState );
        this.#buildingInternal--;
    }
    /**
     * @param {string} oldState
     * @param {RawCellContent|RawCellContent[]|WILDCARD} from
     * @param {string} gadgetName
     * @param {...Mixed} gadgetParams
     */
    addTransitionGadget( oldState, from, gadgetName, ...gadgetParams ) {
        this.#verifySingleTape( 'addTransitionGadget' );
        this.#requireParameter( 'addTransitionGadget', 'oldState', oldState );
        this.#requireParameter( 'addTransitionGadget', 'from', from );
        this.#requireParameter( 'addTransitionGadget', 'gadgetName', gadgetName );
        this.#requireParameter( 'addTransitionGadget', 'gadgetParams', gadgetParams );
        // In case this got called without getState(); each gadget is
        // responsible for checking its new state name
        this.#maybeUpdateOmega( oldState );
        if ( gadgetName === 'SHIFT' ) {
            this.#addGadgetShift( oldState, from, ...gadgetParams );
        } else if ( gadgetName === 'FIRST-CELL-MARKER' ) {
            this.#addFirstCellMarker( oldState, from, ...gadgetParams );
        } else if ( gadgetName === 'INSERT-AFTER-MARKER' ) {
            this.#addAfterMarker( oldState, from, ...gadgetParams );
        } else {
            throw new Error( 'Unknown gadget: ' + gadgetName );
        }
    }
    /**
     * @param {string} oldState
     * @param {(RawCellContent|RawCellContent[]|WILDCARD)[]|WILDCARD} from
     * @param {RawCellContent[]} to
     * @param {(Movement|Function)[]} move
     * @param {string} newState
     */
    addMTapeTransition( oldState, from, to, move, newState ) {
        this.#requireParameter( 'addMTapeTransition', 'oldState', oldState );
        this.#requireParameter( 'addMTapeTransition', 'from', from );
        this.#requireParameter( 'addMTapeTransition', 'to', to );
        this.#requireParameter( 'addMTapeTransition', 'move', move );
        this.#requireParameter( 'addMTapeTransition', 'newState', newState );
        this.#maybeUpdateOmega( oldState );
        this.#maybeUpdateOmega( newState );
        this.#verifyMultiTape( 'addMTapeTransition', from, to, move );

        const moveNormal = move.map( Movement.normalize );
        // REAL use of multiple tapes requires support for MOVE_NONE, so we
        // only need to check if there are any multi-move transitions
        const anyMultiMoves = moveNormal.some(
            ( moveSingle ) => ( moveSingle.tapeOffset > 1
                || moveSingle.tapeOffset < -1 )
        );

        this.#buildingInternal++;
        if ( anyMultiMoves &&
            // ALWAYS need to simulate multi-moves when simulating extra tapes
            ( !this.#features.isEnabled( FeatureSet.MOVE_MULTI ) ||
                !this.#features.isEnabled( FeatureSet.MULTI_TAPE ) )
        ) {
            this.#addMTapeMultiMoves( oldState, from, to, moveNormal, newState );
            this.#buildingInternal--;
            return;
        }

        if ( this.#features.isEnabled( FeatureSet.MULTI_TAPE ) ) {
            this.#addMTapeTransitionReal( oldState, from, to, moveNormal, newState );
            this.#buildingInternal--;
            return;
        }
        this.#addMTapeTransitionSimulated( oldState, from, to, moveNormal, newState );
        this.#buildingInternal--;
    }
    /**
     * @param {string} oldState
     * @param {(RawCellContent|RawCellContent[]|WILDCARD)[]|WILDCARD} from
     * @param {RawCellContent[]} to
     * @param {Movement[]} moveNormal
     * @param {string} newState
     */
    #addMTapeMultiMoves( oldState, from, to, moveNormal, newState ) {
        // Fake support for multiple moves - call addMTapeTransition() with
        // a set of movements to move once, and then a wildcard to move the
        // rest, which will recursively get here
        const firstMoves = moveNormal.map( ( mv ) => mv.splitMovement()[0] );
        const laterMoves = moveNormal.map( ( mv ) => mv.splitMovement()[1] );

        const laterMovesStr = laterMoves.join( ',' );

        const tempState = `${this.#omega}_${laterMovesStr}_${this.#omega}_${newState}_${this.#omega}`;
        // Might already exist
        if ( this.#knownStates[ tempState ] === undefined ) {
            // Does not already exist, need to set up
            this.getState( tempState )
                .addMTapeTransition(
                    // Replace all `to` values with a no-change
                    WILDCARD,
                    to.map( t => NO_CHANGE ),
                    laterMoves,
                    newState
                );
        }
        this.addMTapeTransition(
            oldState,
            from,
            to,
            firstMoves,
            tempState
        );

    }
    /**
     * @param {string} oldState
     * @param {(RawCellContent|RawCellContent[]|WILDCARD)[]|WILDCARD} from
     * @param {RawCellContent[]} to
     * @param {Movement[]} moveNormal
     * @param {string} newState
     */
    #addMTapeTransitionSimulated( oldState, from, to, moveNormal, newState ) {
        // Since for simulated tapes we store the details of defined transitions
        // in existing state names, an overall WILDCARD has to be treated
        // equivalently to a WILDCARD*WILDCARD*... tuple so that we can do the
        // filtering; we cannot just save the wildcard transition somewhere
        if ( from === WILDCARD ) {
            // Use the size of the `to` array
            from = to.map( t => WILDCARD );
        }

        const fromNormal = from.map( CellContent.fromRaw );

        // Here, "using a wildcard" means that the transition targets
        // a WILDCARD on one or more tapes, which gets expanded to the
        // supported alphabet. We need to expand and then filter those
        const usesWildcard = fromNormal.some(
            ( c ) => c.realContent === WILDCARD
        );
        if ( usesWildcard ) {
            // Here, "using a wildcard" means that the transition targets
            // a WILDCARD on one or more tapes, which gets expanded to the
            // supported alphabet
            const fromExpanded = fromNormal.map(
                ( c ) => c.realContent === WILDCARD
                    ? this.#machineAlphabets.developerAlphabet
                    : c
            );
            // Wrap them in CellContent
            const fromExpandedContents = fromExpanded.map( CellContent.fromRaw );
            const allCombos = MTapeMultiMatch.getTargetCombinations( fromExpandedContents );
            // Filter for the wildcard
            const targetCombos = allCombos.filter(
                ( combination ) =>
                    this.#transitions[
                        MTapeSimulationBuilder.getLastFindState( oldState, combination, this.#omega )
                    ] === undefined
            );
            targetCombos.forEach(
                // Bypass multi-tape feature check, if we are here we know
                // it isn't supported
                ( targetCombination ) => this.#addMTapeTransitionSimulated(
                    oldState,
                    targetCombination,
                    MTapeMultiMatch.getCombinationTo( targetCombination, to ),
                    moveNormal,
                    newState
                )
            );
            return;
        }
        // Multi-match doesn't make sense in the context of simulating multiple
        // tapes since we store the tape information in the state name; if
        // there are any multi-matches attempted recursively call this method
        const allTargetedCombinations = MTapeMultiMatch.getTargetCombinations( fromNormal );
        if ( allTargetedCombinations.length !== 1 ) {
            allTargetedCombinations.forEach(
                // Bypass multi-tape feature check, if we are here we know
                // it isn't supported
                ( targetCombination ) => this.#addMTapeTransitionSimulated(
                    oldState,
                    targetCombination,
                    MTapeMultiMatch.getCombinationTo( targetCombination, to ),
                    moveNormal,
                    newState
                )
            );
            return;
        }

        const fromCombo = allTargetedCombinations[ 0 ].map( CellContent.fromRaw );
        const toNormal = to.map( CellContent.fromRaw );
        const stateSimBuilder = new MTapeSimulationBuilder(
            oldState,
            newState,
            fromCombo,
            toNormal,
            moveNormal,
            this.#omega
        );
        // Ensure simulation can start - do this BEFORE we ensure the state
        // exists as part of searching, so that we know it only runs once
        const fromStateContent = new StateNameContent( oldState );
        if ( this.#transitions[ this.#omega + '_process' ].getTransition( fromStateContent ) === undefined ) {
            this.#machineAlphabets.addStateSymbol( oldState );
            this.getState( this.#omega + '_process' )
                .addTransition(
                    fromStateContent,
                    EMPTY_CELL,
                    Movement.right(),
                    stateSimBuilder.getFindingState( 0 )
                );
            this.getState( this.#omega + '_doEmptyCellInsertions-done' )
                .addTransition(
                    fromStateContent,
                    fromStateContent,
                    Movement.none(),
                    this.#omega + '_process'
                );
        }

        for ( let currTapeNum = 0; currTapeNum < this.#numTapes; currTapeNum++ ) {
            // Add states for looking
            const lookState = stateSimBuilder.getFindingState( currTapeNum );
            if ( this.#transitions[ lookState ] === undefined ) {
                this.getState( lookState )
                    // After finding the symbol on the first tape need to
                    // keep looking to the next tape
                    .addTransition(
                        [ ...this.#machineAlphabets.developerAlphabet, MULTITAPE_BOUND_R, MULTITAPE_BOUND_L ],
                        NO_CHANGE,
                        Movement.right(),
                        lookState
                    );
            }
            // Add handling for the current symbols; might already be set
            // for all but the last
            const currTapeHead = new CellContent( fromCombo[currTapeNum].realContent, true );
            if ( currTapeNum !== this.#numTapes - 1 &&
                this.#transitions[ lookState ].getTransition( currTapeHead ) !== undefined
            ) {
                continue;
            }
            this.getState( lookState )
                .addTransition(
                    currTapeHead,
                    currTapeHead,
                    Movement.right(),
                    stateSimBuilder.getFindingState( currTapeNum + 1 )
                );
        }
        for ( let currTapeNum = 0; currTapeNum < this.#numTapes; currTapeNum++ ) {
            // Add states for applying
            const applyState = stateSimBuilder.getApplicationState( currTapeNum );
            if ( this.#transitions[ applyState ] !== undefined ) {
                // application is specific->broad, all already set up
                continue;
            }
            const markHeadState = stateSimBuilder.getMarkHeadState( currTapeNum );
            const applyNextState = stateSimBuilder.getApplicationState( currTapeNum - 1 );
            this.getState( applyState )
                .addTransition(
                    [
                        ...this.#machineAlphabets.developerAlphabet,
                        // After updating the symbol on the last tape need to
                        // keep applying to the prior tape
                        MULTITAPE_BOUND_L, MULTITAPE_BOUND_R,
                    ],
                    NO_CHANGE,
                    Movement.left(),
                    applyState
                );
            this.getState( applyState )
                .addTransition(
                    this.#machineAlphabets.validTapeHeads,
                    toNormal[ currTapeNum ],
                    moveNormal[ currTapeNum ],
                    markHeadState
                );
            this.getState( markHeadState )
                .addTransition(
                    MULTITAPE_BOUND_L,
                    MULTITAPE_BOUND_L,
                    Movement.right(),
                    markHeadState
                );
            this.getState( markHeadState )
                .addTransition(
                    MULTITAPE_BOUND_R,
                    new CellContent( MULTITAPE_BOUND_R, true),
                    Movement.left(),
                    applyNextState
                );
            const markerState = this.getState( markHeadState );
            this.#machineAlphabets.developerAlphabet.forEach(
                ( c ) => markerState.addTransition(
                    c,
                    new CellContent( c.realContent, true ),
                    Movement.left(),
                    applyNextState
                )
            );
        }
        // Got to `afterApplyState` and have applied all updates, now go back
        // to start, record next state, do cleanups, and then resume
        const afterApplyState = stateSimBuilder.applicationStateBase;
        if ( this.#transitions[ afterApplyState ] === undefined ) {
            this.getState( afterApplyState )
                .addTransition(
                    this.#machineAlphabets.developerAlphabet,
                    NO_CHANGE,
                    Movement.left(),
                    afterApplyState
                );
            this.getState( afterApplyState )
                .addTransition(
                    MULTITAPE_BOUND_L,
                    MULTITAPE_BOUND_L,
                    Movement.left(),
                    afterApplyState + '-doRecord'
                );
            this.getState( afterApplyState + '-doRecord' )
                .addTransition(
                    EMPTY_CELL,
                    new StateNameContent( newState ),
                    Movement.right(),
                    this.#omega + '_doEmptyCellInsertions'
                );
        }
    }
    /**
     * @param {string} oldState
     * @param {(RawCellContent|RawCellContent[]|WILDCARD)[]|WILDCARD} from
     * @param {RawCellContent[]} to
     * @param {Movement[]} moveNormal
     * @param {string} newState
     */
    #addMTapeTransitionReal( oldState, from, to, moveNormal, newState ) {
        this.#transitions[ oldState ].createSupportedMTapeMoveTransitions(
            from,
            to,
            moveNormal,
            newState
        );
    }
    /**
     * @param {string} oldState
     * @param {RawCellContent|RawCellContent[]|WILDCARD} from
     * @param {Movement|Function} subsequentMove
     * @param {string} finalState
     */
    #addGadgetShift( oldState, from, subsequentMove, finalState ) {
        this.#requireParameter( 'gadget-shift', 'subsequentMove', subsequentMove );
        this.#requireParameter( 'gadget-shift', 'finalState', finalState );
        this.#maybeUpdateOmega( finalState );
        this.#buildingInternal++;
        const subMoveNormal = Movement.normalize( subsequentMove );
        if ( !this.#features.isEnabled( FeatureSet.GADGET_SHIFT ) ) {
            // Handle wildcard and multimatch
            let fromCells = from;
            if ( fromCells === WILDCARD ) {
                const allTargets = this.#machineAlphabets.wholeTapeAlphabet;
                const currTransitions = this.#transitions[ oldState ];
                fromCells = allTargets.filter(
                    ( target ) => currTransitions.getTransition( target ) === undefined
                );
            }
            if ( !Array.isArray( fromCells ) ) {
                fromCells = [ fromCells ];
            }
            fromCells = fromCells.map( CellContent.fromRaw );
            fromCells.forEach(
                ( fromSingle ) => this.#addFallbackShift(
                    oldState,
                    fromSingle,
                    subMoveNormal,
                    finalState
                )
            );
            this.#buildingInternal--;
            return;
        }

        // the GadgetShiftUpdate just moves exactly what it matched against,
        // it is not specific to the matched symbol
        const result = new TransitionResult(
            [ new GadgetShiftUpdate( subMoveNormal ) ],
            finalState
        );
        this.#transitions[ oldState ].addTransitionForTargets(
            from,
            result
        );
        this.#buildingInternal--;
    }
    /**
     * @param {string} oldState
     * @param {RawCellContent|RawCellContent[]|WILDCARD} from
     * @param {RawCellContent} firstMarker
     * @param {string} finalState
     */
    #addFirstCellMarker( oldState, from, firstMarker, finalState ) {
        this.#requireParameter( 'gadget-first-cell-marker', 'firstMarker', firstMarker );
        this.#requireParameter( 'gadget-first-cell-marker', 'finalState', finalState );
        this.#maybeUpdateOmega( finalState );
        this.#buildingInternal++;
        if ( !this.#features.isEnabled( FeatureSet.GADGET_FIRST_CELL_MARKER ) ) {
            this.#addFallbackFirstCellMarker( oldState, from, firstMarker, finalState );
            this.#buildingInternal--;
            return;
        }

        // Transition gets applied to any remaining symbols to match
        // the GadgetShiftUpdate just moves exactly what it matched against,
        // it is not specific to the matched symbol
        const result = new TransitionResult(
            [ new GadgetFirstCellMarkerUpdate( CellContent.fromRaw( firstMarker ) ) ],
            finalState
        );
        this.#transitions[ oldState ].addTransitionForTargets(
            from,
            result
        );
        this.#buildingInternal--;
    }
    /**
     * @param {string} oldState
     * @param {RawCellContent|RawCellContent[]|WILDCARD} from
     * @param {RawCellContent} cellMarker
     * @param {RawCellContent} toInsert
     * @param {string} finalState
     */
    #addAfterMarker( oldState, from, cellMarker, toInsert, finalState ) {
        this.#requireParameter( 'gadget-after-marker', 'cellMarker', cellMarker );
        this.#requireParameter( 'gadget-after-marker', 'toInsert', toInsert );
        this.#requireParameter( 'gadget-after-marker', 'finalState', finalState );
        this.#maybeUpdateOmega( finalState );
        this.#buildingInternal++;
        if ( !this.#features.isEnabled( FeatureSet.GADGET_INSERT_AFTER_MARKER ) ) {
            this.#addFallbackAfterMarker( oldState, from, cellMarker, toInsert, finalState );
            this.#buildingInternal--;
            return;
        }

        // Transition gets applied to any remaining symbols to match
        const result = new TransitionResult(
            [ new GadgetAfterMarkerUpdate(
                CellContent.fromRaw( cellMarker ),
                CellContent.fromRaw( toInsert )
            ) ],
            finalState
        );
        this.#transitions[ oldState ].addTransitionForTargets(
            from,
            result
        );
        this.#buildingInternal--;
    }
    /**
     * Add manual paste-related transitions needed for a single targeted
     * shift, since if the gadget is not available multi-match and wildcard
     * would be useless (since the state name needs to identify what will
     * be pasted)
     *
     * @param {string} oldState
     * @param {RawCellContent} from
     * @param {Movement} subMoveNormal
     * @param {string} finalState
     */
    #addFallbackShift( oldState, from, subMoveNormal, finalState ) {
        const pasteState = `${this.#omega}_paste${from}_${this.#omega}_${subMoveNormal}_${this.#omega}_${finalState}_${this.#omega}`;
        if ( this.#knownStates[ pasteState ] === undefined ) {
            this.getState( pasteState )
                .addTransition( WILDCARD, from, subMoveNormal, finalState );
        }
        this.getState( oldState )
            .addTransition( from, EMPTY_CELL, Movement.right(), pasteState );
    }
    /**
     * Add manual implementation of the gadget to insert a first cell marker
     *
     * @param {string} oldState
     * @param {RawCellContent|RawCellContent[]|WILDCARD} from
     * @param {RawCellContent} firstMarker
     * @param {string} finalState
     */
    #addFallbackFirstCellMarker( oldState, from, firstMarker, finalState ) {
        // add a prefix from the specific state to avoid conflicts with other
        // first cell insertion attempts; also include the specific `from` since
        // there could be different first cell insertion attempts on the same
        // state but different targets
        let fromContent;
        if ( Array.isArray( from ) ) {
            fromContent = CellContent.forArray( from );
        } else {
            fromContent = CellContent.fromRaw( from );
        }
        const statePre = `${this.#omega}_firstCellMarker_${this.#omega}_${oldState}_${this.#omega}_${fromContent}_${this.#omega}`;
        const findEndState = `${statePre}_findEnd`;
        const doShiftsState = `${statePre}_doShifts`;

        this.getState( oldState )
            .addTransition( from, NO_CHANGE, Movement.right(), findEndState );
        this.getState( findEndState )
            .addTransition( EMPTY_CELL, EMPTY_CELL, Movement.left(), doShiftsState )
            .addTransition( WILDCARD, NO_CHANGE, Movement.right(), findEndState );
        this.getState( doShiftsState )
            .addTransition( EMPTY_CELL, firstMarker, Movement.right(), finalState )
            .addTransitionGadget( WILDCARD, 'SHIFT', Movement.left(2), doShiftsState );
    }
    /**
     * @param {string} oldState
     * @param {RawCellContent|RawCellContent[]|WILDCARD} from
     * @param {RawCellContent} cellMarker
     * @param {RawCellContent} toInsert
     * @param {string} finalState
     */
    #addFallbackAfterMarker( oldState, from, cellMarker, toInsert, finalState ) {
        // add a prefix from the specific state to avoid conflicts with other
        // first cell insertion attempts...
        const fromContent = CellContent.fromRaw( from );
        const cellMarkerContent = CellContent.fromRaw( cellMarker );
        const statePre = `${this.#omega}_afterCellMarker_${this.#omega}_${oldState}_${this.#omega}_${fromContent}_${this.#omega}`;
        const findEndState = `${statePre}_findEnd`;
        const doShiftsState = `${statePre}_doShifts`;
        const doInsertState = `${statePre}_doInsert`;

        this.getState( oldState )
            .addTransition( from, NO_CHANGE, Movement.right(), findEndState );
        this.getState( findEndState )
            .addTransition( EMPTY_CELL, EMPTY_CELL, Movement.left(), doShiftsState )
            .addTransition( WILDCARD, NO_CHANGE, Movement.right(), findEndState );
        this.getState( doShiftsState )
            .addTransition( cellMarkerContent, cellMarkerContent, Movement.right(), doInsertState )
            .addTransitionGadget( WILDCARD, 'SHIFT', Movement.left(2), doShiftsState );
        this.getState( doInsertState )
            .addTransition( EMPTY_CELL, toInsert, Movement.right(), finalState );
    }
    /**
     * @param {string} oldState
     * @param {RawCellContent|RawCellContent[]|WILDCARD} from
     * @param {RawCellContent|NO_CHANGE} to
     * @param {Movement} moveNormal
     * @param {string} finalState
     */
    #handleMove( oldState, from, to, moveNormal, finalState ) {
        // Since Movement#splitMovement() can return a no-move part for the
        // remaining move if the current move is a single movement left or
        // right, that would create a bunch of problems if it was used here but
        // a single move should not reach this code
        const moveOffset = moveNormal.tapeOffset;
        if ( moveOffset === 1 || moveOffset === -1 ) {
            throw new Error(
                '#handleMove() reached for a movement with tape offset ' + moveOffset
            );
        }

        let currentMovement, remainingMove;
        if ( moveOffset === 0 ) {
            // Special handling - for a no-move we make that into a right and
            // then a left
            currentMovement = Movement.right();
            remainingMove = Movement.left();
        } else {
            // Move a single cell right/left and then move some more
            [ currentMovement, remainingMove ] = moveNormal.splitMovement();
        }

        // Set up the subsequent movements
        const nextState = `${this.#omega}_${remainingMove}_${this.#omega}_${finalState}_${this.#omega}`;
        if ( this.#knownStates[ nextState ] === undefined ) {
            // Does not already exist, need to set up
            this.getState( nextState )
                .addTransition( WILDCARD, NO_CHANGE, remainingMove, finalState );
        }

        // Use the normal multi-match and wild-card handling
        this.#transitions[ oldState ].createSupportedMoveTransition(
            from,
            to,
            currentMovement,
            nextState
        );
    }
    getTransitionDisplay() {
        return new TransitionDisplay( this.#transitions );
    }
    /**
     * @param {Renderer} renderer
     * @returns {RealMachine}
     */
    convertToRealMachine( renderer ) {
        // Default rejection on unhandled
        const DEFAULT_REJECT_TRANSITION = new TransitionResult(
            [ new TapeUpdate( CellContent.fromRaw( EMPTY_CELL ), Movement.right() ) ],
            STATE_REJECT
        );

        return new RealMachine(
            renderer,
            this.#logger,
            this.#startState,
            ( currState, currSym ) => {
                if ( this.#knownStates[ currState ] === undefined ) {
                    this.#logger.warn( `unknown current state ${currState}` );
                    return DEFAULT_REJECT_TRANSITION;
                }
                if ( !this.#machineAlphabets.isValid( currSym ) ) {
                    this.#logger.warn( `transition from invalid ${currSym}` );
                    return DEFAULT_REJECT_TRANSITION;
                }
                const transition = this.#transitions[ currState ].getTransition( currSym );
                if ( transition === undefined ) {
                    this.#logger.warn( `no transition from ${currState} on ${currSym}` );
                    return DEFAULT_REJECT_TRANSITION;
                }
                return transition;
            },
            // Even if we (in the builder) say that we have multiple tapes, if its simulated
            // tell the RealMachine to only use one tape
            ( this.#features.isEnabled( FeatureSet.MULTI_TAPE ) && this.#numTapes !== -1 ) ? this.#numTapes : 1
        );
    }
}

/**
 * Represents the control for a feature being enabled or not by the user
 * from the web output
 */
class FeatureControl {
    /** @type {string} key of FeatureSet */
    #featureKey;
    /** @type {HTMLInputElement} */
    #controlCheckbox;

    constructor( featureKey, controlCheckbox ) {
        this.#featureKey = featureKey;
        this.#controlCheckbox = controlCheckbox;
    }

    /**
     * Disable or reenable the checkbox, so that controls cannot be changed
     * once retrieved.
     * @param {boolean} shouldDisable
     */
    set disabled( shouldDisable ) {
        this.#controlCheckbox.disabled = shouldDisable;
    }


    /**
     * If this feature should be enabled, add it to the feature set
     * @param {FeatureSet} features
     */
    applyToSet( features ) {
        if ( this.#controlCheckbox.checked ) {
            features.enable( this.#featureKey );
        }
    }

    /**
     * Load from a feature set, used for loading stored programs
     * @param {FeatureSet} features
     */
    loadFromSet( features ) {
        this.#controlCheckbox.checked = features.isEnabled( this.#featureKey );
    }

    /**
     * Create the DOM elements to display a feature control, and the actual
     * control class
     *
     * @param {string} featureKey
     * @param {string} featureLabel
     * @param {string} featureDesc
     * @return {Array} first element is the FeatureControl, second is the
     *   HTMLDivElement
     */
    static createForFeature( featureKey, featureLabel, featureDesc ) {
        const controlCheck = document.createElement( 'input' );
        controlCheck.setAttribute( 'type', 'checkbox' );
        // Need an ID to attach the label, featureKey should be unique and valid
        controlCheck.setAttribute( 'id', 'control-' + featureKey );

        const label = document.createElement( 'label' );
        label.setAttribute( 'for', 'control-' + featureKey );
        label.setAttribute( 'title', featureDesc );
        // Set TEXT not HTML just in case
        label.innerText = featureLabel;

        const featureDiv = document.createElement( 'div' );
        featureDiv.classList.add( 'feature-control-wrapper' );
        featureDiv.append( controlCheck, label );

        return [
            new FeatureControl( featureKey, controlCheck ),
            featureDiv
        ];
    }
}

/**
 * Handle display and interaction of all FeatureControl instances
 */
class FeatureControlSet {
    /** @type {FeatureControl[]} */
    #controls;

    /** @type {HTMLDivElement[]} */
    #displays;

    constructor() {
        // Set of feature details - arrays of the key, label, and description
        const featureDetails = [
            [ FeatureSet.MULTIMATCH, 'multimatch (write)', 'Allow matching multiple symbols' ],
            [ FeatureSet.MULTIMATCH_NC, 'multimatch (no-change)', 'Allow transitions to not change the tape' ],
            [ FeatureSet.WILDCARD, 'wildcard', 'Allow fallback/default/wildcard transitions' ],
            [ FeatureSet.MOVE_NONE, 'no-move', 'Allow transitions not to move the head of the tape' ],
            [ FeatureSet.MOVE_MULTI, 'multi-move', 'Allow transitions to move the head of the tape multiple cells' ],
            [ FeatureSet.GADGET_SHIFT, 'gadget: shift', 'Use a gadget to shift cells over' ],
            [ FeatureSet.GADGET_FIRST_CELL_MARKER, 'gadget: marker insertion', 'Use a gadget to insert a first cell marker' ],
            [ FeatureSet.GADGET_INSERT_AFTER_MARKER, 'gadget: after marker', 'Use a gadget to insert content after a marker' ],
            [ FeatureSet.MULTI_TAPE, 'multi-tape', 'Use multiple real tapes' ],
        ];
        // Make sure all of the features are there
        const allFeatureKeys = featureDetails.map( ( d ) => d[0] );
        const allRealFeatures = Object.values( FeatureSet );
        allRealFeatures.forEach(
            rf => {
                if ( !allFeatureKeys.includes( rf ) ) {
                    throw new Error( 'Missing feature control: ' + rf );
                }
            }
        );
        if ( allFeatureKeys.length !== allRealFeatures.length ) {
            throw new Error( 'Mismatch feature keys!' );
        }

        this.#controls = [];
        this.#displays = [];
        featureDetails.forEach(
            ( details ) => {
                const [control, display] = FeatureControl.createForFeature( ...details );
                this.#controls.push( control );
                this.#displays.push( display );
            }
        )
    }

    /**
     * Add all control displays to an element
     * @param {HTMLElement} wrapper
     */
    addControlDisplays( wrapper ) {
        wrapper.append( ...this.#displays );
    }

    /**
     * Get the feature set based on what is toggled. Is NOT reactive, so
     * disables the individual controls
     * @return {FeatureSet}
     */
    extractFeatureSet() {
        const featureSet = new FeatureSet;
        this.#controls.forEach(
            ( control ) => {
                control.disabled = true;
                control.applyToSet( featureSet );
            }
        );
        return featureSet;
    }

    /**
     * Load from a feature set, used for loading stored programs
     * @param {FeatureSet} features
     */
    applyFeatureSet( features ) {
        this.#controls.forEach(
            ( control ) => control.loadFromSet( features )
        );
    }

    /**
     * Enable controls again
     */
    enableControls() {
        this.#controls.forEach(
            ( control ) => control.disabled = false
        );
    }
}

class StoredProgram {
    /** @type {string} */
    #displayName;
    /** @type {FeatureSet} */
    #defaultFeatures;
    /** @type {string} */
    #program;
    /** @type {string} */
    #inputAlphabet;
    /** @type {string} */
    #extraAlphabet;

    /**
     * @param {string} displayName
     * @param {string[]} defaultFeatures
     * @param {string} program
     * @param {string} inputAlphabet
     * @param {string} extraAlphabet
     */
    constructor( displayName, defaultFeatures, program, inputAlphabet, extraAlphabet ) {
        this.#displayName = displayName;
        this.#defaultFeatures = new FeatureSet( defaultFeatures );
        this.#program = program;
        this.#inputAlphabet = inputAlphabet;
        this.#extraAlphabet = extraAlphabet;
    }

    // Public getters - do not modify the objects retrieved!!!

    get displayName() {
        return this.#displayName;
    }
    get defaultFeatures() {
        return this.#defaultFeatures;
    }
    get program() {
        return this.#program;
    }
    get inputAlphabet() {
        return this.#inputAlphabet;
    }
    get extraAlphabet() {
        return this.#extraAlphabet;
    }
}

/**
 * All of the controls for setting up a TM
 */
class DeveloperController {
    /** @type {FeatureControlSet} */
    #featureControls;
    /** @type {HTMLTextAreaElement} */
    #configurationCode;
    /** @type {HTMLTextAreaElement} */
    #inputAlphabet;
    /** @type {HTMLTextAreaElement} */
    #tapeAlphabet;
    /** @type {HTMLButtonElement} */
    #btnLoad;
    /** @type {boolean} */
    #programWasLoaded;
    /** @type {Logger} */
    #logger;
    /** @type {Renderer} */
    #renderer;
    /** @type {MachineRunner} */
    #runner;
    /** @type {HTMLPreElement} */
    #transitionDevDisplay;
    /** @type {Object.<string, StoredProgram>} */
    #knownPrograms;
    /** @type {HTMLButtonElement} */
    #btnLoadStored;
    /** @type {HTMLSelectElement} */
    #storedProgSelector;

    constructor( logger, renderer, runner, transitionDevDisplay, knownPrograms ) {
        this.#logger = logger;
        this.#renderer = renderer;
        this.#runner = runner;
        this.#transitionDevDisplay = transitionDevDisplay;
        this.#featureControls = new FeatureControlSet();
        this.#programWasLoaded = false;

        transitionDevDisplay.innerText = '[Not available until machine is loaded]';

        // Retrieve the various elements
        this.#configurationCode = document.getElementById( 'developer-config-code' );
        this.#inputAlphabet = document.getElementById( 'config-input-alphabet' );
        this.#tapeAlphabet = document.getElementById( 'config-tape-alphabet' );

        this.#btnLoad = document.getElementById( 'config-load-program' );
        this.#btnLoad.addEventListener( 'click', () => this.onLoadToggle() );

        this.#knownPrograms = knownPrograms;

        this.#btnLoadStored = document.getElementById( 'config-load-stored' );
        this.#btnLoadStored.addEventListener( 'click', () => this.onLoadStored() );

        const storedProgSelector = document.getElementById( 'config-stored-selector' );
        Object.entries( knownPrograms ).forEach(
            ( [ progKey, storedProg ], index ) => {
                const currOpt = document.createElement( 'option' );
                currOpt.setAttribute( 'value', progKey );
                currOpt.innerText = storedProg.displayName;
                if ( index === 0 ) {
                    // Select the first stored program
                    currOpt.setAttribute( 'selected', true );
                }
                storedProgSelector.appendChild( currOpt );
            }
        );
        this.#storedProgSelector = storedProgSelector;

        // Need the actual controls in their own div to allow column-count
        // to work properly
        this.#featureControls.addControlDisplays(
            document.getElementById( 'individual-feature-controls' )
        );

        // Start by loading the first stored program!
        this.onLoadStored();
    }

    onLoadStored() {
        // Only can be used when the controls are enabled, so no need to
        // enable everything
        const selectedKey = this.#storedProgSelector.value;
        if ( this.#knownPrograms[ selectedKey ] === undefined ) {
            this.#logger.error( 'Unknown program selected!' );
            return;
        }
        const progToLoad = this.#knownPrograms[ selectedKey ];

        this.#inputAlphabet.value = progToLoad.inputAlphabet;
        this.#tapeAlphabet.value = progToLoad.extraAlphabet;
        this.#configurationCode.value = progToLoad.program;
        this.#featureControls.applyFeatureSet( progToLoad.defaultFeatures );
    }

    onLoadToggle() {
        const elemsToDisable = [
            this.#inputAlphabet,
            this.#tapeAlphabet,
            this.#configurationCode,
            this.#btnLoadStored,
        ];
        if ( this.#programWasLoaded ) {
            // Cancelling the current program to resume editing
            this.#featureControls.enableControls();
            elemsToDisable.forEach( ( e ) => e.disabled = false );
            this.#btnLoad.innerText = 'Load program';
            this.#programWasLoaded = false;
            this.#runner.clearMachine();
            this.#transitionDevDisplay.innerText = '[Not available until machine is loaded]';
            return;
        }
        // Finalized the program
        const features = this.#featureControls.extractFeatureSet();
        elemsToDisable.forEach( ( e ) => e.disabled = true );
        this.#btnLoad.innerText = 'Edit program (clears current execution)';
        this.#programWasLoaded = true;

        const TMMachine = new MachineSimulator(
            this.#logger,
            'qstart',
            features,
            this.#inputAlphabet.value.split( '' ),
            this.#tapeAlphabet.value.split( '' )
        );
        // Make sure the start state is known
        TMMachine.getState( 'qstart' );

        // Expose globals
        window.R = Movement.right;
        window.L = Movement.left;
        window.N = Movement.none();
        try {
            const configureCb = new Function('TM', this.#configurationCode.value );
            configureCb( TMMachine );
        } catch ( e ) {
            this.#logger.error( e );
            // Go back to the editing state
            this.onLoadToggle();
            return;
        }
        const transitionDisplay = TMMachine.getTransitionDisplay();
        this.#transitionDevDisplay.innerText = transitionDisplay.getDeveloperDisplay();
        // If you want to see the LaTeX that generates the display of the
        // original input code, uncomment the following block; define
        // `progName`, `progSpecific`, `progDesc`, `progCompilerView`, and
        // `progLabel` to control extra parts of the output; this is expected
        // to only be useful for Daniel generating the examples in the prose
        /*
        let progName = 'NAME';
        let progDesc = 'DESC';
        let progSpecific = 'SPECIFIC';
        let progLabel = 'NONE';
        let progCompilerView = false;
        let latexCode = transitionDisplay.getLaTeXDisplay();
        latexCode = latexCode.replaceAll( '\u03A9', '\\textomega' );
        const latexProse = latexCode.replaceAll( '\\c', '\\w' );
        if ( progSpecific !== 'SPECIFIC' ) {
            if ( progCompilerView ) {
                progSpecific = '\\textit{compiler view} - ' + progSpecific;
            }
            progName += ` (${progSpecific})`;
        }
        if ( progLabel !== 'NONE' ) {
            progName = '\\label{prog:' + progLabel + '}' + progName;
        }
        const latexHeader = `\\program{${progName}}{\n${progDesc}\n}`
        const displayForLatex = `\n\n${latexHeader}{\n${latexProse}\n}{\n${latexCode}\n}`;
        this.#transitionDevDisplay.innerText += displayForLatex;
        // */
        this.#runner.setMachine( TMMachine.convertToRealMachine( this.#renderer ) );
    }
}

class MachineRunner {
    /** @type {RealMachine|false} */
    #realMachine;
    /** @type {Renderer} */
    #renderer;
    /** @type {HTMLButtonElement} */
    #btnLoadMachine;
    /** @type {HTMLButtonElement} */
    #btnOneStep;
    /** @type {HTMLButtonElement} */
    #btnRunToggle;
    /** @type {HTMLButtonElement} */
    #btnGoBack;
    /** @type {boolean} */
    #currentlyRunning;

    /**
     * @param {HTMLTextAreaElement} machineInput
     * @param {Renderer} renderer
     * @param {HTMLButtonElement} btnLoadMachine
     * @param {HTMLButtonElement} btnOneStep
     * @param {HTMLButtonElement} btnRunToggle
     * @param {HTMLButtonElement} btnGoBack
     */
    constructor( machineInput, renderer, btnLoadMachine, btnOneStep, btnRunToggle, btnGoBack ) {
        // Set up properties
        this.#realMachine = false;
        this.#renderer = renderer;
        this.#btnLoadMachine = btnLoadMachine;
        this.#btnOneStep = btnOneStep;
        this.#btnRunToggle = btnRunToggle;
        this.#btnGoBack = btnGoBack;

        // Set up starting state
        this.clearMachine();

        // Button click handlers
        btnLoadMachine.addEventListener( 'click',
            () => this.#realMachine.loadWithContent( machineInput.value.trim() )
        );
        btnOneStep.addEventListener( 'click', () => this.doOneStep() );
        btnRunToggle.addEventListener( 'click', () => this.onToggleClick() );
        btnGoBack.addEventListener( 'click', () => this.onGoBackClick() );
    }

    clearMachine() {
        this.#realMachine = false;
        this.#currentlyRunning = false;
        this.#btnLoadMachine.disabled = true;
        this.#btnOneStep.disabled = true;
        this.#btnRunToggle.disabled = true;
        this.#btnGoBack.disabled = true;
    }
    setMachine( newMachine ) {
        this.#realMachine = newMachine;
        this.#currentlyRunning = false;
        this.#btnLoadMachine.disabled = false;
        this.#btnOneStep.disabled = false;
        this.#btnRunToggle.disabled = false;
        this.#btnGoBack.disabled = false;
    }

    doOneStep() {
        const result = this.#realMachine.performNextStep();
        this.#btnGoBack.disabled = !this.#renderer.canRestorePriorState;
        if ( result === false ) {
            this.#btnRunToggle.innerText = 'Machine has finished';
            this.#currentlyRunning = false;
            return false;
        }
        return true;
    }

    keepRunning( count ) {
        if ( !this.#currentlyRunning ) {
            return;
        }
        if ( count === undefined ) {
            count = 0;
        }
        if ( !this.doOneStep() ) {
            return;
        }
        // Avoid exceeding call stack by using setTimeout() every so often
        if ( count < 20 ) {
            this.keepRunning( count + 1 );
        } else {
            // repeat after 0ms (can be set to 100ms to make easier to follow)
            setTimeout( () => this.keepRunning(), 0 );
        }
    }

    onToggleClick() {
        if ( this.#currentlyRunning ) {
            this.#btnRunToggle.innerText = 'Run machine to completion';
            this.#currentlyRunning = false;
            this.#btnGoBack.disabled = false;
            return;
        }
        this.#btnRunToggle.innerText = 'Pause machine';
        this.#currentlyRunning = true;
        this.#btnGoBack.disabled = true;
        this.keepRunning();
    }

    onGoBackClick() {
        this.#renderer.doRestorePriorState( this.#realMachine );
        this.#btnGoBack.disabled = !this.#renderer.canRestorePriorState;
        this.#btnRunToggle.innerText = 'Run machine to completion';
    }


};

// Stored programs
const digitReplacementProgram = new StoredProgram(
    'Replace odd digits with `1`s',
    [ FeatureSet.MULTIMATCH, FeatureSet.MULTIMATCH_NC ],
    `TM.getState( 'qstart' )
    .addTransition( EMPTY_CELL , EMPTY_CELL , R, STATE_ACCEPT )
    .addTransition( ['1', '3', '5', '7', '9'], '1' , R, 'qstart' )
    .addTransition( ['2', '4', '6', '8', '0'], NO_CHANGE, R, 'qstart' )`,
    '0123456789',
    ''
);
const letterReplacementProgram = new StoredProgram(
    'Replace letters after the first period',
    [ FeatureSet.MULTIMATCH, FeatureSet.MULTIMATCH_NC, FeatureSet.WILDCARD ],
    `TM.getState( 'qstart' )
    .addTransition( '.' , '.' , R, 'qreplacing' )
    .addTransition( EMPTY_CELL , EMPTY_CELL , R, STATE_REJECT )
    .addTransition( WILDCARD, NO_CHANGE, R, 'qstart' )
TM.getState( 'qreplacing' )
    .addTransition( EMPTY_CELL , EMPTY_CELL , R, STATE_ACCEPT )
    .addTransition( WILDCARD, '.' , R, 'qreplacing' )`,
    'abcdefghijklmnopqrstuvwxyz.',
    ''
);
const findFirstZeroProgram = new StoredProgram(
    'End on the first `0`',
    [ FeatureSet.MULTIMATCH, FeatureSet.MULTIMATCH_NC, FeatureSet.WILDCARD, FeatureSet.MOVE_NONE ],
    `TM.getState( 'qstart' )
    .addTransition( '0' , '0' , N, STATE_ACCEPT )
    .addTransition( EMPTY_CELL , EMPTY_CELL , R, STATE_REJECT )
    .addTransition( WILDCARD, NO_CHANGE, R, 'qstart' )`,
    'abcdefghijklmnopqrstuvwxyz0',
    ''
);
const brainfuckProgram = new StoredProgram(
    'Brainfuck execution',
    Object.values( FeatureSet ),
    `const CELLS_PER_DATA = 2;
const ALL_HEX = [ ...'0123456789ABCDEF' ];
TM.setNumTapes( 5, 'qRun' );
TM.getState( 'qRun' ).addMTapeTransition(
    [ [...'+-<>[],.'], EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
    [ NO_CHANGE, '$', '$', NO_CHANGE, NO_CHANGE ],
    [ N, R, N, R, N ],
    'qFindInput'
);
TM.getState( 'qFindInput' ).addMTapeTransition(
    [ [...'+-<>[],.'], EMPTY_CELL, [ '$', EMPTY_CELL ], EMPTY_CELL, EMPTY_CELL ],
    [ NO_CHANGE, EMPTY_CELL, NO_CHANGE, EMPTY_CELL, EMPTY_CELL ],
    [ R, N, R, N, N ],
    'qFindInput'
).addMTapeTransition(
    [ '!', EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
    [ EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
    [ R, N, R, N, N ],
    'qCopyInput'
).addMTapeTransition(
    [ EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
    [ EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
    // for tape 0 don't move so that qDoSetup can assume EMPTY_CELL
    [ N, N, N, N, N ],
    'qDoSetup'
);

ALL_HEX.forEach(
    char => TM.getState( 'qCopyInput' )
        .addMTapeTransition(
            [ char, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
            [ EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, char, EMPTY_CELL ],
            [ R, N, R, R, N ],
            'qCopyInput'
        )
);
TM.getState( 'qCopyInput' ).addMTapeTransition(
    [ EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
    [ EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
    [ N, N, N, L, N ],
    'qResetInput'
);
TM.getState( 'qResetInput' ).addMTapeTransition(
    [ EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, ALL_HEX, EMPTY_CELL ],
    [ EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, NO_CHANGE, EMPTY_CELL ],
    [ N, N, N, L, N ],
    'qResetInput'
).addMTapeTransition(
    [ EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
    [ EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
    [ L, N, L, N, N ],
    'qDoSetup'
);

TM.getState( 'qDoSetup' )
    .addMTapeTransition(
        [ EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
        [ EMPTY_CELL, ';', EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
        [ N, R(CELLS_PER_DATA + 1), N, N, N ],
        'qWriteDataRight'
    );
TM.getState( 'qWriteDataRight' ).addMTapeTransition(
    [ EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
    [ EMPTY_CELL, '/', EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
    [ N, L, N, N, N ],
    'qWriteDataZero'
);
TM.getState( 'qWriteDataZero' ).addMTapeTransition(
    [ EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
    [ EMPTY_CELL, '0', EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
    [ N, L, N, N, N ],
    'qWriteDataZero'
).addMTapeTransition(
    [ EMPTY_CELL, ';', EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
    [ EMPTY_CELL, ';', EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
    [ N, N, N, N, N ],
    'qFindStart'
);
TM.getState( 'qFindStart' )
    .addMTapeTransition(
        [ [ EMPTY_CELL, ...'+-<>[],.'], ';', EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
        [ NO_CHANGE, ';', EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
        [ L, N, L, N, N ],
        'qFindStart'
    )
    .addMTapeTransition(
        [ [ ...'+-<>[],.'], ';', '$', EMPTY_CELL, EMPTY_CELL ],
        [ NO_CHANGE, ';', '$', EMPTY_CELL, EMPTY_CELL ],
        [ N, N, N, N, N ],
        'qProcess'
    );

TM.getState( 'qProcess' )
    .addMTapeTransition(
        [ [ '+', '-', '>', '[' ], ';', '$', EMPTY_CELL, EMPTY_CELL ],
        [ NO_CHANGE, ';', '$', EMPTY_CELL, EMPTY_CELL ],
        [ N, R, N, N, N ],
        'qBeforeProcess'
    )
    .addMTapeTransition(
        [ '<', ';', '$', EMPTY_CELL, EMPTY_CELL ],
        [ '<', ';', '$', EMPTY_CELL, EMPTY_CELL ],
        [ N, L, N, N, N ],
        'qMoveL'
    )
    .addMTapeTransition(
        [ '.', ';', '$', EMPTY_CELL, EMPTY_CELL ],
        [ '.', ';', '$', EMPTY_CELL, EMPTY_CELL ],
        [ N, R, N, N, N ],
        'qDoPrint'
    )
    .addMTapeTransition(
        [ ',', ';', '$', EMPTY_CELL, EMPTY_CELL ],
        [ ',', ';', '$', EMPTY_CELL, EMPTY_CELL ],
        [ N, R, N, R, N ],
        'qDoRead'
    )
    // UNCONDITIONAL JUMP BACK
    .addMTapeTransition(
        [ ']', ';', '$', EMPTY_CELL, EMPTY_CELL ],
        [ ']', ';', '$', EMPTY_CELL, EMPTY_CELL ],
        [ L, N, R, N, N ],
        'qJumpBack'
    )
    // Program end
    .addMTapeTransition(
        [ EMPTY_CELL, ';', '$', EMPTY_CELL, EMPTY_CELL ],
        [ EMPTY_CELL, ';', '$', EMPTY_CELL, EMPTY_CELL ],
        [ N, N, N, N, N ],
        STATE_ACCEPT
    );

// General utility: after an operation where the data pointer is left in
// the middle of a data cell, go back to the start of that cell and then
// go to process
TM.getState( 'qAfterProcess' )
    .addMTapeTransition(
        [ [...'+-[.,'], ALL_HEX, '$', EMPTY_CELL, EMPTY_CELL ],
        [ NO_CHANGE, NO_CHANGE, '$', EMPTY_CELL, EMPTY_CELL ],
        [ N, L, N, N, N ],
        'qAfterProcess'
    ).addMTapeTransition(
        [ [...'+-[.,'], ';', '$', EMPTY_CELL, EMPTY_CELL ],
        [ NO_CHANGE, ';', '$', EMPTY_CELL, EMPTY_CELL ],
        [ R, N, N, N, N ],
        'qProcess'
    );

// General utility: before an operation where the data pointer needs to start
// at the end of the data cell, find that end and then switch to perform the
// operation (except in the case of moving right where we might be done)
TM.getState( 'qBeforeProcess' )
    .addMTapeTransition(
        [ [ '+', '-', '>', '[' ], ALL_HEX, '$', EMPTY_CELL, EMPTY_CELL ],
        [ NO_CHANGE, NO_CHANGE, '$', EMPTY_CELL, EMPTY_CELL ],
        [ N, R, N, N, N ],
        'qBeforeProcess'
    )
    .addMTapeTransition(
        [ [ '+', '-' ], [ ';', '/' ], '$', EMPTY_CELL, EMPTY_CELL ],
        [ NO_CHANGE, NO_CHANGE, '$', EMPTY_CELL, EMPTY_CELL ],
        [ N, L, N, N, N ],
        'qDoMath'
    )
    // Move right: no extra handling needed
    .addMTapeTransition(
        [ '>', ';', '$', EMPTY_CELL, EMPTY_CELL ],
        [ '>', ';', '$', EMPTY_CELL, EMPTY_CELL ],
        [ R, N, N, N, N ],
        'qProcess'
    )
    // Move right: fill in new cell
    .addMTapeTransition(
        [ '>', '/', '$', EMPTY_CELL, EMPTY_CELL ],
        [ '>', ';', '$', EMPTY_CELL, EMPTY_CELL ],
        [ N, R(CELLS_PER_DATA + 1), N, N, N ],
        'qWriteCellBound'
    )
    .addMTapeTransition(
        [ '[', [ ';', '/' ], '$', EMPTY_CELL, EMPTY_CELL ],
        [ '[', NO_CHANGE, '$', EMPTY_CELL, EMPTY_CELL ],
        [ N, L, N, N, N ],
        'qCheckZero'
    );

// GROUP: ADDITION and SUBTRACTION
ALL_HEX.forEach(
    ( char, idx, arr ) => {
        // Addition; overflow on F->0
        const nextChar = ( char === 'F' ? '0' : arr[idx + 1] );
        const afterAddState = ( char === 'F' ? 'qDoMath' : 'qAfterProcess' );
        TM.getState( 'qDoMath' ).addMTapeTransition(
            [ '+', char, '$', EMPTY_CELL, EMPTY_CELL ],
            [ '+', nextChar, '$', EMPTY_CELL, EMPTY_CELL ],
            [ N, L, N, N, N ],
            afterAddState
        );

        // Subtraction; underflow on 0->F
        const prevChar = ( char === '0' ? 'F' : arr[idx - 1] );
        const afterSubState = ( char === '0' ? 'qDoMath' : 'qAfterProcess' );
        TM.getState( 'qDoMath' ).addMTapeTransition(
            [ '-', char, '$', EMPTY_CELL, EMPTY_CELL ],
            [ '-', prevChar, '$', EMPTY_CELL, EMPTY_CELL ],
            [ N, L, N, N, N ],
            afterSubState
        );
    }
);
// Overflow and underflow
TM.getState( 'qDoMath' ).addMTapeTransition(
    [ [ '+', '-' ], ';', '$', EMPTY_CELL, EMPTY_CELL ],
    [ NO_CHANGE, ';', '$', EMPTY_CELL, EMPTY_CELL ],
    [ N, N, N, N, N ],
    'qAfterProcess'
);

// GROUP: MOVE-R
TM.getState( 'qWriteCellBound' )
    .addMTapeTransition(
        [ '>', EMPTY_CELL, '$', EMPTY_CELL, EMPTY_CELL ],
        [ '>', '/', '$', EMPTY_CELL, EMPTY_CELL ],
        [ N, L, N, N, N ],
        'qFillNewCell'
    );
TM.getState( 'qFillNewCell' )
    .addMTapeTransition(
        [ '>', EMPTY_CELL, '$', EMPTY_CELL, EMPTY_CELL ],
        [ '>', '0', '$', EMPTY_CELL, EMPTY_CELL ],
        [ N, L, N, N, N ],
        'qFillNewCell'
    )
    .addMTapeTransition(
        [ '>', ';', '$', EMPTY_CELL, EMPTY_CELL ],
        [ '>', ';', '$', EMPTY_CELL, EMPTY_CELL ],
        [ R, N, N, N, N ],
        'qProcess'
    );

// GROUP: MOVE-L
TM.getState( 'qMoveL' )
    .addMTapeTransition(
        [ '<', ALL_HEX, '$', EMPTY_CELL, EMPTY_CELL ],
        [ '<', NO_CHANGE, '$', EMPTY_CELL, EMPTY_CELL ],
        [ N, L, N, N, N ],
        'qMoveL'
    )
    .addMTapeTransition(
        [ '<', ';', '$', EMPTY_CELL, EMPTY_CELL ],
        [ '<', ';', '$', EMPTY_CELL, EMPTY_CELL ],
        [ R, N, N, N, N ],
        'qProcess'
    )
    // Handle the first cell
    .addMTapeTransition(
        [ '<', '$', '$', EMPTY_CELL, EMPTY_CELL ],
        [ '<', '$', '$', EMPTY_CELL, EMPTY_CELL ],
        [ N, R, N, N, N ],
        'qMoveL'
    );

// GROUP: MAYBE-JUMP
TM.getState( 'qCheckZero' )
    .addMTapeTransition(
        [ '[', [...'123456789ABCDEF'], '$', EMPTY_CELL, EMPTY_CELL ],
        [ '[', NO_CHANGE, '$', EMPTY_CELL, EMPTY_CELL ],
        [ N, L, N, N, N ],
        'qAfterProcess' // not zero,  go to start of this data cell and process
    )
    .addMTapeTransition(
        [ '[', '0', '$', EMPTY_CELL, EMPTY_CELL ],
        [ '[', '0', '$', EMPTY_CELL, EMPTY_CELL ],
        [ N, L, N, N, N ],
        'qCheckZero'
    )
    .addMTapeTransition(
        [ '[', ';', '$', EMPTY_CELL, EMPTY_CELL ],
        [ '[', ';', '$', EMPTY_CELL, EMPTY_CELL ],
        [ R, N, R, N, N ],
        'qJumpForward'
    );
TM.getState( 'qJumpForward' )
    .addMTapeTransition(
        [ [ ...'+-<>,.'], ';', EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
        [ NO_CHANGE, ';', EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
        [ R, N, N, N, N ],
        'qJumpForward'
    )
    .addMTapeTransition(
        [ '[', ';', EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
        [ '[', ';', EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
        [ R, N, R, N, N ],
        'qJumpForward'
    )
    .addMTapeTransition(
        [ ']', ';', EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
        [ ']', ';', EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
        [ R, N, L, N, N ],
        'qJumpForward'
    )
    // At the closing ] we went right on the code and now we finished and do
    // NOT move so that the subsequent command is processed
    .addMTapeTransition(
        [ [ ...'+-<>[],.'], ';', '$', EMPTY_CELL, EMPTY_CELL ],
        [ NO_CHANGE, ';', '$', EMPTY_CELL, EMPTY_CELL ],
        [ N, N, N, N, N ],
        'qProcess'
    );

// GROUP: UNCONDITIONAL JUMP BACK
TM.getState( 'qJumpBack' )
    .addMTapeTransition(
        [ [ ...'+-<>,.'], ';', EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
        [ NO_CHANGE, ';', EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
        [ L, N, N, N, N ],
        'qJumpBack'
    )
    .addMTapeTransition(
        [ ']', ';', EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
        [ ']', ';', EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
        [ L, N, R, N, N ],
        'qJumpBack'
    )
    .addMTapeTransition(
        [ '[', ';', EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
        [ '[', ';', EMPTY_CELL, EMPTY_CELL, EMPTY_CELL ],
        [ L, N, L, N, N ],
        'qJumpBack'
    )
    // At the closing [ we went left on the code and now we finished and go
    // back right to process that [
    .addMTapeTransition(
        [ [ ...'+-<>[],.'], ';', '$', EMPTY_CELL, EMPTY_CELL ],
        [ NO_CHANGE, ';', '$', EMPTY_CELL, EMPTY_CELL ],
        [ R, N, N, N, N ],
        'qProcess'
    );

// GROUP: PRINTING
ALL_HEX.forEach(
    ( char ) => {
        TM.getState( 'qDoPrint' )
            .addMTapeTransition(
                [ '.', char, '$', EMPTY_CELL, EMPTY_CELL ],
                [ '.', char, '$', EMPTY_CELL, char ],
                [ N, R, N, N, R ],
                'qDoPrint'
            );
    }
)
TM.getState( 'qDoPrint' ).addMTapeTransition(
    [ '.', [ ';', '/'], '$', EMPTY_CELL, EMPTY_CELL ],
    [ '.', NO_CHANGE, '$', EMPTY_CELL, EMPTY_CELL ],
    [ N, L, N, N, N ],
    'qAfterProcess'
);

// GROUP: READING
TM.getState( 'qDoRead' )
    .addMTapeTransition(
        // When there is no more input to read fill in with 0xF
        [ ',', ALL_HEX, '$', EMPTY_CELL, EMPTY_CELL ],
        [ ',', 'F', '$', EMPTY_CELL, EMPTY_CELL ],
        [ N, R, N, N, N ],
        'qDoRead'
    )
    .addMTapeTransition(
        [ ',', [ ';', '/' ], '$', WILDCARD, EMPTY_CELL ],
        [ ',', NO_CHANGE, '$', NO_CHANGE, EMPTY_CELL ],
        [ N, L, N, L, N ],
        'qAfterProcess'
    )
ALL_HEX.forEach(
    ( char ) => {
        TM.getState( 'qDoRead' )
            .addMTapeTransition(
                [ ',', WILDCARD, '$', char, EMPTY_CELL ],
                [ ',', char, '$', EMPTY_CELL, EMPTY_CELL ],
                [ N, R, N, R, N ],
                'qDoRead'
            )
    }
);`,
    '+-<>[],.0123456789ABCDEF!',
    '$;/'
);

document.addEventListener( 'DOMContentLoaded', function () {

// Do not set anything up on the test page; check if this is the right page
// based on one of the required elements, the machine input
if ( document.getElementById( 'machine-input' ) === null ) {
    return;
}

const renderer = new MultiRenderer( [
    new DisplayRenderer(
        document.getElementById( 'machine-current-state' ),
        document.getElementById( 'all-machine-tapes' )
    ),
    new LaTeXRenderer(
        document.getElementById( 'latex-execution-rendering' )
    ),
    new MemoryRenderer(),
] );

const machineInput = document.getElementById( 'machine-input' );

// Runner has all of the logic
const runner = new MachineRunner(
    machineInput,
    renderer,
    document.getElementById( 'machine-load' ),
    document.getElementById( 'machine-step' ),
    document.getElementById( 'machine-run-toggle' ),
    document.getElementById( 'machine-go-back' )
);

// Controls handling is wrapped in a class but all of the logic is handled by
// the constructor of that class, no reference is needed to the created object
new DeveloperController(
    new UserVisibleLogger(),
    renderer,
    runner,
    document.getElementById( 'state-machine-transitions' ),
    {
        'replace-odd': digitReplacementProgram,
        'replace-letters': letterReplacementProgram,
        'find-zero': findFirstZeroProgram,
        'brainfuck': brainfuckProgram,
    }
);

// Allow TAB key to insert tabs or spaces
const addTabHandler = ( textarea, toInsert ) => {
    textarea.addEventListener( 'keydown', function ( e ) {
        if ( e.key !== 'Tab' ) {
            return;
        }
        e.preventDefault();
        // New text: text before selection + (tab/spaces) + text after selection
        const startPos = this.selectionStart;
        const endPos = this.selectionEnd;
        this.value = this.value.substring( 0, startPos )
            + toInsert
            + this.value.substring( endPos );
        // put selection in correct place, after the tab or spaces
        this.selectionStart = startPos + toInsert.length;
        this.selectionEnd = startPos + toInsert.length;
    } );
};
addTabHandler( machineInput, '\t' );
addTabHandler( document.getElementById( 'developer-config-code' ), '    ' );

} );
