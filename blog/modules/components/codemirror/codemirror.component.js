/*
	Codemirror component
*/
var m = require('mithril');
var CodemirrorComponent = {
	//	Note: if no controller, mithril assumes we don't want the arguments.
	controller: function(args){
		return args;
	},
	//	Returns a textarea
	view: function(ctrl) {
		return m("textarea", {config: CodemirrorComponent.config(ctrl)}, ctrl.value());
	},
	config: function(ctrl) {
		return function(element, isInitialized) {
			if(typeof CodeMirror !== 'undefined') {
				if (!isInitialized) {
					var editor = CodeMirror.fromTextArea(element, {
						lineNumbers: true
					});

					editor.on("change", function(instance, object) {
						m.startComputation();
						ctrl.value(editor.doc.getValue());
						if (typeof ctrl.onchange == "function"){
							ctrl.onchange(instance, object);
						}
						m.endComputation();
					});
				}
			} else {
				console.warn('ERROR: You need Codemirror in the page');	
			}
		};
	}
};

module.exports = CodemirrorComponent;