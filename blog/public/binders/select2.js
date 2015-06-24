


//	TODO: We need to write this so that it
//	will work on the sever as well.
//
//	Options:
//
//	1. Create a stubbed version for the server that just shows a normal select
//	2. Create a fully server/client compatible version
//	3. Maybe use mithril.elements to create an element for it?

//	Select2 component
//	We assume that both jQuery and Select2 are included in the page.
var Select2 = {
	//this view implements select2's `<select>` progressive enhancement mode
	view: function(ctrl) {
		return m("select", {config: select2.config(ctrl)}, [
			ctrl.data.map(function(item) {
				return m("option", {value: item.id}, item.name)
			})
		]);
	},
	/**
	Select2 config factory. The params in this doc refer to properties of the `ctrl` argument
	@param {Object} data - the data with which to populate the <option> list
	@param {number} value - the id of the item in `data` that we want to select
	@param {function(Object id)} onchange - the event handler to call when the selection changes.
		`id` is the the same as `value`
	*/
	config: function(ctrl) {
		return function(element, isInitialized) {
			var el = $(element);

			if (!isInitialized) {
				//set up select2 (only if not initialized already)
				el.select2()
					//this event handler updates the controller when the view changes
					.on("change", function(e) {
						//integrate with the auto-redrawing system...
						m.startComputation();

						//...so that Mithril autoredraws the view after calling the controller callback
						if (typeof ctrl.onchange == "function"){
							ctrl.onchange(el.select2("val"));
						}

						m.endComputation();
						//end integration
					});
			}

			//update the view with the latest controller value
			el.select2("val", ctrl.value);
		};
	}
};