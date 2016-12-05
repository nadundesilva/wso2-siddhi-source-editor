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

/*
 * Constants to be used by the siddhi editor and the siddhi web worker
 * This is not directly imported by the web worker since some of the constants are initiated using the window object
 * The SiddhiEditor.constants in passed into the web worker when the siddhi worker is initialized
 */
(function () {
    var SiddhiEditor = window.SiddhiEditor || {};
    window.SiddhiEditor = SiddhiEditor;

    /*
     * Finding the base url of the plugin
     * Get "src" attribute of the <script> tag for the current file
     * Last tag in the array since tags after that are not yet added to it
     */
    var scripts = document.getElementsByTagName("script");
    var relativePathToCurrentJS = scripts[scripts.length - 1].getAttribute("src");
    SiddhiEditor.baseURL = relativePathToCurrentJS.substring(0, relativePathToCurrentJS.length - "js/constants.js".length);

    // Server side validation related constants
    SiddhiEditor.serverURL = "http://localhost:8080/";
    SiddhiEditor.serverSideValidationDelay = 2000;      // Token tooltips are also updated after this delay

    /*
     * Constants used by the editor
     */
    var constants = {
        SOURCE: "source",
        FUNCTION_OPERATION: "functionOperation",
        FUNCTIONS: "functions",
        STREAM_PROCESSORS: "streamProcessors",
        WINDOW_PROCESSORS: "windowProcessors",
        STREAMS: "streams",
        EVENT_TABLES: "eventTables",
        TRIGGERS: "eventTriggers",
        WINDOWS: "eventWindows",
        EVAL_SCRIPTS: "evalScripts",
        ATTRIBUTES: "attributes",
        LOGICAL_OPERATORS: "logicalOperators",
        DATA_TYPES: "dataTypes",
        SNIPPETS: "snippet",
        SNIPPET_SIDDHI_CONTEXT: "siddhi"        // Context provided to the snippet manager to register the snippets
    };

    /*
     * Names displayed in the editor
     */
    constants.typeToDisplayNameMap = {};
    constants.typeToDisplayNameMap[constants.FUNCTIONS] = "Function";
    constants.typeToDisplayNameMap[constants.STREAM_PROCESSORS] = "Stream Processor";
    constants.typeToDisplayNameMap[constants.WINDOW_PROCESSORS] = "Window Processor";
    constants.typeToDisplayNameMap[constants.STREAMS] = "Stream";
    constants.typeToDisplayNameMap[constants.EVENT_TABLES] = "Event Table";
    constants.typeToDisplayNameMap[constants.TRIGGERS] = "Event Trigger";
    constants.typeToDisplayNameMap[constants.WINDOWS] = "Event Window";
    constants.typeToDisplayNameMap[constants.EVAL_SCRIPTS] = "Eval Script";
    constants.typeToDisplayNameMap[constants.ATTRIBUTES] = "Attribute";
    constants.typeToDisplayNameMap[constants.LOGICAL_OPERATORS] = "Logical Operator";
    constants.typeToDisplayNameMap[constants.DATA_TYPES] = "Data Type";
    constants.typeToDisplayNameMap[constants.SNIPPETS] = "Snippet";

    /*
     * Ace editor library related constants
     */
    constants.ace = {
        SNIPPET_MANAGER: "ace/snippets",
        LANG_TOOLS: "ace/ext/language_tools",
        SIDDHI_MODE: "ace/mode/siddhi",
        DEFAULT_THEME: "ace/theme/crimson_editor",
        ACE_RANGE: "ace/range",
        LANG_LIB: "ace/lib/lang",
        TOKEN_TOOLTIP: "ace/token/tooltips"
    };

    /*
     * ANTLR related constants
     */
    constants.antlr = {
        INDEX: "antlr4-js-runtime/index",
        ROOT: "antlr/",
        SYNTAX_ERROR_LISTENER: "SyntaxErrorListener",
        SIDDHI_DATA_POPULATION_LISTENER: "DataPopulationListener",
        SIDDHI_TOKEN_TOOL_TIP_UPDATE_LISTENER: "TokenTooltipPointRecognitionListener",
        SIDDHI_PARSER: "gen/SiddhiQLParser",
        SIDDHI_LEXER: "gen/SiddhiQLLexer"
    };

    /*
     * Web worker related constants
     * Used in declaring the message type
     */
    constants.worker = {
        INIT: "INIT",
        EDITOR_CHANGE_EVENT: "EDITOR_CHANGE_EVENT",
        GENERATE_TOKEN_TOOLTIP: "GENERATE_TOKEN_TOOLTIP",
        PARSE_TREE_WALKING_COMPLETION: "PARSE_TREE_WALKING_COMPLETION",
        DATA_POPULATION_COMPLETION: "DATA_POPULATION_COMPLETION",
        TOKEN_TOOLTIP_POINT_RECOGNITION_COMPLETION: "TOKEN_TOOLTIP_POINT_RECOGNITION_COMPLETION"
    };

    /*
     * Loading modules to be used by all the components
     */
    SiddhiEditor.SnippetManager = ace.require(constants.ace.SNIPPET_MANAGER).snippetManager;    // Required for changing the snippets used
    SiddhiEditor.Range = ace.require(constants.ace.ACE_RANGE).Range;                            // Required for extracting part of the query
    SiddhiEditor.lang = ace.require(constants.ace.LANG_LIB);

    SiddhiEditor.constants = constants;
})();