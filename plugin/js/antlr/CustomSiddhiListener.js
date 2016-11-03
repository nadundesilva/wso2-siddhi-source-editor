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


CustomSiddhiListener.prototype.exitDefinition_function = function (ctx) {
    if (SiddhiEditor.debug) {
        console.warn(loggerContext + ":" + "exitDefinition_function" + "->");
        console.log("EXIT Function", ctx);
    }
    updateStatementsList(ctx, this.editor, " ;");
};


CustomSiddhiListener.prototype.exitDefinition_stream = function (ctx) {
    var tempStream = new CompletionEngine.Stream();
    tempStream.setStreamFromDefineStatement(ctx);
    this.editor.completionEngine.streamList.addStream(tempStream);
    updateStatementsList(ctx, this.editor, " ;");
};


CustomSiddhiListener.prototype.exitDefinition_table = function (ctx) {
    var tempTable = new CompletionEngine.Table();
    tempTable.setTableFromDefineStatement(ctx);
    this.editor.completionEngine.tableList.addTable(tempTable);
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


CustomSiddhiListener.prototype.exitQuery = function (ctx) {
    if (ctx.query_output() && ctx.query_output().children &&
            ctx.query_output().target() && ctx.query_output().target().children &&
            ctx.query_output().target().stop.type == 95) {
        var tempStream = new CompletionEngine.Stream();

        if (ctx.query_output() && ctx.query_output().target() && ctx.query_output().target().children) {
            var tableList = this.editor.completionEngine.tableList.getTableIDList();
            var id = ctx.query_output().target().stop.text;
            for (var i = 0; i < tableList.length; i++) {
                if (tableList[i] == id) {
                    return;
                }
            }
            tempStream.id = id;
        } else {
            return;
        }

        var attributeList = (ctx.query_section() && ctx.query_section().children && ctx.query_section().output_attribute()) ? ctx.query_section().output_attribute() : [];

        if (!ctx.query_section() || (attributeList.length == 0 &&
                ctx.query_section().children && ctx.query_section().children[1] &&
                ctx.query_section().children[1].symbol.type === 14)) {
            if (ctx.query_input().standard_stream()) {
                var inputStream = ctx.query_input().standard_stream().source().stream_id().name().stop.text;
                tempStream.attributeNames = this.editor.completionEngine.streamList.getAttributeNameList(inputStream);

                if (SiddhiEditor.debug) {
                    console.warn(loggerContext + ":" + "exitQuery" + "->");
                    console.log("inferred stream", tempStream.attributeNames)
                }
            } else if (ctx.query_input().join_stream()) {
                var leftsource = ctx.query_input().join_stream().left_source.source().stop.text;
                var rightsource = ctx.query_input().join_stream().right_source.source().stop.text;

                var leftStreamAttributeList = this.editor.completionEngine.streamList.getAttributeNameList(leftsource);
                var rightStreamAttributeList = this.editor.completionEngine.streamList.getAttributeNameList(rightsource);
                leftStreamAttributeList = leftStreamAttributeList.map(function (d) {
                    return leftsource + "_" + d;
                });

                rightStreamAttributeList = rightStreamAttributeList.map(function (d) {
                    return rightsource + "_" + d;
                });
                tempStream.attributeNames = leftStreamAttributeList.concat(rightStreamAttributeList);
                if (SiddhiEditor.debug) {
                    console.warn(loggerContext + ":" + "exitQuery" + "->");
                    console.log("JOIN STREAM", tempStream);
                }
            }
        }
        for (i = 0; i < attributeList.length; i++) {
            if (attributeList[i].AS()) {
                if (attributeList[i].attribute_name() &&
                        attributeList[i].attribute_name().children &&
                        attributeList[i].attribute_name().name().stop.type == 95) {
                    tempStream.attributeNames.push(attributeList[i].attribute_name().name().stop.text);
                }

            } else {
                if (attributeList[i].attribute_reference() &&
                        attributeList[i].attribute_reference().children &&
                        attributeList[i].attribute_reference().attribute_name() &&
                        attributeList[i].attribute_reference().attribute_name().children &&
                        attributeList[i].attribute_reference().attribute_name().name().stop.type == 95) {
                    tempStream.attributeNames.push(attributeList[i].attribute_reference().attribute_name().name().stop.text);
                }
            }
        }
        this.editor.completionEngine.streamList.addStream(tempStream);
    }
};

CustomSiddhiListener.prototype.exitFunction_operation = function (ctx) {
    // Updating token tool tip for the WindowProcessor/StreamProcessor/Function
    var snippets;
    var namespaceCtx = ctx.function_namespace(0);
    var functionCtx = ctx.function_id(0);

    var processorName = functionCtx.start.getInputStream().getText(functionCtx.start.start, functionCtx.stop.stop);
    if (namespaceCtx) {
        var namespace = namespaceCtx.start.getInputStream().getText(namespaceCtx.start.start, namespaceCtx.stop.stop);
        snippets = CompletionEngine.functionOperationSnippets.extensions[namespace];

        // Adding namespace tool tip
        updateTokenDescription(this.editor, namespaceCtx.stop.line - 1, namespaceCtx.stop.column + 1, "Extension namespace - " + namespace);
    } else {
        snippets = CompletionEngine.functionOperationSnippets.inBuilt;
    }

    // Adding WindowProcessor/StreamProcessor/Function/additional tool tip
    var snippet = snippets.windowProcessors[processorName];
    if (!snippet) {
        snippet = snippets.streamProcessors[processorName];
    }
    if (!snippet) {
        snippet = snippets.functions[processorName];
    }
    if (!snippet) {
        snippet = CompletionEngine.functionOperationSnippets.additional[processorName];
    }
    if (snippet) {
        updateTokenDescription(this.editor, functionCtx.stop.line - 1, functionCtx.stop.column + 1, snippet.description);
    }
};

CustomSiddhiListener.prototype.exitSource = function (ctx) {
    var streamName = ctx.start.getInputStream().getText(ctx.start.start, ctx.stop.stop);
    var attributes = this.editor.completionEngine.streamList.getAttributeList(streamName);
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

function updateTokenDescription(editor, tokenRow, tokenColumn, tooltip) {
    var token = editor.session.getTokenAt(tokenRow, tokenColumn);
    token.tooltip = tooltip;
}

exports.CustomSiddhiListener = CustomSiddhiListener;
