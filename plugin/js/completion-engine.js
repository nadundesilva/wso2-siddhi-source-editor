/*
 * Copyright (c) 2014, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var loggerContext = "CompletionEngine";

// Constants used by the engine
var constants = {
    FUNCTIONS: "functions",
    STREAM_PROCESSORS: "streamProcessors",
    WINDOW_PROCESSORS: "windowProcessors"
};

// Suggestion lists used by the engine
var suggestions = {
    logicalOperatorList:    ["and", "or", "not", "in", "is null"].map(function (operator) {
                                return {value: operator, type: "Logical Operator"};
                            }),
    dataTypes:              ["int", "long", "double", "float", "string", "bool", "object"].map(function (dataType) {
                                return {value: dataType, type: "Data Type"};
                            }),
    outputEventTypes:       ["current", "all", "expired"].map(function (eventType) {
                                return {value: eventType};
                            }),
    timeValueTypes:         ["years", "months", "weeks", "days", "hours", "minutes", "seconds", "milliseconds"].map(function (timeValueType) {
                                return {value: timeValueType};
                            })
};

/*
 * Regex strings used by the engine starts here
 */
var regex = {};
regex.comment = "(?:\\/\\*[^\\*]*\\*\\/)|(?:--.*\n)";
regex.identifier = "[a-zA-Z_][a-zA-Z_0-9]*";
regex.namespace = "([^\\(:]*):";
regex.hash = "\\s*#";
regex.comma = ",\\s*";
regex.dataTypes = suggestions.dataTypes.map(function (dataType) {return dataType.value;}).join("|");
regex.functionOperation = regex.identifier + "\\s*\\((?:(?:.(?!\\)))*.\\)|\\))\\s*";

regex.query = {};

regex.query.input = {};
regex.query.input.windowKeywordAndDot= "window\\s*\\.";
regex.query.input.sourceRegex = "(" + regex.identifier + ")\\s*";
regex.query.input.filterRegex = "\\[(?:(?:.(?!\\]))*.\\]|\\])\\s*";
regex.query.input.streamFunctionRegex = regex.hash + "\\s*(?:" + regex.identifier + "\\s*:\\s*)?" + regex.functionOperation;
regex.query.input.windowRegex = "(?:" + regex.hash + "\\s*(?:" + regex.query.input.windowKeywordAndDot + "\\s*)?" + "(?:" + regex.identifier + "\\s*:\\s*)?" + regex.functionOperation + ")?";
regex.query.input.sourceHandlersRegex = "(?:" + regex.query.input.filterRegex + "|" + regex.query.input.streamFunctionRegex + ")*";
regex.query.input.standardStreamRegex = regex.query.input.sourceRegex + regex.query.input.sourceHandlersRegex + regex.query.input.windowRegex + regex.query.input.sourceHandlersRegex;
regex.query.input.patternStreamRegex = "(" + regex.identifier + ")=(" + regex.identifier + ")";

regex.query.selection = {};
regex.query.selection.attribute = "(?:" + regex.identifier + "|" + regex.functionOperation + ")\\s*";
regex.query.selection.attributesList = "(?:" + regex.query.selection.attribute + ")(?:" + regex.comma + regex.query.selection.attribute + ")*";

regex.query.outputRate = {};
regex.query.outputRate.types = "all|first|last";

regex.query.output = {};
regex.query.output.eventTypes = "(?:current|all|expired)\\s+";
/*
 * Regex strings used by the engine ends here
 */

/*
 * Snippets to be used in the ace editor at the start of a statement
 */
var initialSnippets = SiddhiEditor.SnippetManager.parseSnippetFile("#Define Statements\n" +
    "snippet defStream\n" +
    "\tdefine stream ${1:stream_name} (${2:attr1} ${3:Type1}, ${4:attN} ${5:TypeN});\n" +
    "snippet defTable\n" +
    "\tdefine table ${1:table_name} (${2:attr1} ${3:Type1}, ${4:attN} ${5:TypeN});\n" +
    "snippet defFunction\n" +
    "\tdefine function ${1:function_name}[${2:lang_name}] return ${3:return_type} { \n" +
    "\t\t${4:function_body} \n" +
    "\t};\n" +
    "snippet annot-IndexedBy\n" +
    "\t@IndexedBy('${1:attribute_name}')\n" +
    "snippet annot-From\n" +
    "\t@From(eventtable='${1:rdbms}', jdbc.url=${2:'jdbc:mysql://host:3306/db}', username='${3:root}', password='${4:root}', driver.name='${5:com.mysql.jdbc.Driver}', datasource.name='${6:datasource}', table.name='${7:tableName}', cache='${8:lru}', cache.size='${9:3000}')\n" +
    "snippet annot-PlanName\n" +
    "\t@Plan:name(\"${1:Plan_Name}\")\n" +
    "snippet annot-PlanDesc\n" +
    "\t@Plan:Description(\"${1:Plan_Description}\")\n" +
    "snippet annot-PlanStat\n" +
    "\t@Plan:Statistics(\"${1:Plan_Statistics}\")\n" +
    "snippet annot-PlanTrace\n" +
    "\t@Plan:Trace(\"${1:Plan_Trace}\")\n" +
    "snippet annot-Import\n" +
    "\t@Import(\"${1:Stream_ID}\")\n" +
    "snippet annot-Export\n" +
    "\t@Export(\"${1:Stream_ID}\")\n" +
    "snippet annot-Info\n" +
    "\t@info(name = \"${1:Stream_ID}\")\n" +
    "snippet annot-Config\n" +
    "\t@config(async = \'true\')\n" +
    "snippet #window.\n" +
    "\twindow.${1:namespace}:${2:window_name}(${3:args})\n" +
    "snippet query-filter\n" +
    "\tfrom ${1:stream_name}[${2:filter_condition}]\n" +
    "\tselect ${3:attribute1}, ${4:attribute2}\n" +
    "\tinsert into ${5:output_stream}\n" +
    "snippet query-window\n" +
    "\tfrom ${1:stream_name}#window.${2:namespace}:${3:window_name}(${4:args})\n" +
    "\tselect ${5:attribute1}, ${6:attribute2}\n" +
    "\tinsert into ${7:output_stream}\n" +
    "snippet query-window-filter\n" +
    "\tfrom ${1:stream_name}[${2:filter_condition}]#window.${3:namespace}:${4:window_name}(${5:args})\n" +
    "\tselect ${6:attribute1} , ${7:attribute2}\n" +
    "\tinsert into ${8:output_stream}\n" +
    "snippet query-join\n" +
    "\tfrom ${1:stream_name}[${2:filter_condition}]#window.${3:window_name}(${4:args}) as ${5:reference}\n" +
    "\t\tjoin ${6:stream_name}[${7:filter_condition}]#window.${8:window_name}(${9:args}) as ${10:reference}\n" +
    "\t\ton ${11:join_condition}\n" +
    "\t\twithin ${12: time_gap}\n" +
    "\tselect ${13:attribute1}, ${14:attribute2}\n" +
    "\tinsert into ${15:output_stream}\n" +
    "snippet query-pattern\n" +
    "\tfrom every ${1:stream_reference}=${2:stream_name}[${3:filter_condition}] -> \n" +
    "\t\tevery ${4:stream_reference2}=${5:stream_name2}[${6:filter_condition2}]\n" +
    "\t\twithin ${7: time_gap}\n" +
    "\tselect ${8:stream_reference}.${9:attribute1}, ${10:stream_reference}.${11:attribute1}\n" +
    "\tinsert into ${12:output_stream}\n" +
    "snippet query\n" +
    "\tfrom ${1:stream_name}\n" +
    "\tselect ${2:attribute1} , ${3:attribute2}\n" +
    "\tinsert into ${4:output_stream}\n" +
    "snippet partition\n" +
    "\tpartition with (${1:attribute_name} of ${2:stream_name}, ${3:attribute2_name} of ${4:stream2_name})\n" +
    "\tbegin\n" +
    "\t\t${5:query1}\n" +
    "\t\t\n" +
    "\t\t${6:query2}\n" +
    "\t\t\n" +
    "\t\t${7:query3}\n" +
    "\tend;\n"
);

