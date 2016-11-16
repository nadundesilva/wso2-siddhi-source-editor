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
 * Completion engine & validation information update listeners starts here
 */

CustomSiddhiListener.prototype.exitPlan_annotation = function (ctx) {
    addStatement(ctx, this.editor, " ");
};

/*
 * Define statement listeners starts here
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

    addStatement(ctx, this.editor, " ; ");
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

    addStatement(ctx, this.editor, " ; ");
};

CustomSiddhiListener.prototype.exitDefinition_trigger = function (ctx) {
    var triggerName = ctx.trigger_name().start.text;
    var time;
    if (ctx.time_value()) {
        time = ctx.time_value().start.text;
    } else if (ctx.string_value()) {
        time = ctx.string_value().start.text;
    }
    this.editor.completionEngine.triggerList[triggerName] = time;

    addStatement(ctx, this.editor, " ; ");
};

CustomSiddhiListener.prototype.exitDefinition_function = function (ctx) {
    this.editor.completionEngine.evalScriptList[ctx.function_name().start.text] = {
        language: ctx.language_name().start.text,
        returnType: ctx.attribute_type().start.text,
        functionBody: ctx.function_body().start.text
    };

    addStatement(ctx, this.editor, " ; ");
};

CustomSiddhiListener.prototype.exitDefinition_window = function (ctx) {
    var windowName = ctx.source().start.text;
    var attributes = {};
    var i = 0;
    while (ctx.attribute_name(i)) {
        attributes[ctx.attribute_name(i).start.text] = ctx.attribute_type(i).start.text;
        i++;
    }
    var window = {
        attributes: attributes,
        functionOperation: ctx.function_operation().start.text
    };
    if (ctx.output_event_type()) {
        window.output = ctx.output_event_type().start.text;
    }
    this.editor.completionEngine.windowList[windowName] = window;

    addStatement(ctx, this.editor, " ; ");
};
/*
 * Define statement listeners ends here
 */

CustomSiddhiListener.prototype.exitExecution_element = function (ctx) {
    addStatement(ctx, this.editor, " ; ");
};

CustomSiddhiListener.prototype.exitError = function (ctx) {
    addStatement(ctx, this.editor, " ");
};

function addStatement(ctx, editor, separator) {
    editor.statementsList.push({
        state: ctx.start.getInputStream().getText(ctx.start.start, ctx.stop.stop) + separator,
        line: ctx.start.line
    });
}

/*
 * Completion engine & validation information update listeners ends here
 */

/*
 * Token Tooltip update listeners starts here
 */

CustomSiddhiListener.prototype.exitFunction_operation = function (ctx) {
    // Updating token tool tip for the WindowProcessor/StreamProcessor/Function
    var snippets;
    var namespaceCtx = ctx.function_namespace(0);
    var functionCtx = ctx.function_id(0);

    if (functionCtx) {
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
        var description;
        if (snippets) {
            if (snippets.windowProcessors && snippets.windowProcessors[processorName]) {            // Checking if the processor exists in window processors
                description = snippets.windowProcessors[processorName].description;
            } else if (snippets.streamProcessors && snippets.streamProcessors[processorName]) {     // Checking if the processor exists in stream processors
                description = snippets.streamProcessors[processorName].description;
            } else if (snippets.functions && snippets.functions[processorName]) {                   // Checking if the processor exists in functions
                description = snippets.functions[processorName].description;
            } else if (this.editor.completionEngine.evalScriptList[processorName]) {
                description = "<strong>Eval Script</strong> - " + processorName + "<br><ul>" +
                    "<li>Language - " + this.editor.completionEngine.evalScriptList[processorName].language + "</li>" +
                    "<li>Return Type - " + this.editor.completionEngine.evalScriptList[processorName].returnType + "</li>" +
                    "<li>Function Body - <br><br>" + this.editor.completionEngine.evalScriptList[processorName].functionBody + "</li></ul>"
            }
        }
        if (description) {
            updateTokenDescription(this.editor, functionCtx.stop.line - 1, functionCtx.stop.column + 1, description);
        }
    }
};

CustomSiddhiListener.prototype.exitSource = function (ctx) {
    var sourceName = ctx.start.getInputStream().getText(ctx.start.start, ctx.stop.stop);
    var type;
    var attributes;

    if (this.editor.completionEngine.streamList[sourceName]) {
        type = "Stream";
        attributes = this.editor.completionEngine.streamList[sourceName];
    } else if (this.editor.completionEngine.tableList[sourceName]) {
        type = "Event Table";
        attributes = this.editor.completionEngine.tableList[sourceName];
    } else if (this.editor.completionEngine.windowList[sourceName]) {
        type = "Event Window";
        attributes = this.editor.completionEngine.windowList[sourceName];
    } else if (this.editor.completionEngine.triggerList[sourceName]) {
        type = "Event Trigger";
        attributes = this.editor.completionEngine.triggerList[sourceName];
    }

    if (type) {
        var tooltip = "<strong>" + type + "</strong> - " + sourceName + "<br>";
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
    }
};

function updateTokenDescription(editor, tokenRow, tokenColumn, tooltip) {
    var token = editor.session.getTokenAt(tokenRow, tokenColumn);
    if (token) {
        token.tooltip = tooltip;
    }
}

/*
 * Token Tooltip update listeners ends here
 */

exports.CustomSiddhiListener = CustomSiddhiListener;
