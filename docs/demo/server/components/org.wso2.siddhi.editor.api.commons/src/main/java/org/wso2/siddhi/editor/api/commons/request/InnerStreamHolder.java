package org.wso2.siddhi.editor.api.commons.request;

import java.util.List;

public class InnerStreamHolder {
    private String partitionName;
    private List<String> innerStreams;

    public String getPartitionName() {
        return partitionName;
    }

    public void setPartitionName(String partitionName) {
        this.partitionName = partitionName;
    }

    public List<String> getInnerStreams() {
        return innerStreams;
    }

    public void setInnerStreams(List<String> innerStreams) {
        this.innerStreams = innerStreams;
    }
}
