function setAppTheme(col) {
	$(".njp-app .njp-header").css("border-top-color", col);
	$(".njp-app .njp-footer").css("border-top-color", col);

	$(".njp-app .njp-content h2").css("color", col);
	$(".njp-app .njp-content h3").css("color", col);
	$(".njp-block-content h3").css("color", col);
	$(".njp-app .njp-list .ui-li-divider").css("color", col);
};

var logstr = "";

function logger(o) {
	// We can switch off the output by commenting this out.
	console.log(o);
	logstr = logstr + o + "\n";
};

function toString(o) {
	// I did have a complex traversal thing, but this does
	return JSON.stringify(o);
};

function objectClone(o) {
	return JSON.parse(JSON.stringify(o));
}

function objectCompare(x, y) {
	return toString(x) == toString(y);
};

function objectMerge(into, from) {
	for (key in from) {
		if (typeof into[key] == "undefined") {
			// merging to an empty slot - easy
			into[key] = from[key];
		} else if (typeof into[key] == "object") {
			// existing slot is an array, so work out what to do - slightly easy
			if (typeof from[key] == "object") {
				// source is also an array so concatentate
				into[key] = into[key].concat(from[key]);
			} else {
				// source is an object, so add it to the existing array
				into[key] = into[key].push(from[key]);
			}
		} else {
			// Exisitng slot is a sigular item, so - awkward
			if (typeof from[key] == "object") {
				// source is an array, so convert locally into an array and concatenate the source
				into[key] = [ into[key] ].concat(from[key]);
			} else {
				// source is an single object, so convert locally into an array and add the source
				into[key] = [ into[key] ].push(from[key]);
			}
		}
	}
};

function treeTraverse(tree, words, log, pad) {
	if (typeof pad == "undefined") {
		pad = "";
	}

	if (log) {
		logger(pad + "treeTraverse('" + tree.join() + "', '" + words.join() + "')");
	}

	var params = {}; // create empty params in case I pull any out of this branch.
	var tests = []; // stores this branches values for the RPN comparison later.
	var func = tree.shift(); // the RPN comparison is at the beginning of the array for ease
	var branch = null;
	var key = null;

	while (branch = tree.shift()) {
		if (typeof branch == "object") {
			var wordsc = objectClone(words);
			// recusion (verb): see recursion.
			// limit scope to just the branch
			var ret = treeTraverse(branch, wordsc, log, pad + "        ");
			tests.push(ret);
			if (ret.outcome == true) {
				// If we sucessfully parsed the branch, consume the words that were used by the parse
				words.length = 0;
				while (word = wordsc.shift()) {
					words.push(word);
				}
			}
		} else if (key = branch.match(/%%(.*)/)) {
			key = key[1];
			var p = {};
			p[key] = words.shift();
			var test = {
			    "outcome" : true,
			    "params" : p
			};
			if (log) {
				logger(pad + "    parsing tokenised leaf: true (" + toString(p) + ")");
			}
			tests.push(test);
		} else {
			var regex = new RegExp("^" + branch + "$", "i");
			var outcome = regex.test(words[0]);
			if (log) {
				logger(pad + "    parsing leaf (/^" + branch + "$/i).test('" + words[0] + "') : " + outcome);
			}

			if (outcome) {
				// This is the recusion end point, if we suceeded, consume a word. if we don't then the tree will empty and overall fail
				words.shift();
			}
			tests.push({
			    "outcome" : outcome,
			    "params" : {}
			});
		}
	}

	var outcome = false;
	if (tests.length > 0) {
		var stests = [];
		outcome = tests[0].outcome;
		for ( var i = 0; i < tests.length; i++) {
			if (func == "&&") {
				outcome = outcome && tests[i].outcome;
			} else if (func == "||") {
				outcome = outcome || tests[i].outcome;
			}
			stests.push(tests[i].outcome);
			if (tests[i].outcome) {
				objectMerge(params, tests[i].params)
				if (log) {
					logger(pad + "    merging params: " + toString(tests[i].params));
				}
			} else {
				if (log) {
					logger(pad + "    skipping params: " + toString(tests[i].params));
				}
			}
		}
		if (log) {
			logger(pad + "    outcome: " + outcome + " (" + stests.join(" " + func + " ") + ") " + toString(params));
		}
	}

	return {
	    "outcome" : outcome,
	    "params" : params
	};
};

