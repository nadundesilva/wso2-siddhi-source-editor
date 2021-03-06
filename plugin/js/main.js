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

requirejs.config({
    baseUrl: window.location.protocol + "//" +
                window.location.host +
                window.location.pathname.split("/").slice(0, -3).join("/") +
                "/plugin",
    paths: {
        jquery: "lib/jquery.min",
        ace: "lib/ace-editor"
    },
    map: {
        "*": {
            jQuery: "jquery"
        }
    }
});

require(["js/siddhi-editor"], function(SiddhiEditor) {

    "use strict";   // JS strict mode

    // Initializing the Siddhi Editor
    new SiddhiEditor({
        divID: "editor",
        realTimeValidation: true,
        autoCompletion: true
    });
});
