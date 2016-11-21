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

function CustomSiddhiListener(editor) {
    SiddhiQLListener.call(this);     // inherit default listener
    this.editor = editor;
    return this;
}
CustomSiddhiListener.prototype = Object.create(SiddhiQLListener.prototype);
CustomSiddhiListener.prototype.constructor = CustomSiddhiListener;

/*
 * Define statement listeners starts here
 */

CustomSiddhiListener.prototype.exitDefinition_stream = function (ctx) {
    var streamName = getTextFromCtx(ctx.source());
    var attributes = {};
    var i = 0;
    while (ctx.attribute_name(i)) {
        attributes[getTextFromCtx(ctx.attribute_name(i))] = getTextFromCtx(ctx.attribute_type(i));
        i++;
    }
    this.editor.completionEngine.streamList[streamName] = {
        attributes: attributes,
        description: SiddhiEditor.utils.generateDescriptionForStreamOrTable("Stream", streamName, attributes)
    };
};

CustomSiddhiListener.prototype.exitDefinition_table = function (ctx) {
    var tableName = getTextFromCtx(ctx.source());
    var attributes = {};
    var i = 0;
    while (ctx.attribute_name(i)) {
        attributes[getTextFromCtx(ctx.attribute_name(i))] = getTextFromCtx(ctx.attribute_type(i));
        i++;
    }
    this.editor.completionEngine.tableList[tableName].attributes = {
        attributes: attributes,
        description: SiddhiEditor.utils.generateDescriptionForStreamOrTable("Event Table", tableName, attributes)
    };
};

CustomSiddhiListener.prototype.exitDefinition_trigger = function (ctx) {
    var triggerName = getTextFromCtx(ctx.trigger_name());
    var metaData;
    if (ctx.time_value()) {
        metaData = {type: "Time Value", time: getTextFromCtx(ctx.time_value())};
    } else if (ctx.string_value()) {
        metaData = {type: "Cron Expression", time: getTextFromCtx(ctx.string_value())};
    }
    if (metaData) {
        metaData.description = SiddhiEditor.utils.generateDescriptionForTrigger(triggerName, metaData);
        this.editor.completionEngine.triggerList[triggerName] = metaData;
    }
};

CustomSiddhiListener.prototype.exitDefinition_function = function (ctx) {
    var evalScriptName = getTextFromCtx(ctx.function_name());
    var metaData = {
        language: getTextFromCtx(ctx.language_name()),
        returnType: [getTextFromCtx(ctx.attribute_type())],
        functionBody: getTextFromCtx(ctx.function_body())
    };
    metaData.description = SiddhiEditor.utils.generateDescriptionForEvalScript(evalScriptName, metaData);
    this.editor.completionEngine.evalScriptList[evalScriptName] = metaData;
};

CustomSiddhiListener.prototype.exitDefinition_window = function (ctx) {
    var windowName = getTextFromCtx(ctx.source());
    var attributes = {};
    var i = 0;
    while (ctx.attribute_name(i)) {
        attributes[getTextFromCtx(ctx.attribute_name(i))] = getTextFromCtx(ctx.attribute_type(i));
        i++;
    }
    var metaData = {
        attributes: attributes,
        functionOperation: getTextFromCtx(ctx.function_operation())
    };
    if (ctx.output_event_type()) {
        metaData.output = getTextFromCtx(ctx.output_event_type());
    }
    metaData.description =
        SiddhiEditor.utils.generateDescriptionForWindow(windowName, metaData);
    this.editor.completionEngine.windowList[windowName] = metaData;
};

/*
 * Define statement listeners ends here
 */

