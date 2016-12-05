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

"use strict";   // JS strict mode

importScripts("../lib/require.js", "utils.js");

(function () {
    var antlrWalker;
    var SiddhiEditor = self.SiddhiEditor || {};

    var messageHandler = (function () {
        var handler = {};
        var messageHandlerMap = {
            INIT: initializeWorker
        };

        handler.handle = function (message) {
            messageHandlerMap[message.type](message.data);
        };

        function initializeWorker(data) {
            SiddhiEditor.constants = data;
            antlrWalker = new ANTLRWalker();

            messageHandlerMap[SiddhiEditor.constants.worker.EDITOR_CHANGE_EVENT] = onEditorChange;
            messageHandlerMap[SiddhiEditor.constants.worker.GENERATE_TOKEN_TOOLTIP] = generateTokenTooltipData;
        }

        function onEditorChange (data) {
            antlrWalker.onEditorChange(data);
        }

        function generateTokenTooltipData (data) {
            antlrWalker.generateTokenTooltipData(data);
        }

        return handler;
    })();

    var renderer = (function () {
        var renderer = {};

        renderer.notifyParseTreeWalkingCompletion = function (errors) {
            postMessage(JSON.stringify({
                type: SiddhiEditor.constants.worker.PARSE_TREE_WALKING_COMPLETION,
                data: errors
            }));
        };

        renderer.notifyDataPopulationCompletion = function (completionData, incompleteData, statementsList) {
            postMessage(JSON.stringify({
                type: SiddhiEditor.constants.worker.DATA_POPULATION_COMPLETION,
                data: {completionData: completionData, incompleteData: incompleteData, statementsList: statementsList}
            }));
        };

        renderer.notifyTokenTooltipPointRecognitionCompletion = function (tooltipData) {
            postMessage(JSON.stringify({
                type: SiddhiEditor.constants.worker.TOKEN_TOOLTIP_POINT_RECOGNITION_COMPLETION,
                data: tooltipData
            }));
        };

        return renderer;
    })();

    self.addEventListener('message', function (event) {
        messageHandler.handle(JSON.parse(event.data));
    });

    function ANTLRWalker() {
        var walker = this;
        var lastParseTree;

        walker.syntaxErrorList = [];
        walker.completionData = {
            streamsList: {},
            eventTablesList: {},
            eventTriggersList: {},
            evalScriptsList: {},
            eventWindowsList: {}
        };
        walker.incompleteData = {
            streams: []
        };
        walker.statementsList = [];
        walker.tokenToolTipData = [];

        /*
         * Loading modules to be used inside the main siddhi editor js file
         */
        var antlr4 = require(SiddhiEditor.constants.antlr.INDEX);                                                                          // ANTLR4 JS runtime
        var SiddhiQLLexer = require(SiddhiEditor.constants.antlr.ROOT + SiddhiEditor.constants.antlr.SIDDHI_LEXER).SiddhiQLLexer;
        var SiddhiQLParser = require(SiddhiEditor.constants.antlr.ROOT + SiddhiEditor.constants.antlr.SIDDHI_PARSER).SiddhiQLParser;
        var DataPopulationListener = require(SiddhiEditor.constants.antlr.ROOT + SiddhiEditor.constants.antlr.SIDDHI_DATA_POPULATION_LISTENER).DataPopulationListener;
        var SyntaxErrorListener = require(SiddhiEditor.constants.antlr.ROOT + SiddhiEditor.constants.antlr.SYNTAX_ERROR_LISTENER).SyntaxErrorListener;
        var TokenToolTipUpdateListener = require(SiddhiEditor.constants.antlr.ROOT + SiddhiEditor.constants.antlr.SIDDHI_TOKEN_TOOL_TIP_UPDATE_LISTENER).TokenToolTipUpdateListener;

        walker.onEditorChange = function (editorText) {
            // Following code segment parse the input query using antlr4's parser and lexer
            var errorListener = new SyntaxErrorListener(walker);
            var txt = new antlr4.InputStream(editorText);       // Input stream
            var lexer = new SiddhiQLLexer(txt);                 // Generating lexer
            lexer._listeners = [];
            lexer._listeners.push(errorListener);
            var tokens = new antlr4.CommonTokenStream(lexer);   // Generated a token stream
            var parser = new SiddhiQLParser(tokens);            // Using the token stream , generate the parser
            parser._listeners = [];
            parser._listeners.push(errorListener);
            parser.buildParseTrees = true;

            // Syntax errors in parsing are stored in  editor.state.syntaxErrorList
            lastParseTree = parser.parse();

            // Adding the syntax errors identified into the editor gutter
            renderer.notifyParseTreeWalkingCompletion(walker.syntaxErrorList);

            var dataPopulationListener = new DataPopulationListener(walker);
            antlr4.tree.ParseTreeWalker.DEFAULT.walk(dataPopulationListener, lastParseTree);

            renderer.notifyDataPopulationCompletion(walker.completionData, walker.incompleteData, walker.statementsList);
        };

        walker.generateTokenTooltipData = function () {
            var tokenToolTipUpdateListener = new TokenToolTipUpdateListener(walker);
            antlr4.tree.ParseTreeWalker.DEFAULT.walk(tokenToolTipUpdateListener, lastParseTree);
            renderer.notifyTokenTooltipPointRecognitionCompletion(walker.tokenToolTipData);
        };
    }
})();