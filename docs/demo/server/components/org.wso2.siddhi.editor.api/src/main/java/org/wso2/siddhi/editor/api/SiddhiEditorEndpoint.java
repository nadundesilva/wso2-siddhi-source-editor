package org.wso2.siddhi.editor.api;

import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import com.google.gson.Gson;
import org.wso2.carbon.notebook.commons.response.ErrorResponse;
import org.wso2.carbon.notebook.commons.response.GeneralResponse;
import org.wso2.carbon.notebook.commons.response.Status;
import org.wso2.siddhi.core.SiddhiManager;

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
}