/*
 *   ruleBase has a list of regular expressions to identify the different contexts and appropriate handlers to generate context aware suggestions.
 *
 *   RULES HAVE DIFFERENT FORMAT
 *   ---------------------------
 *
 *          if the suggestions list is a simple keyword list (ex : suggestions list after 'define' keyword)
 *          ------------------------------------------------
 *                 {
 *                    regex : "regularExpression",
 *                    next : [{value: "list", description:"description"} , {value: "of", description:"of"}, {value: "keywords", description:"keywords"}]
 *                 }
 *          "description" attribute is optional.
 *
 *          if the suggestions list dynamically calculated (Ex : suggestions list after the 'from' keyword)
 *          ----------------------------------------------
 *                 {
 *                    regex : "regularExpression",
 *                    next : "CompletionEngine.$FunctionHandler"   // CONVENTION : function name is started with $ mark
 *                 }
 *
 *
 *          if the context cannot be identified using regular expressions ( Ex : nested structures which cannot be identified using regex)
 *          -------------------------------------------------------------
 *                 {
 *                    cfg : "CompletionEngine._checkNestedBrackets", // CONVENTION : function name is started with _
 *                    next : "CompletionEngine.$FunctionHandler"
 *                 }
 */
var ruleBase = [
    {
        regex: "@[^\\(]*$",
        next: [
            'Plan:name(\'Name of the plan\')',
            'Plan:description(\'Description of the plan\')',
            'Plan:trace(\'true|false\')',
            'Plan:statistics(\'true|false\')',
            'Import(\'StreamName\')',
            'Export(\'StreamName\')',
            'Config(async=true)',
            'info(name=\'stream_id\')'
        ]
    },

    /*
     * Definition rules starts here
     */
    {
        regex: "define\\s+[^\\s@]*$",
        next: ["stream ", "table ", "trigger ", "function ", "window "]
    },
    {
        regex: "define\\s+(stream|table|window)\\s+" + regex.identifier + "\\s*\\((\\s*" +
                    regex.identifier + "\\s+(" + regex.dataTypes +  ")\\s*,)*\\s*" +
                    regex.identifier + "\\s+[^\\s" +
                "\\),]*$",
        next: suggestions.dataTypes
    },
    {
        regex: "define\\s+trigger\\s+" + regex.identifier + "\\s+[^\\s]*$",
        next: ["at"]
    },
    {
        regex: "define\\s+trigger\\s+" + regex.identifier + "\\s+at\\s+[^\\s]*$",
        next: ["every"]
    },
    {
        regex: "define\\s+function\\s+" + regex.identifier + "\\s*\\[[^\\s]*(?!\\])$",
        next: ["JavaScript", "R", "Scala"]
    },
    {
        regex: "define\\s+function\\s+" + regex.identifier + "\\s*\\[\\s*[^\\s]*\\s*\\]\\s+[^\\s]*$",
        next: ["return"]
    },
    {
        regex: "define\\s+function\\s+" + regex.identifier + "\\s*\\[\\s*[^\\s]*\\s*\\]\\s+return\\s+[^\\s]*$",
        next: suggestions.dataTypes
    },
    {
        regex: "define\\s+window\\s+" + regex.identifier + "\\s*\\((\\s*" +
                    regex.identifier + "\\s+(" + regex.dataTypes +  ")\\s*,)*\\s*" +
                    regex.identifier + "\\s+(" + regex.dataTypes +  ")\\s*" +
                "\\)\\s+[^\\s:\\(]*$",
        next: "$namespacesAndInBuiltWindowsAndStreamProcessors"
    },
    {
        regex: "define\\s+window\\s+" + regex.identifier + "\\s*\\((?:\\s*" +
                    regex.identifier + "\\s+(?:" + regex.dataTypes +  ")\\s*,)*\\s*" +
                    regex.identifier + "\\s+(?:" + regex.dataTypes +  ")\\s*" +
                "\\)\\s+(" + regex.identifier + "):[^\\s\\(]*$",
        next: "$extensionWindowsAndStreamProcessors"
    },
    {
        regex: "define\\s+window\\s+(" + regex.identifier + ")\\s*\\((\\s*" +
                    regex.identifier + "\\s+(" + regex.dataTypes +  ")\\s*,)*\\s*" +
                    regex.identifier + "\\s+(" + regex.dataTypes +  ")\\s*" +
                "\\)\\s+(" + regex.identifier + ":)?" + regex.identifier + "\\s*\\((\\s*" + regex.identifier + "\\s*,)*\\s*[^\\s\\)]*$",
        next: "$windowDefinitionFunctionOperationParameters"
    },
    {
        regex: "define\\s+window\\s+" + regex.identifier + "\\s*\\((\\s*" +
                    regex.identifier + "\\s+(" + regex.dataTypes +  ")\\s*,)*\\s*" +
                    regex.identifier + "\\s+(" + regex.dataTypes +  ")\\s*" +
                "\\)\\s+(" + regex.identifier + ":)?" + regex.identifier + "\\s*\\(.*\\)\\s+[^\\s]*$",
        next: ["output"]
    },
    {
        regex: "define\\s+window\\s+" + regex.identifier + "\\s*\\((\\s*" +
                    regex.identifier + "\\s+(" + regex.dataTypes +  ")\\s*,)*\\s*" +
                    regex.identifier + "\\s+(" + regex.dataTypes +  ")\\s*" +
                "\\)\\s+(" + regex.identifier + ":)?" + regex.identifier + "\\s*\\(.*\\)\\s+output\\s+[^\\s]*$",
        next: suggestions.outputEventTypes.map(function (completion) {
            return Object.assign({}, completion, {
                value: completion.value + " events;"
            });
        })
    },
    /*
     * Definition rules ends here
     */
    {
        regex: "(from)\\s+((?:.(?!select|group\\s+by|having|output|insert|delete|update))*)" +
                "(?:\\s+(select)\\s+((?:.(?!group\\s+by|having|output|insert|delete|update))*)" +
                    "(?:\\s+(group\\s+by)\\s+((?:.(?!having|output|insert|delete|update))*))?" +
                    "(?:\\s+(having)\\s+((?:.(?!output|insert|delete|update))*))?" +
                ")?" +
                "(?:\\s+(output)\\s+((?:.(?!insert|delete|update))*))?" +
                "(?:\\s+((?:insert\\s+overwrite|delete|update|insert))\\s+((?:.(?!;))*.?))?$",
        next: "$query"
    },
    /*
     * Partition rules starts here
     */
    {
        regex: "partition\\s+[a-zA-Z_0-9]*$",
        next: ["with"]
    },
    {
        regex: "partition\\s+with\\s*((?:.(?!\\s+begin))*.)\\s*(?:(begin))?(?:\\s+((?:.(?!\\s+end))*))?$",
        next: "$partition"
    }
    /*
     * Partition rules ends here
     */
];

// Loading meta data from the server
loadMetaData();

