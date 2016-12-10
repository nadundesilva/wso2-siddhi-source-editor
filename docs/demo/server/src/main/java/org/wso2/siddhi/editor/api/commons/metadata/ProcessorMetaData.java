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
    private List<AttributeMetaData> returnEvent;
    private String example;

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

    public List<String> getReturnType() {
        return returnType;
    }

    public void setReturnType(List<String> returnType) {
        this.returnType = returnType;
    }

    public List<AttributeMetaData> getReturnEvent() {
        return returnEvent;
    }

    public void setReturnEvent(List<AttributeMetaData> returnEvent) {
        this.returnEvent = returnEvent;
    }

    public String getExample() {
        return example;
    }

    public void setExample(String example) {
        this.example = example;
    }
}
