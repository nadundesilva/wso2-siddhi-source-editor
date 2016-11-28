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

TokenToolTipUpdateListener.prototype.exitStream_id = function (ctx) {
    var sourceName = getTextFromCtx(ctx);
    var source;

    if (ctx.parentCtx.inner && this.editor.completionEngine.streamList["#" + sourceName]) {
        source = this.editor.completionEngine.streamList["#" + sourceName];
    } else {
        if (this.editor.completionEngine.streamList[sourceName]) {
            source = this.editor.completionEngine.streamList[sourceName];
        } else if (this.editor.completionEngine.tableList[sourceName]) {
            source = this.editor.completionEngine.tableList[sourceName];
        } else if (this.editor.completionEngine.windowList[sourceName]) {
            source = this.editor.completionEngine.windowList[sourceName];
        } else if (this.editor.completionEngine.triggerList[sourceName]) {
            source = this.editor.completionEngine.triggerList[sourceName];
        }
    }

    if (source && source.description) {
        updateTokenDescription(this.editor, ctx.stop.line - 1, ctx.stop.column + 1, source.description);
    }
};

TokenToolTipUpdateListener.prototype.exitTrigger_name = function (ctx) {
    var triggerName = getTextFromCtx(ctx);
    var trigger = this.editor.completionEngine.triggerList[triggerName];
    if (trigger && trigger.description) {
        updateTokenDescription(this.editor, ctx.stop.line - 1, ctx.stop.column + 1, trigger.description);
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

exports.TokenToolTipUpdateListener = TokenToolTipUpdateListener;
