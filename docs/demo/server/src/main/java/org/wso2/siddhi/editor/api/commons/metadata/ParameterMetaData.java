package org.wso2.siddhi.editor.api.commons.metadata;

import java.util.List;

/**
 * For storing parameter meta data of a processor or expression executor
 * Used in JSON responses
 */
public class ParameterMetaData {
    private String name;
    private List<String> type;
    private boolean optional;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<String> getType() {
        return type;
    }

    public void setType(List<String> type) {
        this.type = type;
    }

    public boolean isOptional() {
        return optional;
    }

    public void setOptional(boolean optional) {
        this.optional = optional;
    }
}
