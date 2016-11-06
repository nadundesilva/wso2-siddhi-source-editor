package org.wso2.siddhi.editor.api.commons.metadata;

import java.util.LinkedList;
import java.util.List;

/**
 * For storing meta data for a extension namespace or in-built processors
 * Used in JSON responses
 */
public class MetaData {
    private List<ProcessorMetaData> functions;
    private List<ProcessorMetaData> streamProcessors;
    private List<ProcessorMetaData> windowProcessors;

    public MetaData() {
        functions = new LinkedList<>();
        streamProcessors = new LinkedList<>();
        windowProcessors = new LinkedList<>();
    }

    public List<ProcessorMetaData> getFunctions() {
        return functions;
    }

    public void setFunctions(List<ProcessorMetaData> functions) {
        this.functions = functions;
    }

    public List<ProcessorMetaData> getStreamProcessors() {
        return streamProcessors;
    }

    public void setStreamProcessors(List<ProcessorMetaData> streamProcessors) {
        this.streamProcessors = streamProcessors;
    }

    public List<ProcessorMetaData> getWindowProcessors() {
        return windowProcessors;
    }

    public void setWindowProcessors(List<ProcessorMetaData> windowProcessors) {
        this.windowProcessors = windowProcessors;
    }
}
