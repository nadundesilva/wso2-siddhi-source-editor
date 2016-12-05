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
        var keywords = "STREAM|DEFINE|FUNCTION|TRIGGER|TABLE|PLAN|FROM|PARTITION|WINDOW|SELECT|GROUP|BY|" +
            "HAVING|INSERT|OVERWRITE|DELETE|UPDATE|RETURN|EVENTS|INTO|OUTPUT|EXPIRED|CURRENT|SNAPSHOT|" +
            "FOR|RAW|OF|AS|AT|OR|AND|IN|ON|IS|NOT|WITHIN|WITH|BEGIN|END|EVERY|LAST|ALL|FIRST|JOIN|" +
            "INNER|OUTER|RIGHT|LEFT|FULL|UNIDIRECTIONAL|YEARS|MONTHS|WEEKS|DAYS|HOURS|MINUTES|SECONDS|" +
            "MILLISECONDS|STRING|INT|LONG|FLOAT|DOUBLE|BOOL|OBJECT";

        var builtInConstants = "TRUE|FALSE|NULL";

        var builtInBooleanConstants = "TRUE|FALSE";

        var builtInTypes = "STRING|INT|LONG|FLOAT|DOUBLE|BOOL|OBJECT";

        var keywordMapper = this.createKeywordMapper({
            "keyword": keywords,
            "constant.language": builtInConstants,
            "constant.language.boolean": builtInBooleanConstants,
            "support.type": builtInTypes
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
                    token: "string.quoted.double",
                    regex: '".*?"'
                },
                {
                    token: "string.quoted.single",
                    regex: "'.*?'"
                },
                {
                    token: "constant.numeric",
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

ace.define("ace/mode/folding/siddhi",["require","exports","module","ace/lib/oop","ace/range","ace/mode/folding/fold_mode"], function(require, exports, module) {
    "use strict";

    var oop = require("../../lib/oop");
    var BaseFoldMode = require("./fold_mode").FoldMode;

    var SiddhiFoldMode = function() {};
    oop.inherits(SiddhiFoldMode, BaseFoldMode);

    (function() {
        var startToEndBracketRegexMap = {
            "(\\{)(?:.(?!}))*" : "(})"
        };

        /*
         * The fold range start token to end token map
         * Can update this map to define the fold ranges
         */
        var startToEndTokenRegexMap = {
            "(\\/\\*)(?:.(?!\\*\\/))*" : "(\\*\\/)",
            "(begin)(?:.(?!}|end\\s*;))*": "(end\\s*;)"
        };

        // Regular expressions that identify starting and stopping points
        this.foldingStartMarker = new RegExp("(?:" +
                (Object.keys(startToEndBracketRegexMap).length == 0 ? "" : Object.keys(startToEndBracketRegexMap).join("|") + "|") +
                Object.keys(startToEndTokenRegexMap).join("|") +
            ")", "mi");
        this.foldingStopMarker = new RegExp("(?:" +
                (Object.values(startToEndBracketRegexMap).length == 0 ? "" : Object.values(startToEndBracketRegexMap).join("|") + "|") +
                Object.values(startToEndTokenRegexMap).join("|") +
            ")", "mi");

        // The order of tokens should be in the order in which the token groups are matched in foldingStopMarker
        var startTokenRegexps = Object.keys(startToEndTokenRegexMap).map(function (regexString) {
            return new RegExp("^" + regexString, "i");
        });

        // The order of tokens should be in the order in which the token groups are matched in foldingStartMarker
        var endTokenRegexps = Object.values(startToEndTokenRegexMap).map(function (regexString) {
            return new RegExp("^" + regexString, "i");
        });

        this.getFoldWidgetRange = function(session, foldStyle, row) {
            var line = session.getLine(row);

            var match = line.match(this.foldingStartMarker);
            if (match) {
                var i = match.index;
                var matchFound;

                if (match[1]) {     // Brackets are matched using a special function which supports nested brackets
                    return this.openingBracketBlock(session, match[1], row, i);
                }
                for (var j = 1; j < match.length; j++) {
                    if (match[j]) {
                        matchFound = true;
                        break;
                    }
                }

                if (matchFound) {
                    return getRangeFromStartPositionToEndToken(session, row, i + match[j].length, endTokenRegexps[j - 1]);
                }
            }

            if (foldStyle != "markbeginend") {
                return;
            }

            match = line.match(this.foldingStopMarker);
            if (match) {
                i = match.index;

                if (match[1]) {     // Brackets are matched using a special function which supports nested brackets
                    return this.closingBracketBlock(session, match[1], row, i);
                }
                for (j = 1; j < match.length; j++) {
                    if (match[j]) {
                        matchFound = true;
                        break;
                    }
                }

                if (matchFound) {
                    return getRangeFromEndPositionToStartToken(session, row, i, startTokenRegexps[j - 1]);
                }
            }
        };
    }).call(SiddhiFoldMode.prototype);

    /**
     * Return the range from the start position to the position at which the first string matching the endTokenRegex is found
     * Search is started at start position and traveled forward
     *
     * @param session Ace editor session
     * @param startRow Start row of the range
     * @param startColumn Start column of the range
     * @param endTokenRegex Regex of the end token
     */
    function getRangeFromStartPositionToEndToken(session, startRow, startColumn, endTokenRegex) {
        var editorEndRow = session.getLength() - 1;
        var editorEndColumn = session.getLine(editorEndRow).length;

        var editorText = session.doc.getTextRange(SiddhiEditor.Range.fromPoints(
            {row: startRow, column: startColumn},
            {row: editorEndRow, column: editorEndColumn}
        ));

        var endTokenRegexMatch;
        var endTokenRow = startRow;
        var endTokenColumn = startColumn;
        for (var i = 0; i < editorText.length; i++) {
            if (editorText.charAt(i) == "\n") {
                endTokenRow++;
                endTokenColumn = 0;
            } else {
                endTokenColumn++;
            }
            if (endTokenRegexMatch = endTokenRegex.exec(editorText.substring(i))) {
                var range = SiddhiEditor.Range.fromPoints(
                    {row: startRow, column: startColumn},
                    {row: endTokenRow, column: endTokenColumn - 1}
                );
                if (endTokenRegexMatch[1]) {
                    range.end.column += endTokenRegexMatch[0].length - endTokenRegexMatch[1].length;
                }
                return range;
            }
        }
    }

    /**
     * Return the range from the end position to the position at which the last string matching the startTokenRegex is found
     * Search is started at end position and traveled backward
     *
     * @param session Ace editor session
     * @param endRow End row of the range
     * @param endColumn End column of the range
     * @param startTokenRegex Regex of the end token
     */
    function getRangeFromEndPositionToStartToken(session, endRow, endColumn, startTokenRegex) {
        var editorText = session.doc.getTextRange(SiddhiEditor.Range.fromPoints(
            {row: 0, column: 0},
            {row: endRow, column: endColumn}
        ));

        var startTokenRegexMatch;
        var startTokenRow = endRow;
        var startTokenColumn = endColumn;
        for (var i = editorText.length; i > 0 ; i--) {
            if (editorText.charAt(i - 1) == "\n") {
                startTokenRow--;
                startTokenColumn = session.getLine(startTokenRow).length;
            } else {
                startTokenColumn--;
            }
            if (startTokenRegexMatch = startTokenRegex.exec(editorText.substring(i - 1))) {
                var range = SiddhiEditor.Range.fromPoints(
                    {row: startTokenRow, column: startTokenColumn},
                    {row: endRow, column: endColumn}
                );
                if (startTokenRegexMatch[1]) {
                    range.start.column += startTokenRegexMatch[1].length;
                }
                return range;
            }
        }
    }

    exports.SiddhiFoldMode = SiddhiFoldMode;
});

ace.define("ace/mode/siddhi", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text", "ace/mode/siddhi_highlight_rules", "ace/range"], function (require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    var TextMode = require("./text").Mode;
    var SiddhiHighlightRules = require("./siddhi_highlight_rules").SiddhiHighlightRules;
    var SiddhiFoldMode = require("./folding/siddhi").SiddhiFoldMode;

    var Mode = function () {
        this.HighlightRules = SiddhiHighlightRules;
        this.foldingRules = new SiddhiFoldMode();
    };
    oop.inherits(Mode, TextMode);

    (function () {
        this.lineCommentStart = "--";
        this.$id = "ace/mode/siddhi";
    }).call(Mode.prototype);

    exports.Mode = Mode;
});