# Siddhi Editor

This is a web based editor supporting [SiddhiQL 4.0.0](https://github.com/nadundesilva/wso2-siddhi/tree/4.0.0). A server side REST API is also required for providing meta data for the editor about the processors available is the Siddhi engine and also for better validations using the Siddhi engine.

Siddhi is a lightweight, easy-to-use Open Source Complex Event Processing Engine released as a Java Library under Apache Software License v2.0. Siddhi Editor's REST API uses Siddhi 3.1.3-SNAPSHOT and MSF4J 2.1.0-SNAPSHOT to implement the REST API required by the web based editor.

A demo of the editor and how to run the demo can be found [here](https://github.com/nadundesilva/WSO2SiddhiEditor/tree/master/docs/demo).

Documentation for the siddhi source editor can be found [here](https://docs.google.com/document/d/1507PAdMjlweDCU0QUPPHuPSqYvI58KmbU7q75rOwjC8/edit?usp=sharing).

## Getting Started

1. Copy the `plugin/` directory to your project.
2. Add the following html tag. (Change the URIs to the RequireJS location and the main.js scripts)
   ```html
   <script data-main="plugin/js/main" src="plugin/lib/requirejs-2.3.2/require.js"></script>
   ```
   
3. Add the following element to where you want the editor to appear. You can use a `<div>` element instead of `<pre>`
   ```html
   <pre id="editor"></pre>
   ```
   
4. Open the web page and the editor should apear in the specified element.
   The implementation of the REST API required for this can be found [here](https://github.com/nadundesilva/WSO2SiddhiEditor/tree/master/docs/demo/server). This REST API had been implemented using WSO2 MSF4J and you may change the REST API implementation as required keeping the API endpoints the same.

## Configuring the editor

You can configure the Siddhi Editor by passing the configurations object into SiddhiEditor.init() method. The following configurations are supported by the editor.

* divID (required) - string
* realTimeValidation (optional - default: false) - boolean
* autoCompletion (optional - default: false) - boolean
* readOnly (optional - deafult: false) - boolean
* theme (optional - default: "crimson_editor") - string<br>
  Previews of the themes available can be found in the ACE editor demo provided in [Kitchen Sink](https://ace.c9.io/build/kitchen-sink.html). (Note that other features available in the ace editor may be altered and only the themes are recomended to be previewed using Kitchen Sink)
