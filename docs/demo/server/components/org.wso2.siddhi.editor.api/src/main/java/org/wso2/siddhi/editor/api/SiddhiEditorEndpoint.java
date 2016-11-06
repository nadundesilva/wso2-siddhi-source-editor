package org.wso2.siddhi.editor.api;

import com.google.gson.Gson;
import org.wso2.siddhi.core.SiddhiManager;
import org.wso2.siddhi.editor.api.commons.response.ErrorResponse;
import org.wso2.siddhi.editor.api.commons.response.GeneralResponse;
import org.wso2.siddhi.editor.api.commons.response.ResponseFactory;
import org.wso2.siddhi.editor.api.commons.response.Status;
import org.wso2.siddhi.editor.api.core.MetaDataUtils;

import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.Map;

/**
 * HTTP Responses for siddhi editor related requests
 */
@Path("/siddhi-editor")
public class SiddhiEditorEndpoint {
    @POST
    @Path("/validate")
    public Response validateExecutionPlan(String executionPlan) {
        String jsonString;

        try {
            SiddhiManager siddhiManager = new SiddhiManager();
            siddhiManager.validateExecutionPlan(executionPlan);
            jsonString = new Gson().toJson(new GeneralResponse(Status.SUCCESS));
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
