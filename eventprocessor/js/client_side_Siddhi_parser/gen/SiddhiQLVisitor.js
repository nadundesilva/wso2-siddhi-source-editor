// Generated from SiddhiQL.g4 by ANTLR 4.5
// jshint ignore: start
var antlr4 = require('../antlr4/index');

	//import org.wso2.siddhi.query.compiler.exception.SiddhiParserException;


// This class defines a complete generic visitor for a parse tree produced by SiddhiQLParser.

function SiddhiQLVisitor() {
	antlr4.tree.ParseTreeVisitor.call(this);
	return this;
}

SiddhiQLVisitor.prototype = Object.create(antlr4.tree.ParseTreeVisitor.prototype);
SiddhiQLVisitor.prototype.constructor = SiddhiQLVisitor;

// Visit a parse tree produced by SiddhiQLParser#parse.
SiddhiQLVisitor.prototype.visitParse = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#error.
SiddhiQLVisitor.prototype.visitError = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#execution_plan.
SiddhiQLVisitor.prototype.visitExecution_plan = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#execution_element.
SiddhiQLVisitor.prototype.visitExecution_element = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#definition_stream_final.
SiddhiQLVisitor.prototype.visitDefinition_stream_final = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#definition_stream.
SiddhiQLVisitor.prototype.visitDefinition_stream = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#definition_table_final.
SiddhiQLVisitor.prototype.visitDefinition_table_final = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#definition_table.
SiddhiQLVisitor.prototype.visitDefinition_table = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#definition_window_final.
SiddhiQLVisitor.prototype.visitDefinition_window_final = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#definition_window.
SiddhiQLVisitor.prototype.visitDefinition_window = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#definition_function_final.
SiddhiQLVisitor.prototype.visitDefinition_function_final = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#definition_function.
SiddhiQLVisitor.prototype.visitDefinition_function = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#function_name.
SiddhiQLVisitor.prototype.visitFunction_name = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#language_name.
SiddhiQLVisitor.prototype.visitLanguage_name = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#function_body.
SiddhiQLVisitor.prototype.visitFunction_body = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#definition_trigger_final.
SiddhiQLVisitor.prototype.visitDefinition_trigger_final = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#definition_trigger.
SiddhiQLVisitor.prototype.visitDefinition_trigger = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#trigger_name.
SiddhiQLVisitor.prototype.visitTrigger_name = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#annotation.
SiddhiQLVisitor.prototype.visitAnnotation = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#plan_annotation.
SiddhiQLVisitor.prototype.visitPlan_annotation = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#annotation_element.
SiddhiQLVisitor.prototype.visitAnnotation_element = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#partition.
SiddhiQLVisitor.prototype.visitPartition = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#partition_final.
SiddhiQLVisitor.prototype.visitPartition_final = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#partition_with_stream.
SiddhiQLVisitor.prototype.visitPartition_with_stream = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#condition_ranges.
SiddhiQLVisitor.prototype.visitCondition_ranges = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#condition_range.
SiddhiQLVisitor.prototype.visitCondition_range = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#query_final.
SiddhiQLVisitor.prototype.visitQuery_final = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#query.
SiddhiQLVisitor.prototype.visitQuery = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#query_input.
SiddhiQLVisitor.prototype.visitQuery_input = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#standard_stream.
SiddhiQLVisitor.prototype.visitStandard_stream = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#join_stream.
SiddhiQLVisitor.prototype.visitJoin_stream = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#join_source.
SiddhiQLVisitor.prototype.visitJoin_source = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#pattern_stream.
SiddhiQLVisitor.prototype.visitPattern_stream = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#every_pattern_source_chain.
SiddhiQLVisitor.prototype.visitEvery_pattern_source_chain = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#pattern_source_chain.
SiddhiQLVisitor.prototype.visitPattern_source_chain = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#pattern_source.
SiddhiQLVisitor.prototype.visitPattern_source = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#logical_stateful_source.
SiddhiQLVisitor.prototype.visitLogical_stateful_source = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#pattern_collection_stateful_source.
SiddhiQLVisitor.prototype.visitPattern_collection_stateful_source = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#standard_stateful_source.
SiddhiQLVisitor.prototype.visitStandard_stateful_source = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#basic_source.
SiddhiQLVisitor.prototype.visitBasic_source = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#basic_source_stream_handlers.
SiddhiQLVisitor.prototype.visitBasic_source_stream_handlers = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#basic_source_stream_handler.
SiddhiQLVisitor.prototype.visitBasic_source_stream_handler = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#sequence_stream.
SiddhiQLVisitor.prototype.visitSequence_stream = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#sequence_source_chain.
SiddhiQLVisitor.prototype.visitSequence_source_chain = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#sequence_source.
SiddhiQLVisitor.prototype.visitSequence_source = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#sequence_collection_stateful_source.
SiddhiQLVisitor.prototype.visitSequence_collection_stateful_source = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#anonymous_stream.
SiddhiQLVisitor.prototype.visitAnonymous_stream = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#filter.
SiddhiQLVisitor.prototype.visitFilter = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#stream_function.
SiddhiQLVisitor.prototype.visitStream_function = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#window.
SiddhiQLVisitor.prototype.visitWindow = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#query_section.
SiddhiQLVisitor.prototype.visitQuery_section = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#group_by.
SiddhiQLVisitor.prototype.visitGroup_by = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#having.
SiddhiQLVisitor.prototype.visitHaving = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#query_output.
SiddhiQLVisitor.prototype.visitQuery_output = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#output_event_type.
SiddhiQLVisitor.prototype.visitOutput_event_type = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#output_rate.
SiddhiQLVisitor.prototype.visitOutput_rate = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#output_rate_type.
SiddhiQLVisitor.prototype.visitOutput_rate_type = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#within_time.
SiddhiQLVisitor.prototype.visitWithin_time = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#output_attribute.
SiddhiQLVisitor.prototype.visitOutput_attribute = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#attribute.
SiddhiQLVisitor.prototype.visitAttribute = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#expression.
SiddhiQLVisitor.prototype.visitExpression = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#multiplication_math_operation.
SiddhiQLVisitor.prototype.visitMultiplication_math_operation = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#greaterthan_lessthan_math_operation.
SiddhiQLVisitor.prototype.visitGreaterthan_lessthan_math_operation = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#basic_math_operation.
SiddhiQLVisitor.prototype.visitBasic_math_operation = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#in_math_operation.
SiddhiQLVisitor.prototype.visitIn_math_operation = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#addition_math_operation.
SiddhiQLVisitor.prototype.visitAddition_math_operation = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#and_math_operation.
SiddhiQLVisitor.prototype.visitAnd_math_operation = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#or_math_operation.
SiddhiQLVisitor.prototype.visitOr_math_operation = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#equality_math_operation.
SiddhiQLVisitor.prototype.visitEquality_math_operation = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#not_math_operation.
SiddhiQLVisitor.prototype.visitNot_math_operation = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#function_operation.
SiddhiQLVisitor.prototype.visitFunction_operation = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#attribute_list.
SiddhiQLVisitor.prototype.visitAttribute_list = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#null_check.
SiddhiQLVisitor.prototype.visitNull_check = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#stream_reference.
SiddhiQLVisitor.prototype.visitStream_reference = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#attribute_reference.
SiddhiQLVisitor.prototype.visitAttribute_reference = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#attribute_index.
SiddhiQLVisitor.prototype.visitAttribute_index = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#function_id.
SiddhiQLVisitor.prototype.visitFunction_id = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#function_namespace.
SiddhiQLVisitor.prototype.visitFunction_namespace = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#stream_id.
SiddhiQLVisitor.prototype.visitStream_id = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#stream_alias.
SiddhiQLVisitor.prototype.visitStream_alias = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#property_name.
SiddhiQLVisitor.prototype.visitProperty_name = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#attribute_name.
SiddhiQLVisitor.prototype.visitAttribute_name = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#property_value.
SiddhiQLVisitor.prototype.visitProperty_value = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#source.
SiddhiQLVisitor.prototype.visitSource = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#target.
SiddhiQLVisitor.prototype.visitTarget = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#event.
SiddhiQLVisitor.prototype.visitEvent = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#name.
SiddhiQLVisitor.prototype.visitName = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#collect.
SiddhiQLVisitor.prototype.visitCollect = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#attribute_type.
SiddhiQLVisitor.prototype.visitAttribute_type = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#join.
SiddhiQLVisitor.prototype.visitJoin = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#constant_value.
SiddhiQLVisitor.prototype.visitConstant_value = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#id.
SiddhiQLVisitor.prototype.visitId = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#keyword.
SiddhiQLVisitor.prototype.visitKeyword = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#time_value.
SiddhiQLVisitor.prototype.visitTime_value = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#year_value.
SiddhiQLVisitor.prototype.visitYear_value = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#month_value.
SiddhiQLVisitor.prototype.visitMonth_value = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#week_value.
SiddhiQLVisitor.prototype.visitWeek_value = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#day_value.
SiddhiQLVisitor.prototype.visitDay_value = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#hour_value.
SiddhiQLVisitor.prototype.visitHour_value = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#minute_value.
SiddhiQLVisitor.prototype.visitMinute_value = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#second_value.
SiddhiQLVisitor.prototype.visitSecond_value = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#millisecond_value.
SiddhiQLVisitor.prototype.visitMillisecond_value = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#signed_double_value.
SiddhiQLVisitor.prototype.visitSigned_double_value = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#signed_long_value.
SiddhiQLVisitor.prototype.visitSigned_long_value = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#signed_float_value.
SiddhiQLVisitor.prototype.visitSigned_float_value = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#signed_int_value.
SiddhiQLVisitor.prototype.visitSigned_int_value = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#bool_value.
SiddhiQLVisitor.prototype.visitBool_value = function(ctx) {
};


// Visit a parse tree produced by SiddhiQLParser#string_value.
SiddhiQLVisitor.prototype.visitString_value = function(ctx) {
};



exports.SiddhiQLVisitor = SiddhiQLVisitor;