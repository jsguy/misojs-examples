var m = require('mithril'),
	sugartags = require('mithril.sugartags')(m),
	Select2 = require('../modules/components/select2/select2.component.js'),
	CodeMirror = require('../modules/components/codemirror/codemirror.component.js');
	Syntaxify = require('../modules/components/syntaxify/syntaxify.component.js');

module.exports.index = {
	models: {
		post: function(data){
			var me = this;
			me.title = data.title || "Untitled post";
			me.body = data.body || "";
			return this;
		}
	},

	controller: function(params) {
		var me = this;
		me.posts = [
			{title: "Hello world", body: "Well, here we are."},
			{title: "The 2nd post", body: "Yes, this is the second post."}
		];

		

		//list of users to show
		me.data = [
			{id: 1, name: "John"},
			{id: 2, name: "Mary"},
			{id: 3, name: "Senequia"}
		];
		me.currentUser = m.prop(me.data[1]);
		me.codeMirrorValue = m.prop("for(var x = 0; x < 10; x += 1){\n    console.log(x);\n}");

		return me;
	},
	view: function(ctrl) {
		with(sugartags) {
			return DIV({"class": "cw cf"}, [
				H1("Welcome to the blog!"),

				DIV([
					LABEL("User:"),
					m.component(Select2, {
						data: ctrl.data, 
						value: ctrl.currentUser
					})
				]),

				DIV([
					LABEL("Code mirror:"),
					m.component(CodeMirror, {
						value: ctrl.codeMirrorValue
					})
				]),

				DIV([
					LABEL("Syntaxify:"),
					m.component(Syntaxify, {
						value: ctrl.codeMirrorValue,
						language: "javascript"
					})
				]),

				ctrl.posts.map(function(post){
					return DIV({"class": "post"}, [
						H2(post.title),
						P(post.body),
						HR()
					]);
				}),
				//	We only need this in edit mode
				SCRIPT({src: "external/codemirror/lib/codemirror.js"}),
				LINK({rel: "stylesheet", href:"external/codemirror/lib/codemirror.css"}),
				SCRIPT({src: "external/codemirror/mode/javascript/javascript.js"}),

				//	Add in other bits
				//	TODO: Perhaps add to main lib, or use CDN versions
				SCRIPT({src: "/js/jquery-1.11.2.min.js"}),
				SCRIPT({src: "/external/syntaxify/prism.min.js"}),
				SCRIPT({src: "/external/syntaxify/jquery.syntaxify.js"}),
				LINK({rel: "stylesheet", href:"/external/syntaxify/prism.min.css"}),

				SCRIPT({src: "/external/select2/select2.min.js"}),
				LINK({rel: "stylesheet", href:"/external/select2/select2.min.css"})

			]);
		};
	}
};