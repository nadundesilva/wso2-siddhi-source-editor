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
 * @param walker The walker for which this listener is generating token tool tips
 */
function TokenTooltipPointRecognitionListener(walker) {
    SiddhiQLListener.call(this);     // inherit default listener
    this.walker = walker;
    return this;
}
TokenTooltipPointRecognitionListener.prototype = Object.create(SiddhiQLListener.prototype);
TokenTooltipPointRecognitionListener.prototype.constructor = TokenTooltipPointRecognitionListener;

TokenTooltipPointRecognitionListener.prototype.exitFunction_operation = function (ctx) {
    var namespaceCtx = ctx.function_namespace(0);
    var functionCtx = ctx.function_id(0);

    if (functionCtx) {
        var processorName = this.walker.utils.getTextFromANTLRCtx(functionCtx);
        var namespace;
        if (namespaceCtx) {
            namespace = this.walker.utils.getTextFromANTLRCtx(namespaceCtx);
        }

        if (processorName) {
            updateTokenDescription(this.walker, SiddhiEditor.constants.FUNCTION_OPERATION, {
                processorName: processorName, namespace: namespace
            }, functionCtx.stop.line - 1, functionCtx.stop.column + 1);
        }
    }
};

TokenTooltipPointRecognitionListener.prototype.exitStream_id = function (ctx) {
    var sourceName = this.walker.utils.getTextFromANTLRCtx(ctx);
    var isInnerStream;

    if (ctx.parentCtx.inner) {
        isInnerStream = true;
    }

    if (sourceName) {
        updateTokenDescription(this.walker, SiddhiEditor.constants.SOURCE, {
            sourceName: sourceName, isInnerStream: isInnerStream
        }, ctx.stop.line - 1, ctx.stop.column + 1);
    }
};

TokenTooltipPointRecognitionListener.prototype.exitTrigger_name = function (ctx) {
    var triggerName = this.walker.utils.getTextFromANTLRCtx(ctx);

    if (triggerName) {
        updateTokenDescription(this.walker, SiddhiEditor.constants.TRIGGERS, {
            triggerName: triggerName
        }, ctx.stop.line - 1, ctx.stop.column + 1);
    }
};

/**
 * Update the token tool tip point data in the ANTLR walker
 *
 * @private
 * @param walker The walker of which the token should be update
 * @param type The ty[e of tooltip
 * @param tooltipData Tooltip point data
 * @param row The row at which the tooltip should be added
 * @param column The column at which the tooltip should be updated
 */
function updateTokenDescription(walker, type, tooltipData, row, column) {
    walker.tokenToolTipData.push({
        type: type,
        tooltipData: tooltipData,
        row: row,
        column: column
    });
}

exports.TokenTooltipPointRecognitionListener = TokenTooltipPointRecognitionListener;
