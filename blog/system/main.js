/* NOTE: This is a generated file, please do not modify it, your changes will be lost */var m = require('mithril');var sugartags = require('mithril.sugartags')(m);var bindings = require('mithril.bindings')(m);var animate = require('../public/js/mithril.animate.js')(m);var permissions = require('../system/miso.permissions.js');var layout = require('../mvc/layout.js');var restrict = function(route, actionName){	return route;};var permissionObj = {};var home = require('../mvc/home.js');if(typeof window !== 'undefined') {	window.m = m;}	m.route.mode = 'pathname';m.route(document.getElementById('misoAttachmentNode'), '/', {'/': restrict(home.index, 'home.index')});misoGlobal.renderHeader = function(obj){	m.render(document.getElementById('misoHeaderNode'), layout.headerContent({misoGlobal: obj || misoGlobal}));};misoGlobal.renderHeader();