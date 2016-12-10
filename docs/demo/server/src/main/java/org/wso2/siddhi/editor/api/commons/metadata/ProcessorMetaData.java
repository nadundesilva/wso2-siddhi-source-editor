package org.wso2.siddhi.editor.api.commons.metadata;

import java.util.List;

/**
 * For storing Processor and ExpressionExecutor related meta data
 * Used in JSON responses
 */
public class ProcessorMetaData {
    private String name;
    private String description;
    private List<ParameterMetaData> parameters;
    private List<String> returnType;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<ParameterMetaData> getParameters() {
        return parameters;
    }

    public void setParameters(List<ParameterMetaData> parameters) {
        this.parameters = parameters;
    }

    public List<String> getreturnType() {
        return returnType;
    }

    public void setreturnType(List<String> returnType) {
        this.returnType = returnType;
    }
}
