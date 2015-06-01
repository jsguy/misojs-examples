var m = require('mithril'),
	sugartags = require('mithril.sugartags')(m),
	db = require('../system/api/flatfiledb/api.server.js')(m);

var self = module.exports.index = {
	models: {
        todo: function(data){
            this.text = data.text;
            this.done = m.prop(data.done == "false"? false: data.done);
            this._id = data._id;
        }
    },
	controller: function() {
	    var myTodos = [{text: "Learn miso"}, {text: "Build miso app"}];
	    this.list = Object.keys(myTodos).map(function(key) {
	        return new self.models.todo(myTodos[key]);
	    });
	    return this;
	},
	view: function(ctrl) {
	    return m("div.cw", [
	        m("H1", "Todos"),
	        m("UL", [
	            ctrl.list.map(function(todo){
	                return m("LI", todo.text)
	            })
	        ])
	    ]);
	}
};