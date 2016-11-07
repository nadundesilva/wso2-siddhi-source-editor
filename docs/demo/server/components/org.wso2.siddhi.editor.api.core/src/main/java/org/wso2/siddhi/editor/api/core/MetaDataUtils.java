package org.wso2.siddhi.editor.api.core;

import org.wso2.siddhi.core.annotations.Description;
import org.wso2.siddhi.core.annotations.Parameter;
import org.wso2.siddhi.core.annotations.Parameters;
import org.wso2.siddhi.core.annotations.Return;
import org.wso2.siddhi.core.config.SiddhiContext;
import org.wso2.siddhi.core.executor.function.FunctionExecutor;
import org.wso2.siddhi.core.query.processor.stream.StreamProcessor;
import org.wso2.siddhi.core.query.processor.stream.function.StreamFunctionProcessor;
import org.wso2.siddhi.core.query.processor.stream.window.WindowProcessor;
import org.wso2.siddhi.core.query.selector.attribute.aggregator.AttributeAggregator;
import org.wso2.siddhi.editor.api.commons.metadata.MetaData;
import org.wso2.siddhi.editor.api.commons.metadata.ParameterMetaData;
import org.wso2.siddhi.editor.api.commons.metadata.ProcessorMetaData;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.jar.JarEntry;
import java.util.jar.JarInputStream;

/**
 * Utility class for getting the meta data for the in built and extension processors in siddhi
 */
public class MetaDataUtils {
    private static String FUNCTION_EXECUTOR = "FunctionExecutor";
    private static String ATTRIBUTE_AGGREGATOR = "AttributeAggregator";
    private static String WINDOW_PROCESSOR = "WindowProcessor";
    private static String STREAM_FUNCTION_PROCESSOR = "StreamFunctionProcessor";
    private static String STREAM_PROCESSOR = "StreamProcessor";
    private static Map<String, Class<?>> processorTypeToSuperClassMap;

    static {
        // Populating the processor super class map
        processorTypeToSuperClassMap = new HashMap<>();
        processorTypeToSuperClassMap.put(FUNCTION_EXECUTOR, FunctionExecutor.class);
        processorTypeToSuperClassMap.put(ATTRIBUTE_AGGREGATOR, AttributeAggregator.class);
        processorTypeToSuperClassMap.put(WINDOW_PROCESSOR, WindowProcessor.class);
        processorTypeToSuperClassMap.put(STREAM_FUNCTION_PROCESSOR, StreamFunctionProcessor.class);
        processorTypeToSuperClassMap.put(STREAM_PROCESSOR, StreamProcessor.class);
    }

    /**
     * Returns the in built processor meta data
     * Scans for all classes in all jars in the classpath
     *
     * @return In-built processor meta data
     */
    public static MetaData getInBuiltProcessorMetaData() {
        Map<String, String> processorTypeToPackageNameMap = new HashMap<>();
        processorTypeToPackageNameMap.put(FUNCTION_EXECUTOR, "org.wso2.siddhi.core.executor.function");
        processorTypeToPackageNameMap.put(ATTRIBUTE_AGGREGATOR, "org.wso2.siddhi.core.query.selector.attribute.aggregator");
        processorTypeToPackageNameMap.put(WINDOW_PROCESSOR, "org.wso2.siddhi.core.query.processor.stream.window");
        Map<String, Set<Class<?>>> processorTypeToClassMap = getClassesInClassPathFromPackages(processorTypeToPackageNameMap);

        MetaData metaData = new MetaData();
        populateInBuiltMetaData(metaData, processorTypeToClassMap);
        return metaData;
    }

    /**
     * Returns the extension processor meta data
     * Gets the meta data from the siddhi manager
     *
     * @return Extension processor meta data
     */
    public static Map<String, MetaData> getExtensionProcessorMetaData() {
        SiddhiContext siddhiContext = new SiddhiContext();
        Map<String, Class> namesToClassMap = siddhiContext.getSiddhiExtensions();

        Map<String, MetaData> namespaceToMetaDataMap = new HashMap<>();
        populateExtensionsMetaData(namespaceToMetaDataMap, namesToClassMap);
        return namespaceToMetaDataMap;
    }

