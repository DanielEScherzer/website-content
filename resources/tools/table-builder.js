class TableBuilder {
	table;
	body;
	numRows;
	numCols;

	constructor ( table ) {
		this.table = table;
		
		const tbody = document.createElement( 'tbody' );
		table.append( tbody );
		this.body = tbody;

		this.numCols = 0;
		this.numRows = 0;
	}

	makeCell () {
		const cell = document.createElement( 'td' );
		const textarea = document.createElement( 'textarea' );
		textarea.classList.add( 'cell-input-text' );
		textarea.addEventListener(
			'blur',
			() => textarea.style = ''
		);
		cell.append( textarea );
		return cell;
	}

	addRow () {
		const row = document.createElement( 'tr' );
		for ( let iii = 0; iii < this.numCols; iii++ ) {
			row.append( this.makeCell() );
		}
		this.body.append( row );
		this.numRows++;
	}

	addCol () {
		for ( const row of this.body.children ) {
			row.append( this.makeCell() );
		}
		this.numCols++;
	}

	loadJson ( json ) {
		let obj = JSON.parse( json );
		// Add a row for the column headers
		this.addRow();
		// Add column headers
		// Indexes for data stored in the wrong order
		const map = {};
		obj._columns.forEach(
			( column, idx ) => {
				this.addCol();
				map[ column ] = idx;
				this.body.lastChild.lastChild.lastChild.value = column;
			}
		);
		obj.rows.forEach(
			( row ) => {
				this.addRow();
				for ( const [k, v] of Object.entries( row ) ) {
					const childIndex = map[k];
					this.body.lastChild.children[childIndex].lastChild.value = v;
				}
			}
		);
	}

	exportJson ( target ) {
		const obj = {};

		let first = true;
		for ( const row of this.body.children ) {
			if ( first ) {
				first = false;
				obj._columns = Array.from( row.children ).map(
					( td ) => td.lastChild.value || '-'
				);
				// Created second for ordering
				obj.rows = [];
				continue;
			}
			obj.rows.push(
				Object.fromEntries( 
					Array.from( row.children ).map(
						( td, idx ) => [ obj._columns[idx], td.lastChild.value || '-' ]
					)
				)
			);
		}
		console.log( obj );
		target.innerText = JSON.stringify( obj, null, "\t" );
		if ( (new Set( obj._columns )).size !== obj._columns.length ) {
			alert( "Duplicate column headings, rows only use the first column" );
		}
	}

}


const onLoad = () => {
	// Popup to avoid accidental reloads
	window.onbeforeunload = () => false;

	const target = document.getElementById( 'tool-target' );

	const controls = document.createElement( 'div' );
	controls.setAttribute( 'id', 'builder-controls' );

	const addRowBtn = document.createElement( 'button' );
	addRowBtn.textContent = 'Add row';
	addRowBtn.disabled = true;
	addRowBtn.addEventListener( 'click', () => builder.addRow() );

	const addColBtn = document.createElement( 'button' );
	addColBtn.textContent = 'Add column';
	addColBtn.disabled = true;
	addColBtn.addEventListener( 'click', () => builder.addCol() );

	controls.append( addRowBtn, addColBtn );
	target.append( controls );

	const inputArea = document.createElement( 'textarea' );
	inputArea.setAttribute( 'id', 'json-input' );

	const loadBtn = document.createElement( 'button' );
	loadBtn.innerText = 'Load';

	const tableSurface = document.createElement( 'table' );
	target.append( tableSurface );
	const builder = new TableBuilder( tableSurface );

	const outputArea = document.createElement( 'pre' );
	target.append( outputArea );

	const exportBtn = document.createElement( 'button' );
	exportBtn.setAttribute( 'id', 'btn-export' );
	exportBtn.textContent = 'Export to JSON';
	exportBtn.addEventListener( 'click', () => builder.exportJson( outputArea ) );
	exportBtn.disabled = true;
	controls.append( exportBtn );

	loadBtn.addEventListener(
		'click',
		() => {
			const inputContent = inputArea.value;
			loadBtn.remove();
			inputArea.remove();
			builder.loadJson( inputContent );
			exportBtn.disabled = false;
			addRowBtn.disabled = false;
			addColBtn.disabled = false;
		}
	);

	target.append( inputArea );
	target.append( loadBtn );

	inputArea.value = `{
	"_columns": ["A", "B", "C"],
	"rows": [
		{
			"A": "first-A",
			"B": "first-B",
			"C": "first-C"
		},
		{
			"A": "second-A",
			"B": "second-B",
			"C": "second-C"
		},
		{
			"A": "last-A",
			"B": "last-B",
			"C": "last-C"
		}
	]
}`;
};

document.addEventListener( 'DOMContentLoaded', onLoad );
