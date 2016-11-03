/*
 * Copyright (c) 2015, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package org.wso2.carbon.notebook.commons.response;

import java.util.HashMap;
import java.util.Map;

/**
 * Used for generating custom responses
 * This is used when creating a separate object for the response is not required
 * For example returning a list of table names
 */
public class ResponseFactory {
    /**
     * Creates a response map which can be used for returning custom responses
     * Status success is added before the returning the map
     *
     * @return The response map which can be used for encoding into JSON
     */
    public static Map<String, Object> getCustomSuccessResponse() {
        Map<String, Object> response = new HashMap<String, Object>();
        response.put(Status.STATUS, Status.SUCCESS);
        return response;
    }
}
