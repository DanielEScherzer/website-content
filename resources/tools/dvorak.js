// Keyboard is actually qwerty, but I want to touch type dvorak
const TOUCH_TYPE_DVORAK = 'TOUCH_TYPE_DVORAK';

// Keyboard is actually dvorak, but I want to touch type qwerty
const TOUCH_TYPE_QWERTY = 'TOUCH_TYPE_QWERTY';

/**
 * Return an object where the keys are the QWERTY labels and the values are the
 * dvorak keys
 */
const makeConversionMap = () => {
	// Labels on QWERTY
	const letters = [ ...'abcdefghijklmnopqrstuvwxyz' ];
	// Meaning on dvorak
	const thoseMean = [ ..."axje.uidchtnmbrl'poygk,qf;" ];
	const map = {};
	const sub32 = ( char ) => String.fromCharCode( char.charCodeAt(0) - 32 );
	for ( let iii = 0; iii < letters.length; iii++ ) {
		const letter = letters[ iii ];
		const val = thoseMean[ iii ];
		map[ letter ] = val;
		// Upper/lower case
		if ( letter >= 'a' && letter <= 'z' && val >= 'a' && val <= 'z' ) {
			map[ sub32( letter ) ] = sub32( val );
		}
	}
	// Non-letters in one or the other
	const moreQuerty = [ ...'QWEZ-_=+[]{}\'",.<>/?;:' ];
	const moreDvorak = [ ...'"<>:[{]}/=?+-_wvWVzZsS' ];
	for ( let iii = 0; iii < moreQuerty.length; iii++ ) {
		map[ moreQuerty[iii] ] = moreDvorak[ iii ];
	}
	return map;
};
const flipMap = ( original ) => {
	const map = {};
	for ( const [k, v] of Object.entries( original ) ) {
		map[ v ] = k;
	}
	return map;
}

/**
 * Return the overall <div> that holds the radio buttons to change the
 * conversion type; will emit events `update-conversion` with values either
 * `TOUCH_TYPE_DVORAK` or `TOUCH_TYPE_QUERTY`
 */
const makeControls = () => {
	const wrapper = document.createElement( 'div' );
	wrapper.setAttribute( 'id', 'conversion-controls' );


	const ttDvorakRadio = document.createElement( 'input' );
	ttDvorakRadio.setAttribute( 'type', 'radio' );
	ttDvorakRadio.setAttribute( 'name', 'conversion-type' );
	ttDvorakRadio.setAttribute( 'value', TOUCH_TYPE_DVORAK );
	ttDvorakRadio.setAttribute( 'id', 'conversion-type-ttDvorak' );
	ttDvorakRadio.checked = true;
	ttDvorakRadio.addEventListener(
		'input',
		() => {
			const newEvent = new CustomEvent(
				'update-conversion',
				{
					detail: {
						newType: TOUCH_TYPE_DVORAK
					}
				}
			);
			wrapper.dispatchEvent( newEvent );
		}
	);

	const ttDvorakLabel = document.createElement( 'label' );
	ttDvorakLabel.setAttribute( 'for', 'conversion-type-ttDvorak' );
	ttDvorakLabel.innerText = 'Keyboard is QWERTY, I want Dvorak';

	const ttQuertyRadio = document.createElement( 'input' );
	ttQuertyRadio.setAttribute( 'type', 'radio' );
	ttQuertyRadio.setAttribute( 'name', 'conversion-type' );
	ttQuertyRadio.setAttribute( 'value', TOUCH_TYPE_QWERTY );
	ttQuertyRadio.setAttribute( 'id', 'conversion-type-ttQwerty' );
	ttQuertyRadio.addEventListener(
		'input',
		() => {
			const newEvent = new CustomEvent(
				'update-conversion',
				{
					detail: {
						newType: TOUCH_TYPE_QWERTY
					}
				}
			);
			wrapper.dispatchEvent( newEvent );
		}
	);

	const ttQuertyLabel = document.createElement( 'label' );
	ttQuertyLabel.setAttribute( 'for', 'conversion-type-ttQwerty' );
	ttQuertyLabel.innerText = 'Keyboard is Dvorak, I want QWERTY';

	wrapper.append( ttDvorakRadio, ttDvorakLabel );
	wrapper.append( document.createElement( 'br' ) );
	wrapper.append( ttQuertyRadio, ttQuertyLabel );
	return wrapper;
}

const onLoad = () => {
	// Popup to avoid accidental reloads
	window.onbeforeunload = () => false;

	const qwertyToDvorak = makeConversionMap();
	const dvorakToQuerty = flipMap( qwertyToDvorak );
	let currentMap = qwertyToDvorak;
	
	const target = document.getElementById( 'tool-target' );

	const controls = makeControls();
	target.append( controls );

	const inputArea = document.createElement( 'textarea' );

	const convertBtn = document.createElement( 'button' );
	convertBtn.innerText = 'Convert';

	const outputArea = document.createElement( 'textarea' );
	outputArea.setAttribute( 'readonly', true );

	const convert = ( char ) => {
		if ( currentMap[ char ] === undefined ) {
			return char;
		}
		return currentMap[ char ];
	};
	const updateOutput = () => {
		outputArea.value = inputArea.value.split('').map( convert ).join('');
	};

	controls.addEventListener(
		'update-conversion',
		( e ) => {
			currentMap = ( e.detail.newType === TOUCH_TYPE_QWERTY )
				? dvorakToQuerty
				: qwertyToDvorak;
			updateOutput();
		}
	);

	inputArea.addEventListener( 'input', updateOutput );
	convertBtn.addEventListener( 'click', updateOutput );

	target.append( inputArea );
	target.append( convertBtn );
	target.append( outputArea );
};

document.addEventListener( 'DOMContentLoaded', onLoad );
