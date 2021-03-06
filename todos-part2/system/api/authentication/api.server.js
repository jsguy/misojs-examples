/* NOTE: This is a generated file, please do not modify it, your changes will be lost */
var utils = require('../api.js')().utils;
var miso = require('../../../modules/miso.util.js');
var myApi = require('../authentication/authentication.api.js')(utils);
module.exports = function(m){
	return {
'find': function(){
	var args = Array.prototype.slice.call(arguments, 0),
		errResult,
		errFunc = function(){errResult=arguments; doneFunc()},
		successResult,
		successFunc = function(){successResult=arguments; doneFunc()},
		isReady = false,
		doneFunc = function(){isReady = true;};
	
	args.unshift(successFunc, errFunc);

	myApi['find'].apply(this, args);
	var bindScope = arguments.callee.caller;
	bindScope._misoReadyBinding = miso.readyBinderFactory();
	return { then: function(cb, err){
   var deferred = m.deferred();
		doneFunc = bindScope._misoReadyBinding.bind(function(){
			if(errResult){
				err(errResult);
 			} else {
				cb(miso.response(successResult[0]));
       deferred.resolve(miso.response(successResult[0]));
			}
		});
		if(isReady){
			process.nextTick(doneFunc)
		}
   	return deferred.promise;
	}};
},
'save': function(){
	var args = Array.prototype.slice.call(arguments, 0),
		errResult,
		errFunc = function(){errResult=arguments; doneFunc()},
		successResult,
		successFunc = function(){successResult=arguments; doneFunc()},
		isReady = false,
		doneFunc = function(){isReady = true;};
	
	args.unshift(successFunc, errFunc);

	myApi['save'].apply(this, args);
	var bindScope = arguments.callee.caller;
	bindScope._misoReadyBinding = miso.readyBinderFactory();
	return { then: function(cb, err){
   var deferred = m.deferred();
		doneFunc = bindScope._misoReadyBinding.bind(function(){
			if(errResult){
				err(errResult);
 			} else {
				cb(miso.response(successResult[0]));
       deferred.resolve(miso.response(successResult[0]));
			}
		});
		if(isReady){
			process.nextTick(doneFunc)
		}
   	return deferred.promise;
	}};
},
'remove': function(){
	var args = Array.prototype.slice.call(arguments, 0),
		errResult,
		errFunc = function(){errResult=arguments; doneFunc()},
		successResult,
		successFunc = function(){successResult=arguments; doneFunc()},
		isReady = false,
		doneFunc = function(){isReady = true;};
	
	args.unshift(successFunc, errFunc);

	myApi['remove'].apply(this, args);
	var bindScope = arguments.callee.caller;
	bindScope._misoReadyBinding = miso.readyBinderFactory();
	return { then: function(cb, err){
   var deferred = m.deferred();
		doneFunc = bindScope._misoReadyBinding.bind(function(){
			if(errResult){
				err(errResult);
 			} else {
				cb(miso.response(successResult[0]));
       deferred.resolve(miso.response(successResult[0]));
			}
		});
		if(isReady){
			process.nextTick(doneFunc)
		}
   	return deferred.promise;
	}};
},
'authenticate': function(){
	var args = Array.prototype.slice.call(arguments, 0),
		errResult,
		errFunc = function(){errResult=arguments; doneFunc()},
		successResult,
		successFunc = function(){successResult=arguments; doneFunc()},
		isReady = false,
		doneFunc = function(){isReady = true;};
	
	args.unshift(successFunc, errFunc);

	myApi['authenticate'].apply(this, args);
	var bindScope = arguments.callee.caller;
	bindScope._misoReadyBinding = miso.readyBinderFactory();
	return { then: function(cb, err){
   var deferred = m.deferred();
		doneFunc = bindScope._misoReadyBinding.bind(function(){
			if(errResult){
				err(errResult);
 			} else {
				cb(miso.response(successResult[0]));
       deferred.resolve(miso.response(successResult[0]));
			}
		});
		if(isReady){
			process.nextTick(doneFunc)
		}
   	return deferred.promise;
	}};
},
'login': function(){
	var args = Array.prototype.slice.call(arguments, 0),
		errResult,
		errFunc = function(){errResult=arguments; doneFunc()},
		successResult,
		successFunc = function(){successResult=arguments; doneFunc()},
		isReady = false,
		doneFunc = function(){isReady = true;};
	
	args.unshift(successFunc, errFunc);

	myApi['login'].apply(this, args);
	var bindScope = arguments.callee.caller;
	bindScope._misoReadyBinding = miso.readyBinderFactory();
	return { then: function(cb, err){
   var deferred = m.deferred();
		doneFunc = bindScope._misoReadyBinding.bind(function(){
			if(errResult){
				err(errResult);
 			} else {
				cb(miso.response(successResult[0]));
       deferred.resolve(miso.response(successResult[0]));
			}
		});
		if(isReady){
			process.nextTick(doneFunc)
		}
   	return deferred.promise;
	}};
},
'logout': function(){
	var args = Array.prototype.slice.call(arguments, 0),
		errResult,
		errFunc = function(){errResult=arguments; doneFunc()},
		successResult,
		successFunc = function(){successResult=arguments; doneFunc()},
		isReady = false,
		doneFunc = function(){isReady = true;};
	
	args.unshift(successFunc, errFunc);

	myApi['logout'].apply(this, args);
	var bindScope = arguments.callee.caller;
	bindScope._misoReadyBinding = miso.readyBinderFactory();
	return { then: function(cb, err){
   var deferred = m.deferred();
		doneFunc = bindScope._misoReadyBinding.bind(function(){
			if(errResult){
				err(errResult);
 			} else {
				cb(miso.response(successResult[0]));
       deferred.resolve(miso.response(successResult[0]));
			}
		});
		if(isReady){
			process.nextTick(doneFunc)
		}
   	return deferred.promise;
	}};
},
'findUsers': function(){
	var args = Array.prototype.slice.call(arguments, 0),
		errResult,
		errFunc = function(){errResult=arguments; doneFunc()},
		successResult,
		successFunc = function(){successResult=arguments; doneFunc()},
		isReady = false,
		doneFunc = function(){isReady = true;};
	
	args.unshift(successFunc, errFunc);

	myApi['findUsers'].apply(this, args);
	var bindScope = arguments.callee.caller;
	bindScope._misoReadyBinding = miso.readyBinderFactory();
	return { then: function(cb, err){
   var deferred = m.deferred();
		doneFunc = bindScope._misoReadyBinding.bind(function(){
			if(errResult){
				err(errResult);
 			} else {
				cb(miso.response(successResult[0]));
       deferred.resolve(miso.response(successResult[0]));
			}
		});
		if(isReady){
			process.nextTick(doneFunc)
		}
   	return deferred.promise;
	}};
},
'saveUser': function(){
	var args = Array.prototype.slice.call(arguments, 0),
		errResult,
		errFunc = function(){errResult=arguments; doneFunc()},
		successResult,
		successFunc = function(){successResult=arguments; doneFunc()},
		isReady = false,
		doneFunc = function(){isReady = true;};
	
	args.unshift(successFunc, errFunc);

	myApi['saveUser'].apply(this, args);
	var bindScope = arguments.callee.caller;
	bindScope._misoReadyBinding = miso.readyBinderFactory();
	return { then: function(cb, err){
   var deferred = m.deferred();
		doneFunc = bindScope._misoReadyBinding.bind(function(){
			if(errResult){
				err(errResult);
 			} else {
				cb(miso.response(successResult[0]));
       deferred.resolve(miso.response(successResult[0]));
			}
		});
		if(isReady){
			process.nextTick(doneFunc)
		}
   	return deferred.promise;
	}};
}
	};
};