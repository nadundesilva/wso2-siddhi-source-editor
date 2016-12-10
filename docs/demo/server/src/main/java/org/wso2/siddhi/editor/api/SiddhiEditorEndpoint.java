package org.wso2.siddhi.editor.api;

import com.google.gson.Gson;
import org.wso2.siddhi.core.ExecutionPlanRuntime;
import org.wso2.siddhi.core.SiddhiManager;
import org.wso2.siddhi.editor.api.commons.request.ValidationRequest;
import org.wso2.siddhi.editor.api.commons.response.ErrorResponse;
import org.wso2.siddhi.editor.api.commons.response.ResponseFactory;
import org.wso2.siddhi.editor.api.commons.response.Status;
import org.wso2.siddhi.editor.api.commons.response.ValidationSuccessResponse;
import org.wso2.siddhi.editor.api.core.MetaDataUtils;
import org.wso2.siddhi.query.api.definition.AbstractDefinition;

import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * HTTP Responses for siddhi editor related requests
 */
@Path("/siddhi-editor")
public class SiddhiEditorEndpoint {
    @POST
    @Path("/validate")
    public Response validateExecutionPlan(String validationRequestString) {
        ValidationRequest validationRequest = new Gson().fromJson(validationRequestString, ValidationRequest.class);
        String jsonString;

        try {
            // Validating the execution plan
            SiddhiManager siddhiManager = new SiddhiManager();
            ExecutionPlanRuntime executionPlanRuntime = siddhiManager.createExecutionPlanRuntime(validationRequest.getExecutionPlan());
            executionPlanRuntime.start();
            executionPlanRuntime.shutdown();

            // Fetching the missing streams requested by the editor
            // Status SUCCESS to indicate that the execution plan is valid
            ValidationSuccessResponse response = new ValidationSuccessResponse(Status.SUCCESS);

            // Getting requested inner stream definitions
            List<List<AbstractDefinition>> innerStreamDefinitions = new ArrayList<>();
            if (validationRequest.getMissingInnerStreams() != null) {
                List<List<String>> partitionsWithMissingInnerStreams = validationRequest.getMissingInnerStreams();

                // Transforming the element ID to partition inner streams map to element ID no to partition inner streams map
                Map<Integer, Map<String, AbstractDefinition>> partitionElementIdNoToInnerStreamsMap =
                        new ConcurrentHashMap<>();
                executionPlanRuntime.getPartitionedInnerStreamDefinitionMap().entrySet().parallelStream().forEach(
                        entry -> partitionElementIdNoToInnerStreamsMap.put(
                                Integer.parseInt(entry.getKey().split("-")[1]),
                                entry.getValue()
                        )
                );

                // Creating an ordered list of partition inner streams based on partition element ID
                List<Map<String, AbstractDefinition>> rankedPartitionsWithInnerStreams = new ArrayList<>();
                List<Integer> rankedPartitionElementIds = new ArrayList<>();
                for (Map.Entry<Integer, Map<String, AbstractDefinition>> entry :
                        partitionElementIdNoToInnerStreamsMap.entrySet()) {
                    int i = 0;
                    for (; i < rankedPartitionsWithInnerStreams.size(); i++) {
                        if (entry.getKey() < rankedPartitionElementIds.get(i)) {
                            break;
                        }
                    }
                    rankedPartitionsWithInnerStreams.add(i, entry.getValue());
                    rankedPartitionElementIds.add(i, entry.getKey());
                }

                // Extracting the requested stream definitions from based on the order in rankedPartitionsWithInnerStreams and partitionsWithMissingInnerStreams
                for (int i = 0; i < partitionsWithMissingInnerStreams.size(); i++) {
                    List<String> partitionWithMissingInnerStreams = partitionsWithMissingInnerStreams.get(i);
                    Map<String, AbstractDefinition> partitionWithInnerStreams = rankedPartitionsWithInnerStreams.get(i);
                    List<AbstractDefinition> innerStreamDefinition = new ArrayList<>();

                    for (String missingInnerStream : partitionWithMissingInnerStreams) {
                        AbstractDefinition streamDefinition = partitionWithInnerStreams.get(missingInnerStream);
                        if (streamDefinition != null) {
                            innerStreamDefinition.add(streamDefinition);
                        }
                    }
                    innerStreamDefinitions.add(innerStreamDefinition);
                }
            }
            response.setInnerStreams(innerStreamDefinitions);

            // Getting requested stream definitions
            List<AbstractDefinition> streamDefinitions = new ArrayList<>();
            if (validationRequest.getMissingStreams() != null) {
                Map<String, AbstractDefinition> streamDefinitionMap = executionPlanRuntime.getStreamDefinitionMap();
                for (String stream : validationRequest.getMissingStreams()) {
                    AbstractDefinition streamDefinition = streamDefinitionMap.get(stream);
                    if (streamDefinition != null) {
                        streamDefinitions.add(streamDefinition);
                    }
                }
            }
            response.setStreams(streamDefinitions);

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
