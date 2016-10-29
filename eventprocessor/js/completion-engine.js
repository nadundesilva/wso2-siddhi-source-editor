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

(function () {
    var loggerContext = "CompletionEngine";

    //Aliases for the attribute names used in 'CompletionEngine.extensions' and 'CompletionEngine.inBuilt' json objects
    var FUNCTIONS = "functions";
    var STREAM_PROCESSORS = "streamProcessors";
    var WINDOW_PROCESSORS = "windowProcessors";

    // Following keyword lists are repeated in many functions
    var logicalOperatorList = [
        {value: "IN"},
        {value: "AND"},
        {value: "OR"},
        {value: "NOT"},
        {value: "isNull", parameters: [{name: "arg", type:["int", "long", "double", "float", "string", "bool", "object"]}], return: ["bool"]},
        {value: "IS NULL"},
        {value: "CONTAINS"}
    ];
    var dataTypes = [
        {value: "int"}, {value: "float"}, {value: "double"}, {value: "bool"}, {value: "time"},
        {value: "object"}, {value: "string"}, {value: "long"}
    ];

    // Set of regular expressions
    var identifier = "[a-zA-Z_][a-zA-Z_0-9]*";
    var anyChar = "(.|\\n)";
    var oneDataType = "(int|long|double|bool|object|string|time)";
    var queryActions = "insert|delete|update";
    var querySelection = "select";
    var queryOutput = "output";
    var groupBY = "(group\\s+by)";
    var having = "having";
    var queryInput = "((?!(" + querySelection + "|" + queryOutput + "|" + queryActions + "|" + having + "|" + groupBY + ")).)*";
    var querySection = "((?!(" + queryOutput + "|" + queryActions + ")).)*";
    var outputRate = "((?!(every|" + queryActions + ")).)*";
    var outputRateEvery = "((?!(" + queryActions + ")).)*";

    var generalSnippets = SiddhiEditor.SnippetManager.parseSnippetFile("#Define Statements\n\
snippet defStream\n\
	define stream ${1:stream_name} (${2:attr1} ${3:Type1}, ${4:attN} ${5:TypeN});\n\
snippet defTable\n\
	define table ${1:table_name} (${2:attr1} ${3:Type1}, ${4:attN} ${5:TypeN});\n\
snippet defFunction\n\
	define function ${1:function_name}[${2:lang_name}] return ${3:return_type} { \n\
	    ${4:function_body} \n\
	};\n\
snippet annot-IndexedBy\n\
	@IndexedBy('${1:attribute_name}')\n\
snippet annot-From\n\
	@From(eventtable='${1:rdbms}',jdbc.url=${2:'jdbc:mysql://HOST:3306/DB}', username='${3:root}', password='${4:root}', driver.name='${5:com.mysql.jdbc.Driver}', datasource.name='${6:DATASOURCE}', table.name='${7:TABLENAME}', cache='${8:lru}', cache.size='${9:3000}')\n\
snippet annot-PlanName\n\
	@Plan:name(\"${1:Plan_Name}\")\n\
snippet annot-PlanDesc\n\
	@Plan:Description(\"${1:Plan_Description}\")\n\
snippet annot-PlanStat\n\
	@Plan:Statistics(\"${1:Plan_Statistics}\")\n\
snippet annot-PlanTrace\n\
	@Plan:Trace(\"${1:Plan_Trace}\")\n\
snippet annot-Import\n\
	@Import(\"${1:Stream_ID}\")\n\
snippet annot-Export\n\
	@Export(\"${1:Stream_ID}\")\n\
snippet annot-Info\n\
	@info(name = \"${1:Stream_ID}\")\n\
snippet annot-Config\n\
	@config(async = \'true\')\n\
snippet #window.\n\
	window.${1:namespace}:${2:window_name}(${3:args})\n\
snippet query-filter\n\
	from ${1:stream_name}[${2:filter_condition}]\n\
	select ${3:attribute1}, ${4:attribute2} \n\
	insert into ${5:output_stream}\n\
	\n\
snippet query-window\n\
	from ${1:stream_name}#window.${2:namespace}:${3:window_name}(${4:args})\n\
	select ${5:attribute1}, ${6:attribute2} \n\
	insert into ${7:output_stream}\n\
	\n\
snippet query-window-filter\n\
	from ${1:stream_name}[${2:filter_condition}]#window.${3:namespace}:${4:window_name}( ${5:args} )\n\
	select ${6:attribute1} , ${7:attribute2} \n\
	insert into ${8:output_stream}\n\
	\n\
snippet query-join\n\
	from ${1:stream_name}[${2:filter_condition}]#window.${3:window_name}(${4:args}) as ${5:reference}\n\
		join ${6:stream_name}[${7:filter_condition}]#window.${8:window_name}(${9:args}) as ${10:reference}\n\
		on ${11:join_condition}\n\
		within ${12: time_gap}\n\
	select ${13:attribute1}, ${14:attribute2} \n\
	insert into ${15:output_stream}\n\
	\n\
snippet query-pattern\n\
	from every ${1:stream_reference}=${2:stream_name}[${3:filter_condition}] -> \n\
		every ${4:stream_reference2}=${5:stream_name2}[${6:filter_condition2}]\n\
		within ${7: time_gap}\n\
	select  ${8:stream_reference}.${9:attribute1}, ${10:stream_reference}.${11:attribute1} \n\
	insert into ${12:output_stream}\n\
	\n\
snippet query\n\
	from ${1:stream_name}\n\
	select ${2:attribute1} , ${3:attribute2} \n\
	insert into ${4:output_stream}\n\
	\n\
snippet partition\n\
	partition with (${1:attribute_name} of ${2:stream_name}, ${3:attribute2_name} of ${4:stream2_name})\n\
	begin\n\
		${5:query1}\n\
		\n\
		${6:query2}\n\
		\n\
		${7:query3}\n\
	end;\n\
");

    /*
     *  'ruleBase' has a list of regular expressions to identify the different contexts and appropriate handlers to generate context aware suggestions.
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
     ************/
    var ruleBase = [
        {
            regex: "@(p(l(a(n?)?)?)?)((?![)]).)*$",
            next: [
                {value: 'Plan:name(\'Name of the plan\')'},
                {value: 'Plan:description(\'Description of the plan\')'},
                {value: 'Plan:trace(\'true|false\')'},
                {value: 'Plan:statistics(\'true|false\')'},
                {value: 'Import(\'StreamName\')'},
                {value: 'Export(\'StreamName\')'}
            ]
        },
        {
            regex: "@\\w*((?![)]).)*$",
            next: [
                {value: 'Config(async=true)'},
                {value: 'info(name=\'stream_id\')'},
                {value: 'Plan:name(\'Name of the plan\')'},
                {value: 'Plan:description(\'Description of the plan\')'},
                {value: 'Plan:trace(\'true|false\')'},
                {value: 'Plan:statistics(\'true|false\')'},
                {value: 'Import(\'StreamName\')'},
                {value: 'Export(\'StreamName\')'}
            ]
        },
        {
            regex: "\\0$",
            next: "$initialList"
        },
        {
            regex: "\\s+in\\s+$",
            next: "$TableSuggestions"
        },
        {
            regex: "from\\s+" + queryInput + "#window\\.(.)*(?!\\s+)$",
            next: "$windowPhrase"
        },
        {
            regex: "from\\s+" + queryInput + "#(.)+:$",
            next: "$nameSpacePhrase"
        },
        {
            regex: "(\\w+)\\:$",
            next: "$nameSpacePhrase"
        },
        {
            regex: "(\\w+)\\[\\s*(\\d+|last|last-\\d+)\\s*\\]\\.$",
            next: "$streamReferenceHandler"
        },
        {
            regex: "(\\w+)\\.$",
            next: "$resolveVariable"
        },
        {
            regex: "from\\s+" + queryInput + "#\\w*$",
            next: "$processorPhrase"
        },
        {
            regex: "insert\\s+((?!(into|;)).)*$",
            next: [{value: "into"}, {value: "events"}, {value: "all"}, {value: "current"}, {value: "expired"}]
        },
        {
            regex: "insert(.)*into((?!(;)).)*$",
            next: "$TableSuggestions"
        },
        {
            regex: "from.*(delete|update)((?!(on|for)).)*$",
            next: "$UDPhrase" //for,on,tablenames
        },
        {
            regex: "from.*(delete|update)\\s+" + identifier + "\\s+for((?!on).)*$",
            next: [{value: "all"}, {value: "current"}, {value: "expired"}, {value: "events"}, {value: "on"}]   //all , current, expired , events .
        },
        {
            regex: "from.*(delete|update)\\s+(" + identifier + ").*on.*((?!;).)*$",
            next: "$UDConditionPhrase"
        },
        {
            regex: "partition\\s+$",
            next: [{value: "with"}]
        },
        {
            regex: "partition\\s+with\\s+[(](\\s*" + identifier + "\\s+of\\s+" + identifier + "\\s*[,])*\\s*$",
            next: "$allAttributeList"
        },
        {
            regex: "partition\\s+with\\s+[(](\\s*" + identifier + "\\s+of\\s+" + identifier + "\\s*[,])*\\s*" + identifier + "\\s+$",
            next: [{value: "of"}]
        },
        {
            regex: "partition\\s+with\\s+[(](\\s*" + identifier + "\\s+of\\s+" + identifier + "\\s*[,])*\\s*" + identifier + "\\s+of\\s+$",
            next: "$partitionStreamList"
        },
        {
            regex: "define\\s*((?!(stream|table|function)).)*$",
            next: [{value: "stream"}, {value: "table"}, {value: "function"}]
        },
        {
            regex: "define\\s+function\\s+" + identifier + "\\s+$",
            next: [{value: " [language_name] "}]
        },
        {
            regex: "define\\s+function\\s+" + identifier + "\\s+\\[\\s*\\w+\\s*\\]\\s+$",
            next: [{value: "return"}]
        },
        {
            regex: "define\\s+function\\s+" + identifier + "\\s+\\[\\s*\\w+\\s*\\]\\s+return\\s+$",
            next: dataTypes
        },
        {
            regex: "define\\s+function\\s+" + identifier + "\\s+\\[\\s*\\w+\\s*\\]\\s+return\\s+" + oneDataType + "\\s+$",
            next: [{value: "{ \"Function Body\"  }"}]
        },
        {
            regex: "define\\s+(stream|table)\\s+" + identifier + "\\s*[(](\\s*" + identifier + "\\s+\\w+\\s*[,])*\\s*" + identifier + "\\s+((?!(int|string|float|object|time|bool|[,]|;))" + anyChar + ")*$",
            next: dataTypes
        },
        {
            regex: "from.*(select)?.*" + groupBY + "?.*having" + querySection + "$", //output | insert | delete | update is possible
            next: "$selectPhraseHaving"
        },
        {
            regex: "from.*(select)?.*" + groupBY + "\\s+" + querySection + "$", // having | output | insert| delete | update is possible
            next: "$selectPhraseGroupBy"
        },
        {
            regex: "from(.)*\\[((?!\\]).)*$",
            next: "$filterPhrase"
        },
        {
            cfg: "_checkNestedSquareBracketInFROMPhrase",
            next: "$filterPhrase"
        },
        {
            regex: "from\\s+" + queryInput + "$",    //group by , having , output    join ,on "expired events   "from\\s+((?!select).)*$"
            next: "$fromPhraseStreamIdList"
        },
        {
            regex: "from(.)*select\\s+" + querySection + "$",             //output ,group by , having , insert, delete , update
            next: "$selectPhraseAttributesList"
        },
        {
            regex: "from(.)*output\\s+" + outputRate + "$",             //insert, delete , update
            next: [{value: "snapshot"}, {value: "all"}, {value: "last"}, {value: "first"}, {value: "every"}]
        },
        {
            regex: "from(.)*output.*every" + outputRateEvery + "$",             //insert, delete , update
            next: [
                {value: "events"}, {value: "min"}, {value: "hours"}, {value: "weeks"}, {value: "days"},
                {value: "months"}, {value: "years"}, {value: "insert"}, {value: "delete"}, {value: "update"}
            ]
        }
    ];

    window.CompletionEngine = function () {
        var self = this;

        //List of streams that would keep the meta data of the streams defined/inferred within the query.
        self.streamList = new StreamList();

        //List of tables that would keep the meta data of the tables defined within the query.
        self.tableList = new TableList();

        //List of functions that would keep the meta data of the functions defined within the query.
        self.functionList = new FunctionList();

        //stream aliases in query are stored as a list of  aliasName:streamID .
        // ex :
        //  query
        //  -----
        //  from streamB as myStream join streamA as foo ...
        //
        //  representation
        //  --------------
        //  streamAliasList={
        //    myStream : streamB,
        //         foo : streamA
        //  }
        self.streamAliasList = {};

        //Event references in a query are stored as a list of  aliasName:streamID .
        // ex :
        //  query
        //  -----
        //  from e1=streamB -> e2=streamA ...
        //
        //  representation
        //  --------------
        //  streamStore ={
        //    e1 : streamB,
        //    e2 : streamA
        //  }
        self.streamStore = {};

        // CompletionEngine.wordList is the current suggestions list . This is an array of objects with following format
        // {
        //       definition:"suggestion name",
        //       value : "suggestion value"
        //       score : 2,
        //       meta : "keyword"
        // }
        self.wordList = [];

        // SiddhiCompleter is attached with ext-language module. So that Ace editor library will be using this module for generate suggestions
        self.SiddhiCompleter = {
            getCompletions: function (editor, session, pos, prefix, callback) {
                self.calculateCompletions(editor);      // Calculate the suggestions list for current context
                self.checkTheBeginning(editor);

                // This completer will be using the wordList array
                // context-handler functions will be updated the the worldList based on the context around the cursor position
                callback(null, self.wordList);
            },
            getDocTooltip: function(item) {
                if (item.description && !item.docHTML) {
                    item.docHTML = "<div>" +
                        "<strong>" + item.caption + "</strong><br>" +
                        "<p>" + item.description + "</p>";
                    if (item.parameters) {
                        item.docHTML += "<strong>Parameters - </strong><ul>";
                        for(var i = 0; i < item.parameters.length; i++) {
                            if (item.parameters[i].multiple) {
                                for(var j = 0; j < item.parameters.length; j++) {
                                    item.docHTML += "<li>" + item.parameters[i].multiple[j].name +
                                        (item.parameters[i].optional ? " (optional & multiple)" : "") + " - " +
                                        item.parameters[i].multiple[j].type.join(" | ") + "</li>";
                                }
                            } else {
                                item.docHTML += "<li>" + item.parameters[i].name +
                                    (item.parameters[i].optional ? " (optional)" : "") + " - " +
                                    item.parameters[i].type.join(" | ") + "</li>";
                            }
                        }
                        item.docHTML += "</ul>";
                    }
                    if (item.return) {
                        item.docHTML += "<strong>Return Type - </strong>" + item.return.join(" | ");
                    }
                    item.docHTML += "</div>";
                }
            }
        };

        /*************************************************************************************************************************
         *                                          Integration functions for CompletionEngine
         *************************************************************************************************************************/

        /**
         * Dynamically select the completers suitable for current context
         *
         * @param editor ace editor instance
         * @returns {Array|*} suitable completer list for current context
         */
        self.adjustAutoCompletionHandlers = function (editor) {
            // adjustAutoCompletionHandlers() method will be called in js/ace_editor/ext-language_tools.js in basicAutoComplete and liveAutoComplete
            // This method will dynamically select the appropriate completer for current context when auto complete event occurred.
            var completerList = [];

            // If the cursor is placed in the middle of the statement
            if (this.checkVariableResolveness(editor)) {
                // If the last token is the dot operator => only the attributes of the object/namespace should be listed
                // So that just show the suggestions from the SiddhiCompleter
                completerList = [SiddhiEditor.langTools.snippetCompleter, this.SiddhiCompleter];
            } else {
                // If the cursor is in the middle of a query and not preceded by a dot operator
                // Show the keywords, and suggestions from the SiddhiCompleter.
                completerList = [SiddhiEditor.langTools.keyWordCompleter, SiddhiEditor.langTools.snippetCompleter, this.SiddhiCompleter];
            }

            if (this.checkTheBeginning(editor)) {
                SiddhiEditor.SnippetManager.register(generalSnippets);
            } else {
                SiddhiEditor.SnippetManager.unregister(generalSnippets);
            }

            editor.completers = completerList;
        };

        /**
         * Check whether the cursor is positioned next to a dot operator or namespace operator
         *
         * @param editor ace editor instance
         * @returns {boolean} true if the cursor is positioned just after the dot operator or namespace operator
         */
        self.checkVariableResolveness = function (editor) {
            var objectNameRegex = /\w*\.$/i;
            var namespaceRegex = /\w*:$/i;
            var txt = editor.getValue();
            return !!(objectNameRegex.test(txt) || namespaceRegex.test(txt));
        };

        /**
         * Check whether the cursor is positioned at the beginning of a query
         *
         * @param editor ace editor instance
         * @returns {boolean} true if the cursor is positioned at the beginning.
         */
        self.checkTheBeginning = function (editor) {
            var position = editor.getCursorPosition();
            var lineNumber = position.row;
            var currentLine = editor.session.getLine(lineNumber);
            var txt = editor.session.doc.getTextRange(SiddhiEditor.Range.fromPoints({
                row: 0,
                column: 0
            }, position));  // all the text up to the cursor position.

            var tailingSpaces = /^\s*/i;
            var tail = currentLine.substring(position.column); //rest of the line

            if (tailingSpaces.test(tail)) {
                // if the rest of the line after the cursor has only the whitespaces.

                // set of regular expressions to identify the beginning of the statement
                var name = identifier + "(\\." + identifier + ")*";
                var annotationElement = "(" + name + "\\s*[=]\\s*)?[\"'](.)+[\"']";
                var newStatement = /;\s+\S*$/i;
                var blockCommentEnd = /[*][/]\s*\S*$/i; // just after the block comment
                var lineComment = /--(.)*\s+\S*$/i;     // just after the line comment
                var begin = /begin\s*\S*$/i;            // within the partition statement. just after the begin keyword
                var spaces = /^\s*$/;
                var startingWord = /^\s*\S*$/i;         //spaces followed by non-space characters
                var annotationBody = name + "\\s*[(]\\s*" + annotationElement + "(\\s*[,]\\s*" + annotationElement + ")*\\s*[)]\\s*\\S*$";
                var annotation = new RegExp("@\\s*" + annotationBody, "i");                     //annotation element
                var planAnnotations = new RegExp("@\\s*plan\\s*:\\s*" + annotationBody, "i");   //Regular expression for plan-annotations.

                if (newStatement.test(txt) || annotation.test(txt) || planAnnotations.test(txt) ||
                        blockCommentEnd.test(txt) || lineComment.test(txt) || begin.test(txt) ||
                        spaces.test(txt) || txt == "" || startingWord.test(txt)) {
                    if (SiddhiEditor.debug) {
                        console.warn(loggerContext + ":" + "checkTheBeginning" + "->");
                        console.log("New statement is suitable for current position");
                    }
                    return true;
                }
            }
            return false;
        };

        /**
         * Calculate the list of suggestions based on the context around the cursor position
         *
         * @param editor : ace editor instance
         *
         */
        self.calculateCompletions = function (editor) {
            var pos = editor.getCursorPosition();   //cursor position
            var text = editor.session.doc.getTextRange(SiddhiEditor.Range.fromPoints({
                row: 0,
                column: 0
            }, pos));                               //all the text before the cursor position
            var tempStatements = text.split(";");
            text = tempStatements[tempStatements.length - 1]; //get the last statement.

            this.streamStore = {};           //clear the global tables for event references and stream alias
            this.streamAliasList = {};

            text = text.replace(/\s/g, " "); //Replace all the white spaces with single space each.
            // This step is important for identifying the statements span across  multiple lines using regular expressions.
            // Regular expressions listed in 'ruleBase' structure only identify the prefixes span in single line.
            // By replacing newline characters of the input text with spaces, those rules can be used for identifying multiline prefixes.

            if (SiddhiEditor.debug) {
                console.warn(loggerContext + ":" + "calculateCompletions" + "->");
                console.log("input text", text);
            }

            self.wordList = [];     // Clear the previous suggestion list
            if (this.checkTheBeginning(editor)) {
                this.$initialList();
            }

            for (var a = 0; a < ruleBase.length; a++) {
                if (ruleBase[a].hasOwnProperty("cfg")) {
                    if (executeFunctionByName.call(this, ruleBase[a].cfg, [text])) {
                        if (Object.prototype.toString.call(ruleBase[a].next) === '[object Array]') {
                            addCompletions(ruleBase[a].next);
                        } else {
                            executeFunctionByName.call(this, ruleBase[a].next, [text]);
                        }
                        return;
                    }
                } else {
                    var regx = new RegExp(ruleBase[a].regex, "i");
                    if (regx.test(text)) {
                        if (SiddhiEditor.debug) {
                            console.warn(loggerContext + ":" + "calculateCompletion" + "->");
                            console.log("Matched regular expression : ", text, ruleBase[a]);
                        }

                        if (Object.prototype.toString.call(ruleBase[a].next) === '[object Array]') {
                            addCompletions(ruleBase[a].next)

                        } else {
                            executeFunctionByName.call(this, ruleBase[a].next, [text, regx]);
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
         *                                          Context identification functions
         *************************************************************************************************************************/

        self._checkNestedSquareBracketInFROMPhrase = function (arg) {
            var fromRegxp = /from((?:.(?!from))+)$/i;
            var fromPhrase = fromRegxp.exec(arg[0]);
            if (fromPhrase == null) {
                return false;
            }

            var bracketCouter = 0;
            for (var index = fromPhrase[1].length - 1; index >= 0; index--) {

                if (fromPhrase[1].charAt(index) == '[')
                    bracketCouter++;
                else if (fromPhrase[1].charAt(index) == ']')
                    bracketCouter--;

                if (bracketCouter > 0)
                    return true;
            }
            return false;
        };


        /*************************************************************************************************************************
         *                                          Auto completions context-handler functions
         *************************************************************************************************************************/

        self.$initialList = function () {
            addCompletions(
                [{value: "define"}, {value: "from"}, {value: "partition"}, {value: "@"}]
            );
        };

        self.$fromPhraseStreamIdList = function (args) {
            var essentialKeyWords = [
                "output", "outer", "inner", "left", "unidirectional", "all", "events", "insert",
                "delete", "update", "select", "as", "join", "on", "every", "group by", "having", "within"
            ];
            this.$streamReference(args[0]);
            this.$streamAlias(args[0]);

            addCompletions(essentialKeyWords.map(function(keyword) {
                return {
                    value: keyword,
                    priority: 2
                };
            }));
            addCompletions(this.streamList.getStreamIDList().map(function(stream) {
                return {
                    value: stream,
                    type: "Stream",
                    priority: 3
                };
            }));
            addCompletions(getStreamReferences().map(function(stream) {
                return {
                    value: stream + ".",
                    type: "Stream",
                    priority: 4
                };
            }));
            addCompletions(getStreamAliasList().map(function(stream) {
                return {
                    value: stream + ".",
                    type: "Stream",
                    priority: 5
                };
            }));
        };

        self.$selectPhraseAttributesList = function (args) {
            // Stream Alias yet to be handled , both in 'stream as e' form and "e1=stream"
            var keywords = [
                {value: "as"}, {value: "insert"}, {value: "group by"}, {value: "having"},
                {value: "output"}, {value: "update"}, {value: "delete"}
            ];

            var sysFunctions = getInBuiltFunctionNames();

            var ns = getExtensionNamesSpaces(FUNCTIONS);
            ns = ns.map(function (d) {
                return d + ":";
            });

            var tableList = this.tableList.getTableIDList();
            tableList = tableList.map(function (d) {
                return d + ".";
            });

            var result = args[1].exec(args[0]);
            var streamNames = this.streamList.getStreamIDList();
            var fromPhrase = /from(.*)select/i.exec(result[0]);

            if (SiddhiEditor.debug) {
                console.warn(loggerContext + ":" + "$selectPhraseAttributesList" + "->");
                console.log("From Phrase", fromPhrase);
            }

            this.$streamAlias(result[0]);
            var aliasList = getStreamAliasList();
            aliasList = aliasList.map(function (d) {
                return d + ".";
            });

            this.$streamReference(result[0]);
            var refList = getStreamReferences();
            refList = refList.map(function (d) {
                return d + ".";
            });

            var streamIds = [];
            var list = [];
            for (var index = 0; index < streamNames.length; index++) {
                var regex = new RegExp("[^a-zA-Z]" + streamNames[index] + "[^a-zA-Z0-9]");

                if (fromPhrase[1].match(regex)) {
                    streamIds.push(streamNames[index]);
                    list = list.concat(this.streamList.getAttributeList(streamNames[index]));
                }
            }

            if (SiddhiEditor.debug) {
                console.warn(loggerContext + ":" + "$selectPhraseAttributesList" + "->");
                console.log("generated list", list);
            }

            addCompletions(streamIds.map(function(stream) {
                return {
                    value: stream + ".",
                    type: "Stream",
                    priority: 5
                };
            }));
            addCompletions(list.map(function(stream) {
                return {
                    value: stream,
                    type: "Stream Attribute",
                    priority: 8
                };
            }));
            addCompletions(refList.map(function(stream) {
                return {
                    value: stream,
                    type: "Stream",
                    priority: 7
                };
            }));
            addCompletions(aliasList.map(function(stream) {
                return {
                    value: stream,
                    type: "Stream",
                    priority: 6
                };
            }));
            addCompletions(tableList.map(function(table) {
                return {
                    value: table,
                    type: "Event Table",
                    priority: 4
                };
            }));
            addCompletions(ns.map(function(namespace) {
                return {
                    value: namespace,
                    type: "Extension Namespace",
                    priority: 3
                };
            }));
            addCompletions(keywords.map(function(keyword) {
                keyword.priority = 1;
                return keyword;
            }));
            addCompletions(sysFunctions.map(function(keyword) {
                keyword.priority = 2;
                return keyword;
            }));
        };

        self.$windowPhrase = function () {
            addCompletions(getInBuiltWindowProcessors());

            addCompletions(getExtensionNamesSpaces(WINDOW_PROCESSORS).map(function (d) {
                return {
                    value: d + ":",
                    type: "Extension Namespace"
                };
            }));
        };

        self.$processorPhrase = function (args) {
            // If built in streamProcessors exist , they should be included
            addCompletions(
                [{value: "window.", priority: 2}]
            );

            addCompletions(getExtensionNamesSpaces(WINDOW_PROCESSORS, STREAM_PROCESSORS).map(function(ns) {
                return {
                    value: ns + ":",
                    type: "Extension Namespace",
                    priority: 1
                };
            }));
        };

        self.$allAttributeList = function (args) {
            var tempList = [];
            var streamList = this.streamList.getStreamIDList();
            for (var s = 0; s < streamList.length; s++) {
                var attributeList = this.streamList.getAttributeList(streamList[s]);
                addCompletions(attributeList.map(function(attribute) {
                    return {
                        value: attribute,
                        type: "Stream Attribute",
                        priority: s
                    };
                }));
            }
        };

        self.$partitionStreamList = function (args) {
            var tempList = [];
            var regx = "(" + identifier + ")\\s+of\\s+\\w*$";
            var identifierResult = (new RegExp(regx)).exec(args[0]);

            var streamList = this.streamList.getStreamIDList();
            for (var i = 0; i < streamList.length; i++) {
                var attributeList = this.streamList.getAttributeList(streamList[i]);
                for (var index = 0; index < attributeList.length; index++) {
                    if (attributeList[index] == identifierResult[1]) {
                        tempList.push(streamList[i]);
                        break;
                    }
                }
            }
            addCompletions(tempList.map(function(stream) {
                return {
                    value: stream,
                    type: "Stream"
                };
            }));
        };

        self.$TableSuggestions = function (args) {
            addCompletions(this.tableList.getTableIDList().map(function(stream) {
                return {
                    value: stream,
                    type: "Stream"
                };
            }));
        };

        self.$UDPhrase = function (args) {
            addCompletions([{value: "for"}, {value: "on"}].map(function (keyword) {
                keyword.priority = 1;
                return keyword;
            }));

            addCompletions(this.tableList.getTableIDList().map(function (table) {
                return {
                    value: table,
                    type: "Event Table",
                    priority: 2
                };
            }));
        };

        self.$UDConditionPhrase = function (args) {
            addCompletions(
                [{value: "IS NULL"}, {value: "NOT"}, {value: "AND"}, {value: "OR"}].map(function (keyword) {
                    keyword.priority = 1;
                    return keyword;
                })
            );

            var result = args[1].exec(args[0]);
            var streamNames = this.streamList.getStreamIDList();
            var tableNames = this.tableList.getTableIDList();

            var fromPhrase = /from(.*)(update|delete)/i.exec(result[0]);
            var streamList = [];
            var attributeList = [];
            var regex;
            for (var i = 0; i < streamNames.length; i++) {
                regex = new RegExp("[^a-zA-Z]" + streamNames[i] + "[^a-zA-Z0-9]");

                if (fromPhrase[1].match(regex)) {
                    streamList.push(streamNames[i]);
                    attributeList = attributeList.concat(this.streamList.getAttributeList(streamNames[i]))
                }
            }
            addCompletions(streamList.map(function (d) {
                return {
                    value: d + ".",
                    type: "Stream",
                    priority: 2
                }
            }));

            var updatePhrase = /(update|delete)(.*)on/i.exec(result[0]);
            var tableList = [];
            for (i = 0; i < tableNames.length; i++) {
                regex = new RegExp("[^a-zA-Z]" + tableNames[i] + "[^a-zA-Z0-9]");
                if (updatePhrase[2].match(regex)) {
                    //
                    // if( updatePhrase[2].indexOf(tableNames[i]))
                    tableList.push(tableNames[i]);
                }
            }
            addCompletions(tableList.map(function (d) {
                return  {
                    value: d + ".",
                    type: "Event Table",
                    priority: 4
                }
            }));

            addCompletions(attributeList.map(function(attribute) {
                return {
                    value: attribute,
                    type: "Stream Attribute",
                    priority: 3
                };
            }));
        };

        self.$selectPhraseGroupBy = function (args) {
            var keywords = [{value: "output"}, {value: "having"}, {value: "insert"}, {value: "delete"}, {value: "update"}];
            var result = args[1].exec(args[0]);
            var regex = /from(.*)group/i;
            var fromPhrase = regex.exec(result[0]);

            if (SiddhiEditor.debug) {
                console.warn(loggerContext + ":" + "$selectPhraseGroupBy" + "->");
                console.log("fromPhrase:", fromPhrase);
            }

            var streamNames = this.streamList.getStreamIDList();

            addCompletions(keywords.map(function(keyword) {
                keyword.priority = 1;
                return keyword;
            }));
            addCompletions(streamNames.map(function(stream) {
                return {
                    value: stream + ".",
                    type: "Stream",
                    priority: 2
                };
            }));
            for (var index = 0; index < streamNames.length; index++) {
                regex = new RegExp("[^a-zA-Z]" + streamNames[index] + "[^a-zA-Z0-9]");
                if (fromPhrase[1].match(regex)) {
                    addCompletions(this.streamList.getAttributeList(streamNames[index]).map(function(stream) {
                        return {
                            value: stream,
                            type: "Stream Attribute",
                            priority: 3
                        };
                    }));
                }
            }
        };

        self.$selectPhraseHaving = function (args) {
            var result = args[1].exec(args[0]);
            var regx = /from(.*)having/i;
            var fromPhrase = regx.exec(result[0]);
            var keywords = [{value: "output"}, {value: "insert"}, {value: "delete"}, {value: "update"}];

            if (SiddhiEditor.debug) {
                console.warn(loggerContext + ":" + "$selectPhraseHaving" + "->");
                console.log("fromPhrase:", fromPhrase);
            }

            var streamNames = this.streamList.getStreamIDList();
            var attributeList = [];
            for (var index = 0; index < streamNames.length; index++) {
                var regex = new RegExp("[^a-zA-Z]" + streamNames[index] + "[^a-zA-Z0-9]");
                if (fromPhrase[1].match(regex)) {
                    attributeList = attributeList.concat(this.streamList.getAttributeList(streamNames[index]));
                }
            }

            addCompletions(keywords.concat(logicalOperatorList).map(function (keyword) {
                keyword.priority = 2;
                return keyword;
            }));

            addCompletions(streamNames.map(function (d) {
                return {
                    value: d + ".",
                    type: "Stream",
                    priority: 4
                };
            }));

            addCompletions(getExtensionNamesSpaces(FUNCTIONS).map(function (namespace) {
                return {
                    value: namespace + ":",
                    type: "Extension Namespace",
                    priority: 3
                }
            }));

            addCompletions(getInBuiltFunctionNames().map(function (d) {
                return {
                    value: d + "(args)",
                    type: "Function",
                    priority: 1
                }
            }));

            addCompletions(attributeList.map(function (d) {
                return {
                    value: d,
                    type: "Stream Attribute",
                    priority: 5
                }
            }));
        };

        self.$filterPhrase = function (args) {
            var fromRegexp = /from((?:.(?!from))+)$/i;
            var result = fromRegexp.exec(args[0]);

            if (SiddhiEditor.debug) {
                console.warn(loggerContext + ":" + "$filterPhrase" + "->");
                console.log("result:", result);
            }
            var start = -1;
            var temp = "";
            var flag = true;

            this.streamStore = {};
            this.$streamReference(result[0]);
            for (var i = result[0].length - 1; i >= 0; i--) {
                if (start == 0) {
                    if (/\W/.test(result[0].charAt(i))) {
                        if (flag) {
                            continue;
                        } else {
                            break;
                        }
                    } else {
                        flag = false;
                        temp = result[0].charAt(i) + temp;
                    }
                }

                if (result[0].charAt(i) == ']') {
                    start--;
                }
                if (result[0].charAt(i) == '[') {
                    start++;
                }
            }

            addCompletions(logicalOperatorList.map(function (operator) {
                operator.priority = 1;
                return operator;
            }));
            if (SiddhiEditor.debug) {
                console.warn(loggerContext + ":" + "$filterPhrase" + "->");
                console.log("Event LIST ", temp);
            }

            if (this.streamStore.hasOwnProperty(temp)) {
                addCompletions([{value: "last", priority: 2}])
            } else {
                addCompletions(getStreamReferences().map(function(stream) {
                    return {
                        value: stream,
                        type: "Stream",
                        priority: 2
                    };
                }));

                addCompletions(this.streamList.getAttributeList(temp).map(function(attribute) {
                    return {
                        value: attribute,
                        type: "Stream Attribute",
                        priority: 3
                    };
                }));
            }
        };

        self.$nameSpacePhrase = function (args) {
            var result = args[1].exec(args[0]);
            var windowRegex = /#window.(\w+):$/i;
            var streamRegex = /#(\w+):$/i;
            var functionRegex = /(\w+):$/i;
            var ns = "";
            if (windowRegex.test(result[0])) {
                var windowResult = windowRegex.exec(result[0]);
                ns = windowResult[1];
                addCompletions(getExtensionWindowProcessors(ns));
            } else if (streamRegex.test(result[0])) {
                var streamFunctionPhrase = streamRegex.exec(result[0]);
                ns = streamFunctionPhrase[1];
                addCompletions(getExtensionStreamProcessors(ns));
            } else if (functionRegex.test(result[0])) {
                var functionPhrase = functionRegex.exec(result[0]);
                ns = functionPhrase[1];
                addCompletions(getExtensionFunctionNames(ns));
            }
        };

        self.$resolveVariable = function (args) {
            var result = args[1].exec(args[0]);
            if (SiddhiEditor.debug) {
                console.warn(loggerContext + ":" + "$resolveVariable" + "->");
                console.log("result ", result);
            }

            this.$streamReference(args[0]);
            this.$streamAlias(args[0]);

            if (this.tableList.hasTable(result[1])) {
                addCompletions(this.tableList.getAttributeList(result[1]).map(function(attribute) {
                    return {
                        value: attribute,
                        type: "Event Table Attribute",
                        priority: 1
                    };
                }));
            } else {
                if (this.streamStore.hasOwnProperty(result[1])) {
                    result[1] = this.streamStore[result[1]];
                }
                if (this.streamAliasList.hasOwnProperty(result[1])) {
                    result[1] = this.streamAliasList[result[1]];
                }
                if (this.streamList.hasStream(result[1])) {
                    addCompletions(this.streamList.getAttributeList(result[1]).map(function(stream) {
                        return {
                            value: stream,
                            type: "Stream",
                            priority: 1
                        };
                    }))
                }
            }
        };

        self.$streamAlias = function (str) {
            var fromRegxp = /from((?:.(?!from))+)$/i;
            var fromPhrase = fromRegxp.exec(str);
            var asRegexp = /\s+as\s+(\w+)\s+/;
            var tokenArray = fromPhrase[1].split(asRegexp);
            var streamIdList = this.streamList.getStreamIDList();

            var aliases = {};
            if (tokenArray.length >= 2) {
                for (var i = 0; i + 1 < tokenArray.length; i += 2) {
                    var maxIndex = 0;
                    var strId = "";
                    for (var j = 0; j < streamIdList.length; j++) {
                        var tempIndex = 0;
                        if (tempIndex = tokenArray[i].lastIndexOf(streamIdList[j]) >= 0) {
                            if (tempIndex > maxIndex)
                                strId = streamIdList[j];
                        }
                    }

                    aliases[tokenArray[i + 1]] = strId;
                    this.streamAliasList[tokenArray[i + 1]] = strId;
                }
            }
            return aliases;
        };

        self.$streamReferenceHandler = function (args) {
            var results = args[1].exec(args[0]);

            this.$streamReference(args[0]);
            this.$streamAlias(args[0]);

            var ref = this.streamStore[results[1]];
            var attributeList = this.streamList.getAttributeList(ref);
            addCompletions(attributeList.map(function(stream) {
                return {
                    value: stream,
                    type: "Stream Attribute"
                };
            }));
        };

        self.$streamReference = function (str) {
            var fromRegxp = /from((?:.(?!from))+)$/i;
            var fromPhrase = fromRegxp.exec(str);
            var eventRef = /(\w+\s*=\s*\w+)/;
            var tokenArray = fromPhrase[1].split(eventRef);

            for (var i = 0; i < tokenArray.length; i++) {
                if (tokenArray[i].indexOf('=') > 0 && tokenArray[i].indexOf('==') < 0 && tokenArray[i].indexOf('<=') < 0 && tokenArray[i].indexOf('>=') < 0) {
                    var keyValue = tokenArray[i].split("=");
                    if (SiddhiEditor.debug) {
                        console.warn(loggerContext + ":" + "$streamReference" + "->");
                        console.log("keyValue", keyValue);
                    }

                    var keyRegex = /(\w+)\s*$/i;
                    var valueRegex = /^\s*(\w+)/i;
                    var ref = keyRegex.exec(keyValue[0]);
                    var value = valueRegex.exec(keyValue[1]);

                    if (ref && value && ref[0] && value[0]) {
                        value = value[0].trim();
                        ref = ref[0].trim();

                        //Check the match with stream ID
                        // for (var j = 0; j < streamIdList.length; j++) {
                        //    var tempIndex = 0;
                        //    if (tempIndex = tokenArray[i].lastIndexOf(streamIdList[j]) >= 0) {
                        //        if (tempIndex > maxIndex)
                        //            strId = streamIdList[j];
                        //    }
                        //}

                        this.streamStore[ref] = value;
                    }
                }
            }
        };

        /**
         * Load meta data from a json file
         *
         * @param jsonFile JSON file from which the meta data should be loaded
         * @param type The type of meta data to be loaded
         */
        self.loadGeneralMetaData = function (jsonFile, type) {
            jQuery.getJSON("js/" + jsonFile, function (data) {
                CompletionEngine[type] = data;
            });
        };

        /**
         * Get the current stream alias list
         *
         * @returns {Array}
         */
        function getStreamAliasList() {
            var aliasList = [];
            for (var propertyName in this.streamAliasList) {
                if (this.streamAliasList.hasOwnProperty(propertyName))
                    aliasList.push(propertyName)
            }
            return aliasList;
        }

        /**
         * Get the current event references list
         *
         * @returns {Array}
         */
        function getStreamReferences() {
            var aliasList = [];
            for (var propertyName in this.streamStore) {
                if (this.streamStore.hasOwnProperty(propertyName))
                    aliasList.push(propertyName)
            }
            return aliasList;
        }

        /**
         * Get the list of namespaces which has artifacts in  objType1 or objType2 categories
         *
         * @param {string} objType1 windowProcessors|functions|streamProcessors
         * @param {string} [objType2] windowProcessors|functions|streamProcessors
         * @returns {Array} list of namespaces.
         */
        function getExtensionNamesSpaces(objType1, objType2) {
            var tempList = [];
            for (var propertyName in CompletionEngine.extensions) {
                if (CompletionEngine.extensions.hasOwnProperty(propertyName)) {
                    if (SiddhiEditor.debug) {
                        console.warn(loggerContext + ":" + "getExtensionNamesSpaces" + "->");
                        console.log(CompletionEngine.extensions[propertyName][objType1], objType1, propertyName);
                        console.log("RESULTS", objType1 && !isEmpty(CompletionEngine.extensions[propertyName][objType1]));
                    }

                    if ((objType1 && !isEmpty(CompletionEngine.extensions[propertyName][objType1])) ||
                        (objType2 && !isEmpty(CompletionEngine.extensions[propertyName][objType2]))) {
                        tempList.push(propertyName);
                    } else if (!objType1 && !objType2) {
                        tempList.push(propertyName);
                    }
                }
            }
            return tempList;
        }

        /**
         * Get the list of  extension functions of given namespace
         *
         * @param {string} namespace namespace of the functions
         * @returns {Array} : list of function names
         */
        function getExtensionFunctionNames(namespace) {
            var tempList = [];
            for (var i = 0; i < CompletionEngine.extensions[namespace].functions.length; i++) {
                tempList.push({
                    value: CompletionEngine.extensions[namespace].functions[i].name,
                    description: CompletionEngine.extensions[namespace].functions[i].description,
                    parameters: CompletionEngine.extensions[namespace].functions[i].parameters,
                    return: CompletionEngine.extensions[namespace].functions[i].return,
                    type: "Function Extension"
                });
        }
            return tempList;
        }

        /**
         * Get the list of  extension window processors of given namespace
         *
         * @param {string} namespace namespace of the window processors
         * @returns {Array} list of window processor names
         */
        function getExtensionWindowProcessors(namespace) {
            var tempList = [];
            for (var i = 0; i < CompletionEngine.extensions[namespace].windowProcessors.length; i++) {
                tempList.push({
                    value: CompletionEngine.extensions[namespace].windowProcessors[i].name,
                    description: CompletionEngine.extensions[namespace].windowProcessors[i].description,
                    parameters: CompletionEngine.extensions[namespace].windowProcessors[i].parameters,
                    return: CompletionEngine.extensions[namespace].windowProcessors[i].return,
                    type: "Window Processor Extension"
                });
            }
            return tempList;
        }

        /**
         * Get the list of  extension stream processors of given namespace
         *
         * @param {string} namespace namespace of the stream processors
         * @returns {Array} list of stream processor names
         */
        function getExtensionStreamProcessors(namespace) {
            var tempList = [];
            for (var i = 0; i < CompletionEngine.extensions[namespace].streamProcessors.length; i++) {
                tempList.push({
                    value: CompletionEngine.extensions[namespace].streamProcessors[i].name,
                    description: CompletionEngine.extensions[namespace].streamProcessors[i].description,
                    parameters: CompletionEngine.extensions[namespace].streamProcessors[i].parameters,
                    return: CompletionEngine.extensions[namespace].streamProcessors[i].return,
                    type: "Stream Processor Extension"
                });
            }
            return tempList;
        }

        /**
         * Get the list of inbuilt function names
         *
         * @returns {Array} list of function names
         */
        function getInBuiltFunctionNames() {
            var tempList = [];
            for (var i = 0; i < CompletionEngine.inBuilt.functions.length; i++) {
                tempList.push({
                    value: CompletionEngine.inBuilt.functions[i].name,
                    description: CompletionEngine.inBuilt.functions[i].description,
                    parameters: CompletionEngine.inBuilt.functions[i].parameters,
                    return: CompletionEngine.inBuilt.functions[i].return,
                    type: "Function"
                });
            }
            return tempList;
        }

        /**
         * Get the list of inbuilt window processor names
         *
         * @returns {Array} list of window processor names
         */
        function getInBuiltWindowProcessors() {
            var tempList = [];
            for (var i = 0; i < CompletionEngine.inBuilt.windowProcessors.length; i++) {
                tempList.push({
                    value: CompletionEngine.inBuilt.windowProcessors[i].name,
                    description: CompletionEngine.inBuilt.windowProcessors[i].description,
                    parameters: CompletionEngine.inBuilt.windowProcessors[i].parameters,
                    return: CompletionEngine.inBuilt.windowProcessors[i].return,
                    type: "Window Processor"
                });
            }
            return tempList;
        }

        /**
         * Get the list of inbuilt stream processor names
         *
         * @returns {Array} list of stream processor names
         */
        function getInBuiltStreamProcessors() {
            var tempList = [];
            for (var i = 0; i < CompletionEngine.inBuilt.streamProcessors.length; i++) {
                tempList.push({
                    value: CompletionEngine.inBuilt.streamProcessors[i].name,
                    description: CompletionEngine.inBuilt.streamProcessors[i].description,
                    parameters: CompletionEngine.inBuilt.streamProcessors[i].parameters,
                    return: CompletionEngine.inBuilt.streamProcessors[i].return,
                    type: "Stream Processor"
                });
            }
            return tempList;
        }

        /**
         * This function will call a given function by it's name within given context
         *
         * @param {string} functionName name of the function
         * @param {Array} args arguments array that would be passed to the function
         * @returns {*}
         */
        function executeFunctionByName(functionName, args) {
            return this[functionName].call(this, args);
        }

        /**
         * Add a new completions to the words list
         *
         * @param {Object[]} suggestions list of  suggestions
         */
        function addCompletions(suggestions) {
            for (var i = 0; i < suggestions.length; i++) {
                var suggestion = suggestions[i];
                var completion = {
                    caption: (suggestion.caption == undefined ? suggestion.value : suggestion.caption),
                    value: suggestion.value,
                    score: (suggestions.priority == undefined ? 1 : suggestions.priority),
                    meta: suggestion.type,
                    description: suggestion.description,
                    parameters: suggestion.parameters,
                    return: suggestion.return
                };
                if (suggestion.parameters) {
                    completion.value += "(";
                    for (var j = 0; j < suggestion.parameters.length; j++) {
                        if (j != 0) {
                            completion.value += ", ";
                        }
                        completion.value += suggestion.parameters[j].name;
                    }
                    completion.value += ")";

                }
                self.wordList.push(completion);
            }
        }
    };

    /*
     * extension' json object contains the custom function,streamProcessor and windowProcessor extensions available for
     * the current Siddhi Session. Currently the extensions listed in the documentation are listed below.
     * But this data structure should be dynamically pull down from the backend services.
     *
     * SCHEMA
     * ------
     *    extensions={
     *       namespace1:{
     *                  functions:{
     *                              function1:[  // array is used here to allow multiple representations of the same function
     *                                          {
     *                                              Description: "description of the function1",
     *                                              argNames: ["p1"],
     *                                              argTypes: [["float", "double"]],
     *                                              returnType: ["float", "double"]
     *                                          }
     *                              ],
     *                              function2:[
     *                                          {
     *                                              //representation of the function2
     *                                          }
     *                              ]
     *                  },
     *                  streamProcessors:{
     *                         // Same as in function section
     *                  }  ,
     *                  windowProcessors:{
     *                          // same as in function section
     *                  }
     *       },
     *
     *       namespace2:{
     *                  functions:{
     *
     *                  },
     *
     *                  streamProcessors:{
     *                         // Same as in function section
     *                  }
     *                  ,
     *
     *                  windowProcessors:{
     *                          // same as in function section
     *                  }
     *       }
     *
     *
     *    }
     */
    CompletionEngine.extensions = {};

    // System json object contains the inbuilt function,streamProcessor and windowProcessor  available for the current Siddhi Session
    CompletionEngine.inBuilt = {};

    // Constructor of the Stream class is exposed to global scope
    CompletionEngine.Stream = Stream;

    /**
     * Check whether a given object has properties or not
     *
     * @param {object} map : object
     * @returns {boolean} : true if the object has properties. false if the object is empty
     */
    function isEmpty(map) {
        for (var key in map) {
            if (map.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    }


    /*************************************************************************************************************************
     *                                          Prototypes and constructors
     *************************************************************************************************************************/

    // Stream class represent the abstraction of Stream
    function Stream() {
        this.id = "";
        this.attributeNames = [];
        this.attributeTypes = [];
    }

    Stream.prototype.setStreamFromDefineStatement = function (ctx) {
        this.id = ctx.source().start.text;
        var counter = 0;
        while (attrName = ctx.attribute_name(counter)) {
            this.attributeNames.push(ctx.attribute_name(counter).start.text);
            this.attributeTypes.push(ctx.attribute_type(counter).start.text);
            counter++;
        }
    };
    Stream.prototype.getAttributeNameList = function () {
        return this.attributeNames;
    };
    Stream.prototype.getAttribute = function (i) {
        return this.attributeNames[i];
    };

    // StreamList Class represents the symbolic list for streams within the execution plan
    function StreamList() {
        this.streamList = {};
    }

    StreamList.prototype.addStream = function (streamObj) {
        this.streamList[streamObj.id] = streamObj;
    };
    StreamList.prototype.getAttributeList = function (id) {
        if (!this.streamList[id])
            return [];
        return this.streamList[id].getAttributeNameList();
    };
    StreamList.prototype.clear = function () {
        this.streamList = {};
        //var array=this.getStreamIDList();
        //for(var i=0;i<array.length;i++)
        //{
        //    delete this.editor.completionEngine.streamList[array[i]];
        //}
    };
    StreamList.prototype.getStreamIDList = function () {
        var temp = [];
        for (var propertyName in this.streamList) {
            // propertyName is what you want
            // you can get the value like this: myObject[propertyName]
            if (this.streamList.hasOwnProperty(propertyName))
                temp.push(propertyName);
        }
        return temp;
    };
    StreamList.prototype.hasStream = function (id) {
        var status = false;
        this.getStreamIDList().map(function (d) {
            if (id == d)
                status = true;
        });
        return status;
    };


    // Table prototype represents Stream Table
    function Table() {
        this.id = "";
        this.attributeNames = [];
        this.attributeTypes = [];
    }

    Table.prototype.setTableFromDefineStatement = function (ctx) {
        this.id = ctx.source().start.text;
        var counter = 0;
        while (attrName = ctx.attribute_name(counter)) {
            this.attributeNames.push(ctx.attribute_name(counter).start.text);
            this.attributeTypes.push(ctx.attribute_type(counter).start.text);
            counter++;
        }
    };
    Table.prototype.getAttributeNameList = function () {
        return this.attributeNames;
    };
    Table.prototype.getAttribute = function (i) {
        return this.attributeNames[i];
    };
    Table.prototype.setTableFromDefineStatement = function (ctx) {
        this.id = ctx.source().start.text;
        var counter = 0;
        var attrName;

        while (attrName = ctx.attribute_name(counter)) {
            this.attributeNames.push(ctx.attribute_name(counter).start.text);
            this.attributeTypes.push(ctx.attribute_type(counter).start.text);
            counter++;
        }
    };
    Table.prototype.getAttributeNameList = function () {
        return this.attributeNames;
    };
    Table.prototype.getAttribute = function (i) {
        return this.attributeNames[i];
    };

    // TableList class represent the symbolic list of Stream tables
    function TableList() {
        this.tableList = {};
    }

    TableList.prototype.addTable = function (tableObj) {
        this.tableList[tableObj.id] = tableObj;
    };
    TableList.prototype.getAttributeList = function (id) {
        return this.tableList[id].getAttributeNameList();
    };
    TableList.prototype.getTableIDList = function () {
        var temp = [];
        for (var propertyName in this.tableList) {
            if (this.tableList.hasOwnProperty(propertyName))
                temp.push(propertyName);
        }
        return temp;
    };
    TableList.prototype.hasTable = function (id) {
        var status = false;
        this.getTableIDList().map(function (d) {
            if (id == d)
                status = true;
        });
        return status;
    };


    // Function class which represent the functions defined within the execution plan
    function Function() {
        this.id = "";
        this.lang = "";
        this.returnType = "";
        this.code = "";
    }

    // FunctionList
    function FunctionList() {
        this.functionList = {};
    }

    FunctionList.prototype.addFunction = function (functionObj) {
        this.functionList[functionObj.id] = functionObj;
    };
    FunctionList.prototype.getFunctionIDList = function () {
        var temp = [];
        for (var propertyName in this.functionList) {
            if (this.functionList.hasOwnProperty(propertyName)) {
                temp.push(propertyName);
            }
        }
        return temp;
    };
})();