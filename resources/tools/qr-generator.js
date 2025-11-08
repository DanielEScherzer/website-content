const makeQRImg = ( data ) => {
	const img = document.createElement( 'img' );
	// Figure out size
	let size = '250x250';
	if ( data.length > 400 ) {
		size = '500x500';
	} else if ( data.length > 200 ) {
		size = '300x300';
	}
	img.setAttribute(
		'src',
		'https://api.qrserver.com/v1/create-qr-code/?size=' + size + '&data=' + encodeURIComponent( data )
	);
	return img;
}

/**
 * Return the overall <div> that holds the elements
 */
const makeControls = () => {
	const wrapper = document.createElement( 'div' );
	wrapper.setAttribute( 'id', 'qr-generator-controls' );

	const targetLabel = document.createElement( 'label' );
	targetLabel.setAttribute( 'for', 'qr-generator--target' );
	targetLabel.innerText = 'Target URL:';
	wrapper.append( targetLabel );

	const targetElem = document.createElement( 'input' );
	targetElem.setAttribute( 'type', 'text' );
	targetElem.setAttribute( 'id', 'qr-generator--target' );

	wrapper.append( targetElem );

	const generateBtn = document.createElement( 'button' );
	generateBtn.setAttribute( 'id', 'qr-generator--btn' );
	generateBtn.innerText = 'Generate';

	const emitGeneration = () => {
		const newEvent = new CustomEvent(
			'do-generate',
			{
				detail: {
					url: targetElem.value
				}
			}
		);
		wrapper.dispatchEvent( newEvent );
	};

	generateBtn.addEventListener( 'click', emitGeneration );

	// Listen to the enter key
	targetElem.addEventListener(
		'keypress' ,
		( e ) => {
			if ( e.key === 'Enter' ) {
				emitGeneration();
			}
		}
	);

	wrapper.append( generateBtn );

	return wrapper;
};

const onLoad = () => {
	// Popup to avoid accidental reloads
	window.onbeforeunload = () => false;

	const target = document.getElementById( 'tool-target' );

	const controls = makeControls();
	target.append( controls );

	const outputElem = document.createElement( 'div' );
	outputElem.setAttribute( 'id', 'qr-generator-output' );
	target.append( outputElem );

	const downloadNote = document.createElement( 'p' );
	downloadNote.innerText = 'To download, right click on the image and save the image.';
	downloadNote.innerText += 'You can submit a new URL to generate a new QR code.'

	const downloadNoteHolder = document.createElement( 'div' );
	target.append( downloadNoteHolder );

	controls.addEventListener(
		'do-generate',
		( e ) => {
			// console.log( e );
			// So that a new URL clears the existing image while waiting
			outputElem.replaceChildren();
			outputElem.replaceChildren( makeQRImg( e.detail.url ) )
			if ( downloadNoteHolder.children.length === 0 ) {
				downloadNoteHolder.append( downloadNote );
			}
		}
	);
};

document.addEventListener( 'DOMContentLoaded', onLoad );
