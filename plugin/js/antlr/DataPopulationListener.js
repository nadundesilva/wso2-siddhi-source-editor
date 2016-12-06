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
 * The Data Population Listener prototype constructor
 * Inherits from SiddhiQLListener generated from SiddhiQL grammar using ANTLR4
 *
 * @constructor
 * @param walker The editor for which this listener is populating data
 */
function DataPopulationListener(walker) {
    SiddhiQLListener.call(this);     // inherit default listener
    this.walker = walker;
    return this;
}
DataPopulationListener.prototype = Object.create(SiddhiQLListener.prototype);
DataPopulationListener.prototype.constructor = DataPopulationListener;

/*
 * Define statement listeners starts here
 */

DataPopulationListener.prototype.exitDefinition_stream = function (ctx) {
    var streamName = this.walker.utils.getTextFromANTLRCtx(ctx.source());
    var attributes = {};
    var i = 0;
    while (ctx.attribute_name(i)) {
        attributes[this.walker.utils.getTextFromANTLRCtx(ctx.attribute_name(i))] = this.walker.utils.getTextFromANTLRCtx(ctx.attribute_type(i));
        i++;
    }
    this.walker.completionData.streamsList[streamName] = {
        attributes: attributes
    };

    addStatement(this.walker, ctx, ";");
};

DataPopulationListener.prototype.exitDefinition_table = function (ctx) {
    var tableName = this.walker.utils.getTextFromANTLRCtx(ctx.source());
    var attributes = {};
    var i = 0;
    while (ctx.attribute_name(i)) {
        attributes[this.walker.utils.getTextFromANTLRCtx(ctx.attribute_name(i))] = this.walker.utils.getTextFromANTLRCtx(ctx.attribute_type(i));
        i++;
    }
    this.walker.completionData.eventTablesList[tableName] = {
        attributes: attributes
    };

    addStatement(this.walker, ctx, ";");
};

DataPopulationListener.prototype.exitDefinition_trigger = function (ctx) {
    var triggerName = this.walker.utils.getTextFromANTLRCtx(ctx.trigger_name());
    var metaData;
    if (ctx.time_value()) {
        metaData = {type: "Time Value", time: this.walker.utils.getTextFromANTLRCtx(ctx.time_value())};
    } else if (ctx.string_value()) {
        metaData = {type: "Cron Expression", time: this.walker.utils.getTextFromANTLRCtx(ctx.string_value())};
    }
    if (metaData) {
        this.walker.completionData.eventTriggersList[triggerName] = metaData;
    }

    addStatement(this.walker, ctx, ";");
};

DataPopulationListener.prototype.exitDefinition_function = function (ctx) {
    var evalScriptName = this.walker.utils.getTextFromANTLRCtx(ctx.function_name());
    this.walker.completionData.evalScriptsList[evalScriptName] = {
        language: this.walker.utils.getTextFromANTLRCtx(ctx.language_name()),
        returnType: [this.walker.utils.getTextFromANTLRCtx(ctx.attribute_type())],
        functionBody: this.walker.utils.getTextFromANTLRCtx(ctx.function_body())
    };

    addStatement(this.walker, ctx, ";");
};

DataPopulationListener.prototype.exitDefinition_window = function (ctx) {
    var windowName = this.walker.utils.getTextFromANTLRCtx(ctx.source());
    var attributes = {};
    var i = 0;
    while (ctx.attribute_name(i)) {
        attributes[this.walker.utils.getTextFromANTLRCtx(ctx.attribute_name(i))] = this.walker.utils.getTextFromANTLRCtx(ctx.attribute_type(i));
        i++;
    }
    var metaData = {
        attributes: attributes,
        functionOperation: this.walker.utils.getTextFromANTLRCtx(ctx.function_operation())
    };
    if (ctx.output_event_type()) {
        metaData.output = this.walker.utils.getTextFromANTLRCtx(ctx.output_event_type());
    }
    this.walker.completionData.eventWindowsList[windowName] = metaData;

    addStatement(this.walker, ctx, ";");
};

/*
 * Define statement listeners ends here
 */

DataPopulationListener.prototype.exitQuery = function (ctx) {
    if (ctx.query_output() && ctx.query_output().children && ctx.query_output().target()) {
        var outputTarget = this.walker.utils.getTextFromANTLRCtx(ctx.query_output().target());
        if (ctx.query_section()) {
            // Updating the data for streams inserted into without defining if select section is available
            if (!this.walker.completionData.eventTablesList[outputTarget] && !this.walker.completionData.streamsList[outputTarget] && !this.walker.completionData.eventWindowsList[outputTarget]) {
                // Creating the attributes to reference map
                var querySelectionCtx = ctx.query_section();
                var attributes = {};
                var i = 0;
                var outputAttributeCtx;
                while (outputAttributeCtx = querySelectionCtx.output_attribute(i)) {
                    if (outputAttributeCtx.attribute_name()) {
                        attributes[this.walker.utils.getTextFromANTLRCtx(outputAttributeCtx.attribute_name())] = undefined;
                    } else if (outputAttributeCtx.attribute_reference() &&
                        outputAttributeCtx.attribute_reference().attribute_name()) {
                        attributes[this.walker.utils.getTextFromANTLRCtx(outputAttributeCtx.attribute_reference().attribute_name())] = undefined;
                    }
                    i++;
                }
                this.walker.completionData.streamsList[outputTarget] = {
                    attributes: attributes,
                    isInner: !!ctx.query_output().target().source().inner
                };
            }
        }
        this.walker.incompleteData.streams.push(outputTarget);
    }
};

DataPopulationListener.prototype.exitPlan_annotation = function (ctx) {
    addStatement(this.walker, ctx);
};

DataPopulationListener.prototype.exitExecution_element = function (ctx) {
    addStatement(this.walker, ctx, ";");
};

/**
 * Add a statement to the editor.completionEngine.statementsList array
 * endOfStatementToken is added at the end of the statement if provided
 *
 * @param {object} walker The editor which holds the statements list to which the statement is added
 * @param {object} ctx The ANTLR context which will be used in getting the statement
 * @param [endOfStatementToken] The token to be appended at the end of the statement
 */
function addStatement(walker, ctx, endOfStatementToken) {
    walker.statementsList.push({
        statement: walker.utils.getTextFromANTLRCtx(ctx)  + (endOfStatementToken ? endOfStatementToken : ""),
        line:ctx.start.line - 1
    });
}

/*
 * Token Tooltip update listeners ends here
 */

exports.DataPopulationListener = DataPopulationListener;
