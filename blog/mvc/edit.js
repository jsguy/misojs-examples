var m = require('mithril'),
	sugartags = require('mithril.sugartags')(m);

var Markdown = require('misojs-markdown-component')({});
var CodeMirror = require('misojs-codemirror-component')();
var SequenceDiagrams = require('misojs-sequencediagrams-component')({});


var Syntaxify = require('../../../misojs-syntaxify-component/syntaxify.component.js')({});


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
		me.codeMirrorValue = m.prop([
			"for(var x = 0; x < 10; x += 1){",
			"    console.log(x);",
			"}"].join("\n"));

		me.sequenceDiagramValue = m.prop([
			"MVC entity->Miso API: Request",
			"Miso API-->Server API: JSONRPC 2.0 request",
			"Server API-->Miso API: JSONRPC 2.0 Response",
			"Miso API->MVC entity: Response"].join("\n")
		);

		me.markdownValue = [
			"## Markdown",
			"The mark-up that likes to get down!",
			"* That",
			"* Is",
			"",
			"Definitely",
			"",
			"1. **Rather**",
			"2. Awesome"].join("\n");

		me.markdownValue2 = [
			"## Markdown2",
			"The mark-up that likes to get down!",
			"* That",
			"* Is",
			"",
			"Definitely",
			"",
			"1. **Rather**",
			"2. Awesome"].join("\n");

		me.markdownValue3 = [
			"## Markdown3",
			"The mark-up that likes to get down!",
			"* That",
			"* Is",
			"",
			"Definitely",
			"",
			"1. **Rather**",
			"2. Awesome"].join("\n");

		return me;
	},
	view: function(ctrl) {
		with(sugartags) {
			return DIV({"class": "cw cf"}, [
				H1("Welcome to the blog!"),

				// DIV([
				// 	LABEL("User:"),
				// 	m.component(Select2, {
				// 		data: ctrl.data, 
				// 		value: ctrl.currentUser
				// 	})
				// ]),

				DIV([
					LABEL("Code mirror:"),
					m.component(CodeMirror, {
						value: ctrl.codeMirrorValue
					})
				]),

				// DIV([
				// 	LABEL("Syntaxify:"),
				// 	m.component(Syntaxify, {
				// 		value: ctrl.codeMirrorValue,
				// 		language: "javascript"
				// 	})
				// ]),



				DIV([
					LABEL("Sequence diagram:"),
					m.component(SequenceDiagrams, {
						value: ctrl.sequenceDiagramValue,
						language: "javascript"
					})
				]),


				DIV([
					LABEL("Markdown render:"),
					m.component(Markdown, {
						value: ctrl.markdownValue
					})
				]),

				m.component(Markdown, {
					value: ctrl.markdownValue2
				}),

				DIV([
					LABEL("Markdown 3 render:"),
					m.component(Markdown, {
						value: ctrl.markdownValue3
					})
				]),

				ctrl.posts.map(function(post){
					return DIV({"class": "post"}, [
						H2(post.title),
						P(post.body),
						HR()
					]);
				}),

			]);
		};
	}
};