function traverse(tree, str, log) {
	// Probably a nicerway of doing this, and the list is not complete, but we don't want to delete all decimal points for example
	var words = str.replace(/'/, "") // delete single quotes for contractions
	.replace(/"/, "") // delete double quotes, just cuz
	.replace(/,/, "") // don't care about pausing
	.replace(/\.$/, "") // remove ending full stop
	.replace(/\?$/, "") // remove ending question mark
	.split(" "); // tokenise

	var ret = treeTraverse(objectClone(tree), words, log);

	if (log) {
		logger(toString(ret));
	}

	if (ret.outcome) {
		return ret.params;
	}
	return null;
};

function performTests(title, match, tests) {
	logger("=============================================================================================");
	logger(title);
	logger("=============================================================================================");
	logger(toString(match));
	for (i in tests) {
		var text = tests[i].text;
		var expect = tests[i].expect;
		if (typeof expect == "string") {
			expect = JSON.parse(expect);
		}
		logger("---------------------------------------------------------------------------------------------");
		var lhs = traverse(match, text);
		if (objectCompare(lhs, expect)) {
			logger("PASSED: " + text);
		} else {
			logger("FAILED: " + text);
			logger("EXPECT: " + toString(expect));
			logger("   GOT: " + toString(lhs));
		}
	}
};

function testfunc() {
	var isnot = [ "||", [ "&&", "is", "not" ], "isnt" ];
	var doesnot = [ "||", [ "&&", "does", "not" ], "doesnt" ];
	var wasnot = [ "||", [ "&&", "was", "not" ], "wasnt" ];
	var the = [ "||", "my", "the" ];
	var is = [ "||", "is", "was" ];
	var getbe = [ "||", "get", "be" ];
	var workagain = [ "||", [ "&&", getbe, "fixed" ], "work" ];
	var itthething = [ "||", "it", [ "&&", the, "%%thing" ] ];
	var itthethingis = [ "||", "its", [ "&&", itthething, "is" ] ];
	var broken = [ "||", "broken?", [ "&&", "not", "working" ] ];

	var match = [];
	var tests = [];

	tests = [];
	match = [ "&&", itthething, [ "||", [ "&&", isnot, "%%isnt_doing" ], // still broke
								[ "&&", wasnot, "%%wasnt_doing" ], // is it fixed now?
								[ "&&", doesnot, "%%doesnt_do" ], // feature request
	] ];
	tests.push({ "text" : "my keyboard does not work", "expect" : '{"thing":"keyboard","doesnt_do":"work"}' });
	tests.push({ "text" : "my phone was not ringing", "expect" : '{"thing":"phone","wasnt_doing":"ringing"}' });
	tests.push({ "text" : "the printer isn't printing", "expect" : '{"thing":"printer","isnt_doing":"printing"}' });
	tests.push({ "text" : "the cable does not reach", "expect" : '{"thing":"cable","doesnt_do":"reach"}' });
	performTests("Thanks for letting me know", match, tests);

	tests = [];
	match = [ "&&", itthething, "%%is" ];
	tests.push({ "text" : "the pen broke", "expect" : '{"thing":"pen","is":"broke"}' });
	tests.push({ "text" : "the cable snapped", "expect" : '{"thing":"cable","is":"snapped"}' });
	tests.push({ "text" : "it sucks", "expect" : '{"is":"sucks"}' });
	performTests("More thanks for letting me know", match, tests);

	tests = [];
	match = [ "&&", itthethingis, "%%is" ];
	tests.push({ "text" : "the pen is broken", "expect" : '{"thing":"pen","is":"broken"}' });
	tests.push({ "text" : "my computer is slow", "expect" : '{"thing":"computer","is":"slow"}' });
	performTests("Even more thanks for letting me know", match, tests);

	tests = [];
	match = [ "&&", "why", [ "||", "has", is ], itthething, [ "||", broken, "%%broken" ] ];
	tests.push({ "text" : "why has the printer broken", "expect" : '{"thing":"printer"}' });
	tests.push({ "text" : "why has my computer crashed", "expect" : '{"thing":"computer","broken":"crashed"}' });
	tests.push({ "text" : "why is it red", "expect" : '{"broken":"red"}' });
	tests.push({ "text" : "why is the network down", "expect" : '{"thing":"network","broken":"down"}' });
	tests.push({ "text" : "why is it not working", "expect" : '{}' });
	performTests("Who knows, %%thing[s] are funny things", match, tests);

	tests = [];
	match = [ "&&", "when", "will", itthething, [ "||", workagain, "%%action" ] ];
	tests.push({ "text" : "when will my computer be fixed", "expect" : '{"thing":"computer"}' });
	tests.push({ "text" : "when will the printer get fixed", "expect" : '{"thing":"printer"}' });
	tests.push({ "text" : "when will the internet work", "expect" : '{"thing":"internet"}' });
	tests.push({ "text" : "when will it fly", "expect" : '{"action":"fly"}' });
	performTests("When will it [%%action | work again]? when it's good and ready", match, tests);

	tests = [];
	match = [ "&&", "why", "does", itthething, "not", "%%action" ];
	tests.push({ "text" : "why does my computer not connect", "expect" : '{"thing":"computer","action":"connect"}' });
	tests.push({ "text" : "why does it not start", "expect" : '{"action":"start"}' });
	// tests.push({ "text": "why does my computer not make me breakfast", "expect": '{"thing":"computer","action":"make me breakfast"}' });
	// tests.push({ "text": "why does my mobile phone not recieve texts", "expect": '{"thing":"mobile phone","action":"recieve texts"}' });
	performTests("Why would the %%thing %%action? Is it supposed to?", match, tests);

	tests = [];
	match = [ "&&", "why", "doesnt", itthething, "%%action" ];
	tests.push({ "text" : "why doesn't my computer work", "expect" : '{"thing":"computer","action":"work"}' });
	tests.push({ "text" : "why doesn't the printer print", "expect" : '{"thing":"printer","action":"print"}' });
	tests.push({ "text" : "why doesn't my phone ring", "expect" : '{"thing":"phone","action":"ring"}' });
	tests.push({ "text" : "why doesn't it work", "expect" : '{"action":"work"}' });
	// never gonna happen becasue of the 2 tokens next ot each other
	// tests.push({ "text": "why doesn't my mobile phone recieve texts", "expect": '{"thing":"mobile phone","action":"recieve texts"}' });
	performTests("[It | the %%thing] doesn't %%action? really?", match, tests);

};

/********************************************************************************************************************************/

var debug = false;
function answerQuestion(question, match, answer) {
	if(question.trim().length == 0) {
		$("#the-answer").text("You'll need to meet me half way, telepathy is not my bag.");
		$("#the-answer-holder").show();
		$("#log").text("No text was entered");
		return true;
	} else {
		var parse = null;
		if(parse = traverse(match, question, debug)) {
			$("#the-answer").text(answer);
			$("#the-answer-holder").show();
			$("#log").text("Tokens:\n" + toString(parse));
			return true;
		}
	}
	return false;
};

function dontKnow() {
	$("#the-answer").text("I don't know.");
	$("#the-answer-holder").show();
	$("#log").text("The question was not understood by the parser");
}

//function autoresize(textarea) {
//    textarea.style.height = '0px';     //Reset height, so that it not only grows but also shrinks
//    textarea.style.height = (textarea.scrollHeight) + 'px';    //Set new height
//}

var editor = null;
$(document).ready(function() {
	setAppTheme("#9c0");
	
	$("#the-question").focus();
	$("#the-question").keyup(function(e) {
		if(e.which === 13){
			$("#ask-the-question").click();
	    }
	});
	
	$("#ask-the-question").click(function () {
		// get the debug status
		var q = $("#the-question").val();
		var ev = "var question = '" + q.replace("'", "\\'") + "';\n" + editor.getValue(); //+ $("#the-structure").val();
		logger(ev);
		eval(ev);
		$("#the-question").focus().select();
	});
	
	$("#perform-tests").on("click", function() {
		$("#the-answer-holder").hide();
		logstr = "";
		testfunc();
		$("#log").text(logstr);
		$("#the-question").focus();
	});
	

//	$('.autosize').keyup(function () {
//	    autoresize(this);
//	});
	
	$.ajax({
	    url : "js/default_structure.js",
	    dataType : "text",
	    success : function(data) {
		    $("#log").text("Loaded default structure.");
		    //$("#the-structure").text(decodeURIComponent(escape(data)));
		    
		    editor = ace.edit("the-structure");
		    editor.setTheme("ace/theme/xcode");
		    editor.getSession().setMode("ace/mode/javascript");
		    editor.setValue(data);
		    editor.setShowPrintMargin(false);
		    editor.gotoLine(0);
		    //$("#the-structure").keyup();
	    },
	    error:  function( jqXHR, textStatus, errorThrown ) {
		    $("#log").text("An error occured while getting default structure: \n." + errorThrown);
	    }
	});
});
 	