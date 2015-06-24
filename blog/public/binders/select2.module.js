/*
	Select2 component

	This implements Select2's `<select>` progressive enhancement mode, 
	and works on both server and client.

	Note: for client funcitonality we assume that both jQuery and 
	Select2 are included in the page, so you must manually do that.

	Note2: The config is never run server side - it doesn't need to.
*/
var m = require('mithril');
var Select2 = {
	//	Note: if no controller, mithril assumes we don't want the arguments.
	controller: function(args){
		return args;
	},
	//	Returns a select box
	view: function(ctrl) {
		var selectedId = ctrl.value().id;
		return m("select", {config: Select2.config(ctrl)}, [
			ctrl.data.map(function(item) {
				var args = {value: item.id};
				//	Set selected option
				if(item.id == selectedId) {
					args.selected = "selected";
				}
				return m("option", args, item.name);
			})
		]);
	},
	/**
	Select2 config factory. The params in this doc refer to properties of the `ctrl` argument
	@param {Object} data - the data with which to populate the <option> list
	@param {prop} value - the prop of the item in `data` that we want to select
	@param {function(Object id)} onchange - the event handler to call when the selection changes.
		`id` is the the same as `value`
	*/
	config: function(ctrl) {
		return function(element, isInitialized) {
			if(typeof jQuery !== 'undefined' && typeof jQuery.fn.select2 !== 'undefined') {
				var el = $(element);
				if (!isInitialized) {
					el.select2()
						.on("change", function(e) {
							m.startComputation();
							if (typeof ctrl.onchange == "function"){
								ctrl.onchange(el.select2("val"));
							}
							m.endComputation();
						});
				}
				el.val(ctrl.value().id).trigger("change");
			} else {
				console.warn('ERROR: You need jquery and Select2 in the page');	
			}
		};
	}
};

module.exports = Select2;