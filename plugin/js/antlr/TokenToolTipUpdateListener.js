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

var SiddhiQLListener = require('./gen/SiddhiQLListener').SiddhiQLListener;

/**
 * The Token Tool Tip Update Listener prototype constructor
 * Inherits from SiddhiQLListener generated from SiddhiQL grammar using ANTLR4
 *
 * @constructor
 * @param editor The editor for which this listener is generating token tool tips
 */
function TokenToolTipUpdateListener(editor) {
    SiddhiQLListener.call(this);     // inherit default listener
    this.editor = editor;
    return this;
}
TokenToolTipUpdateListener.prototype = Object.create(SiddhiQLListener.prototype);
TokenToolTipUpdateListener.prototype.constructor = TokenToolTipUpdateListener;

TokenToolTipUpdateListener.prototype.exitFunction_operation = function (ctx) {
    // Updating token tool tip for the WindowProcessor/StreamProcessor/Function
    var snippets;
    var namespaceCtx = ctx.function_namespace(0);
    var functionCtx = ctx.function_id(0);

    if (functionCtx) {
        var processorName = SiddhiEditor.utils.getTextFromANTLRCtx(functionCtx);
        if (namespaceCtx) {
            var namespace = SiddhiEditor.utils.getTextFromANTLRCtx(namespaceCtx);
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
            } else if (this.editor.completionEngine.evalScriptsList[processorName]) {
                description = this.editor.completionEngine.evalScriptsList[processorName].description;
            }
        }
        if (description) {
            updateTokenDescription(this.editor, functionCtx.stop.line - 1, functionCtx.stop.column + 1, description);
        }
    }
};

TokenToolTipUpdateListener.prototype.exitStream_id = function (ctx) {
    var sourceName = SiddhiEditor.utils.getTextFromANTLRCtx(ctx);
    var source;

    if (ctx.parentCtx.inner && this.editor.completionEngine.streamsList["#" + sourceName]) {
        source = this.editor.completionEngine.streamsList["#" + sourceName];
    } else {
        if (this.editor.completionEngine.streamsList[sourceName]) {
            source = this.editor.completionEngine.streamsList[sourceName];
        } else if (this.editor.completionEngine.eventTablesList[sourceName]) {
            source = this.editor.completionEngine.eventTablesList[sourceName];
        } else if (this.editor.completionEngine.eventWindowsList[sourceName]) {
            source = this.editor.completionEngine.eventWindowsList[sourceName];
        } else if (this.editor.completionEngine.eventTriggersList[sourceName]) {
            source = this.editor.completionEngine.eventTriggersList[sourceName];
        }
    }

    if (source && source.description) {
        updateTokenDescription(this.editor, ctx.stop.line - 1, ctx.stop.column + 1, source.description);
    }
};

TokenToolTipUpdateListener.prototype.exitTrigger_name = function (ctx) {
    var triggerName = SiddhiEditor.utils.getTextFromANTLRCtx(ctx);
    var trigger = this.editor.completionEngine.eventTriggersList[triggerName];
    if (trigger && trigger.description) {
        updateTokenDescription(this.editor, ctx.stop.line - 1, ctx.stop.column + 1, trigger.description);
    }
};

/**
 * Update the tooltip in the token in the row and column specified
 *
 * @private
 * @param editor The editor of which the token should be update
 * @param tokenRow The row in which the token is at
 * @param tokenColumn The column at which the token is at
 * @param tooltip The tooltip to show when the user hovers over the token
 */
function updateTokenDescription(editor, tokenRow, tokenColumn, tooltip) {
    var token = editor.getAceEditorObject().session.getTokenAt(tokenRow, tokenColumn);
    if (token) {
        token.tooltip = tooltip;
    }
}

exports.TokenToolTipUpdateListener = TokenToolTipUpdateListener;
