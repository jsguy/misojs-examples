/* Sequencediagrams component */
var m = require('mithril');
var SequencediagramsComponent = {
	//	Note: if no controller, mithril assumes we don't want the arguments.
	controller: function(args){
		return args;
	},
	view: function(ctrl) {
		return m("div", {
			config: SequencediagramsComponent.config(ctrl), 
			"class": "diagram"},
			ctrl.value()
		);
	},
	config: function(ctrl) {
		return function(element, isInitialized) {
			if(typeof jQuery !== 'undefined' && typeof jQuery.fn.sequenceDiagram !== 'undefined') {
				if (!isInitialized) {
					$(element).sequenceDiagram({theme: 'hand'});
				}
			} else {
				console.warn('ERROR: You need jQuery and js sequence diagrams in the page');	
			}
		};
	}
};

module.exports = SequencediagramsComponent;