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

var SiddhiQLListener = require('./gen/SiddhiQLListener').SiddhiQLListener;
var loggerContext = "CustomSiddhiListener";

function CustomSiddhiListener(editor) {
    SiddhiQLListener.call(this);     // inherit default listener
    this.editor = editor;
    return this;
}
CustomSiddhiListener.prototype = Object.create(SiddhiQLListener.prototype);
CustomSiddhiListener.prototype.constructor = CustomSiddhiListener;

/*
 * For updating the completion engine information
 */
CustomSiddhiListener.prototype.exitDefinition_stream = function (ctx) {
    var streamName = ctx.source().start.text;
    var attributes = {};
    var i = 0;
    while (ctx.attribute_name(i)) {
        attributes[ctx.attribute_name(i).start.text] = ctx.attribute_type(i).start.text;
        i++;
    }
    this.editor.completionEngine.streamList[streamName] = attributes;

    updateStatementsList(ctx, this.editor, " ;");
};

CustomSiddhiListener.prototype.exitDefinition_table = function (ctx) {
    var tableName = ctx.source().start.text;
    var attributes = {};
    var i = 0;
    while (ctx.attribute_name(i)) {
        attributes[ctx.attribute_name(i).start.text] = ctx.attribute_type(i).start.text;
        i++;
    }
    this.editor.completionEngine.tableList[tableName] = attributes;

    updateStatementsList(ctx, this.editor, " ;");
};

CustomSiddhiListener.prototype.exitError = function (ctx) {
    updateStatementsList(ctx, this.editor, " ");
};

CustomSiddhiListener.prototype.exitExecution_element = function (ctx) {
    updateStatementsList(ctx, this.editor, ";");
};


CustomSiddhiListener.prototype.exitPlan_annotation = function (ctx) {
    updateStatementsList(ctx, this.editor, " ");
};

function updateStatementsList(ctx, editor, seperator) {
    editor.statementsList.push({
        state: ctx.start.getInputStream().getText(ctx.start.start, ctx.stop.stop) + seperator,
        line: ctx.start.line
    });

    if (SiddhiEditor.debug) {
        console.warn(loggerContext + ":" + "updateStatementsList" + "->");
        console.log("StatementList", editor.statementsList);
    }
}

/*
 * For updating token tooltips
 */
CustomSiddhiListener.prototype.exitFunction_operation = function (ctx) {
    // Updating token tool tip for the WindowProcessor/StreamProcessor/Function
    var snippets;
    var namespaceCtx = ctx.function_namespace(0);
    var functionCtx = ctx.function_id(0);

    var processorName = functionCtx.start.getInputStream().getText(functionCtx.start.start, functionCtx.stop.stop);
    if (namespaceCtx) {
        var namespace = namespaceCtx.start.getInputStream().getText(namespaceCtx.start.start, namespaceCtx.stop.stop);
        snippets = SiddhiEditor.CompletionEngine.functionOperationSnippets.extensions[namespace];

        // Adding namespace tool tip
        updateTokenDescription(this.editor, namespaceCtx.stop.line - 1, namespaceCtx.stop.column + 1, "Extension namespace - " + namespace);
    } else {
        snippets = SiddhiEditor.CompletionEngine.functionOperationSnippets.inBuilt;
    }

    // Adding WindowProcessor/StreamProcessor/Function/additional tool tip
    var snippet;
    if (snippets.windowProcessors[processorName]) {         // Checking if the processor exists in window processors
        snippet = snippets.windowProcessors[processorName];
    } else if (snippets.streamProcessors[processorName]) {  // Checking if the processor exists in stream processors
        snippet = snippets.streamProcessors[processorName];
    } else if (snippets.functions[processorName]) {         // Checking if the processor exists in functions
        snippet = snippets.functions[processorName];
    } else if (SiddhiEditor.CompletionEngine.functionOperationSnippets.additional[processorName]) {     // Checking if the processor exists in additional processors
        snippet = SiddhiEditor.CompletionEngine.functionOperationSnippets.additional[processorName];
    }
    if (snippet) {
        updateTokenDescription(this.editor, functionCtx.stop.line - 1, functionCtx.stop.column + 1, snippet.description);
    }
};

CustomSiddhiListener.prototype.exitSource = function (ctx) {
    var streamName = ctx.start.getInputStream().getText(ctx.start.start, ctx.stop.stop);
    var attributes = this.editor.completionEngine.streamList[streamName];
    var tooltip = "<strong>Stream</strong> - " + streamName + "<br>";
    if (attributes && Object.keys(attributes).length > 0) {
        tooltip += "<ul>";
        for (var attribute in attributes) {
            if (attributes.hasOwnProperty(attribute)) {
                tooltip += "<li>" + attribute + " - " + attributes[attribute] + "</li>";
            }
        }
        tooltip += "</ul>";
    }
    updateTokenDescription(this.editor, ctx.stop.line - 1, ctx.stop.column + 1, tooltip);
};

function updateTokenDescription(editor, tokenRow, tokenColumn, tooltip) {
    var token = editor.session.getTokenAt(tokenRow, tokenColumn);
    token.tooltip = tooltip;
}

exports.CustomSiddhiListener = CustomSiddhiListener;