    /**
     * Returns processor types to Classes map with classes in the packages in processor type to package name map
     *
     * @param processorTypeToPackageNameMap Processor types to name map
     * @return Processor types to Classes map
     */
    private static Map<String, Set<Class<?>>> getClassesInClassPathFromPackages(Map<String, String> processorTypeToPackageNameMap) {
        String[] classPathNames = System.getProperty("java.class.path").split(File.pathSeparator);
        Map<String, Set<Class<?>>> processorTypeToClassSetMap = new HashMap<>();
        // Looping the jars
        for (String classPathName : classPathNames) {
            if (classPathName.endsWith(".jar")) {
                JarInputStream stream = null;
                try {
                    stream = new JarInputStream(new FileInputStream(classPathName));
                    JarEntry jarEntry = stream.getNextJarEntry();
                    // Looping the classes in jar to get classes in the specified package
                    while (jarEntry != null) {
                        // Looping the set of packages
                        for (Map.Entry<String, String> entry : processorTypeToPackageNameMap.entrySet()) {
                            String packagePath = entry.getValue().replace(".", "/");
                            String jarEntryName = jarEntry.getName();

                            if (packagePath.length() > 0 &&
                                    jarEntryName.length() > packagePath.length() &&
                                    jarEntryName.endsWith(".class") &&
                                    jarEntryName.substring(0, packagePath.length()).equals(packagePath)) {
                                Set<Class<?>> classSet = processorTypeToClassSetMap.get(entry.getKey());
                                if (classSet == null) {
                                    classSet = new HashSet<>();
                                    processorTypeToClassSetMap.put(entry.getKey(), classSet);
                                }
                                classSet.add(Class.forName(jarEntryName.substring(0, jarEntryName.length() - 6).replace("/", ".")));
                            }
                        }
                        jarEntry = stream.getNextJarEntry();
                    }
                } catch (IOException | ClassNotFoundException ignored) {
                } finally {
                    if (stream != null) {
                        try {
                            stream.close();
                        } catch (IOException e) {
                            e.printStackTrace();
                        }
                    }
                }
            }
        }
        return processorTypeToClassSetMap;
    }

    /**
     * Populate the targetMetaData passed with the annotated data in classes in processor type to class map
     *
     * @param targetMetaData            Meta data object to populate
     * @param processorTypeToClassesMap processor types to class map
     */
    private static void populateInBuiltMetaData(MetaData targetMetaData, Map<String, Set<Class<?>>> processorTypeToClassesMap) {
        List<ProcessorMetaData> functionMetaData = new ArrayList<>();
        populateInBuiltProcessorMetaDataList(functionMetaData, processorTypeToClassesMap, FUNCTION_EXECUTOR);
        populateInBuiltProcessorMetaDataList(functionMetaData, processorTypeToClassesMap, ATTRIBUTE_AGGREGATOR);
        targetMetaData.setFunctions(functionMetaData);

        List<ProcessorMetaData> streamProcessorMetaData = new ArrayList<>();
        populateInBuiltProcessorMetaDataList(streamProcessorMetaData, processorTypeToClassesMap, STREAM_FUNCTION_PROCESSOR);
        populateInBuiltProcessorMetaDataList(streamProcessorMetaData, processorTypeToClassesMap, STREAM_PROCESSOR);
        targetMetaData.setStreamProcessors(streamProcessorMetaData);

        List<ProcessorMetaData> windowProcessorMetaData = new ArrayList<>();
        populateInBuiltProcessorMetaDataList(windowProcessorMetaData, processorTypeToClassesMap, WINDOW_PROCESSOR);
        targetMetaData.setWindowProcessors(windowProcessorMetaData);
    }

    /**
     * populate the targetProcessorMetaDataList with the annotated data in the classes in the class map for the specified processor type
     *
     * @param targetProcessorMetaDataList List of processor meta data objects to populate
     * @param processorTypeToClassesMap   processor types to set of class map from which the metadata should be extracted
     * @param processorType               The type of the processor of which meta data needs to be extracted
     */
    private static void populateInBuiltProcessorMetaDataList(List<ProcessorMetaData> targetProcessorMetaDataList,
                                                             Map<String, Set<Class<?>>> processorTypeToClassesMap,
                                                             String processorType) {
        Set<Class<?>> classSet = processorTypeToClassesMap.get(processorType);
        if (classSet != null) {
            for (Class<?> processorClass : classSet) {
                ProcessorMetaData processorMetaData = generateProcessorMetaData(processorClass, processorType, null);
                if (processorMetaData != null) {
                    targetProcessorMetaDataList.add(processorMetaData);
                }
            }
        }
    }

