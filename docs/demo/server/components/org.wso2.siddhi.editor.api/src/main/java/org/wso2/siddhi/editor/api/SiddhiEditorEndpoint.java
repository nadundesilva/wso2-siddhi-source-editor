package org.wso2.siddhi.editor.api;

import com.google.gson.Gson;
import org.wso2.siddhi.core.ExecutionPlanRuntime;
import org.wso2.siddhi.core.SiddhiManager;
import org.wso2.siddhi.editor.api.commons.request.ValidateRequest;
import org.wso2.siddhi.editor.api.commons.response.ErrorResponse;
import org.wso2.siddhi.editor.api.commons.response.ResponseFactory;
import org.wso2.siddhi.editor.api.core.MetaDataUtils;
import org.wso2.siddhi.query.api.definition.AbstractDefinition;

import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.HashMap;
import java.util.Map;

/**
 * HTTP Responses for siddhi editor related requests
 */
@Path("/siddhi-editor")
public class SiddhiEditorEndpoint {
    @POST
    @Path("/validate")
    public Response validateExecutionPlan(String validationRequestString) {
        ValidateRequest validateRequest = new Gson().fromJson(validationRequestString, ValidateRequest.class);
        String jsonString;

        try {
            // validating the execution plan
            SiddhiManager siddhiManager = new SiddhiManager();
            ExecutionPlanRuntime executionPlanRuntime = siddhiManager.createExecutionPlanRuntime(validateRequest.getExecutionPlan());
            executionPlanRuntime.start();
            executionPlanRuntime.shutdown();

            // Fetching the missing streams requested by the editor
            Map<String, Object> response = ResponseFactory.getCustomSuccessResponse();
            if (validateRequest.getMissingStreams() != null) {
                Map<String, AbstractDefinition> streamDefinitionMap = executionPlanRuntime.getStreamDefinitionMap();
                Map<String, AbstractDefinition> requiredStreamDefinitions = new HashMap<>();
                for (String stream : validateRequest.getMissingStreams()) {
                    AbstractDefinition streamDefinition = streamDefinitionMap.get(stream);
                    if (streamDefinition != null) {
                        requiredStreamDefinitions.put(stream, streamDefinition);
                    }
                }
                response.put("streams", requiredStreamDefinitions);
            }

            jsonString = new Gson().toJson(response);
        } catch (Throwable t) {
            jsonString = new Gson().toJson(new ErrorResponse(t.getMessage()));
        }

        return Response.ok(jsonString, MediaType.APPLICATION_JSON)
                .header("Access-Control-Allow-Origin", "*")
                .build();
    }

    @GET
    @Path("/meta-data")
    public Response getMetaData() {
        Map<String, Object> response = ResponseFactory.getCustomSuccessResponse();
        response.put("inBuilt", MetaDataUtils.getInBuiltProcessorMetaData());
        response.put("extensions", MetaDataUtils.getExtensionProcessorMetaData());

        String jsonString = new Gson().toJson(response);
        return Response.ok(jsonString, MediaType.APPLICATION_JSON)
                .header("Access-Control-Allow-Origin", "*")
                .build();
    }
}
