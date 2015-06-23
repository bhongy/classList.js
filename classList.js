/**
 * Cross-browser full element.classList implementation for IE9+.
 * Forked from Eli Grey classList.js 2014-12-13
 *
 * -----
 * 
 * Note to self and my colleagues:
 * 
 * Avoid using Minimal classList shim for IE 9 By Devon Govett
 * (https://gist.github.com/devongovett/1381839) - gist rev: Nov 20, 2011
 * There are some issues - e.g. className is not trimmed before being processed
 */

/*global self, document, DOMException */

/*! @source https://github.com/bhongy/classList.js */

// Full polyfill for browsers with no classList support
function runFullPolyfill(view) {

	'use strict';

	// in Browsers `view` should be `window` and it should have
	// `window.Element` (function)  - else this code might be running
	// on a non-browser environment - bail out.
	if ( !( 'Element' in view ) ) return;

	var classListProp  = 'classList',
			elemCtrProto   = view.Element.prototype,
			objCtr         = Object,
			classListProto = ClassList.prototype = [];
			
	// Vendors: please allow content code to instantiate DOMExceptions
	function DOMEx(type, message) {
		this.name    = type;
		this.code    = DOMException[ type ];
		this.message = message;
	}

	// Most DOMException implementations don't allow calling DOMException's toString()
	// on non-DOMExceptions. Error's toString() is sufficient here.
	DOMEx.prototype = Error.prototype;

	function checkTokenAndGetIndex(classList, token) {

		if ( token === '' ) {
			throw new DOMEx(
				'SYNTAX_ERR',
				'An invalid or illegal string was specified'
			);
		}

		if ( /\s/.test(token) ) {
			throw new DOMEx(
				'INVALID_CHARACTER_ERR',
				'String contains an invalid character'
			);
		}

		return Array.prototype.indexOf.call( classList, token );
	}

	function ClassList(elem) {
		var trimmedClasses = String.prototype.trim.call( elem.className || '' ),
				classes = trimmedClasses ? trimmedClasses.split(/\s+/) : [],
				i = 0,
				len = classes.length;

		for ( ; i < len; i++ ) {
			this.push( classes[i] );
		}

		this._updateClassName = function() {

			// `this` is `classListProto` -> classList instance
			elem.className = this.toString();
		};
	}

	function classListGetter() {
		return new ClassList(this);
	}

	classListProto.item = function(i) {
		return this[i] || null;
	};

	classListProto.contains = function(token) {
		token += '';
		return checkTokenAndGetIndex(this, token) !== -1;
	};

	classListProto.add = function() {
		var tokens  = arguments,
				updated = false,
				i = 0,
				l = tokens.length,
				token;

		do {
			token = tokens[i] + '';

			if ( checkTokenAndGetIndex(this, token) === -1 ) {

				// `this` is `classListProto` -> classList instance
				this.push( token );
				updated = true;
			}
		} while ( ++i < l );

		if ( updated ) {
			this._updateClassName();
		}
	};

	classListProto.remove = function() {
		var tokens  = arguments,
				updated = false,
				i = 0,
				l = tokens.length,
				token,
				index;

		do {
			token = tokens[i] + '';
			index = checkTokenAndGetIndex(this, token);

			while ( index !== -1 ) {

				// `this` is `classListProto` -> classList instance
				this.splice(index, 1);
				updated = true;
				index = checkTokenAndGetIndex(this, token);
			}
		} while ( ++i < l );

		if ( updated ) {
			this._updateClassName();
		}
	};

	classListProto.toggle = function(token, force) {
		token += '';

		var hasClass = this.contains(token),
				method;

		// must check `force` against boolean, not truthiness/falsiness
		// `force` false -> remove
		// `force` true  -> add
		if ( typeof force === 'boolean' ) {
			method = force ? 'add' : 'remove';
		} else {
			method = hasClass ? 'remove' : 'add';
		}

		if ( method ) {
			this[ method ]( token );
		}

		// handle return value when calling .toggle

		// if `force` is used, return `force` as the result
		if (force === true || force === false) {
			return force;

		// if `force` is not used, return the result
		} else {
			return !hasClass;
		}
	};

	classListProto.toString = function() {
		return this.join(' ');
	};

	if ( objCtr.defineProperty ) {
		var classListPropDesc = {
			get          : classListGetter,
			enumerable   : true,
			configurable : true
		};

		// TODO:
		//   remove try-catch if pass in modern browsers
		//   since we do not support IE8
		//   keep `objCtr.defineProperty( elemCtrProto, classListProp, classListPropDesc );`

		try {
			objCtr.defineProperty( elemCtrProto, classListProp, classListPropDesc );
		} catch (ex) { // IE 8 doesn't support enumerable: true
			if ( ex.number === -0x7FF5EC54 ) {
				classListPropDesc.enumerable = false;
				objCtr.defineProperty( elemCtrProto, classListProp, classListPropDesc );
			}
		}
	} else if ( objCtr.prototype.__defineGetter__ ) {
		elemCtrProto.__defineGetter__( classListProp, classListGetter );
	}
}  // END: function runFullPolyfill() { ... }

// There is full or partial native classList support, so just check if we need
// to normalize the add/remove and toggle APIs.
function runPartialPolyfill() {

	'use strict';

	var testElement = document.createElement('_');


	// Polyfill for IE 10/11 and Firefox <26, where classList.add and
	// classList.remove exist but support only one argument at a time.

	function createMethod(method) {

		// classList is a type of DOMToketList (inherited)
		var original = DOMTokenList.prototype[method];

		DOMTokenList.prototype[method] = function(token) {
			var i, len = arguments.length;

			// iterate through arguments and call the original method
			for (i = 0; i < len; i++) {
				token = arguments[i];
				original.call(this, token);
			}
		};
	}

	testElement.classList.add('c1', 'c2');

	if ( !testElement.classList.contains('c2') ) {
		createMethod('add');
		createMethod('remove');
	}


	// Polyfill for IE 10 and Firefox <24, where classList.toggle does not
	// support the second argument.
	
	// The toggle method has an optional second argument that will force
	// the class name to be added or removed based on the truthiness
	// of the second argument.

	testElement.classList.toggle('c3', false);

	// if we still have 'c3' class, it means that .toggle works but
	// does not support the second argument (force).
	if ( testElement.classList.contains('c3') ) {
		var _toggle = DOMTokenList.prototype.toggle;

		DOMTokenList.prototype.toggle = function(token, force) {
			var hasSecondArgument = ( typeof arguments[1] !== 'undefined' );

			// if we have class and force truthy OR do not have class
			// and force falsy, do not do anything - just return the `force`
			// Otherwise, toggle it.
			// 
			// *** use `==` to do type coercion - `force` check for truthiness
			if ( hasSecondArgument && this.contains(token) == force ) {
				return force;
			} else {
				return _toggle.call(this, token);
			}
		};
	}

	// should not need to clear value of `testElement`
	// garbage collection should handle correctly
	// testElement = null;

} // END: function runPartialPolyfill() { ... }


// `self` refers to `window` itself in Browsers
// and refers to `global` object in other environments.
if ('document' in self) {
	if ( !( 'classList' in document.createElement('_') ) ) {
		runFullPolyfill(self);
	} else {
		runPartialPolyfill();
	}
}