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

    // Aliases for the attribute names used in 'CompletionEngine.functionOperationSnippets.extensions' and 'CompletionEngine.functionOperationSnippets.inBuilt' json objects
    var FUNCTIONS = "functions";
    var STREAM_PROCESSORS = "streamProcessors";
    var WINDOW_PROCESSORS = "windowProcessors";

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

    // Following keyword lists are repeated in many functions
    var logicalOperatorList = ["IN", "AND", "OR", "NOT", "IS NULL", "CONTAINS"].map(function (operator) {
        return {
            value: operator
        };
    });
    var dataTypes = ["int", "float", "double", "bool", "time", "object", "string", "long"].map(function (dataType) {
        return {
            value: dataType
        };
    });

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
            regex: "from\\s+" + queryInput + "#window\\.$",
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

    // Loading meta data from the server
    loadMetaData();

    window.CompletionEngine = function () {
        var self = this;

        // List of streams that would keep the meta data of the streams defined/inferred within the query.
        self.streamList = new StreamList();

        // List of tables that would keep the meta data of the tables defined within the query.
        self.tableList = new TableList();

        // List of functions that would keep the meta data of the functions defined within the query.
        self.functionList = new FunctionList();

        /*
         * Stream aliases in query are stored as a list of  aliasName:streamID .
         * ex :
         *  query
         *  -----
         *  from streamB as myStream join streamA as foo ...
         *
         *  representation
         *  --------------
         *  streamAliasList = [
         *      {
         *          myStream : streamB,
         *          foo : streamA
         *      }
         *  ]
         */
        self.streamAliasList = {};

        /*
         * Event references in a query are stored as a list of  aliasName:streamID .
         * ex :
         *  query
         *  -----
         *  from e1=streamB -> e2=streamA ...
         *
         *  representation
         *  --------------
         *  streamStore ={
         *    e1 : streamB,
         *    e2 : streamA
         *  }
         */
        self.streamStore = {};

        /*
         * CompletionEngine.wordList is the current suggestions list . This is an array of objects with following format
         * {
         *       definition:"suggestion name",
         *       value : "suggestion value"
         *       score : 2,
         *       meta : "keyword"
         * }
         */
        self.wordList = [];

        // Snippets that had been added to the SnippetManager. This is stored so that they can be removed when the next suggestion need to be calculated
        self.suggestedSnippets = [];

        // SiddhiCompleter provides language specific suggestions
        self.SiddhiCompleter = {
            getCompletions: function (editor, session, pos, prefix, callback) {
                self.calculateCompletions(editor);      // Calculate the suggestions list for current context
                self.checkTheBeginning(editor);

                // This completer will be using the wordList array
                // context-handler functions will be updated the the worldList based on the context around the cursor position
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
                        if (!caption)
                            continue;
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
            var completerList = [this.SiddhiCompleter, this.SnippetCompleter];
            // SiddhiCompleter needs to be the first completer in the list as it will update the snippets
            if (this.isKeyWordCompleterRequired(editor)) {
                // If the cursor is in the middle of a query and not preceded by a dot operator
                completerList.push(SiddhiEditor.langTools.keyWordCompleter);
            }
            editor.completers = completerList;

            if (this.checkTheBeginning(editor)) {
                SiddhiEditor.SnippetManager.register(initialSnippets, "siddhi");
            } else {
                SiddhiEditor.SnippetManager.unregister(initialSnippets, "siddhi");
            }
        };

        /**
         * Check whether the cursor is positioned next to a dot operator or namespace operator
         *
         * @param {Object} editor ace editor instance
         * @returns {boolean} true if the cursor is positioned just after the dot operator or namespace operator
         */
        self.isKeyWordCompleterRequired = function (editor) {
            var objectNameRegex = /\w*\.$/i;
            var namespaceRegex = /\w*:$/i;
            var txt = editor.getValue();
            return !(objectNameRegex.test(txt) || namespaceRegex.test(txt));
        };

        /**
         * Check whether the cursor is positioned at the beginning of a query
         *
         * @param {Object} editor ace editor instance
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
         * @param {Object} editor ace editor instance
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

            self.wordList = [];                                                         // Clear the previous suggestion list
            SiddhiEditor.SnippetManager.unregister(self.suggestedSnippets, "siddhi");   // Clear the previous snippet suggestions
            self.suggestedSnippets = [];
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

            addCompletions(essentialKeyWords.map(function (keyword) {
                return {
                    value: keyword,
                    priority: 2
                };
            }));
            addCompletions(this.streamList.getStreamIDList().map(function (stream) {
                return {
                    value: stream,
                    type: "Stream",
                    priority: 3
                };
            }));
            addCompletions(getStreamReferences().map(function (stream) {
                return {
                    value: stream + ".",
                    type: "Stream",
                    priority: 4
                };
            }));
            addCompletions(getStreamAliasList().map(function (stream) {
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
                    list = list.concat(this.streamList.getAttributeNameList(streamNames[index]));
                }
            }

            if (SiddhiEditor.debug) {
                console.warn(loggerContext + ":" + "$selectPhraseAttributesList" + "->");
                console.log("generated list", list);
            }

            addCompletions(streamIds.map(function (stream) {
                return {
                    value: stream + ".",
                    type: "Stream",
                    priority: 5
                };
            }));
            addCompletions(list.map(function (stream) {
                return {
                    value: stream,
                    type: "Stream Attribute",
                    priority: 8
                };
            }));
            addCompletions(refList.map(function (stream) {
                return {
                    value: stream,
                    type: "Stream",
                    priority: 7
                };
            }));
            addCompletions(aliasList.map(function (stream) {
                return {
                    value: stream,
                    type: "Stream",
                    priority: 6
                };
            }));
            addCompletions(tableList.map(function (table) {
                return {
                    value: table,
                    type: "Event Table",
                    priority: 4
                };
            }));
            addCompletions(ns.map(function (namespace) {
                return {
                    value: namespace,
                    type: "Extension Namespace",
                    priority: 3
                };
            }));
            addCompletions(keywords.map(function (keyword) {
                keyword.priority = 1;
                return keyword;
            }));
            addSnippets(getInBuiltFunctionNames());
        };

        self.$windowPhrase = function () {
            addSnippets(getInBuiltWindowProcessors());

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

            addCompletions(getExtensionNamesSpaces(WINDOW_PROCESSORS, STREAM_PROCESSORS).map(function (ns) {
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
                var attributeList = this.streamList.getAttributeNameList(streamList[s]);
                addCompletions(attributeList.map(function (attribute) {
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
                var attributeList = this.streamList.getAttributeNameList(streamList[i]);
                for (var index = 0; index < attributeList.length; index++) {
                    if (attributeList[index] == identifierResult[1]) {
                        tempList.push(streamList[i]);
                        break;
                    }
                }
            }
            addCompletions(tempList.map(function (stream) {
                return {
                    value: stream,
                    type: "Stream"
                };
            }));
        };

        self.$TableSuggestions = function (args) {
            addCompletions(this.tableList.getTableIDList().map(function (stream) {
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
                    attributeList = attributeList.concat(this.streamList.getAttributeNameList(streamNames[i]))
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
                return {
                    value: d + ".",
                    type: "Event Table",
                    priority: 4
                }
            }));

            addCompletions(attributeList.map(function (attribute) {
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

            addCompletions(keywords.map(function (keyword) {
                keyword.priority = 1;
                return keyword;
            }));
            addCompletions(streamNames.map(function (stream) {
                return {
                    value: stream + ".",
                    type: "Stream",
                    priority: 2
                };
            }));
            for (var index = 0; index < streamNames.length; index++) {
                regex = new RegExp("[^a-zA-Z]" + streamNames[index] + "[^a-zA-Z0-9]");
                if (fromPhrase[1].match(regex)) {
                    addCompletions(this.streamList.getAttributeNameList(streamNames[index]).map(function (stream) {
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
                    attributeList = attributeList.concat(this.streamList.getAttributeNameList(streamNames[index]));
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

            addSnippets(getInBuiltFunctionNames());

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
                addCompletions(getStreamReferences().map(function (stream) {
                    return {
                        value: stream,
                        type: "Stream",
                        priority: 2
                    };
                }));

                addCompletions(this.streamList.getAttributeNameList(temp).map(function (attribute) {
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
                addSnippets(getExtensionWindowProcessors(ns));
            } else if (streamRegex.test(result[0])) {
                var streamFunctionPhrase = streamRegex.exec(result[0]);
                ns = streamFunctionPhrase[1];
                addSnippets(getExtensionStreamProcessors(ns));
            } else if (functionRegex.test(result[0])) {
                var functionPhrase = functionRegex.exec(result[0]);
                ns = functionPhrase[1];
                addSnippets(getExtensionFunctionNames(ns));
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
                addCompletions(this.tableList.getAttributeNameList(result[1]).map(function (attribute) {
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
                    addCompletions(this.streamList.getAttributeNameList(result[1]).map(function (stream) {
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
            var attributeList = this.streamList.getAttributeNameList(ref);
            addCompletions(attributeList.map(function (stream) {
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
            for (var propertyName in CompletionEngine.functionOperationSnippets.extensions) {
                if (CompletionEngine.functionOperationSnippets.extensions.hasOwnProperty(propertyName)) {
                    if (SiddhiEditor.debug) {
                        console.warn(loggerContext + ":" + "getExtensionNamesSpaces" + "->");
                        console.log(CompletionEngine.functionOperationSnippets.extensions[propertyName][objType1], objType1, propertyName);
                        console.log("RESULTS", objType1 && !isEmpty(CompletionEngine.functionOperationSnippets.extensions[propertyName][objType1]));
                    }

                    if ((objType1 && !isEmpty(CompletionEngine.functionOperationSnippets.extensions[propertyName][objType1])) ||
                        (objType2 && !isEmpty(CompletionEngine.functionOperationSnippets.extensions[propertyName][objType2]))) {
                        tempList.push(propertyName);
                    } else if (!objType1 && !objType2) {
                        tempList.push(propertyName);
                    }
                }
            }
            return tempList;
        }

        /**
         * Get the list of  extension function snippets of given namespace
         *
         * @param {string} namespace namespace of the functions
         * @returns {Array} : list of function snippets
         */
        function getExtensionFunctionNames(namespace) {
            return Object.values(CompletionEngine.functionOperationSnippets.extensions[namespace].functions).map(function (processor) {
                processor.type = "Function";
                return processor;
            });
        }

        /**
         * Get the list of  extension window processor snippets of given namespace
         *
         * @param {string} namespace namespace of the window processors
         * @returns {Array} list of window processor snippets
         */
        function getExtensionWindowProcessors(namespace) {
            return Object.values(CompletionEngine.functionOperationSnippets.extensions[namespace].windowProcessors).map(function (processor) {
                processor.type = "Window Processor";
                return processor;
            });
        }

        /**
         * Get the list of  extension stream processor snippets of given namespace
         *
         * @param {string} namespace namespace of the stream processors
         * @returns {Array} list of stream processor snippets
         */
        function getExtensionStreamProcessors(namespace) {
            return Object.values(CompletionEngine.functionOperationSnippets.extensions[namespace].streamProcessors).map(function (processor) {
                processor.type = "Stream Processor";
                return processor;
            });
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
         * @param {Array} args arguments array that would be passed to the function
         * @returns {*} return from the executed function
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
                    parameters: suggestion.parameters,
                    description: suggestion.description,
                    returnType: suggestion.returnType
                };
                if (completion.parameters) {
                    var snippet = generateSnippet({
                        name: completion.caption,
                        description: completion.description,
                        parameters: completion.parameters,
                        returnType: completion.returnType
                    });
                    addSnippets(snippet);

                    // Adding to the additional snippets to be used in token tool tips
                    if (!CompletionEngine.functionOperationSnippets.additional[completion.caption]) {
                        CompletionEngine.functionOperationSnippets.additional[completion.caption] = snippet;
                    }
                } else {
                    self.wordList.push(completion);
                }
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
    };

    // Constructors to expose to the global scope
    CompletionEngine.Stream = Stream;
    CompletionEngine.Table = Table;

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
        inBuilt: {},

        /* Additional function operations used by the completion engine
         *
         *    additional = {
         *          functionOperation1Name : {snippet},
         *          functionOperation2Name : {snippet}
         *    {
         */
        additional: {}
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
        var snippetText = "snippet " + processorMetaData.name + "\n\t" +
            processorMetaData.name + "(";
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
        var snippet = SiddhiEditor.SnippetManager.parseSnippetFile(snippetText)[0];

        snippet.description = generateDescription(processorMetaData);
        return snippet;
    }

    /**
     * Generate description html string from meta data
     * Descriptions are intended to be shown in the tooltips for a completions
     *
     * @param {Object} metaData Meta data object containing parameters, return and description
     * @return {string} html string of the description generated from the meta data provided
     */
    function generateDescription(metaData) {
        var description = "<div>" +
            (metaData.name ? "<strong>" + metaData.name + "</strong><br>" : "") +
            (metaData.description ? "<p>" + SiddhiEditor.utils.wordWrap(metaData.description, 100) + "</p>" : "<br>");
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
        this.attributes = {};
    }

    Stream.prototype.setStreamFromDefineStatement = function (ctx) {
        this.id = ctx.source().start.text;
        var counter = 0;
        var attrName;
        while (attrName = ctx.attribute_name(counter)) {
            this.attributes[ctx.attribute_name(counter).start.text] = ctx.attribute_type(counter).start.text;
            counter++;
        }
    };
    Stream.prototype.getAttributeList = function () {
        return this.attributes;
    };
    Stream.prototype.getAttributeNameList = function () {
        return Object.keys(this.attributes);
    };
    Stream.prototype.getAttribute = function (i) {
        return Object.keys(this.attributes)[i];
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
            return {};
        return this.streamList[id].getAttributeList();
    };
    StreamList.prototype.getAttributeNameList = function (id) {
        if (!this.streamList[id])
            return {};
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
        this.attributes = {};
    }

    Table.prototype.setTableFromDefineStatement = function (ctx) {
        this.id = ctx.source().start.text;
        var counter = 0;
        var attrName;
        while (attrName = ctx.attribute_name(counter)) {
            this.attributes[ctx.attribute_name(counter).start.text] = ctx.attribute_type(counter).start.text;
            counter++;
        }
    };
    Table.prototype.getAttributeNameList = function () {
        return Object.keys(this.attributes);
    };
    Table.prototype.getAttributeList = function () {
        return this.attributes;
    };
    Table.prototype.getAttribute = function (i) {
        return Object.keys(this.attributes)[i];
    };

    // TableList class represent the symbolic list of Stream tables
    function TableList() {
        this.tableList = {};
    }

    TableList.prototype.addTable = function (tableObj) {
        this.tableList[tableObj.id] = tableObj;
    };
    TableList.prototype.getAttributeNameList = function (id) {
        if (!this.tableList[id])
            return {};
        return this.tableList[id].getAttributeNameList();
    };
    TableList.prototype.getAttributeList = function (id) {
        if (!this.tableList[id])
            return {};
        return this.tableList[id].getAttributeList();
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