    /**
     * Populate the targetNamespaceToMetaDataMap with the annotated data in the extension names to class map
     *
     * @param targetNamespaceToMetaDataMap Map which should be populated
     * @param extensionNamesToClassesMap   Map from which the meta data needs to be extracted
     */
    private static void populateExtensionsMetaData(Map<String, MetaData> targetNamespaceToMetaDataMap,
                                                   Map<String, Class> extensionNamesToClassesMap) {
        for (Map.Entry<String, Class> entry : extensionNamesToClassesMap.entrySet()) {
            String[] processorNameWithNamespace = entry.getKey().split(":");
            MetaData metaData = targetNamespaceToMetaDataMap.get(processorNameWithNamespace[0]);
            if (metaData == null) {
                metaData = new MetaData();
                targetNamespaceToMetaDataMap.put(processorNameWithNamespace[0], metaData);
            }

            Class<?> extensionClass = entry.getValue();
            String processorType = null;
            List<ProcessorMetaData> processorMetaDataList = null;
            if (extensionClass.isAssignableFrom(processorTypeToSuperClassMap.get(FUNCTION_EXECUTOR))) {
                processorType = FUNCTION_EXECUTOR;
                processorMetaDataList = metaData.getFunctions();
            } else if (extensionClass.isAssignableFrom(processorTypeToSuperClassMap.get(ATTRIBUTE_AGGREGATOR))) {
                processorType = ATTRIBUTE_AGGREGATOR;
                processorMetaDataList = metaData.getFunctions();
            } else if (extensionClass.isAssignableFrom(processorTypeToSuperClassMap.get(STREAM_FUNCTION_PROCESSOR))) {
                processorType = STREAM_FUNCTION_PROCESSOR;
                processorMetaDataList = metaData.getStreamProcessors();
            } else if (extensionClass.isAssignableFrom(processorTypeToSuperClassMap.get(STREAM_PROCESSOR))) {
                processorType = STREAM_PROCESSOR;
                processorMetaDataList = metaData.getStreamProcessors();
            } else if (extensionClass.isAssignableFrom(processorTypeToSuperClassMap.get(WINDOW_PROCESSOR))) {
                processorType = WINDOW_PROCESSOR;
                processorMetaDataList = metaData.getWindowProcessors();
            }

            ProcessorMetaData processorMetaData =
                    generateProcessorMetaData(extensionClass, processorType, processorNameWithNamespace[1]);
            if (processorMetaData != null && processorMetaDataList != null) {
                processorMetaDataList.add(processorMetaData);
            }
        }
    }

    /**
     * Generate processor meta data from the annotated data in the class
     * Passing null as the name of the processor will generate a name from the class name
     *
     * @param processorClass Class from which meta data should be extracted from
     * @param processorType  The processor type of the class
     * @param processorName  The name of the processor
     * @return processor meta data
     */
    private static ProcessorMetaData generateProcessorMetaData(Class<?> processorClass, String processorType,
                                                               String processorName) {
        ProcessorMetaData processorMetaData = null;
        // Check if the processor class is a subclass of the super class and not the superclass itself
        if (processorTypeToSuperClassMap.get(processorType).isAssignableFrom(processorClass) &&
                processorTypeToSuperClassMap.get(processorType) != processorClass) {
            if (processorName == null) {
                processorName = processorClass.getName().replace(processorType, "");
                processorName = processorName.substring(processorName.lastIndexOf('.') + 1);
            }

            Description descriptionAnnotation = processorClass.getAnnotation(Description.class);
            Parameters parametersAnnotation = processorClass.getAnnotation(Parameters.class);   // When multiple parameters are present
            Parameter parameterAnnotation = processorClass.getAnnotation(Parameter.class);      // When only single parameter is present
            Return returnAnnotation = processorClass.getAnnotation(Return.class);

            if (descriptionAnnotation != null || parametersAnnotation != null || returnAnnotation != null) {
                processorMetaData = new ProcessorMetaData();
                processorMetaData.setName(processorName.substring(0, 1).toLowerCase() + processorName.substring(1));

                if (descriptionAnnotation != null) {
                    processorMetaData.setDescription(descriptionAnnotation.value());
                }
                if (parametersAnnotation != null) {
                    // When multiple parameters are present
                    List<ParameterMetaData> parameterMetaDataList = new ArrayList<>();
                    for (Parameter parameter : parametersAnnotation.value()) {
                        ParameterMetaData parameterMetaData = new ParameterMetaData();
                        parameterMetaData.setName(parameter.name());
                        parameterMetaData.setType(Arrays.asList(parameter.type()));
                        parameterMetaData.setOptional(parameter.optional());
                        parameterMetaDataList.add(parameterMetaData);
                    }
                    processorMetaData.setParameters(parameterMetaDataList);
                } else if (parameterAnnotation != null) {
                    // When only a single parameter is present
                    ParameterMetaData parameterMetaData = new ParameterMetaData();
                    parameterMetaData.setName(parameterAnnotation.name());
                    parameterMetaData.setType(Arrays.asList(parameterAnnotation.type()));
                    parameterMetaData.setOptional(parameterAnnotation.optional());

                    List<ParameterMetaData> parameterMetaDataList = new ArrayList<>();
                    parameterMetaDataList.add(parameterMetaData);
                    processorMetaData.setParameters(parameterMetaDataList);
                } else {
                    processorMetaData.setParameters(new ArrayList<>());
                }
                if (returnAnnotation != null) {
                    processorMetaData.setreturnType(Arrays.asList(returnAnnotation.value()));
                } else {
                    processorMetaData.setParameters(new ArrayList<>());
                }
            }
        }
        return processorMetaData;
    }
}
