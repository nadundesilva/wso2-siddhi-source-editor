package org.wso2.siddhi.editor.api.commons.response;

import org.wso2.siddhi.query.api.definition.AbstractDefinition;

import java.util.List;

public class InnerStreamDefinitionHolder {
    private String partitionName;
    private List<AbstractDefinition> innerStreams;

    public String getPartitionName() {
        return partitionName;
    }

    public void setPartitionName(String partitionName) {
        this.partitionName = partitionName;
    }

    public List<AbstractDefinition> getInnerStreams() {
        return innerStreams;
    }

    public void setInnerStreams(List<AbstractDefinition> innerStreams) {
        this.innerStreams = innerStreams;
    }
}
