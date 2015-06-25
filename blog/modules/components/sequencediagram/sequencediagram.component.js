/* Sequencediagrams component */
var m = require('mithril');
var SequencediagramsComponent = {
	//	Note: if no controller, mithril assumes we don't want the arguments.
	controller: function(args){
		return args;
	},
	view: function(ctrl) {
		return m("div",{
				config: SequencediagramsComponent.config(ctrl), 
				"class": "diagram"
			},
			//	We need this to preserve NL and not use &gt;
			m("pre", m.trust(ctrl.value()))
		);
	},
	config: function(ctrl) {
		return function(element, isInitialized) {
			if(typeof Diagram !== 'undefined') {
				if (!isInitialized) {
					var pre = element.firstChild;
					var diagram = Diagram.parse(pre.innerText);
  					diagram.drawSVG(element, {theme: 'hand'});
  					element.removeChild(pre);
				}
			} else {
				console.warn('ERROR: You need js sequence diagrams in the page');
			}
		};
	}
};

module.exports = SequencediagramsComponent;