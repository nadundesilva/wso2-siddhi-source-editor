package org.wso2.siddhi.editor.api;

import org.wso2.msf4j.MicroservicesRunner;

public class Application {
    public static void main(String[] args) {
        new MicroservicesRunner().deploy(new SiddhiEditorEndpoint()).start();
    }
}
