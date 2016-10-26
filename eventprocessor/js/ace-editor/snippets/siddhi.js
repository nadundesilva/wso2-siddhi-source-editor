
/*
 * Copyright (c) 2014, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

ace.define("ace/snippets/siddhi",["require","exports","module"], function(require, exports, module) {
	"use strict";

	exports.snippetText = "#Define Statements\n\
snippet defStream\n\
	define stream ${1:stream_name} ( ${2:attr1} ${3:Type1},${4:attN} ${5:TypeN});\n\
snippet defTable\n\
	define table ${1:table_name}  ( ${2:attr1} ${3:Type1},${4:attN} ${5:TypeN} );\n\
snippet defFunction\n\
	define function ${1:function_name} [ ${2:lang_name} ] return ${3:return_type} { \n\
	\"Function_body\" \n\
	};\n\
snippet annot-IndexedBy\n\
	@IndexedBy('${1:attribute_name}')\n\
snippet annot-From\n\
	@From(eventtable='${1:rdbms}',jdbc.url=${2:'jdbc:mysql://HOST:3306/DB}', username='${3:root}', password='${4:root}', driver.name='${5:com.mysql.jdbc.Driver}', datasource.name='${6:DATASOURCE}', table.name='${7:TABLENAME}', cache='${8:lru}', cache.size='${9:3000}')\n\
snippet annot-PlanName\n\
	@Plan:name(\"${1:Plan_Name}\")\n\
snippet annot-PlanDesc\n\
	@Plan:Description(\"${1:Plan_Description}\")\n\
snippet annot-PlanStat\n\
	@Plan:Statistics(\"${1:Plan_Statistics}\")\n\
snippet annot-PlanTrace\n\
	@Plan:Trace(\"${1:Plan_Trace}\")\n\
snippet annot-Import\n\
	@Import(\"${1:Stream_ID}\")\n\
snippet annot-Export\n\
	@Export(\"${1:Stream_ID}\")\n\
snippet annot-Info\n\
	@info( name = \"${1:Stream_ID}\" )\n\
snippet annot-Config\n\
	@config( async = \'true\' )\n\
snippet #window.\n\
	window.${1:namespace}:${2:window_name}( ${3:args} )\n\
snippet query-filter\n\
	from ${1:stream_name}[${2:filter_condition}]\n\
	select ${3:attribute1} , ${4:attribute2} \n\
	insert into ${5:output_stream}\n\
	\n\
snippet query-window\n\
	from ${1:stream_name}#window.${2:namespace}:${3:window_name}( ${4:args} )\n\
	select ${5:attribute1} , ${6:attribute2} \n\
	insert into ${7:output_stream}\n\
	\n\
snippet query-window-filter\n\
	from ${1:stream_name}[${2:filter_condition}]#window.${3:namespace}:${4:window_name}( ${5:args} )\n\
	select ${6:attribute1} , ${7:attribute2} \n\
	insert into ${8:output_stream}\n\
	\n\
snippet query-join\n\
	from ${1:stream_name}[${2:filter_condition}]#window.${3:window_name}(${4:args}) {as ${5:reference}}\n\
		join ${6:stream_name}[${7:filter_condition}]#window.${8:window_name}(${9:args}) {as ${10:reference}}\n\
		on ${11:join_condition}\n\
		within ${12: time_gap}\n\
	select ${13:attribute1} , ${14:attribute2} \n\
	insert into ${15:output_stream}\n\
	\n\
snippet query-pattern\n\
	from every ${0:stream_reference}=${1:stream_name}[${2:filter_condition}] -> \n\
		every ${3:stream_reference2}=${4:stream_name2}[${5:filter_condition2}]\n\
		within ${6: time_gap}\n\
	select  ${7:stream_reference}.${8:attribute1} , ${9:stream_reference}.${10:attribute1} \n\
	insert into ${15:output_stream}\n\
	\n\
snippet query\n\
	from ${1:stream_name}\n\
	select ${2:attribute1} , ${3:attribute2} \n\
	insert into ${4:output_stream}\n\
	\n\
snippet partition\n\
	partition with ( ${1:attribute_name} of ${2:stream_name} , ${3:attribute2_name} of ${4:stream2_name})\n\
	begin\n\
		${5:query1}\n\
		\n\
		${6:query2}\n\
		\n\
		${7:query3}\n\
	end;\n\
";
	exports.scope = "siddhi";

});
