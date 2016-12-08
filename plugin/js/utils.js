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

/*
 * Utility functions to be used by the siddhi editor and the siddhi web worker
 */
define(function () {

    "use strict";   // JS strict mode

    var self = {};

    /**
     * Word wrap the the string with a maxWidth for each line
     *
     * @param {string} str The string to be word wrapped
     * @param {int} maxWidth The maximum width for the lines
     * @return {string} The word wrapped string
     */
    self.wordWrap = function (str, maxWidth) {
        for (var i = maxWidth; i < str.length;) {
            if (/\s/.test(str.charAt(i))) {
                str = str.substring(0, i) + "\n" + str.substring(i + 1);
                i += maxWidth + 1;
            } else {
                for (var j = i - 1; j > i - maxWidth; j--) {
                    if (/\s/.test(str.charAt(j))) {
                        str = str.substring(0, j) + "\n" + str.substring(j + 1);
                        i = j + maxWidth + 1;
                        break;
                    }
                }
            }
        }
        return str;
    };

    /**
     * Generate description html string from meta data for processor
     * Descriptions are intended to be shown in the tooltips for completions
     *
     * @param {Object} metaData Meta data object containing parameters, return and description
     * @return {string} html string of the description generated from the meta data provided
     */
    self.generateDescriptionForProcessor = function (metaData) {
        var description = "<div>" + (metaData.name ? "<strong>" + metaData.name + "</strong><br>" : "");
        if (metaData.description) {
            description += metaData.description ? "<p>" + self.wordWrap(metaData.description, 100) + "</p>" : "<br>";
        }
        if (metaData.parameters) {
            description += "Parameters - ";
            if (metaData.parameters.length > 0) {
                description += "<ul>";
                for (var j = 0; j < metaData.parameters.length; j++) {
                    if (metaData.parameters[j].multiple) {
                        for (var k = 0; k < metaData.parameters[j].multiple.length; k++) {
                            description += "<li>" +
                                metaData.parameters[j].multiple[k].name +
                                (metaData.parameters[j].optional ? " (optional & multiple)" : "") + " - " +
                                (metaData.parameters[j].multiple[k].type.length > 0 ?
                                    metaData.parameters[j].multiple[k].type.join(" | ").toUpperCase() :
                                    "")
                                + "</li>";
                        }
                    } else {
                        description += "<li>" +
                            metaData.parameters[j].name +
                            (metaData.parameters[j].optional ? " (optional)" : "") +
                            (metaData.parameters[j].type.length > 0 ?
                            " - " + metaData.parameters[j].type.join(" | ").toUpperCase() :
                                "") +
                            "</li>";
                    }
                }
                description += "</ul>";
            } else {
                description += "none<br><br>";
            }
        }
        if (metaData.returnType) {
            description += "Return Type - ";
            if (metaData.returnType.length > 0) {
                description += metaData.returnType.join(" | ").toUpperCase();
            } else {
                description += "none";
            }
        }
        description += "</div>";
        return description;
    };

    /**
     * Generate description html string from meta data for eval script
     * Descriptions are intended to be shown in the tooltips for completions
     *
     * @param {string} evalScriptName Name of the eval script for which the description is generated
     * @param {Object} metaData Meta data object containing parameters, return and description
     * @return {string} html string of the description generated from the meta data provided
     */
    self.generateDescriptionForEvalScript = function (evalScriptName, metaData) {
        return "<div><strong>Eval Script</strong> - " + evalScriptName + "<br><ul>" +
            "<li>Language - " + metaData.language + "</li>" +
            "<li>Return Type - " + metaData.returnType.join(" | ").toUpperCase() + "</li>" +
            "<li>Function Body -" + "<br><br>" + metaData.functionBody + "</li>" +
            "</ul></div>";
    };

    /**
     * Generate description html string from stream/table meta data
     * Descriptions are intended to be shown in the tooltips for completions
     *
     * @param {string} type Type of the source. Should be one of ["Stream", "Event Table"]
     * @param {string} sourceName Name of the stream/table for which the description is generated
     * @param {Object} attributes attributes of the stream/table
     * @return {string} html string of the description generated from the meta data provided
     */
    self.generateDescriptionForStreamOrTable = function (type, sourceName, attributes) {
        var description = "<div><strong>" + type + "</strong> - " + sourceName + "<br>";
        if (attributes && Object.keys(attributes).length > 0) {
            description += "<ul>";
            for (var attribute in attributes) {
                if (attributes.hasOwnProperty(attribute)) {
                    description += "<li>" +
                        attribute + (attributes[attribute] ? " - " + attributes[attribute].toUpperCase() : "") +
                        "</li>";
                }
            }
            description += "</ul>";
        }
        description += "</div>";
        return description;
    };

    /**
     * Generate description html string from trigger meta data
     * Descriptions are intended to be shown in the tooltips for completions
     *
     * @param {string} triggerName Name of the trigger for which the description is generated
     * @param {string} metaData metaData of the trigger
     * @return {string} html string of the description generated from the meta data provided
     */
    self.generateDescriptionForTrigger = function (triggerName, metaData) {
        return "<div><strong>Trigger</strong> - " + triggerName + "<br><br>" +
            metaData.type + " - " + metaData.time + "</div>";
    };

    /**
     * Generate description html string from window meta data
     * Descriptions are intended to be shown in the tooltips for completions
     *
     * @param {string} windowName Name of the window for which the description is generated
     * @param {object} metaData metaData of the window
     * @param {object} functionOperationSnippets Completion engine's function operation snippets object
     * @return {string} html string of the description generated from the meta data provided
     */
    self.generateDescriptionForWindow = function (windowName, metaData, functionOperationSnippets) {
        var description = "<div><strong>Window</strong> - " + windowName + "<br><br>";
        if (metaData.attributes && Object.keys(metaData.attributes).length > 0) {
            description += "Attributes -<ul>";
            for (var attribute in metaData.attributes) {
                if (metaData.attributes.hasOwnProperty(attribute)) {
                    description += "<li>" +
                        attribute + (metaData.attributes[attribute] ? " - " + metaData.attributes[attribute].toUpperCase() : "") +
                        "</li>";
                }
            }
            description += "</ul>";
        }
        if (metaData.functionOperation) {
            description += "Window - " + metaData.functionOperation + "<br><br>";
        }
        if (metaData.output) {
            description += "Output - " + metaData.output + "<br><br>";
        }
        if (metaData.functionOperation &&
            functionOperationSnippets.inBuilt.windowProcessors) {
            var window =
                functionOperationSnippets.inBuilt.windowProcessors[windowName];
            if (window) {
                description += "Description of the window used - <br><br>" +
                    "<div style='margin-left: 25px;'>" + window.description + "</div>";
            }
        }
        description += "</div>";
        return description;
    };

    return self;
});