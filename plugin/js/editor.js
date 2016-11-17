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
    var relativePathToCurrentJS = scripts[scripts.length - 1].getAttribute("src");     // Get "src" attribute of the <script> tag for the current file (last tag in the array)
    SiddhiEditor.baseURL = relativePathToCurrentJS.substring(0, relativePathToCurrentJS.length - "js/editor.js".length);
    SiddhiEditor.serverURL = "http://localhost:8080/";
    SiddhiEditor.serverSideValidationDelay = 2000;

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
    SiddhiEditor.CompletionEngine = require(SIDDHI_EDITOR_CONSTANT.ROOT + SIDDHI_EDITOR_CONSTANT.COMPLETION_ENGINE).CompletionEngine;
    SiddhiEditor.Tracing = {NONE: "NONE", ERROR: "ERROR", DEBUG: "DEBUG", INFO: "INFO"};
    SiddhiEditor.Tracing.traceLevel = SiddhiEditor.Tracing.NONE;

    /**
     * Initialize the editor
     *
     * @param {Object} config The configuration object to be used in the initialization
     * @return {Object} ace editor instance
     */
    SiddhiEditor.init = function (config) {
        var editor = ace.edit(config.divID);                // Setting the DivID of the Editor .. Could be <pre> or <div> tags

        SiddhiEditor.Tracing.traceLevel = config.traceLevel;
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
            // (client-side-siddhi-parser/antlr4/error/ErrorListener.js -> ConsoleErrorListener.syntaxError()) will be invoked automatically.
            // within that method , the syntax errors are stored in  editor.state.syntaxErrorList
            var tree = parser.parse();

            // By now the current syntax errors are identified . following line shows the all the errors again.
            editor.session.setAnnotations(editor.state.syntaxErrorList.concat(editor.state.semanticErrorList));

            // To maintains the line numbers against the distinct query statements(streamDefinitions,query,functionDefinitions..).
            // statementList is important when checking semantic errors.
            // The input execution plan is submitted to the server statement by statement for semantic error checking
            editor.statementsList = [];

            var parserListener = new CustomSiddhiListener(editor);

            // Default walker will traverse through the parserTree and generate events.
            // Those events are listen by the parserListener and update the statementsList with line numbers.
            antlr4.tree.ParseTreeWalker.DEFAULT.walk(parserListener, tree);

            if (parser._syntaxErrors == 0 && config.realTimeValidation &&
                (editor.state.previousParserTree != tree.toStringTree(tree, parser))) {
                // If there are no syntax errors and there is a change in parserTree => check for semantic errors if there is no change in the query within 3sec period
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

            if (Date.now() - editor.state.lastEdit >= SiddhiEditor.serverSideValidationDelay) {
                // If the user has not typed anything after 3 seconds from his last change, then send the query for semantic check
                // check whether the query contains errors or not
                var isValid = submitToServerForSemanticErrorCheck(editor.getValue(), true);

                if (!isValid) {
                    // If the query contains semantic  errors. send the query in a constructive manner to sever to get the line number with error
                    // This check is needed because the ServerSide compiler doesn't return line numbers of the semantic errors.
                    var query = "";
                    for (var i = 0; i < editor.statementsList.length; i++) {
                        query += editor.statementsList[i].state + "  \n";
                        submitToServerForSemanticErrorCheck(query, false, editor.statementsList[i].line, editor.statementsList[i].state);
                        if (editor.state.foundSemanticErrors) {
                            break;
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
         * @param {string} [checkingQuery] currently checking query statement
         * @returns {boolean} query is valid or not
         */
        function submitToServerForSemanticErrorCheck(executionPlan, errorCheck, line, checkingQuery) {
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
                            text: SiddhiEditor.utils.wordWrap(response.message, 100),
                            type: "error",
                            inputText: checkingQuery
                        });

                        // Update the state of the editor.state.foundSemanticErrors to stop sending another server call
                        editor.state.foundSemanticErrors = true;

                        // Show the errors
                        editor.session.setAnnotations(editor.state.semanticErrorList.concat(editor.state.syntaxErrorList));
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

        return this;
    })();
})();
