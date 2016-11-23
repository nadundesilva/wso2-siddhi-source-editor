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

/**
 *  This Script contains the integration code segment of Siddhi editor.
 *  This will set the options of ACE editor, attach client side parser and attach SiddhiCompletion Engine with the editor
 **/
(function () {
    // Adding SiddhiEditor to global scope
    var SiddhiEditor = window.SiddhiEditor || {};
    window.SiddhiEditor = SiddhiEditor;

    // Finding the base url of the plugin
    var scripts = document.getElementsByTagName("script");
    // Get "src" attribute of the <script> tag for the current file
    // (last tag in the array since tags after that are not yet added to it)
    var relativePathToCurrentJS = scripts[scripts.length - 1].getAttribute("src");
    SiddhiEditor.baseURL =
        relativePathToCurrentJS.substring(0, relativePathToCurrentJS.length - "js/siddhi-editor.js".length);

    SiddhiEditor.serverURL = "http://localhost:8080/";
    SiddhiEditor.serverSideValidationDelay = 2000;
    SiddhiEditor.tokenTooltipUpdateDelay = 1000;

    // Used in separating statements
    SiddhiEditor.statementStartToEndKeywordMap = {
        "@": "\\)",
        "define": ";",
        "from": ";",
        "partition": "end\\s*;",
        "/\\*": "\\*/",
        "--": "[\r\n]"
    };

    /*
     * Annotations, Annotation Names and relevant tokens
     */
    var ACE_CONSTANT = {
        SNIPPET_MANAGER: "ace/snippets",
        LANG_TOOLS: "ace/ext/language_tools",
        SIDDHI_MODE: "ace/mode/siddhi",
        DEFAULT_THEME: "ace/theme/crimson_editor",
        ACE_RANGE: "ace/range",
        LANG_LIB: "ace/lib/lang"
    };
    var SIDDHI_EDITOR_CONSTANT = {
        ROOT: SiddhiEditor.baseURL + "js/",
        TOKEN_TOOLTIP: "token-tooltip",
        COMPLETION_ENGINE: "completion-engine"
    };
    var ANTLR_CONSTANT = {
        ROOT: SiddhiEditor.baseURL + "js/antlr/",
        SYNTAX_ERROR_LISTENER: "SyntaxErrorListener",
        SIDDHI_DATA_POPULATION_LISTENER: "DataPopulationListener",
        SIDDHI_TOKEN_TOOL_TIP_UPDATE_LISTENER: "TokenToolTipUpdateListener",
        SIDDHI_PARSER: "gen/SiddhiQLParser",
        SIDDHI_LEXER: "gen/SiddhiQLLexer"
    };
    var ANTLR_RUNTIME_INDEX = SiddhiEditor.baseURL + "lib/antlr4-js-runtime/index";

    // ANTLR4 JS runtime integration code segment goes here..
    var antlr4 = require(ANTLR_RUNTIME_INDEX);                                                                          // ANTLR4 JS runtime
    var SiddhiQLLexer = require(ANTLR_CONSTANT.ROOT + ANTLR_CONSTANT.SIDDHI_LEXER).SiddhiQLLexer;
    var SiddhiQLParser = require(ANTLR_CONSTANT.ROOT + ANTLR_CONSTANT.SIDDHI_PARSER).SiddhiQLParser;
    var DataPopulationListener = require(ANTLR_CONSTANT.ROOT + ANTLR_CONSTANT.SIDDHI_DATA_POPULATION_LISTENER).DataPopulationListener;
    var TokenToolTipUpdateListener = require(ANTLR_CONSTANT.ROOT + ANTLR_CONSTANT.SIDDHI_TOKEN_TOOL_TIP_UPDATE_LISTENER).TokenToolTipUpdateListener;
    var SyntaxErrorListener = require(ANTLR_CONSTANT.ROOT + ANTLR_CONSTANT.SYNTAX_ERROR_LISTENER).SyntaxErrorListener;
    var TokenTooltip = require(SIDDHI_EDITOR_CONSTANT.ROOT + SIDDHI_EDITOR_CONSTANT.TOKEN_TOOLTIP).TokenTooltip;        // Required for token tooltips
    var langTools = ace.require(ACE_CONSTANT.LANG_TOOLS);                              // Required for auto completion

    SiddhiEditor.SnippetManager = ace.require(ACE_CONSTANT.SNIPPET_MANAGER).snippetManager;     // Required for changing the snippets used
    SiddhiEditor.Range = ace.require(ACE_CONSTANT.ACE_RANGE).Range;                             // Required for extracting part of the query
    SiddhiEditor.lang = ace.require(ACE_CONSTANT.LANG_LIB);
    SiddhiEditor.CompletionEngine = require(SIDDHI_EDITOR_CONSTANT.ROOT +
        SIDDHI_EDITOR_CONSTANT.COMPLETION_ENGINE).CompletionEngine;

    /**
     * Initialize the editor
     *
     * @param {Object} config The configuration object to be used in the initialization
     * @return {Object} ace editor instance
     */
    SiddhiEditor.init = function (config) {
        var editor = ace.edit(config.divID);                // Setting the DivID of the Editor .. Could be <pre> or <div> tags

        editor.realTimeValidation = config.realTimeValidation;
        new TokenTooltip(editor);
        editor.setReadOnly(config.readOnly);

        // Setting the editor options
        editor.session.setMode(ACE_CONSTANT.SIDDHI_MODE);   // Language mode located at ace_editor/mode-siddhi.js
        editor.setTheme(config.theme ? "ace/theme/" + config.theme : ACE_CONSTANT.DEFAULT_THEME);
        editor.getSession().setUseWrapMode(true);
        editor.getSession().setTabSize(4);
        editor.getSession().setUseSoftTabs(true);
        editor.setShowFoldWidgets(true);
        editor.setBehavioursEnabled(true);
        editor.setHighlightSelectedWord(true);
        editor.setHighlightActiveLine(true);
        editor.setDisplayIndentGuides(true);
        editor.setShowPrintMargin(false);
        editor.setOptions({
            enableBasicAutocompletion: !config.readOnly && config.autoCompletion,
            enableSnippets: !config.readOnly && config.autoCompletion,
            enableLiveAutocompletion: config.autoCompletion,
            autoScrollEditorIntoView: true,
            enableMultiselect: false
        });

        // State variables for error checking and highlighting
        editor.state = {};
        editor.state.previousParserTree = "";
        editor.state.syntaxErrorList = [];      // To save the syntax Errors with line numbers
        editor.state.semanticErrorList = [];    // To save semanticErrors with line numbers
        editor.state.lastEdit = 0;              // Last edit time

        // Adding the default text into the editor
        editor.setValue("/* Enter a unique ExecutionPlan */\n" +
            "@Plan:name('ExecutionPlan')\n\n" +
            "/* Enter a unique description for ExecutionPlan */\n" +
            "-- @Plan:description('ExecutionPlan')\n\n" +
            "/* define streams/tables and write queries here ... */\n\n", 1);
        editor.focus();

        editor.completionEngine = new SiddhiEditor.CompletionEngine();

        // Attaching editor's onChange event handler
        editor.getSession().on('change', editorChangeHandler);

        // For adjusting the completer list as required
        adjustAutoCompletionHandlers();
        editor.commands.on('afterExec', function () {
            adjustAutoCompletionHandlers();
        });

        // Adding events for adjusting the completions list styles
        var completionTypeToStyleMap = {
            "snippet": "font-style: italic;"
        };
        editor.renderer.on("afterRender", function () {
            // Checking if a popup is open when the editor is re-rendered
            if (editor.completer && editor.completer.popup) {
                // Adding a on after render event for updating the popup styles
                editor.completer.popup.renderer.on("afterRender", function () {
                    var completionElements = document.querySelectorAll(
                        ".ace_autocomplete > .ace_scroller > .ace_content > .ace_text-layer > .ace_line"
                    );
                    for (var i = 0; i < completionElements.length; i++) {
                        var element = completionElements[i].getElementsByClassName("ace_rightAlignedText")[0];
                        if (element && completionTypeToStyleMap[element.innerHTML]) {
                            completionElements[i].setAttribute("style", completionTypeToStyleMap[element.innerHTML]);
                        }
                    }
                });
            }
        });

        /**
         * Dynamically select the completers suitable for current context
         *
         */
        function adjustAutoCompletionHandlers() {
            // This method will dynamically select the appropriate completer for current context when auto complete event occurred.
            // SiddhiCompleter needs to be the first completer in the list as it will update the snippets
            var completerList = [editor.completionEngine.SiddhiCompleter, editor.completionEngine.SnippetCompleter];

            // Adding keyword completor if the cursor is not in front of dot or colon
            var objectNameRegex = new RegExp("[a-zA-Z_][a-zA-Z_0-9]*\\s*\\.\\s*$", "i");
            var namespaceRegex = new RegExp("[a-zA-Z_][a-zA-Z_0-9]*\\s*:\\s*$", "i");
            var editorText = editor.getValue();
            if (!(objectNameRegex.test(editorText) || namespaceRegex.test(editorText))) {
                completerList.push(langTools.keyWordCompleter);
            }

            editor.completers = completerList;
        }

        /**
         * Editor change handler
         */
        function editorChangeHandler() {
            editor.completionEngine.clearData();                // Clear the exiting completion engine data

            // Clearing all errors before finding the errors again
            editor.state.semanticErrorList = [];
            editor.state.syntaxErrorList = [];

            // Following code segment parse the input query using antlr4's parser and lexer
            var errorListener = new SyntaxErrorListener(editor);
            var editorText = editor.getValue().trim();          // Input text
            var txt = new antlr4.InputStream(editorText);       // Input stream
            var lexer = new SiddhiQLLexer(txt);                 // Generating lexer
            lexer._listeners = [];
            lexer._listeners.push(errorListener);
            var tokens = new antlr4.CommonTokenStream(lexer);   // Generated a token stream
            var parser = new SiddhiQLParser(tokens);            // Using the token stream , generate the parser
            parser._listeners = [];
            parser._listeners.push(errorListener);
            parser.buildParseTrees = true;

            // parser() is the root level grammar rule. This line generates a parser tree.
            // when generating the new parserTree, the ErrorListener
            // (client-side-siddhi-parser/antlr4/error/ErrorListener.js -> ConsoleErrorListener.syntaxError())
            // will be invoked automatically.
            // within that method , the syntax errors are stored in  editor.state.syntaxErrorList
            var tree = parser.parse();

            // By now the current syntax errors are identified . following line shows the all the errors again.
            editor.session.setAnnotations(editor.state.syntaxErrorList.concat(editor.state.semanticErrorList));

            var dataPopulationListener = new DataPopulationListener(editor);

            // Default walker will traverse through the parserTree and generate events.
            // Those events are listen by the parserListener and update the statementsList with line numbers.
            antlr4.tree.ParseTreeWalker.DEFAULT.walk(dataPopulationListener, tree);

            if (parser._syntaxErrors == 0 && config.realTimeValidation && editor.state.previousParserTree &&
                editor.state.previousParserTree.toStringTree(tree, parser) != tree.toStringTree(tree, parser)) {
                // If there are no syntax errors and there is a change in parserTree
                // check for semantic errors if there is no change in the query within 3sec period
                // 3 seconds delay is added to avoid repeated server calls while user is typing the query.
                setTimeout(function () {
                    if (Date.now() - editor.state.lastEdit >= SiddhiEditor.serverSideValidationDelay - 100) {
                        // Updating the token tooltips using the data available
                        // Some data that was intended to be fetched from the server might be missing
                        updateTokenToolTips(tree);

                        checkForSemanticErrors();
                    }
                }, SiddhiEditor.serverSideValidationDelay);
            }
            editor.state.previousParserTree = tree;     // Save the current parser tree
            editor.state.lastEdit = Date.now();         // Save user's last edit time
        }

        /**
         * This method send server calls to check the semantic errors
         * Also retrieves the missing completion engine data from the server if the execution plan is valid
         */
        function checkForSemanticErrors() {
            var foundSemanticErrors = false;

            var editorText = editor.getValue();
            // If the user has not typed anything after 3 seconds from his last change, then send the query for semantic check
            // check whether the query contains errors or not
            submitToServerForSemanticErrorCheck(
                {
                    executionPlan: editorText,
                    missingStreams: editor.completionEngine.incompleteData.streams
                },
                function (response) {
                    if (response.status == "SUCCESS") {
                        // Execution plan is valid
                        editor.completionEngine.clearData();                // Clear the exiting completion engine data

                        // Populating the fetched data for incomplete data items into the completion engine's data
                        for (var stream in response.streams) {
                            if (response.streams.hasOwnProperty(stream)) {
                                var streamDefinition = response.streams[stream];
                                var attributes = {};
                                for (var k = 0; k < streamDefinition.attributeList.length; k++) {
                                    attributes[streamDefinition.attributeList[k].name] =
                                        streamDefinition.attributeList[k].type;
                                }
                                editor.completionEngine.streamList[stream] = {
                                    attributes: attributes,
                                    description: SiddhiEditor.utils.generateDescriptionForStreamOrTable("Stream", stream, attributes)
                                };
                            }
                        }

                        // Updating token tooltips
                        editor.completionEngine.clearIncompleteDataLists();
                        updateTokenToolTips(editor.state.previousParserTree);
                    } else {
                        // Error found in execution plan

                        // Generate the statements list from the editor text
                        var statementsList = generateStatementsListFromText(editorText);

                        // If the query contains semantic errors
                        // send the query in a constructive manner to sever to get the line number with error
                        // This check is needed because the ServerSide compiler doesn't return line numbers of the semantic errors.
                        var query = "";
                        for (var i = 0; i < statementsList.length; i++) {
                            if (statementsList[i].statement.substring(0, 2) != "\\*" &&
                                    statementsList[i].statement.substring(0, 2) != "--") {  // Appending statements excepts comments
                                query += statementsList[i].statement + "  \n";
                                (function (line, query) {
                                    submitToServerForSemanticErrorCheck({
                                        executionPlan: query,
                                        missingStreams: []
                                    }, function (response) {
                                        if (!foundSemanticErrors && response.status != "SUCCESS") {
                                            // Update the semanticErrorList
                                            editor.state.semanticErrorList.push({
                                                row: line - 1,
                                                // Change attribute "text" to "html" if html is sent from server
                                                text: SiddhiEditor.utils.wordWrap(response.message, 100),
                                                type: "error"
                                            });

                                            // Update the state of the foundSemanticErrors to stop sending another server call
                                            foundSemanticErrors = true;

                                            // Show the errors
                                            editor.session.setAnnotations(
                                                editor.state.semanticErrorList.concat(editor.state.syntaxErrorList)
                                            );
                                        }
                                    });
                                })(statementsList[i].line, query);

                                if (foundSemanticErrors) {
                                    break;
                                }
                            }
                        }
                    }
                }
            );
        }

        /**
         * Update the token tool tips
         */
        function updateTokenToolTips(parseTree) {
            var parserListener = new TokenToolTipUpdateListener(editor);
            antlr4.tree.ParseTreeWalker.DEFAULT.walk(parserListener, parseTree);
        }

        /**
         * Generate list of statements from the editor text
         *
         * @param editorText Text in the editor
         * @return {string[]} The list of statements
         */
        function generateStatementsListFromText(editorText) {
            // Separating execution plan into statements and adding them to an array
            var statementsList = [];
            var lineNumber = 1;
            editorTextLoop: for (var i = 0; i < editorText.length; i++) {
                for (var keyword in SiddhiEditor.statementStartToEndKeywordMap) {
                    if (SiddhiEditor.statementStartToEndKeywordMap.hasOwnProperty(keyword) &&
                        new RegExp("^" + keyword, "i").test(editorText.substring(i))) {
                        var endKeyword = SiddhiEditor.statementStartToEndKeywordMap[keyword];
                        var keywordMatch = new RegExp("^(" + keyword + ")", "i").exec(editorText.substring(i))[1];

                        // For storing the number of lines the statement spans across
                        // lineNumber variable is not incremented since statement start line number is required
                        var statementSpanningLines = 0;

                        for (var j = i + keywordMatch.length; j < editorText.length; j++) {
                            if (new RegExp("^" + endKeyword, "i").test(editorText.substring(j))) {
                                var endKeywordMatch =
                                    new RegExp("^(" + endKeyword + ")", "i").exec(editorText.substring(j))[1];
                                statementsList.push({
                                    statement: editorText.substring(i, j + endKeywordMatch.length),
                                    line: lineNumber
                                });
                                lineNumber += statementSpanningLines;

                                // -1 to adjust for the increment in i after iteration
                                // -1 to adjust for statements with end keyword as new line
                                i = j + endKeywordMatch.length - 2;

                                continue editorTextLoop;
                            }
                            if (editorText.charAt(j) == "\n") {
                                statementSpanningLines++;
                            }
                        }
                        break editorTextLoop;
                    }
                }
                if (editorText.charAt(i) == "\n") {
                    lineNumber++;
                }
            }

            return statementsList;
        }

        /**
         * Submit the execution plan to server for semantic error checking
         * Also fetched the incomplete data from the server for the completion engine
         *
         * @param {Object} data The execution plan and the missing data in a java script object
         * @param {function} callback Missing streams whose definitions should be fetched after validation
         */
        function submitToServerForSemanticErrorCheck(data, callback) {
            if (data.executionPlan == "") {
                return;
            }
            jQuery.ajax({
                type: "POST",
                url: SiddhiEditor.serverURL + "siddhi-editor/validate",
                data: JSON.stringify(data),
                success: callback
            });
        }

        return editor;
    };

    /**
     * Utils used by the SiddhiEditor
     */
    SiddhiEditor.utils = (function () {
        /**
         * Word wrap the the string with a maxWidth for each line
         *
         * @param {string} str The string to be word wrapped
         * @param {int} maxWidth The maximum width for the lines
         * @return {string} The word wrapped string
         */
        this.wordWrap = function (str, maxWidth) {
            for (var i = maxWidth; i < str.length;) {
                if (/\s/.test(str.charAt(i))) {
                    str = str.substring(0, i) + "\n" + str.substring(i + 1);
                    i += maxWidth + 1;
                } else {
                    for (var j = i - 1; j > i - maxWidth; j--) {
                        if (/\s/.test(str.charAt(j))) {
                            str = str.substring(0, j) + "\n" + str.substring(j + 1);
                            i = j + maxWidth + 1;
                            break;
                        }
                    }
                }
            }
            return str;
        };

        /**
         * Generate description html string from meta data for processor
         * Descriptions are intended to be shown in the tooltips for a completions
         *
         * @param {Object} metaData Meta data object containing parameters, return and description
         * @return {string} html string of the description generated from the meta data provided
         */
        this.generateDescriptionForProcessor = function (metaData) {
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
                                description += "<li>" +
                                    metaData.parameters[j].multiple[k].name +
                                    (metaData.parameters[j].optional ? " (optional & multiple)" : "") + " - " +
                                    (metaData.parameters[j].multiple[k].type.length > 0 ?
                                        metaData.parameters[j].multiple[k].type.join(" | ").toUpperCase() :
                                        "")
                                    + "</li>";
                            }
                        } else {
                            description += "<li>" +
                                metaData.parameters[j].name +
                                (metaData.parameters[j].optional ? " (optional)" : "") +
                                (metaData.parameters[j].type.length > 0 ?
                                " - " + metaData.parameters[j].type.join(" | ").toUpperCase() :
                                    "") +
                                "</li>";
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
                    description += metaData.returnType.join(" | ").toUpperCase();
                } else {
                    description += "none";
                }
            }
            description += "</div>";
            return description;
        };

        /**
         * Generate description html string from meta data for eval script
         * Descriptions are intended to be shown in the tooltips for a completions
         *
         * @param {string} evalScriptName Name of the eval script for which the description is generated
         * @param {Object} metaData Meta data object containing parameters, return and description
         * @return {string} html string of the description generated from the meta data provided
         */
        this.generateDescriptionForEvalScript = function (evalScriptName, metaData) {
            return "<div><strong>Eval Script</strong> - " + evalScriptName + "<br><ul>" +
                "<li>Language - " + metaData.language + "</li>" +
                "<li>Return Type - " + metaData.returnType.join(" | ").toUpperCase() + "</li>" +
                "<li>Function Body -" + "<br><br>" + metaData.functionBody + "</li>" +
                "</ul></div>";
        };

        /**
         * Generate description html string from stream/table meta data
         * Descriptions are intended to be shown in the tooltips for a completions
         *
         * @param {string} type Type of the source. Should be one of ["Stream", "Event Table"]
         * @param {string} sourceName Name of the stream/table for which the description is generated
         * @param {Object} attributes attributes of the stream/table
         * @return {string} html string of the description generated from the meta data provided
         */
        this.generateDescriptionForStreamOrTable = function (type, sourceName, attributes) {
            var description = "<div><strong>" + type + "</strong> - " + sourceName + "<br>";
            if (attributes && Object.keys(attributes).length > 0) {
                description += "<ul>";
                for (var attribute in attributes) {
                    if (attributes.hasOwnProperty(attribute)) {
                        description += "<li>" +
                            attribute + (attributes[attribute] ? " - " + attributes[attribute].toUpperCase() : "") +
                            "</li>";
                    }
                }
                description += "</ul>";
            }
            description += "</div>";
            return description;
        };

        /**
         * Generate description html string from stream/table meta data
         * Descriptions are intended to be shown in the tooltips for a completions
         *
         * @param {string} triggerName Name of the trigger for which the description is generated
         * @param {string} metaData metaData of the trigger
         * @return {string} html string of the description generated from the meta data provided
         */
        this.generateDescriptionForTrigger = function (triggerName, metaData) {
            return "<div><strong>Trigger</strong> - " + triggerName + "<br><br>" +
                metaData.type + " - " + metaData.time + "</div>";
        };

        this.generateDescriptionForWindow = function (windowName, metaData) {
            var description = "<div><strong>Window</strong> - " + windowName + "<br><br>";
            if (metaData.attributes && Object.keys(metaData.attributes).length > 0) {
                description += "Attributes -<ul>";
                for (var attribute in metaData.attributes) {
                    if (metaData.attributes.hasOwnProperty(attribute)) {
                        description += "<li>" +
                            attribute + (metaData.attributes[attribute] ? " - " + metaData.attributes[attribute].toUpperCase() : "") +
                            "</li>";
                    }
                }
                description += "</ul>";
            }
            if (metaData.functionOperation) {
                description += "Window - " + metaData.functionOperation + "<br><br>";
            }
            if (metaData.output) {
                description += "Output - " + metaData.output + "<br><br>";
            }
            if (metaData.functionOperation &&
                SiddhiEditor.CompletionEngine.functionOperationSnippets.inBuilt.windowProcessors) {
                var windowName = /^\s*([a-zA-Z_][a-zA-Z_0-9]*)\s*\(/i.exec(metaData.functionOperation)[1];
                var window =
                    SiddhiEditor.CompletionEngine.functionOperationSnippets.inBuilt.windowProcessors[windowName];
                if (window) {
                    description += "Description of the window used - <br><br>" +
                        "<div style='margin-left: 25px;'>" + window.description + "</div>";
                }
            }
            description += "</div>";
            return description;
        };

        return this;
    })();
})();
