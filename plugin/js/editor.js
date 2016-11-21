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
        relativePathToCurrentJS.substring(0, relativePathToCurrentJS.length - "js/editor.js".length);

    SiddhiEditor.serverURL = "http://localhost:8080/";
    SiddhiEditor.serverSideValidationDelay = 2000;

    // Used in separating statements
    SiddhiEditor.statementStartToEndKeywordMap = {
        "@": "\\)",
        "define": ";",
        "from": ";",
        "partition": "end\\s*;",
        "/\\*": "\\*/",
        "--": "\n"
    };

    /*
     * Annotations, Annotation Names and relevant tokens
     */
    var ACE_CONSTANT = {
        SNIPPET_MANAGER: "ace/snippets",
        LANG_TOOLS: "ace/ext/language_tools",
        SIDDHI_MODE: "ace/mode/siddhi",
        THEME: "ace/theme/crimson_editor",
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
        ERROR_LISTENER: "AceErrorListener",
        SIDDHI_LISTENER: "CustomSiddhiListener",
        SIDDHI_PARSER: "gen/SiddhiQLParser",
        SIDDHI_LEXER: "gen/SiddhiQLLexer"
    };
    var ANTLR_RUNTIME_INDEX = SiddhiEditor.baseURL + "lib/antlr4-js-runtime/index";

    // ANTLR4 JS runtime integration code segment goes here..
    var antlr4 = require(ANTLR_RUNTIME_INDEX);                                                                          // ANTLR4 JS runtime
    var SiddhiQLLexer = require(ANTLR_CONSTANT.ROOT + ANTLR_CONSTANT.SIDDHI_LEXER).SiddhiQLLexer;
    var SiddhiQLParser = require(ANTLR_CONSTANT.ROOT + ANTLR_CONSTANT.SIDDHI_PARSER).SiddhiQLParser;
    var CustomSiddhiListener = require(ANTLR_CONSTANT.ROOT + ANTLR_CONSTANT.SIDDHI_LISTENER).CustomSiddhiListener;      // Custom listener for Siddhi
    var AceErrorListener = require(ANTLR_CONSTANT.ROOT + ANTLR_CONSTANT.ERROR_LISTENER).AceErrorListener;
    var TokenTooltip = require(SIDDHI_EDITOR_CONSTANT.ROOT + SIDDHI_EDITOR_CONSTANT.TOKEN_TOOLTIP).TokenTooltip;        // Required for token tooltips

    SiddhiEditor.SnippetManager = ace.require(ACE_CONSTANT.SNIPPET_MANAGER).snippetManager;     // Required for changing the snippets used
    SiddhiEditor.langTools = ace.require(ACE_CONSTANT.LANG_TOOLS);                              // Required for auto completion
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
        editor.tokenTooltip = new TokenTooltip(editor);
        editor.setReadOnly(config.readOnly);

        // Setting the editor options
        editor.session.setMode(ACE_CONSTANT.SIDDHI_MODE);   // Language mode located at ace_editor/mode-siddhi.js
        editor.setTheme(ACE_CONSTANT.THEME);                // Theme located at ace_editor/theme/crimson_editor.js
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
            enableLiveAutocompletion: true,
            autoScrollEditorIntoView: true,
            enableMultiselect: false
        });

        // State variables for error checking and highlighting
        editor.state = {};
        editor.state.previousParserTree = "";
        editor.state.syntaxErrorList = [];      // To save the syntax Errors with line numbers
        editor.state.semanticErrorList = [];    // To save semanticErrors with line numbers
        editor.state.lastEdit = 0;              // Last edit time
        editor.state.foundSemanticErrors = false;

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
        editor.completionEngine.adjustAutoCompletionHandlers(editor);
        editor.commands.on('afterExec', function () {
            editor.completionEngine.adjustAutoCompletionHandlers(editor);
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
         * Editor change handler
         */
        function editorChangeHandler() {
            editor.completionEngine.streamList = {};            // Clear the exiting streams

            // Clearing all errors before finding the errors again
            editor.state.semanticErrorList = [];
            editor.state.syntaxErrorList = [];

            // Following code segment parse the input query using antlr4's parser and lexer
            var errorListener = new AceErrorListener(editor);
            var expression = editor.getValue().trim();          // Input text
            var txt = new antlr4.InputStream(expression);       // Input stream
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

            var parserListener = new CustomSiddhiListener(editor);

            // Default walker will traverse through the parserTree and generate events.
            // Those events are listen by the parserListener and update the statementsList with line numbers.
            antlr4.tree.ParseTreeWalker.DEFAULT.walk(parserListener, tree);

            if (parser._syntaxErrors == 0 && config.realTimeValidation &&
                (editor.state.previousParserTree != tree.toStringTree(tree, parser))) {
                // If there are no syntax errors and there is a change in parserTree
                // check for semantic errors if there is no change in the query within 3sec period
                // 3 seconds delay is added to avoid repeated server calls while user is typing the query.
                setTimeout(checkForSemanticErrors, SiddhiEditor.serverSideValidationDelay);
            }
            editor.state.previousParserTree = tree.toStringTree(tree, parser);  // Save the current parser tree
            editor.state.lastEdit = Date.now();                                 // Keep user's last edit time
        }

        /**
         * This method send server calls to check the semantic errors
         */
        function checkForSemanticErrors() {
            editor.state.foundSemanticErrors = false;

            if (Date.now() - editor.state.lastEdit >= SiddhiEditor.serverSideValidationDelay - 100) {
                var editorText = editor.getValue();
                // If the user has not typed anything after 3 seconds from his last change, then send the query for semantic check
                // check whether the query contains errors or not
                var isValid = submitToServerForSemanticErrorCheck(editorText, true);

                if (!isValid) {
                    // Separating execution plan into statements and adding them to an array
                    var statementsList = [];
                    var lineNumber = 1;
                    editorTextLoop: for (i = 0; i < editorText.length; i++) {
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

                    // If the query contains semantic errors
                    // send the query in a constructive manner to sever to get the line number with error
                    // This check is needed because the ServerSide compiler doesn't return line numbers of the semantic errors.
                    var query = "";
                    for (var i = 0; i < statementsList.length; i++) {
                        if (statementsList[i].statement.substring(0, 2) != "\\*" &&
                                statementsList[i].statement.substring(0, 2) != "--") {
                            query += statementsList[i].statement + "  \n";
                            submitToServerForSemanticErrorCheck(query, false, statementsList[i].line);
                            if (editor.state.foundSemanticErrors) {
                                break;
                            }
                        }
                    }
                }
            }
        }

        /**
         * This Method submit the query to server for semantic error checking
         * if(errorCheck)
         *      => This method is called to check the validity of the complete query
         * else
         *      => This method is called to check the validity of the sub statements.
         *
         * Ex: suppose the query is like below
         *     1. define stream Abc( def int) -> A
         *     2. from Abc      -> B
         *     3. select def
         *     4. insert into Ghi
         *
         *     ***To check complete query -> submitToServerForSemanticErrorCheck(executionPlan,true)
         *     ***To find the line number with the error->
         *                  submitToServerForSemanticErrorCheck(A , false , 1 , "define ...")
         *                  submitToServerForSemanticErrorCheck(A+B,false , 3 , "from abc ..")
         *
         * @param {string} executionPlan The input query
         * @param {boolean} errorCheck isValid check or not.
         * @param {int} [line] line number related to the current statement
         * @returns {boolean} query is valid or not
         */
        function submitToServerForSemanticErrorCheck(executionPlan, errorCheck, line) {
            if (executionPlan == "") {
                return true;
            }

            var ajaxConfig = {
                type: "POST",
                url: SiddhiEditor.serverURL + "siddhi-editor/validate",
                data: executionPlan
            };
            if (errorCheck) {
                ajaxConfig.async = false;
                var response = JSON.parse(jQuery.ajax(ajaxConfig).responseText);
                return response.status == "SUCCESS";
            } else {
                ajaxConfig.async = true;
                ajaxConfig.success = function (response) {
                    if (!editor.state.foundSemanticErrors && response.status != "SUCCESS") {
                        // Update the semanticErrorList
                        editor.state.semanticErrorList.push({
                            row: line - 1,
                            // Change attribute "text" to "html" if html is sent from server
                            text: SiddhiEditor.utils.wordWrap(response.message, 100),
                            type: "error"
                        });

                        // Update the state of the editor.state.foundSemanticErrors to stop sending another server call
                        editor.state.foundSemanticErrors = true;

                        // Show the errors
                        editor.session.setAnnotations(
                            editor.state.semanticErrorList.concat(editor.state.syntaxErrorList)
                        );
                    }
                };
                jQuery.ajax(ajaxConfig);
            }
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
                                        metaData.parameters[j].multiple[k].type.join(" | ") :
                                        "")
                                    + "</li>";
                            }
                        } else {
                            description += "<li>" +
                                metaData.parameters[j].name +
                                (metaData.parameters[j].optional ? " (optional)" : "") +
                                (metaData.parameters[j].type.length > 0 ?
                                " - " + metaData.parameters[j].type.join(" | ") :
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
                    description += metaData.returnType.join(" | ");
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
                "<li>Return Type - " + metaData.returnType.join(" | ") + "</li>" +
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
                            attribute + (attributes[attribute] ? " - " + attributes[attribute] : "") +
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
                            attribute + (metaData.attributes[attribute] ? " - " + metaData.attributes[attribute] : "") +
                            "</li>";
                    }
                }
                description += "</ul>";
            }
            if (metaData.functionOperation) {
                description += "Type - " + metaData.functionOperation + "<br><br>";
            }
            if (metaData.output) {
                description += "Output - " + metaData.output + "<br><br>";
            }
            if (metaData.functionOperation &&
                    SiddhiEditor.CompletionEngine.functionOperationSnippets.inBuilt.windowProcessors) {
                var window =
                    SiddhiEditor.CompletionEngine.functionOperationSnippets.inBuilt.windowProcessors[metaData.functionOperation];
                if (window) {
                    description += "Description of the window used - <br><br>" + window.description;
                }
            }
            description += "</div>";
            return description;
        };

        return this;
    })();
})();