CustomSiddhiListener.prototype.exitQuery = function (ctx) {
    if (ctx.query_section() && ctx.query_output() && ctx.query_output().children && ctx.query_output().target()) {
        var outputTarget = getTextFromCtx(ctx.query_output().target());
        if (!this.editor.completionEngine.tableList[outputTarget] &&
                !this.editor.completionEngine.streamList[outputTarget] &&
                !this.editor.completionEngine.windowList[outputTarget]) {
            // Creating the attributes to reference map
            var querySelectionCtx = ctx.query_section();
            var attributes = {};
            var i = 0;
            var outputAttributeCtx;
            while (outputAttributeCtx = querySelectionCtx.output_attribute(i)) {
                if (outputAttributeCtx.attribute_name()) {
                    attributes[getTextFromCtx(outputAttributeCtx.attribute_name())] = undefined;
                } else if (outputAttributeCtx.attribute_reference() &&
                        outputAttributeCtx.attribute_reference().attribute_name()) {
                    attributes[getTextFromCtx(outputAttributeCtx.attribute_reference().attribute_name())] = undefined;
                }
                i++;
            }
            this.editor.completionEngine.streamList[outputTarget] = {
                attributes: attributes,
                description: SiddhiEditor.utils.generateDescriptionForStreamOrTable("Stream", outputTarget, attributes)
            };
        }
    }
};

/*
 * Token Tooltip update listeners starts here
 */

CustomSiddhiListener.prototype.exitFunction_operation = function (ctx) {
    // Updating token tool tip for the WindowProcessor/StreamProcessor/Function
    var snippets;
    var namespaceCtx = ctx.function_namespace(0);
    var functionCtx = ctx.function_id(0);

    if (functionCtx) {
        var processorName = getTextFromCtx(functionCtx);
        if (namespaceCtx) {
            var namespace = getTextFromCtx(namespaceCtx);
            snippets = SiddhiEditor.CompletionEngine.functionOperationSnippets.extensions[namespace];

            // Adding namespace tool tip
            updateTokenDescription(
                this.editor, namespaceCtx.stop.line - 1,
                namespaceCtx.stop.column + 1,
                "Extension namespace - " + namespace
            );
        } else {
            snippets = SiddhiEditor.CompletionEngine.functionOperationSnippets.inBuilt;
        }

        // Adding WindowProcessor/StreamProcessor/Function/additional tool tip
        var description;
        if (snippets) {
            if (snippets.windowProcessors && snippets.windowProcessors[processorName]) {
                description = snippets.windowProcessors[processorName].description;
            } else if (snippets.streamProcessors && snippets.streamProcessors[processorName]) {
                description = snippets.streamProcessors[processorName].description;
            } else if (snippets.functions && snippets.functions[processorName]) {
                description = snippets.functions[processorName].description;
            } else if (this.editor.completionEngine.evalScriptList[processorName]) {
                description = this.editor.completionEngine.evalScriptList[processorName].description;
            }
        }
        if (description) {
            updateTokenDescription(this.editor, functionCtx.stop.line - 1, functionCtx.stop.column + 1, description);
        }
    }
};

CustomSiddhiListener.prototype.exitStream_id = function (ctx) {
    var sourceName = getTextFromCtx(ctx);
    var source;

    if (this.editor.completionEngine.streamList[sourceName]) {
        source = this.editor.completionEngine.streamList[sourceName];
    } else if (this.editor.completionEngine.tableList[sourceName]) {
        source = this.editor.completionEngine.tableList[sourceName];
    } else if (this.editor.completionEngine.windowList[sourceName]) {
        source = this.editor.completionEngine.windowList[sourceName];
    } else if (this.editor.completionEngine.triggerList[sourceName]) {
        source = this.editor.completionEngine.triggerList[sourceName];
    }

    if (source && source.description) {
        updateTokenDescription(this.editor, ctx.stop.line - 1, ctx.stop.column + 1, source.description);
    }
};

function updateTokenDescription(editor, tokenRow, tokenColumn, tooltip) {
    var token = editor.session.getTokenAt(tokenRow, tokenColumn);
    if (token) {
        token.tooltip = tooltip;
    }
}

function getTextFromCtx(ctx) {
    return ctx.start.getInputStream().getText(ctx.start.start, ctx.stop.stop);
}

/*
 * Token Tooltip update listeners ends here
 */

exports.CustomSiddhiListener = CustomSiddhiListener;
