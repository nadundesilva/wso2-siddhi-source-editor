package org.wso2.siddhi.editor.api.commons.request;

import java.util.List;

public class ValidateRequest {
    private String executionPlan;
    private List<String> missingStreams;

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
}
