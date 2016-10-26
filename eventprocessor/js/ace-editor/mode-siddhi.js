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
ace.define("ace/mode/siddhi_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function (require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

    var SiddhiHighlightRules = function () {
        var keywords = "STREAM|DEFINE|TABLE|FUNCTION|FROM|PARTITION|WINDOW|SELECT|GROUP|BY|HAVING|" +
            "INSERT|DELETE|UPDATE|RETURN|EVENTS|INTO|OUTPUT|EXPIRED|CURRENT|SNAPSHOT|FOR|RAW|OF|AS|" +
            "OR|AND|ON|IS|NOT|WITHIN|WITH|BEGIN|END|NULL|EVERY|LAST|ALL|FIRST|JOIN|INNER|OUTER|" +
            "RIGHT|LEFT|FULL|UNIDIRECTIONAL|YEARS|YEAR|MONTHS|MONTH|WEEKS|WEEK|DAYS|DAY|HOURS|HOUR|" +
            "MINUTES|MIN|MINUTE|SECONDS|SECOND|SEC|MILLISECONDS|MILLISECOND";

        var builtInConstants = "true|false|null";

        var builtInBooleanConstants = "true|false";

        var builtInTypes = "int|string|bool|float|double|object|long";

        var builtInFunctions = "coalesce|convert|instanceOfBoolean|instanceOfDouble|instanceOfFloat|instanceOfInteger|" +
            "instanceOfLong|instanceOfString|UUID|maximum|minimum|cast|ifThenElse";

        var builtInWindows = "time|timeBatch|length|lengthBatch|externalTime|cron|firstUnique|" +
            "unique|sort|frequent|lossyFrequent|externalTimeBatch|timeLength|uniqueExternalTimeBatch";

        var builtInAggregateFunctions = "count|min|max|avg|sum";

        var keywordMapper = this.createKeywordMapper({
            "keyword": keywords,
            "constant.language": builtInConstants,
            "constant.language.boolean": builtInBooleanConstants,
            "support.function": builtInFunctions,
            "support.type": builtInTypes,
            "window.function": builtInWindows,
            "aggregate.function": builtInAggregateFunctions
        }, "identifier", true);

        this.$rules = {
            "start": [
                {
                    token: "annotation.plan",
                    regex: "@Plan\\s*\\:\\s*\\w+"
                },
                {
                    token: "annotation.common",
                    regex: "@\\w+"
                },
                {
                    token: "comment.line",
                    regex: "--.*$"
                },
                {
                    token: "comment.block",
                    start: "/\\*",
                    end: "\\*/"
                },
                {
                    token: "string.quoted.double",           // " string
                    regex: '".*?"'
                },
                {
                    token: "string.quoted.single",           // ' string
                    regex: "'.*?'"
                },
                {
                    token: "constant.numeric", // float
                    regex: "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b"
                },
                {
                    token: keywordMapper,
                    regex: "[a-zA-Z_$][a-zA-Z0-9_$]*\\b"
                },
                {
                    token: "keyword.operator",
                    regex: "\\+|\\-|\\/|\\/\\/|%|<@>|@>|<@|&|\\^|~|<|>|<=|=>|==|!=|<>|=|->|@|#|\\?|\\[|\\]|\\(|\\)|\\?|:|;|,|\\."
                },
                {
                    token: "paren.lparen",
                    regex: "\\("
                },
                {
                    token: "paren.rparen",
                    regex: "\\)"
                },
                {
                    token: "text",
                    regex: "\\s+"
                }
            ]
        };

        this.normalizeRules();
    };

    oop.inherits(SiddhiHighlightRules, TextHighlightRules);
    exports.SiddhiHighlightRules = SiddhiHighlightRules;
});

ace.define("ace/mode/siddhi", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text", "ace/mode/siddhi_highlight_rules", "ace/range"], function (require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    var TextMode = require("./text").Mode;
    var SiddhiHighlightRules = require("./siddhi_highlight_rules").SiddhiHighlightRules;

    var Mode = function () {
        this.HighlightRules = SiddhiHighlightRules;
    };
    oop.inherits(Mode, TextMode);

    (function () {
        this.lineCommentStart = "--";
        this.$id = "ace/mode/siddhi";
    }).call(Mode.prototype);

    exports.Mode = Mode;
});