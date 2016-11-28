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

function DataPopulationListener(editor) {
    SiddhiQLListener.call(this);     // inherit default listener
    this.editor = editor;
    return this;
}
DataPopulationListener.prototype = Object.create(SiddhiQLListener.prototype);
DataPopulationListener.prototype.constructor = DataPopulationListener;

/*
 * Define statement listeners starts here
 */

DataPopulationListener.prototype.exitDefinition_stream = function (ctx) {
    var streamName = getTextFromCtx(ctx.source());
    var attributes = {};
    var i = 0;
    while (ctx.attribute_name(i)) {
        attributes[getTextFromCtx(ctx.attribute_name(i))] = getTextFromCtx(ctx.attribute_type(i));
        i++;
    }
    this.editor.completionEngine.streamsList[streamName] = {
        attributes: attributes,
        description: SiddhiEditor.utils.generateDescriptionForStreamOrTable("Stream", streamName, attributes)
    };
};

DataPopulationListener.prototype.exitDefinition_table = function (ctx) {
    var tableName = getTextFromCtx(ctx.source());
    var attributes = {};
    var i = 0;
    while (ctx.attribute_name(i)) {
        attributes[getTextFromCtx(ctx.attribute_name(i))] = getTextFromCtx(ctx.attribute_type(i));
        i++;
    }
    this.editor.completionEngine.eventTablesList[tableName] = {
        attributes: attributes,
        description: SiddhiEditor.utils.generateDescriptionForStreamOrTable("Event Table", tableName, attributes)
    };
};

DataPopulationListener.prototype.exitDefinition_trigger = function (ctx) {
    var triggerName = getTextFromCtx(ctx.trigger_name());
    var metaData;
    if (ctx.time_value()) {
        metaData = {type: "Time Value", time: getTextFromCtx(ctx.time_value())};
    } else if (ctx.string_value()) {
        metaData = {type: "Cron Expression", time: getTextFromCtx(ctx.string_value())};
    }
    if (metaData) {
        metaData.description = SiddhiEditor.utils.generateDescriptionForTrigger(triggerName, metaData);
        this.editor.completionEngine.triggersList[triggerName] = metaData;
    }
};

DataPopulationListener.prototype.exitDefinition_function = function (ctx) {
    var evalScriptName = getTextFromCtx(ctx.function_name());
    var metaData = {
        language: getTextFromCtx(ctx.language_name()),
        returnType: [getTextFromCtx(ctx.attribute_type())],
        functionBody: getTextFromCtx(ctx.function_body())
    };
    metaData.description = SiddhiEditor.utils.generateDescriptionForEvalScript(evalScriptName, metaData);
    this.editor.completionEngine.evalScriptsList[evalScriptName] = metaData;
};

DataPopulationListener.prototype.exitDefinition_window = function (ctx) {
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
    this.editor.completionEngine.windowsList[windowName] = metaData;
};

/*
 * Define statement listeners ends here
 */

DataPopulationListener.prototype.exitQuery = function (ctx) {
    if (ctx.query_output() && ctx.query_output().children && ctx.query_output().target()) {
        var outputTarget = getTextFromCtx(ctx.query_output().target());
        if (ctx.query_section()) {
            // Updating the data for streams inserted into without defining if select section is available
            if (!this.editor.completionEngine.eventTablesList[outputTarget] && !this.editor.completionEngine.streamsList[outputTarget] && !this.editor.completionEngine.windowsList[outputTarget]) {
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
                this.editor.completionEngine.streamsList[outputTarget] = {
                    attributes: attributes,
                    description: SiddhiEditor.utils.generateDescriptionForStreamOrTable(
                        (ctx.query_output().target().source().inner ? "Inner " : "") + "Stream", outputTarget, attributes
                    )
                };
            }
        }
        this.editor.completionEngine.incompleteData.streams.push(outputTarget);
    }
};

function getTextFromCtx(ctx) {
    return ctx.start.getInputStream().getText(ctx.start.start, ctx.stop.stop);
}

/*
 * Token Tooltip update listeners ends here
 */

exports.DataPopulationListener = DataPopulationListener;
