/* Syntaxify component */
var m = require('mithril');
var SyntaxifyComponent = {
	//	Note: if no controller, mithril assumes we don't want the arguments.
	controller: function(args){
		return args;
	},
	view: function(ctrl) {
		return m("div", {
			config: SyntaxifyComponent.config(ctrl), 
			"data-syntaxify-language": ctrl.language || "markup"},
			ctrl.value()
		);
	},
	config: function(ctrl) {
		return function(element, isInitialized) {
			if(typeof jQuery !== 'undefined' && typeof jQuery.fn.syntaxify !== 'undefined') {
				if (!isInitialized) {
					$(element).syntaxify(element);
				}
			} else {
				console.warn('ERROR: You need jQuery and jquery.syntaxify in the page');	
			}
		};
	}
};

module.exports = SyntaxifyComponent;