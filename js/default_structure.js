// the "question" variable will be pre-populated by what's typed in the box on the left

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

var itthething_match = [ "&&", itthething, "%%is" ];
var itthethingis_match = [ "&&", itthethingis, "%%is" ];
var itdoesnt_match = [ "&&", itthething, [ "||", [ "&&", isnot, "%%isnt_doing" ], // still broke
				[ "&&", wasnot, "%%wasnt_doing" ], // is it fixed now?
				[ "&&", doesnot, "%%doesnt_do" ], // feature request
			] ];

var thanks_match = [ "||", itthething_match, itthethingis_match, itdoesnt_match];
var whybroke_match = [ "&&", "why", [ "||", "has", is ], itthething, [ "||", broken, "%%broken" ] ];
var whenfix_match = [ "&&", "when", "will", itthething, [ "||", workagain, "%%action" ] ];
var why_doesnot_match = [ "&&", "why", "does", itthething, "not", "%%action" ];
var why_doesnt_match = [ "&&", "why", "doesnt", itthething, "%%action" ];
var whynot_match = ["||", why_doesnot_match, why_doesnt_match];

if(false) {}
else if (answerQuestion(question, thanks_match , "Thanks for letting me know")) {}
else if (answerQuestion(question, whybroke_match , "Who knows, %%thing[s] are funny like that")) {}
else if (answerQuestion(question, whenfix_match , "When will it [%%action | work again]? when it's good and ready!")) {}
else if (answerQuestion(question, whynot_match , "Why would the %%thing %%action? Is it supposed to?")) {}
else { dontKnow() }
