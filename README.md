# Siddhi Editor

This is a web based editor supporting [SiddhiQL 3.1](https://docs.wso2.com/display/CEP420/SiddhiQL+Guide+3.1). A server side REST API is also required for providing meta data for the editor about the processors available is the Siddhi engine and also for better validations using the Siddhi engine.

[Siddhi](https://github.com/wso2/siddhi) is a lightweight, easy-to-use Open Source Complex Event Processing Engine released as a Java Library under Apache Software License v2.0. Siddhi Editor's REST API uses Siddhi 3.1.3-SNAPSHOT and MSF4J 2.1.0-SNAPSHOT to implement the REST API required by the web based editor.

A demo of the editor and how to run the demo can be found [here](https://github.com/nadundesilva/WSO2SiddhiEditor/tree/master/docs/demo).

## Getting Started

1. Copy the `plugin/` directory to your project.
2. Add the following java script files in the given order.
   ```html
   <script src="plugin/lib/jquery.min.js"></script>
   <script src="plugin/lib/prototype.js"></script>
   <script src="plugin/lib/require.js"></script>

   <script src="plugin/lib/ace-editor/ace.js"></script>
   <script src="plugin/lib/ace-editor/ext-language_tools.js"></script>

   <script src="plugin/js/siddhi-editor.js"></script>
   ```

3. Add the following element to where you want the editor to appear. You can use a `<div>` element instead of `<pre>`
   ```html
   <pre id="my-editor"></pre>
   ```

4. Add the following script.
   ```html
   <script type="text/javascript">
      jQuery(document).ready(function () {
         SiddhiEditor.init({
            divID: "my-editor",
            realTimeValidation: true,
            autoCompletion: true
         });
      });
   </script>
   ```
5. Open the web page and the editor should apear in the specified element.
   The implementation of the REST API required for this can be found [here](https://github.com/nadundesilva/WSO2SiddhiEditor/tree/master/docs/demo/server). This REST API had been implemented using WSO2 MSF4J and you may change the REST API implementation as required keeping the API endpoints the same.

## Configuring the editor

You can configure the Siddhi Editor by passing the configurations object into SiddhiEditor.init() method. The following configurations are supported by the editor.

* divID (required) - string
* realTimeValidation (optional - default: false) - boolean
* autoCompletion (optional - default: false) - boolean
* readOnly (optional - deafult: false) - boolean
* theme (optional - default: "crimson_editor") - string<br>
  The following themes are avaialable. Previews of the themes can be found in the ACE editor demo provided in [Kitchen Sink](https://ace.c9.io/build/kitchen-sink.html). (Note that other features available in the ace editor may be altered and only the themes are recomended to be previewed using Kitchen Sink)
  * ambiance
  * chaos
  * chrome
  * clouds
  * clouds_midnight
  * cobalt
  * crimson_editor
  * dawn
  * dreamweaver
  * eclipse
  * github
  * idle_fingers
  * iplastic
  * katzenmilch
  * kr_theme
  * kuroir
  * merbivore
  * merbivore_soft
  * mono_industrial
  * monokai
  * pastel_on_dark
  * solarized_dark
  * solarized_light
  * sqlserver
  * terminal
  * textmate
  * tomorrow
  * tomorrow_night
  * tomorrow_night_blue
  * tomorrow_night_bright
  * tomorrow_night_eighties
  * twilight
  * vibrant_ink
  * xcode