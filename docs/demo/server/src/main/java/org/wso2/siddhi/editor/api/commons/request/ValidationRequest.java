package org.wso2.siddhi.editor.api.commons.request;

import java.util.List;

public class ValidationRequest {
    private String executionPlan;
    private List<String> missingStreams;
    private List<List<String>> missingInnerStreams;

    public String getExecutionPlan() {
        return executionPlan;
    }

    public void setExecutionPlan(String executionPlan) {
        this.executionPlan = executionPlan;
    }

    public List<String> getMissingStreams() {
        return missingStreams;
    }

    public void setMissingStreams(List<String> missingStreams) {
        this.missingStreams = missingStreams;
    }

    public List<List<String>> getMissingInnerStreams() {
        return missingInnerStreams;
    }

    public void setMissingInnerStreams(List<List<String>> missingInnerStreams) {
        this.missingInnerStreams = missingInnerStreams;
    }
}
