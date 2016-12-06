package org.wso2.siddhi.editor.api.commons.response;

import org.wso2.siddhi.query.api.definition.AbstractDefinition;

import java.util.List;

public class ValidationSuccessResponse extends GeneralResponse {
    private List<AbstractDefinition> streams;
    private List<List<AbstractDefinition>> innerStreams;

    public ValidationSuccessResponse(String status) {
        super(status);
    }

    public List<AbstractDefinition> getStreams() {
        return streams;
    }

    public void setStreams(List<AbstractDefinition> streams) {
        this.streams = streams;
    }

    public List<List<AbstractDefinition>> getInnerStreams() {
        return innerStreams;
    }

    public void setInnerStreams(List<List<AbstractDefinition>> innerStreams) {
        this.innerStreams = innerStreams;
    }
}