function CompletionEngine() {
    var self = this;

    /*
     * List of streams defined
     */
    self.streamList = {};

    /*
     * List of tables defined
     */
    self.tableList = {};

    /*
     * List of triggers defined
     */
    self.triggerList = {};

    /*
     * List of functions defined
     */
    self.evalScriptList = {};

    /*
     * List of windows defined
     */
    self.windowList = {};

    /*
     * CompletionEngine.wordList is the current suggestions list . This is an array of objects with following format
     * wordList = {
     *       caption: "suggestion name",
     *       value: "suggestion value",
     *       score: 2,
     *       meta: "suggestion type"
     * }
     */
    self.wordList = [];

    // Snippets that had been added to the SnippetManager
    // This is stored so that they can be unregistered when the next suggestion need to be calculated
    self.suggestedSnippets = [];

    // SiddhiCompleter provides language specific suggestions
    self.SiddhiCompleter = {
        getCompletions: function (editor, session, pos, prefix, callback) {
            // Calculate the suggestions list for current context
            // context-handler functions will be updated the the worldList based on the context around the cursor position
            self.calculateCompletions(editor);

            // This completer will be using the wordList array
            callback(null, self.wordList);
        }
    };

    // SnippetCompleter provides language specific snippets
    self.SnippetCompleter = {
        getCompletions: function (editor, session, pos, prefix, callback) {
            var snippetMap = SiddhiEditor.SnippetManager.snippetMap;
            var completions = [];
            SiddhiEditor.SnippetManager.getActiveScopes(editor).forEach(function (scope) {
                var snippets = snippetMap[scope] || [];
                for (var i = snippets.length; i--;) {
                    var s = snippets[i];
                    var caption = s.name || s.tabTrigger;
                    if (!caption) {
                        continue;
                    }
                    completions.push({
                        caption: caption,
                        snippet: s.content,
                        meta: s.tabTrigger && !s.name ? s.tabTrigger + "\u21E5 " : (s.type != undefined ? s.type : "snippet"),
                        docHTML: s.description,
                        type: (s.type != undefined ? s.type : "snippet")
                    });
                }
            }, this);
            callback(null, completions);
        },
        getDocTooltip: function (item) {
            if (item.type == "snippet" && !item.docHTML) {
                item.docHTML = [
                    "<div>", "<strong>", SiddhiEditor.lang.escapeHTML(item.caption), "</strong>", "<p>",
                    SiddhiEditor.lang.escapeHTML(item.snippet), "</p>", "</div>"
                ].join("");
            }
        }
    };


    /*************************************************************************************************************************
     *                                          Integration functions for CompletionEngine
     *************************************************************************************************************************/

    /**
     * Dynamically select the completers suitable for current context
     *
     * @param {Object} editor ace editor instance
     * @returns {Array|*} suitable completer list for current context
     */
    self.adjustAutoCompletionHandlers = function (editor) {
        // This method will dynamically select the appropriate completer for current context when auto complete event occurred.
        // SiddhiCompleter needs to be the first completer in the list as it will update the snippets
        var completerList = [self.SiddhiCompleter, self.SnippetCompleter];

        // Adding keyword completor if the cursor is not in front of dot or colon
        var objectNameRegex = new RegExp(regex.identifier + "\\s*\\.\\s*$", "i");
        var namespaceRegex = new RegExp(regex.identifier + "\\s*:\\s*$", "i");
        var editorText = editor.getValue();
        if (!(objectNameRegex.test(editorText) || namespaceRegex.test(editorText))) {
            completerList.push(SiddhiEditor.langTools.keyWordCompleter);
        }

        editor.completers = completerList;
    };

    /**
     * Calculate the list of suggestions based on the context around the cursor position
     *
     * @param {Object} editor ace editor instance
     */
    self.calculateCompletions = function (editor) {
        var pos = editor.getCursorPosition();   // Cursor position
        var editorText = editor.session.doc.getTextRange(SiddhiEditor.Range.fromPoints({
            row: 0,
            column: 0
        }, pos));                               // All the text before the cursor

        editorText = editorText.replace(new RegExp(regex.comment, "ig"), "");       // Removing comments
        editorText = editorText.replace(/\s+/g, " ");           // Replacing all spaces with single white spaces

        // Get the last statement
        var statementStartToEndKeywordMap = {
            "@": "\\)",
            "define": ";",
            "from": ";",
            "partition": "end\\s*;"
        };
        var currentStatementStartIndex = 0;
        editorTextLoop: for (var i = 0; i < editorText.length; i++) {
            keywordMapLoop: for (var keyword in statementStartToEndKeywordMap) {
                if (statementStartToEndKeywordMap.hasOwnProperty(keyword) &&
                        new RegExp("^" + keyword, "i").test(editorText.substring(i))) {
                    var endKeyword = statementStartToEndKeywordMap[keyword];
                    for (var j = i + new RegExp("^(" + keyword + ")", "i").exec(editorText.substring(i))[1].length; j < editorText.length; j++) {
                        if (new RegExp("^" + endKeyword, "i").test(editorText.substring(j))) {
                            currentStatementStartIndex = j + new RegExp("^(" + endKeyword + ")", "i").exec(editorText.substring(j))[1].length;
                            i = currentStatementStartIndex;
                            break keywordMapLoop;
                        }
                    }
                    break editorTextLoop;
                }
            }
        }
        editorText = editorText.substring(currentStatementStartIndex).replace(/^\s+/, "");

        if (SiddhiEditor.debug) {
            console.warn(loggerContext + ":" + "calculateCompletions" + "->");
            console.log("input text", editorText);
        }

        // Clear the suggestion lists
        SiddhiEditor.SnippetManager.unregister(self.suggestedSnippets, "siddhi");   // Clear the previous snippet suggestions
        self.suggestedSnippets = [];
        self.wordList = [];                                                         // Clear the previous suggestion list

        if (editorText == "") {
            self.$startOfStatement();
            SiddhiEditor.SnippetManager.register(initialSnippets, "siddhi");
        } else {
            SiddhiEditor.SnippetManager.unregister(initialSnippets, "siddhi");
        }

        for (var a = 0; a < ruleBase.length; a++) {
            if (ruleBase[a].hasOwnProperty("cfg")) {
                if (executeLoadSuggestionFunctionByName.call(this, ruleBase[a].cfg, [editorText])) {
                    if (Object.prototype.toString.call(ruleBase[a].next) === '[object Array]') {
                        addCompletions(ruleBase[a].next.map(function (completion) {
                            if (typeof completion == "string") {
                                completion = {value: completion};
                            }
                            return completion;
                        }));
                    } else {
                        executeLoadSuggestionFunctionByName.call(this, ruleBase[a].next, [editorText]);
                    }
                    return;
                }
            } else {
                var ruleRegex = new RegExp(ruleBase[a].regex, "i");
                if (ruleRegex.test(editorText)) {
                    if (SiddhiEditor.debug) {
                        console.warn(loggerContext + ":" + "calculateCompletion" + "->");
                        console.log("Matched regular expression : ", editorText, ruleBase[a]);
                    }

                    if (Object.prototype.toString.call(ruleBase[a].next) === '[object Array]') {
                        addCompletions(ruleBase[a].next.map(function (completion) {
                            if (typeof completion == "string") {
                                completion = {value: completion};
                            }
                            return completion;
                        }));
                    } else {
                        executeLoadSuggestionFunctionByName.call(this, ruleBase[a].next, ruleRegex.exec(editorText));
                    }

                    if (SiddhiEditor.debug) {
                        console.warn(loggerContext + ":" + "calculateCompletion" + "->");
                        console.log("Generated suggestion List", self.wordList);
                    }

                    return;
                }
            }
        }
    };

    /*************************************************************************************************************************
     *                                          Auto completions context-handler functions
     *************************************************************************************************************************/

    /**
     * Load the initial suggestions list
     */
    self.$startOfStatement = function () {
        addCompletions(["define ", "from ", "partition ", "@"].map(function (completion) {
            return {value: completion};
        }));
    };

    /**
     * Load the namespaces of extension windows and stream processors, in-built window names and in-built stream processor names
     */
    self.$namespacesAndInBuiltWindowsAndStreamProcessors = function () {
        addSnippets(getInBuiltWindowProcessors());
        addSnippets(getInBuiltStreamProcessors());
        addSnippets(getExtensionNamesSpaces([constants.WINDOW_PROCESSORS, constants.STREAM_PROCESSORS]));
        addCompletions({value: "window.", priority: 2});
    };

    /**
     * Load the extension windows and stream processors for a namespace
     *
     * @param {Array} args
     */
    self.$extensionWindowsAndStreamProcessors = function (args) {
        var namespace = args[1];
        addSnippets(getExtensionWindowProcessors(namespace));
        addSnippets(getExtensionStreamProcessors(namespace));
    };

    self.$windowDefinitionFunctionOperationParameters = function (args) {
        var stream = args[1];
        if (self.windowList[stream]) {
            addCompletions(Object.keys(self.windowList[stream].attributes).map(function (attribute) {
                return {
                    value: attribute,
                    type: "Attribute"
                }
            }));
        }
    };

    self.$query = function (args) {
        // Find the part of the query in which the cursor is at
        for (var i = args.length - 1; i > 0; i--) {
            if (args[i] != undefined) {
                break;
            }
        }
        switch (args[i - 1]) {
            case "from":
                handleQueryInputSuggestions(args);
                break;
            case "select":
                handleQuerySelectionSuggestions(args);
                break;
            case "group by":
                handleGroupBySuggestions(args);
                break;
            case "having":
                handleHavingSuggestions(args);
                break;
            case "output":
                handleQueryOutputRateSuggestions(args);
                break;
            case "insert":
                handleQueryInsertIntoSuggestions(args);
                break;
            case "insert overwrite":
            case "delete":
            case "update":
                handleQueryInsertOverwriteDeleteUpdateSuggestions(args);
                break;
            default:
        }
    };

    /**
     * Handle the query input suggestions for the query
     *
     * @param {string[]} regexResults Array of groups from the regex execution of the query
     */
    function handleQueryInputSuggestions(regexResults) {
        var queryInput = regexResults[2];

        // Regexps used for identifying the suggestions
        var sourceSuggestionsRegex = new RegExp("(?:" +
                "^[a-zA-Z_0-9]*|" +                                     // Source name at the start of query input
                "\\s+join\\s+(?:[a-zA-Z_0-9]*)?|" +                     // Source name after "join" keyword
                regex.identifier + "\\s*=\\s*(?:[a-zA-Z_0-9]*)?" +      // Source name after "=" in patterns
            ")$", "i");
        var afterHashSuggestionsRegex = new RegExp(regex.query.input.standardStreamRegex + regex.hash + "[^\\(\\.:]*$", "i");
        var streamProcessorExtensionSuggestionsRegex = new RegExp(regex.query.input.standardStreamRegex + regex.hash + regex.namespace + "[^\\(]*$", "i");
        var windowSuggestionsRegex = new RegExp(regex.query.input.standardStreamRegex + regex.hash + "\\s*" + regex.query.input.windowKeywordAndDot + "[^\\(:]*$", "i");
        var windowExtensionSuggestionsRegex = new RegExp(regex.query.input.standardStreamRegex + regex.hash + "\\s*" + regex.query.input.windowKeywordAndDot + regex.namespace + "[^\\(]*$", "i");
        var windowAndStreamProcessorParameterSuggestionsRegex = new RegExp(regex.query.input.standardStreamRegex + "\\s*#" +
            "(?:\\s*" + regex.query.input.windowKeywordAndDot + ")?" +
            "(?:\\s*" + regex.identifier + "\\s*:)?" +
            "\\s*" + regex.identifier + "\\s*\\([^\\)]*$", "i");
        var patternQueryFilterSuggestionsRegex = new RegExp(regex.query.input.patternStreamRegex + "\\[(?:.(?!\\]))*$", "i");
        var nonPatternQueryFilterSuggestionsRegex = new RegExp(regex.query.input.standardStreamRegex + "\\[(?:.(?!\\]))*$", "i");
        var afterStreamSuggestionsRegex = new RegExp(regex.query.input.standardStreamRegex + "\\s+[^\\[#]*$", "i");
        var afterUnidirectionalKeywordSuggestionsRegex = new RegExp(regex.query.input.standardStreamRegex + "\\s+unidirectional\\s+[a-zA-Z_0-9]*$", "i");
        var afterOnKeywordSuggestionsRegex = new RegExp("\\s+on\\s+(?:.(?!\\s+within))*$", "i");
        var afterWithinKeywordSuggestionsRegex = new RegExp("\\s+within\\s+(?:.(?!select|group\\s+by|having|output|insert|delete|update))*$", "i");

        // Testing to find the relevant suggestion
        if (queryInput == "" || sourceSuggestionsRegex.test(queryInput)) {
            addCompletions(Object.keys(self.streamList).map(function (stream) {
                return {
                    value: stream,
                    type: "Stream",
                    priority: 3
                }
            }));
            addCompletions(Object.keys(self.tableList).map(function (table) {
                return {
                    value: table,
                    type: "Event Table",
                    priority: 2
                }
            }));
        } else if (streamProcessorExtensionSuggestionsRegex.test(queryInput)) {
            var namespace = streamProcessorExtensionSuggestionsRegex.exec(queryInput)[1].trim();
            addSnippets(getExtensionStreamProcessors(namespace));
        } else if (windowSuggestionsRegex.test(queryInput)) {
            addSnippets(getInBuiltWindowProcessors());
            addSnippets(getExtensionNamesSpaces([constants.WINDOW_PROCESSORS]).map(function (windowProcessor) {
                return Object.assign({}, windowProcessor, {
                    value: windowProcessor.value + ":"
                });
            }));
        } else if (windowExtensionSuggestionsRegex.test(queryInput)) {
            addSnippets(getExtensionWindowProcessors(windowExtensionSuggestionsRegex.exec(queryInput)[1].trim()));
        } else if (windowAndStreamProcessorParameterSuggestionsRegex.test(queryInput)) {
            addCompletions(getAttributesFromStreamsOrTables(windowAndStreamProcessorParameterSuggestionsRegex.exec(queryInput)[1].trim()));
        } else if (afterUnidirectionalKeywordSuggestionsRegex.test(queryInput)) {
            addCompletions(["join ", "on ", "within "].map(function (suggestion) {
                return {value: suggestion};
            }));
        } else if (afterOnKeywordSuggestionsRegex.test(queryInput)) {
            addAttributesOfStreamsAsCompletionsFromQueryIn(regexResults, 4, 3);
            addCompletions(suggestions.logicalOperatorList.map(function (operator) {
                return Object.assign({}, operator, {
                    priority: 2
                });
            }));
            addCompletions({value: "within ", priority: 3});
        } else if (patternQueryFilterSuggestionsRegex.test(queryInput)) {
            var patternMatch = patternQueryFilterSuggestionsRegex.exec(queryInput);
            addCompletions(getAttributesFromStreamsOrTables(patternMatch[2]));
            addAttributesOfStandardStatefulSourcesAsCompletionsFromQueryIn(regexResults, 3, 2);
        } else if (nonPatternQueryFilterSuggestionsRegex.test(queryInput)) {
            addCompletions(getAttributesFromStreamsOrTables(nonPatternQueryFilterSuggestionsRegex.exec(queryInput)[1].trim()).map(function (suggestion) {
                return {value: suggestion.value + " ", priority: 3};
            }));
            addCompletions(suggestions.logicalOperatorList.map(function (operator) {
                return {value: operator.value + " ", priority: 2};
            }));
        } else if (afterWithinKeywordSuggestionsRegex.test(queryInput)) {
            addCompletions(suggestions.timeValueTypes.map(function (type) {
                return {value: type.value + " ", priority: 2};
            }));
            addCompletions(["select ", "output ", "insert ", "delete ", "update "].map(function (completion) {
                return {value: completion, priority: 2};
            }));
        } else if (afterStreamSuggestionsRegex.test(queryInput)) {
            var completions = [{value: "#"}];
            if (/\s+[^\[#]*$/i.test(queryInput)) {
                completions = completions.concat(
                    [
                        "join ", "left outer join ", "right outer join ", "full outer join ", "on ",
                        "unidirectional ", "within ", "select ", "output ", "insert ", "delete ", "update "
                    ].map(function (completion) {
                        return {value: completion};
                    })
                );
            }
            addCompletions(completions);
        } else if (afterHashSuggestionsRegex.test(queryInput)) {
            addSnippets(getInBuiltStreamProcessors().map(function (suggestion) {
                return Object.assign({}, suggestion, {
                    priority: 3
                });
            }));
            addSnippets(getExtensionNamesSpaces([constants.STREAM_PROCESSORS]).map(function (suggestion) {
                return Object.assign({}, suggestion, {
                    value: suggestion.value + ":",
                    priority: 3
                });
            }));
            if (new RegExp(regex.query.input.sourceRegex + regex.query.input.sourceHandlersRegex + regex.hash + "[^\\(\\.:]*$", "i").test(queryInput)) {
                // Only one window can be applied for a stream
                addCompletions({value: "window.", priority: 2});
            }
        }
    }

    /**
     * Handle the query section suggestions for the query
     *
     * @param {string[]} regexResults Array of groups from the regex execution of the query
     */
    function handleQuerySelectionSuggestions(regexResults) {
        var querySelectionClause = regexResults[4];

        // Regexps used for identifying the suggestions
        var extensionFunctionSuggestionsRegex = new RegExp(regex.query.selection.attributesList + regex.comma + regex.namespace + "[a-zA-Z_0-9]*$", "i");
        var afterQuerySectionClauseSuggestionsRegex = new RegExp(regex.query.selection.attributesList + "\\s+[a-zA-Z_0-9]*$", "i");
        var generalSuggestionsRegex = new RegExp("(?:" +
            regex.query.selection.attributesList + regex.comma + "[a-zA-Z_0-9]*(?:\\s*\\((?:(?:.(?!\\)))*.)?\\s*)?|" +
            "^" + regex.identifier + ")$", "i");

        // Testing to find the relevant suggestion
        if (extensionFunctionSuggestionsRegex.test(querySelectionClause)) {
            var namespace = extensionFunctionSuggestionsRegex.exec(querySelectionClause)[0];
            addSnippets(getExtensionFunctionNames(namespace));
        } else if (afterQuerySectionClauseSuggestionsRegex.test(querySelectionClause)) {
            addCompletions(["as", "group by ", "having ", "output ", "insert ", "delete ", "update "].map(function (completion) {
                return {value: completion};
            }));
        } else if (querySelectionClause == "" || generalSuggestionsRegex.test(querySelectionClause)) {
            addAttributesOfStreamsAsCompletionsFromQueryIn(regexResults, 3, 2);
            addAttributesOfStandardStatefulSourcesAsCompletionsFromQueryIn(regexResults, 3, 2);
            addSnippets(getExtensionNamesSpaces([constants.FUNCTIONS]).map(function (suggestion) {
                suggestion.value = suggestion.value + ":";
                return suggestion;
            }));
            addSnippets(getInBuiltFunctionNames());
        }
    }

    /**
     * Handle the query section group by suggestions for the query
     *
     * @param {string[]} regexResults Array of groups from the regex execution of the query
     */
    function handleGroupBySuggestions(regexResults) {
        var groupByClause = regexResults[6];

        // Regexps used for identifying the suggestions
        var afterGroupByClauseRegex = new RegExp("(?:" + regex.identifier + "\\s*)(?:" + regex.comma + regex.identifier + "\\s*)*" + "\\s+[a-zA-Z_0-9]*$", "i");
        var generalSuggestionsRegex = new RegExp("(?:" + regex.identifier + "\\s*" + regex.comma + ")*", "i");

        // Testing to find the relevant suggestion
        if (afterGroupByClauseRegex.test(groupByClause)) {
            addCompletions(["having ", "output ", "insert ", "delete ", "update "].map(function (completion) {
                return {value: completion, priority: 2};
            }));
        } else if (generalSuggestionsRegex.test(groupByClause)) {
            addAttributesOfStreamsAsCompletionsFromQueryIn(regexResults, 3, 2);
            addAttributesOfStandardStatefulSourcesAsCompletionsFromQueryIn(regexResults, 3, 2);
        }
    }

    /**
     * Handle the having suggestions for the query
     *
     * @param {string[]} regexResults Array of groups from the regex execution of the query
     */
    function handleHavingSuggestions(regexResults) {
        var havingClause = regexResults[8];

        // Regexps used for identifying the suggestions
        var afterHavingClauseRegex = new RegExp("\\s+[a-zA-Z_0-9]*$");

        // Testing to find the relevant suggestion
        if (afterHavingClauseRegex.test(havingClause)) {
            addCompletions(["output ", "insert ", "delete ", "update "].map(function (completion) {
                return {value: completion, priority: 2};
            }));
        }
        addAttributesOfStreamsAsCompletionsFromQueryIn(regexResults, 3, 2);
        addAttributesOfStandardStatefulSourcesAsCompletionsFromQueryIn(regexResults, 3, 2);
        addCompletions(suggestions.logicalOperatorList.map(function (suggestion) {
            return Object.assign({}, suggestion, {
                priority: 2
            });
        }));
    }

    /**
     * Handle the query output rate suggestions for the query
     *
     * @param {string[]} regexResults Array of groups from the regex execution of the query
     */
    function handleQueryOutputRateSuggestions(regexResults) {
        var outputRateClause = regexResults[10];

        // Regexps used for identifying the suggestions
        var afterHalfTypedKeywordSuggestionsRegex = new RegExp("^[a-zA-Z]*$", "i");
        var everyKeywordSuggestionsRegex = new RegExp("^(?:" + regex.query.outputRate.types + "|snapshot)\\s+[a-zA-Z]*$", "i");
        var afterOutputRateClauseSuggestionsRegex = new RegExp("^(?:" +
                "(?:" + regex.query.outputRate.types + ")?|" +
                "(?:(?:" + regex.query.outputRate.types + ")?|snapshot)" +
            ")\\s+every\\s+[0-9]*\\s+" + regex.identifier + "\\s+[a-zA-Z]*$", "i");
        var timeValueSuggestionsRegex = new RegExp("^(?:(?:" + regex.query.outputRate.types + ")?|snapshot)\\s+every\\s+[0-9]*\\s+[a-zA-Z]*$", "i");
        var eventKeywordSuggestionRegex = new RegExp("^(?:" + regex.query.outputRate.types + ")?\\s+every\\s+[0-9]*\\s+[a-zA-Z]*$", "i");

        // Testing to find the relevant suggestion
        if (outputRateClause == "" || afterHalfTypedKeywordSuggestionsRegex.test(outputRateClause)) {
            addCompletions(["snapshot every ", "all every ", "last every ", "first every ", "every "].map(function (completion) {
                return {value: completion};
            }));
        } else if (everyKeywordSuggestionsRegex.test(outputRateClause)) {
            addCompletions({value: "every "});
        } else if (afterOutputRateClauseSuggestionsRegex.test(outputRateClause)) {
            addCompletions(["insert ", "delete ", "update "].map(function (completion) {
                return {value: completion};
            }));
        } else {
            if (timeValueSuggestionsRegex.test(outputRateClause)) {
                addCompletions(suggestions.timeValueTypes);
            }
            if (eventKeywordSuggestionRegex.test(outputRateClause)) {
                addCompletions({value: "events"});
            }
        }
    }

    /**
     * Handle the query insert into suggestions for the query
     *
     * @param {string[]} regexResults Array of groups from the regex execution of the query
     */
    function handleQueryInsertIntoSuggestions(regexResults) {
        var streamOutputClause = regexResults[12];

        // Regexps used for identifying the suggestions
        var afterHalfTypedKeywordSuggestionsRegex = new RegExp("^[a-zA-Z]*$", "i");
        var afterOutputEventTypesSuggestionRegex = new RegExp("^(?:" +regex.query.output.eventTypes + ")?events\\s+[a-zA-Z]*$", "i");
        var afterIntoKeywordSuggestionsRegex = new RegExp("^(?:(?:" + regex.query.output.eventTypes + ")?events\\s+)?into\\s+[a-zA-Z]*$", "i");
        var afterQuerySuggestionsRegex = new RegExp("^(?:(?:" + regex.query.output.eventTypes + ")?events\\s+)?into\\s+" + regex.identifier + "\\s*(?:;)?\\s+[a-zA-Z]*$", "i");

        // Testing to find the relevant suggestion
        if (streamOutputClause == "" || afterHalfTypedKeywordSuggestionsRegex.test(streamOutputClause)) {
            addCompletions(suggestions.outputEventTypes.map(function (completion) {
                return Object.assign({}, completion, {
                    value: completion.value + " events into "
                });
            }));
            addCompletions(["into ", "overwrite "].map(function (completion) {
                return {value: completion};
            }));
        } else if (afterOutputEventTypesSuggestionRegex.test(streamOutputClause)) {
            addCompletions({value: "into "});
        } else if (afterIntoKeywordSuggestionsRegex.test(streamOutputClause)) {
            addCompletions(Object.keys(self.streamList).map(function (stream) {
                return {
                    caption: stream,
                    value: stream + ";",
                    type: "Stream"
                }
            }));
            addCompletions(Object.keys(self.tableList).map(function (table) {
                return {
                    caption: table,
                    value: table + ";",
                    type: "Event Table"
                }
            }));
        } else if (afterQuerySuggestionsRegex.test(streamOutputClause)) {
            handleEndOfPartitionCheck(regexResults);
        }
    }

    /**
     * Handle the query output to table suggestions for the query
     *
     * @param {string[]} regexResults Array of groups from the regex execution of the query
     */
    function handleQueryInsertOverwriteDeleteUpdateSuggestions(regexResults) {
        var tableOutputClause = regexResults[12];

        // Regexps used for identifying the suggestions
        var afterHalfTypedKeywordSuggestionsRegex = new RegExp("^[a-zA-Z]*$", "i");
        var eventTypeSuggestionsRegex = new RegExp("^" + regex.identifier + "\\s+[a-zA-Z]*$", "i");
        var afterForKeywordSuggestionsRegex = new RegExp("^" + regex.identifier + "\\s+" +
                "for\\s+[a-zA-Z]*$", "i");
        var eventsKeywordSuggestionsRegex = new RegExp("^" + regex.identifier + "\\s+" +
                "for\\s+" + regex.query.output.eventTypes + "[a-zA-Z]*$", "i");
        var onKeywordSuggestionsRegex = new RegExp("^" + regex.identifier + "\\s+" +
                "(?:for\\s+(?:" + regex.query.output.eventTypes + ")?events\\s+)?[a-zA-Z]*$", "i");
        var afterOnKeywordSuggestionsRegex = new RegExp("^" + regex.identifier + "\\s+" +
                "(?:for\\s+(?:" + regex.query.output.eventTypes + ")?events\\s+)?" +
                "on\\s+(?!;)(?:.(?!;))*$", "i");

        // Testing to find the relevant suggestion
        if (tableOutputClause == "" || afterHalfTypedKeywordSuggestionsRegex.test(tableOutputClause)) {
            addCompletions(Object.keys(self.tableList).map(function (table) {
                return {
                    value: table + " ",
                    type: "Event Table"
                }
            }));
        } else if (eventTypeSuggestionsRegex.test(tableOutputClause)) {
            addCompletions(suggestions.outputEventTypes.map(function (completion) {
                return Object.assign({}, completion, {
                    value: "for " + completion.value + " events on "
                });
            }));
        } else if (afterForKeywordSuggestionsRegex.test(tableOutputClause)) {
            addCompletions(suggestions.outputEventTypes.map(function (completion) {
                return Object.assign({}, completion, {
                    value: completion.value + " events on "
                });
            }));
        } else if (eventsKeywordSuggestionsRegex.test(tableOutputClause)) {
            addCompletions({value: "events "});
        } else if (afterOnKeywordSuggestionsRegex.test(tableOutputClause)) {
            addAttributesOfStreamsAsCompletionsFromQueryIn(regexResults, 3, 2);
            addCompletions(suggestions.logicalOperatorList.map(function (suggestion) {
                return Object.assign({}, suggestion, {
                    priority: 2
                });
            }));
            handleEndOfPartitionCheck(regexResults);
        }
        if (onKeywordSuggestionsRegex.test(tableOutputClause)) {
            addCompletions({value: "on "});
        }
    }

    /**
     * Add "end" keyword after checking for end of partition
     *
     * @param {string[]} regexResults Array of groups from the regex execution of the query
     */
    function handleEndOfPartitionCheck(regexResults) {
        // Regexps used for identifying the suggestions
        var endOfPartitionRegex = new RegExp("partition\\s+with\\s+(?:.(?!\\s+begin))*.\\s+begin\\s+(?:.(?!\\s+end))*.$", "i");

        // Testing to find the relevant suggestion
        if (endOfPartitionRegex.test(regexResults.input)) {
            addCompletions({value: "end;"});
        }
    }

    /**
     * add attributes of standard stateful sources in patterns in query
     *
     * @param {string[]} regexResults Array of groups from the regex execution of the query
     * @param {int} attributePriority priority to be set as attribute priority
     * @param {int} streamPriority priority to be set as stream priority
     */
    function addAttributesOfStandardStatefulSourcesAsCompletionsFromQueryIn(regexResults, attributePriority, streamPriority) {
        var queryInput = regexResults[2];
        var standardStatefulSourceSearchRegex = new RegExp(regex.query.input.patternStreamRegex, "ig");
        var eventToStreamMap = [];
        var standardStatefulSourceMatch;
        while(standardStatefulSourceMatch = standardStatefulSourceSearchRegex.exec(queryInput)) {
            eventToStreamMap[standardStatefulSourceMatch[1]] = standardStatefulSourceMatch[2];
        }
        addAttributesOfStreamReferencesAsCompletions(regexResults, eventToStreamMap, attributePriority, streamPriority);
    }

    /**
     * add attributes in the streams or tables in the query
     *
     * @param {string[]} regexResults Array of groups from the regex execution of the query
     * @param {int} attributePriority priority to be set as attribute priority
     * @param {int} streamPriority priority to be set as stream priority
     */
    function addAttributesOfStreamsAsCompletionsFromQueryIn(regexResults, attributePriority, streamPriority) {
        var queryInput = regexResults[2];
        var queryInStreams = [];
        var streamFinderRegex = new RegExp(regex.query.input.standardStreamRegex, "ig");
        var streamMatch;
        while (streamMatch = streamFinderRegex.exec(queryInput)) {
            if (["join", "every"].indexOf(streamMatch[1]) == -1) {
                queryInStreams.push(streamMatch[1]);
            }
        }
        addAttributesOfStreamsAsCompletions(regexResults, queryInStreams, attributePriority, streamPriority);
    }

    self.$partition = function (regexResults) {
        var partitionConditionStatement = regexResults[1];
        var partitionBody = regexResults[3];

        var unclosedBracketsCount = 0;
        for (var i = 0; i < partitionConditionStatement.length; i++) {
            if (partitionConditionStatement.charAt(i) == "(") {
                unclosedBracketsCount++;
            } else if (partitionConditionStatement.charAt(i) == ")") {
                unclosedBracketsCount--;
            }
        }

        if (partitionBody && /;\s*$/.test(partitionBody)) {
            addCompletions({value: "\nend;", caption: "end"});
        } else if (unclosedBracketsCount == 0 && /\)\s*[a-zA-Z_0-9]*/.test(partitionConditionStatement)) {
            var completionPrefix = "";
            if (partitionConditionStatement.charAt(partitionConditionStatement.length - 1) == ")") {
                completionPrefix = "\n";
            }
            addCompletions({value: completionPrefix + "begin\n\t", caption: "begin"});
        } else if (unclosedBracketsCount == 1) {
            // Regexps used for identifying the suggestions
            var beforeOfKeywordSuggestionRegex = new RegExp("^\\s*\\((?:.(?!\\s+of))*.\\s+[a-zA-Z_0-9]*$", "i");
            var afterOfKeywordSuggestionRegex = new RegExp("^\\s*\\((?:.(?!\\s+of))*.\\s+of\\s+[a-zA-Z_0-9]*$", "i");

            // Testing to find the relevant suggestion
            if (beforeOfKeywordSuggestionRegex.test(partitionConditionStatement)) {
                addAllAttributesInExecutionPlanAsCompletions(4, 3);
                if (new RegExp("\s+$", "i")) {
                    addCompletions([{value: "of "}, {value: "as "}, {value: "or ", type: "Logical Operator"}]);
                }
            } else if (afterOfKeywordSuggestionRegex) {
                var streamAttributeSearchRegex = new RegExp("([a-zA-Z_0-9]+)\\s*(?:<|>|=|!){1,2}\\s*[a-zA-Z_0-9]+\\s+(?:as|of)", "ig");

                var attributeList = [];
                var attribute;
                while (attribute = streamAttributeSearchRegex.exec(partitionConditionStatement)) {
                    if (attributeList.indexOf(attribute) == -1) {
                        attributeList.push(attribute[1]);
                    }
                }

                var streamList = [];
                streamListLoop: for (var streamName in self.streamList) {
                    if (self.streamList.hasOwnProperty(streamName)) {
                        for (i = 0; i < attributeList.length; i++) {
                            if (!self.streamList[streamName][attributeList[i]]) {
                                continue streamListLoop;
                            }
                        }
                        streamList.push(streamName);
                    }
                }
                addCompletions(streamList.map(function (stream) {
                    return {value: stream + ")\nbegin\n\t", caption: stream, type: "Stream"};
                }));
            }
        } else if (unclosedBracketsCount > 1) {
            addAllAttributesInExecutionPlanAsCompletions(3, 2);
            if (new RegExp("\s+$", "i")) {
                addCompletions({value: "as "});
            }
        }

        /**
         * Add all attributes in all the streams in the execution plan as completions
         *
         * @param {int} attributePriority priority to be set as attribute priority
         * @param {int} streamPriority priority to be set as stream priority
         */
        function addAllAttributesInExecutionPlanAsCompletions(attributePriority, streamPriority) {
            addAttributesOfStreamsAsCompletions(regexResults, Object.keys(self.streamList), attributePriority, streamPriority);
        }
    };

    /**
     * add attributes in the streams or tables in the query
     *
     * @param {string[]} regexResults Array of groups from the regex execution of the query
     * @param {string[]} streams Array of streams of which attributes will be added
     * @param {int} attributePriority priority to be set as attribute priority
     * @param {int} streamPriority priority to be set as stream priority
     */
    function addAttributesOfStreamsAsCompletions(regexResults, streams, attributePriority, streamPriority) {
        var afterStreamAndDotSuggestionsRegex = new RegExp("(" + regex.identifier + ")\\s*\\.\\s*[a-zA-Z_0-9]*$", "i");
        var streamBeforeDotMatch;
        if (streamBeforeDotMatch = afterStreamAndDotSuggestionsRegex.exec(regexResults.input)) {
            if (streams.indexOf(streamBeforeDotMatch[1]) != -1) {
                addCompletions(getAttributesFromStreamsOrTables(streamBeforeDotMatch[1]).map(function (attribute) {
                    return Object.assign({}, attribute, {
                        priority: attributePriority
                    });
                }));
            }
        } else {
            addCompletions(getAttributesFromStreamsOrTables(streams).map(function (attribute) {
                return Object.assign({}, attribute, {
                    priority: attributePriority
                });
            }));
            addCompletions(streams.map(function (stream) {
                return {
                    value: stream + ".",
                    priority: streamPriority
                };
            }));
        }
    }

    /**
     * add attributes in the streams in the reference to stream map
     * References will be used rather than stream names to refer to attributes (reference.attribute)
     *
     * @param {string[]} regexResults Array of groups from the regex execution of the query
     * @param {string[]} referenceToStreamMap Array of streams of which attributes will be added
     * @param {int} attributePriority priority to be set as attribute priority
     * @param {int} streamPriority priority to be set as stream priority
     */
    function addAttributesOfStreamReferencesAsCompletions(regexResults, referenceToStreamMap, attributePriority, streamPriority) {
        var afterStreamAndDotSuggestionsRegex = new RegExp("(" + regex.identifier + ")\\s*\\.\\s*[a-zA-Z_0-9]*$", "i");
        var referenceBeforeDotMatch;
        if (referenceBeforeDotMatch = afterStreamAndDotSuggestionsRegex.exec(regexResults.input)) {
            if (referenceToStreamMap[referenceBeforeDotMatch]) {
                addCompletions(getAttributesFromStreamsOrTables(referenceToStreamMap[referenceBeforeDotMatch]).map(function (attribute) {
                    return Object.assign({}, attribute, {
                        priority: attributePriority
                    });
                }));
            }
        } else {
            for (var reference in referenceToStreamMap) {
                if (referenceToStreamMap.hasOwnProperty(reference)) {
                    addCompletions(getAttributesFromStreamsOrTables(referenceToStreamMap[reference]).map(function (attribute) {
                        return Object.assign({}, attribute, {
                            value: reference + "." + attribute.value,
                            priority: attributePriority
                        });
                    }));
                }
            }
            addCompletions(Object.keys(referenceToStreamMap).map(function (stream) {
                return {
                    value: stream + ".",
                    priority: streamPriority
                };
            }));
        }
    }

    /**
     * Get the list of namespaces which has artifacts in  objType1 or objType2 categories
     *
     * @param {string[]} types types of processors of which namespaces are returned. Should be one of ["windowProcessors", "functions", "streamProcessors"]
     * @returns {Array} list of namespaces.
     */
    function getExtensionNamesSpaces(types) {
        var namespaces = [];
        for (var namespace in CompletionEngine.functionOperationSnippets.extensions) {
            if (CompletionEngine.functionOperationSnippets.extensions.hasOwnProperty(namespace)) {
                var processorsPresentInNamespace = false;
                for (var i = 0; i < types.length; i++) {
                    if (CompletionEngine.functionOperationSnippets.extensions[namespace][types[i]]) {
                        processorsPresentInNamespace = true;
                        break;
                    }
                }
                if (processorsPresentInNamespace) {
                    namespaces.push(namespace);
                }
            }
        }
        return namespaces;
    }

    /**
     * Get the list of  extension function snippets of given namespace
     *
     * @param {string} namespace namespace of the functions
     * @returns {Array} : list of function snippets
     */
    function getExtensionFunctionNames(namespace) {
        if (CompletionEngine.functionOperationSnippets.extensions[namespace]) {
            return Object.values(CompletionEngine.functionOperationSnippets.extensions[namespace].functions).map(function (processor) {
                processor.type = "Function";
                return processor;
            });
        } else {
            return [];
        }
    }

    /**
     * Get the list of  extension window processor snippets of given namespace
     *
     * @param {string} namespace namespace of the window processors
     * @returns {Array} list of window processor snippets
     */
    function getExtensionWindowProcessors(namespace) {
        if (CompletionEngine.functionOperationSnippets.extensions[namespace]) {
            return Object.values(CompletionEngine.functionOperationSnippets.extensions[namespace].windowProcessors).map(function (processor) {
                processor.type = "Window Processor";
                return processor;
            });
        } else {
            return [];
        }
    }

    /**
     * Get the list of  extension stream processor snippets of given namespace
     *
     * @param {string} namespace namespace of the stream processors
     * @returns {Array} list of stream processor snippets
     */
    function getExtensionStreamProcessors(namespace) {
        if (CompletionEngine.functionOperationSnippets.extensions[namespace]) {
            return Object.values(CompletionEngine.functionOperationSnippets.extensions[namespace].streamProcessors).map(function (processor) {
                processor.type = "Stream Processor";
                return processor;
            });
        } else {
            return [];
        }
    }

    /**
     * Get the list of inbuilt function snippets
     *
     * @returns {Array} list of function snippets
     */
    function getInBuiltFunctionNames() {
        return Object.values(CompletionEngine.functionOperationSnippets.inBuilt.functions).map(function (processor) {
            processor.type = "Function";
            return processor;
        });
    }

    /**
     * Get the list of inbuilt window processor snippets
     *
     * @returns {Array} list of window processor snippets
     */
    function getInBuiltWindowProcessors() {
        return Object.values(CompletionEngine.functionOperationSnippets.inBuilt.windowProcessors).map(function (processor) {
            processor.type = "Window Processor";
            return processor;
        });
    }

    /**
     * Get the list of inbuilt stream processor snippets
     *
     * @returns {Array} list of stream processor snippets
     */
    function getInBuiltStreamProcessors() {
        return Object.values(CompletionEngine.functionOperationSnippets.inBuilt.streamProcessors).map(function (processor) {
            processor.type = "Stream Processor";
            return processor;
        });
    }

    /**
     * This function will call a given function by it's name within given context
     *
     * @param {string} functionName name of the function
     * @param {String[]} matchedStringGroups arguments array that would be passed to the function
     * @returns {*} return from the executed function
     */
    function executeLoadSuggestionFunctionByName(functionName, matchedStringGroups) {
        return self[functionName].call(this, matchedStringGroups);
    }

    /**
     * get the attributes of the streams or tables specified
     *
     * @param {string|string[]} streamOrTableName name of the streams or tables of which attributes are returned
     * @return {Object[]} arrays of attribute names of the stream or table
     */
    function getAttributesFromStreamsOrTables(streamOrTableName) {
        var attributes = [];
        if (streamOrTableName.constructor === Array) {
            var newAttributes = [];
            for (var i = 0; i < streamOrTableName.length; i++) {
                newAttributes = newAttributes.concat(getAttributesOfSource(streamOrTableName[i]));
            }

            // Prefixing duplicates attribute names with stream
            var prefixedAttributes = [];
            for (var j = 0; j < newAttributes.length; j++) {
                if (prefixedAttributes.indexOf(newAttributes[j].value) == -1) {
                    // Check for duplicates after the current index
                    for (var k = j + 1; k < newAttributes.length; k++) {
                        if (newAttributes[j].value == newAttributes[k].value) {
                            attributes.push({
                                value: newAttributes[k].source + "." + newAttributes[k].value,
                                type: "Attribute"
                            });

                            // If this is the first time this duplicate is detected prefix the first attribute as well
                            if (prefixedAttributes.indexOf(newAttributes[j].value) == -1) {
                                attributes.push({
                                    value: newAttributes[j].source + "." + newAttributes[j].value,
                                    type: "Attribute"
                                });
                                prefixedAttributes.push(newAttributes[j].value);
                            }
                        }
                    }

                    // If no duplicates are found add without prefix
                    if (prefixedAttributes.indexOf(newAttributes[j].value) == -1) {
                        attributes.push({
                            value: newAttributes[j].value,
                            type: "Attribute"
                        });
                    }
                }
            }
        } else {
            attributes = getAttributesOfSource(streamOrTableName);
        }

        /**
         * get the attributes of a single stream or table
         *
         * @param {string} sourceName name of the stream or table of which attributes are returned
         * @return {Object[]} arrays of attribute names of the stream or table
         */
        function getAttributesOfSource (sourceName) {
            var attributes = [];
            if (self.streamList[sourceName]) {
                attributes = Object.keys(self.streamList[sourceName]);
            } else if (self.tableList[sourceName]) {
                attributes = Object.keys(self.tableList[sourceName]);
            }
            return attributes.map(function (attribute) {
                return {value: attribute, source: sourceName};
            });
        }

        return attributes;
    }

    /**
     * Add a new completions to the words list
     *
     * @param {Object[]|Object} suggestions list of  suggestions
     */
    function addCompletions(suggestions) {
        if (suggestions.constructor === Array) {
            for (var i = 0; i < suggestions.length; i++) {
                addCompletion(suggestions[i]);
            }
        } else {
            addCompletion(suggestions);
        }

        /**
         * Add a single completion to the completions list
         *
         * @param {Object} completion Completion to add to the completions list
         */
        function addCompletion(completion) {
            self.wordList.push({
                caption: (completion.caption == undefined ? completion.value : completion.caption),
                value: completion.value,
                score: (completion.priority == undefined ? 1 : completion.priority),
                meta: completion.type
            });
        }
    }

    /**
     * Add a new completions to the words list
     *
     * @param {Object[]|Object} suggestions list of  suggestions
     */
    function addSnippets(suggestions) {
        if (suggestions.constructor === Array) {
            for (var i = 0; i < suggestions.length; i++) {
                SiddhiEditor.SnippetManager.register(suggestions[i], "siddhi");
                self.suggestedSnippets.push(suggestions[i]);
            }
        } else {
            SiddhiEditor.SnippetManager.register(suggestions, "siddhi");
            self.suggestedSnippets.push(suggestions);
        }
    }
}

CompletionEngine.functionOperationSnippets = {
    /*
     * extensions object contains the custom function, streamProcessor and windowProcessor extensions available for
     * the current Siddhi session. This data structure is dynamically pulled down from the backend services.
     *
     *      extensions = {
     *        namespace1: {
     *          functions: {
     *              function1: {function1 snippet object},
     *              function2: {function2 snippet object},
     *          },
     *          streamProcessors: {
     *              // Same as in function section
     *          },
     *          windowProcessors: {
     *              // same as in function section
     *          }
     *       },
     *       namespace2: {
     *          functions: {
     *              // Same as in function section
     *          },
     *          streamProcessors: {
     *              // Same as in function section
     *          },
     *          windowProcessors: {
     *              // same as in function section
     *          }
     *       }
     *    }
     */
    extensions: {},

    /*
     * inBuilt object contains the custom function, streamProcessor and windowProcessor extensions available for
     * the current Siddhi session. This data structure is dynamically pulled down from the backend services.
     *
     *    inBuilt = {
     *          functions: {
     *              function1: {function1 snippet object},
     *              function2: {function2 snippet object},
     *          },
     *          streamProcessors: {
     *              // Same as in function section
     *              // Same as in function section
     *          }  ,
     *          windowProcessors: {
     *              // same as in function section
     *          }
     *    }
     */
    inBuilt: {}
};

/*
 * Meta data JSON object structure (for extensions and inbuilt) :
 * These are either inside the inBuilt JSON object and extensions.namespace JSON object
 *
 *  {
 *      processorType: [
 *          {
 *              "name": "name of the processor",
 *              "description": "description about the processor",
 *              "parameters": [
 *                  {
 *                      "name": "name of the first parameter",
 *                      "type": ["possible", "types", "of", "arguments", "that", "can", "be", "passed", "for", "this", "parameter"],
 *                      "optional": "boolean"
 *                  },
 *                  {
 *                      "name": "name of the second parameter",
 *                      "type": ["possible", "types", "of", "arguments", "that", "can", "be", "passed", "for", "this", "parameter"],
 *                      "optional": "boolean"
 *                  }
 *                  {
 *                      "multiple": [       // Set of parameters that can be repeated
 *                          {
 *                              "name": "name of the parameter that can be repeated",
 *                              "type": ["possible", "types", "of", "arguments", "that", "can", "be", "passed", "for", "this", "parameter"]
 *                          },
 *                          {
 *                              "name": "name of the second parameter that can be repeated",
 *                              "type": ["possible", "types", "of", "arguments", "that", "can", "be", "passed", "for", "this", "parameter"]\
 *                          }
 *                      ],
 *                      "optional": "boolean"
 *                  }
 *              ],
 *              "return": ["possible", "types", "returned", "by", "the", "processor"]
 *          }
 *      ]
 *  }
 */
/**
 * Load meta data from a json file
 */
function loadMetaData() {
    jQuery.ajax({
        type: "GET",
        url: SiddhiEditor.serverURL + "siddhi-editor/meta-data",
        success: function (response) {
            if (response.status == "SUCCESS") {
                (function () {
                    var snippets = {};
                    for (var processorType in response.inBuilt) {
                        if (response.inBuilt.hasOwnProperty(processorType)) {
                            var snippet = {};
                            for (var i = 0; i < response.inBuilt[processorType].length; i++) {
                                snippet[response.inBuilt[processorType][i].name] = generateSnippet(
                                    response.inBuilt[processorType][i]
                                );
                            }
                            snippets[processorType] = snippet;
                        }
                    }
                    CompletionEngine.functionOperationSnippets.inBuilt = snippets;
                })();
                (function () {
                    var snippets = {};
                    for (var namespace in response.extensions) {
                        if (response.extensions.hasOwnProperty(namespace)) {
                            snippets[namespace] = {};
                            for (var processorType in response.extensions[namespace]) {
                                if (response.extensions[namespace].hasOwnProperty(processorType)) {
                                    var snippet = {};
                                    for (var i = 0; i < response.extensions[namespace][processorType].length; i++) {
                                        snippets[response.extensions[namespace][processorType][i].name] = generateSnippet(
                                            response.extensions[namespace][processorType][i]
                                        );
                                    }
                                    snippets[namespace][processorType] = snippet;
                                }
                            }
                        }
                    }
                    CompletionEngine.functionOperationSnippets.extensions = snippets;
                })();
            }
        }
    });
}

/**
 * Prepare a snippet from the processor
 * Snippets are objects that can be passed into the ace editor to add snippets to the completions provided
 *
 * @param {Object} processorMetaData The processor object with relevant parameters
 * @return {Object} snippet
 */
function generateSnippet(processorMetaData) {
    var snippetVariableCount = 0;
    var snippetText = "snippet " + processorMetaData.name + "\n\t" + processorMetaData.name;
    if (processorMetaData.parameters) {
        snippetText += "(";
        for (var i = 0; i < processorMetaData.parameters.length; i++) {
            var parameter = processorMetaData.parameters[i];
            if (i != 0) {
                snippetText += ", ";
            }
            if (parameter.multiple) {
                var repeatAmount = 2;
                for (var j = 0; j < repeatAmount; j++) {   // Adding the multiple attributes twice
                    for (var k = 0; k < parameter.multiple.length; k++) {
                        if (k != 0) {
                            snippetText += ", ";
                        }
                        snippetText += "${" + (snippetVariableCount + 1) + ":" + parameter.multiple[k].name + j + "}";
                        snippetVariableCount++;
                    }
                    if (j != repeatAmount - 1) {
                        snippetText += ", ";
                    }
                }
            } else {
                snippetText += "${" + (snippetVariableCount + 1) + ":" + parameter.name + "}";
                snippetVariableCount++;
            }
        }
        snippetText += ")\n";
    }
    var snippet = SiddhiEditor.SnippetManager.parseSnippetFile(snippetText)[0];

    if (processorMetaData.description || processorMetaData.returnType || processorMetaData.parameters) {
        snippet.description = generateDescriptionFromProcessorMetaData(processorMetaData);
    }
    return snippet;
}

/**
 * Generate description html string from meta data
 * Descriptions are intended to be shown in the tooltips for a completions
 *
 * @param {Object} metaData Meta data object containing parameters, return and description
 * @return {string} html string of the description generated from the meta data provided
 */
function generateDescriptionFromProcessorMetaData(metaData) {
    var description = "<div>" + (metaData.name ? "<strong>" + metaData.name + "</strong><br>" : "");
    if (metaData.description) {
        description += metaData.description ? "<p>" + SiddhiEditor.utils.wordWrap(metaData.description, 100) + "</p>" : "<br>";
    }
    if (metaData.parameters) {
        description += "Parameters - ";
        if (metaData.parameters.length > 0) {
            description += "<ul>";
            for (var j = 0; j < metaData.parameters.length; j++) {
                if (metaData.parameters[j].multiple) {
                    for (var k = 0; k < metaData.parameters[j].multiple.length; k++) {
                        description += "<li>" + metaData.parameters[j].multiple[k].name +
                            (metaData.parameters[j].optional ? " (optional & multiple)" : "") + " - " +
                            (metaData.parameters[j].multiple[k].type.length > 0 ? metaData.parameters[j].multiple[k].type.join(" | ") : "") + "</li>";
                    }
                } else {
                    description += "<li>" + metaData.parameters[j].name +
                        (metaData.parameters[j].optional ? " (optional)" : "") +
                        (metaData.parameters[j].type.length > 0 ? " - " + metaData.parameters[j].type.join(" | ") : "") + "</li>";
                }
            }
            description += "</ul>";
        } else {
            description += "none<br><br>";
        }
    }
    if (metaData.returnType) {
        description += "Return Type - ";
        if (metaData.returnType.length > 0) {
            description += metaData.returnType.join(" | ");
        } else {
            description += "none";
        }
    }
    description += "</div>";
    return description;
}


exports.CompletionEngine = CompletionEngine;