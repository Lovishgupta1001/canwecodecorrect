package com.eqtechnologic.eqube.mi.activities.filezip; 

import com.eqtechnologic.eqube.connectionconfiguration.bean.ConnectionConfigurationBean; 
import com.eqtechnologic.eqube.connectionconfiguration.service.ConnectionConfigurationService; 
import com.eqtechnologic.eqube.connectionconfiguration.startup.ConnectionServiceInitializer; 
import com.eqtechnologic.eqube.connectionmanagement.api.EQConnectionI; 
import com.eqtechnologic.eqube.eqjdbc.EQConnection; 
import com.eqtechnologic.eqube.exception.BusinessException; 
import com.eqtechnologic.eqube.helperinterface.apis.FileHelper; 
import com.eqtechnologic.eqube.helperinterface.apis.enums.FileHelperTypes; 
import com.eqtechnologic.eqube.helperinterface.apis.util.FileHelperFactory; 
import com.eqtechnologic.eqube.helperinterface.apis.util.beans.FileMetaData; 
import com.eqtechnologic.eqube.helperinterface.apis.util.beans.FileZipUnzipBean; 
import com.eqtechnologic.eqube.helperinterface.apis.util.beans.InsertReturnBean; 
import com.eqtechnologic.eqube.logging.LogTemplate; 
import com.eqtechnologic.eqube.logging.Logger; 
import com.eqtechnologic.eqube.logging.transaction.annotation.LogModuleName; 
import com.eqtechnologic.eqube.mi.common.mierror.eQMIException; 
import com.eqtechnologic.eqube.mi.dlp.constants.DLPConstants; 
import com.eqtechnologic.eqube.mi.dlp.service.DataLossPreventionService; 
import com.eqtechnologic.eqube.mi.enums.eQProcessContextKeys; 
import com.eqtechnologic.eqube.mi.process.context.eQActivityState; 
import com.eqtechnologic.eqube.mi.process.context.eQContext; 
import com.eqtechnologic.eqube.mi.process.context.eQContextConnection; 
import com.eqtechnologic.eqube.mi.process.definition.activity.eQActivityExecutor; 
import com.eqtechnologic.eqube.mi.util.eQMIExceptionUtil; 
import com.eqtechnologic.eqube.platform.adapternextgen.pluginclient.PluginClient; 
import com.eqtechnologic.eqube.property.common.client.interfaces.IPropertyClient; 
import com.eqtechnologic.eqube.property.common.constants.ServiceNameConstants; 
import com.eqtechnologic.eqube.soa.servicemanagement.serviceregistry.ServiceRegistry; 
import com.eqtechnologic.eqube.util.eQubeSQLException; 
import org.apache.commons.lang3.StringUtils; 
import com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.constants.FileSystemConstants; 
import com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.service.FileSystemConnectionService; 
import com.eqtechnologic.eqube.mi.componentservices.filesystemconnection.beans.ConnectionValidationResult; 
import com.eqtechnologic.eqube.mi.activities.filezip.helper.FileZipPluginRegistry; 

import java.util.*; 
import java.util.regex.Pattern; 
import java.util.regex.PatternSyntaxException; 
import java.io.File; 
import java.io.FileInputStream; 
import java.io.IOException; 
import java.nio.file.DirectoryStream; 
import java.nio.file.Files; 
import java.nio.file.Path; 
import java.nio.file.attribute.BasicFileAttributes; 
import java.sql.SQLException; 

import static java.util.Objects.isNull; 

/** 
 * This class implements the execute method of interface eQActivityExecutor. 
 * It's responsible for zip of files/folders from one location to other 
 * @author Devang Desale 
 * 
 */ 
@LogModuleName(moduleName = "Activity") 
public class FileZipExecutor extends eQActivityExecutor { 

    private static final String FILE_ZIP_FAIL = "[ File Zip ] File zip operation will fail"; 

    public FileZipExecutor() { 
        super(); 
    } 

    private static final Logger logger; 

    static { 
        logger = Logger.getLogger(FileZipExecutor.class.getName()); 
    } 

    public static final String TRANSACTION_ID="Transaction Id"; 

    public Object execute(Object configData, eQActivityState activityState, Map<String, String> outPutMap) throws eQMIException { 
        Map<String, Object> configMap = (Map<String, Object>)configData; 
        eQContext context = activityState.getContext(); 
        EQConnectionI srcCon=getConnection(context, configMap, FileZipConstants.SRC_CON,Long.valueOf(-100) ); 
        EQConnectionI destCon=getConnection(context, configMap, FileZipConstants.DEST_CON, Long.valueOf(srcCon.getConnectionId()) ); 

        if(srcCon==null||destCon==null){ 
            throw new eQMIException(FileZipErrorCodes.ERRCODE_INVALID_CONNECTION_KEY, FileZipErrorCodes.INVALID_CONNECTION_KEY,"[File Zip] Error occurred while getting connection from context."); 
        } 

        String transactionId = getTransactionId(context); 
        FileZipUnzipBean fileBean = new FileZipUnzipBean(); 
        String relativeSrcPath=(String) configMap.get(FileZipConstants.SRC_RELATIVE_PATH); 
        relativeSrcPath = !relativeSrcPath.isEmpty()?(String)context.get(relativeSrcPath):""; 
        relativeSrcPath=appendSeparatorBeforeFilePath(relativeSrcPath); 
        String relativeDestPath=(String) configMap.get(FileZipConstants.DEST_RELATIVE_PATH); 
        relativeDestPath = !relativeDestPath.isEmpty()?(String)context.get(relativeDestPath):""; 
        relativeDestPath=appendSeparatorBeforeFilePath(relativeDestPath); 
        String filePattern=(String) configMap.get(FileZipConstants.FILENAME_PATTERN); 
        filePattern = !filePattern.isEmpty() ? getValueFromContext(context,filePattern) : ""; 
        String archiveName=(String) configMap.get(FileZipConstants.ARCHIVE_NAME); 
        archiveName = !archiveName.isEmpty() ? getValueFromContext(context,archiveName) : ""; 
        String archiveType = (String) configMap.get(FileZipConstants.ARCHIVE_TYPE); 

        handleEmptyArchiveName(archiveName,transactionId); 

        archiveName=archiveName+"."+archiveType; 
        archiveName=appendSeparatorBeforeFilePath(archiveName); 

        boolean isRecursive=(boolean)configMap.get(FileZipConstants.RECURSIVE_CHK); 

        boolean isPreserveParentFolder=true; 
        if(configMap.containsKey(FileZipConstants.PRESERVE_PARENT_FOLDER)){ 
            isPreserveParentFolder = (boolean)configMap.get(FileZipConstants.PRESERVE_PARENT_FOLDER); 
        } 
        boolean isPreserveStructure=(boolean)configMap.get(FileZipConstants.PRESERVE_FOLDER); 
        boolean isDeleteInputFiles = (boolean)configMap.get(FileZipConstants.DELETE_INPUT_FILES); 

        //set file bean 
        fileBean.setFileNamePattern(filePattern); 
        fileBean.setSrcRelativeFilePath(relativeSrcPath); 
        fileBean.setDestRelativeFilePath(relativeDestPath); 
        fileBean.setArchiveName(archiveName); 
        fileBean.setArchiveType(archiveType); 
        fileBean.setRecursive(isRecursive); 
        fileBean.setDeleteInputFiles(isDeleteInputFiles); 
        fileBean.setPreserveFolderStructure(isPreserveStructure); 
        fileBean.setIncludeParentFolder(isPreserveParentFolder); 
        if (isDlpScanningEnabled()) { 
            scanForDLP(fileBean,srcCon, getTransactionId(context)); 
        } 

        //zip files 
        try { 
            FileHelper fileHelper= FileHelperFactory.getFileHelper(FileHelperTypes.FILESYSTEMHELPER,srcCon.getPluginV2()); 
            InsertReturnBean returnBean = fileHelper.zipArchiveFiles(fileBean,(EQConnection) destCon.getPluginV2().getConnectionService().getEQConnection()); 

            String zipBaseFilePath=outPutMap.get(FileZipConstants.ZIP_BASE_PATH); 
            String zipRelativeFilePath=outPutMap.get(FileZipConstants.ZIP_RELATIVE_PATH); 
            String zippedFiles=outPutMap.get(FileZipConstants.ZIPPED_FILES); 
            String failedFiles=outPutMap.get(FileZipConstants.FAILED_FILES); 
            String failedFilesToDelete=outPutMap.get(FileZipConstants.FAILED_FILES_TO_DELETE); 
            String zipBaseFilePathValue=getBasePath((EQConnection) destCon.getPluginV2().getConnectionService().getEQConnection()); 
            String zipRelativeFilePathValue= fileBean.getDestRelativeFilePath(); 
            zipRelativeFilePathValue= zipRelativeFilePathValue.replace("/",File.separator); 
            zipRelativeFilePathValue= zipRelativeFilePathValue.replace("\\",File.separator); 

            zipBaseFilePathValue=configureZipBasePathValue(zipBaseFilePathValue); 

            zipRelativeFilePathValue = configureZipRelativeFilePathValue(zipRelativeFilePathValue); 

            if(zipBaseFilePath != null){ 
                context.put(zipBaseFilePath, zipBaseFilePathValue); 
            } 
            if(zipRelativeFilePath != null) { 
                context.put(zipRelativeFilePath, zipRelativeFilePathValue); 
            } 
            if (zippedFiles != null) { 
                context.put(zippedFiles, returnBean.getSuccessfulFileNames()); 
            } 
            if (failedFiles!= null) { 
                context.put(failedFiles, returnBean.getErrorBeans()); 
            } 
            if (failedFilesToDelete != null) { 
                context.put(failedFilesToDelete, returnBean.getDeleteSourceErrorBeans()); 
            } 

        } catch (Exception e) { 
            String errorMessage = TRANSACTION_ID + " : [" + transactionId +"][File Zip] Error occurred while getting file zip output"; 
            LogTemplate logTemplate = LogTemplate.of(errorMessage) 
                .impact(FILE_ZIP_FAIL) 
                .resolution("Check source and destination configuration."); 
            throw eQMIExceptionUtil.createMIException(logger, FileZipErrorCodes.ERRCODE_FILE_ZIP_OUTPUT, FileZipErrorCodes.FILE_ZIP_OUTPUT ,logTemplate, e); 
        } 

        return null; 
    } 

    public static FileSystemConnectionService getFileSystemConnectionService() { 
        return ServiceRegistry.getInstance().getService(FileSystemConstants.FILE_SYSTEM_CONNECTION_SERVICE); 
    } 

    public static boolean isValidRegex(String regex) { 
        try { 
            Pattern.compile(regex); 
            return true; // Regex is valid 
        } catch (PatternSyntaxException e) { 
            return false; // Regex is invalid 
        } 
    } 

    private void scanForDLP(FileZipUnzipBean fileBean, EQConnectionI srcCon, String transactionId) throws eQMIException{ 
        try { 
            List<FileMetaData> files = new LinkedList<>(); 
            String pattern = convertToRegexPattern(fileBean.getFileNamePattern()); 
            EQConnection eQSourceConn = (EQConnection) srcCon.getPluginV2().getConnectionService().getEQConnection(); 
            String sourceBaseRelativePath = getBasePath(eQSourceConn); 
            if (sourceBaseRelativePath.endsWith(File.separator)) { 
                sourceBaseRelativePath = sourceBaseRelativePath.substring(0, sourceBaseRelativePath.length() - 1); 
            } 
            sourceBaseRelativePath +=  fileBean.getSrcRelativeFilePath(); 
            ConnectionConfigurationBean connectionConfigurationBean = fetchConnectionBean(eQSourceConn); 

            if(connectionConfigurationBean !=null) { 
                Map<String, String> connectionDetailsMap = connectionConfigurationBean.getAllPropertiesMap(); 
                if(isValidRegex(pattern) ) { 
                    getFileNames(files, new File(sourceBaseRelativePath).toPath(), pattern, fileBean.isRecursive()); 
                    if (isDlpScanningEnabled() && "File".equalsIgnoreCase(connectionDetailsMap.get("Scheme")) && !connectionConfigurationBean.isRemote()) { 
                        scanAllFilesForDLP(files); 
                    } 
                } 
            } 

        } catch (BusinessException e) { 
            String errorMessage = TRANSACTION_ID + " : [" + transactionId +"][File Zip] Error occurred while scanning files during creating zip."; 
            LogTemplate logTemplate = LogTemplate.of(errorMessage) 
                .impact(FILE_ZIP_FAIL) 
                .resolution("File will not be added in the Zip file"); 
            throw eQMIExceptionUtil.createMIException(logger, FileZipErrorCodes.ERRCODE_FILE_ZIP_OUTPUT, FileZipErrorCodes.FILE_ZIP_OUTPUT ,logTemplate, e); 
        } catch (IOException e) { 
            String errorMessage = TRANSACTION_ID + " : [" + transactionId +"][File Zip] Error while fetching files from source relative file path."; 
            LogTemplate logTemplate = LogTemplate.of(errorMessage) 
                .impact(FILE_ZIP_FAIL) 
                .resolution("Please check relative path as well provided in the configuration."); 
            throw eQMIExceptionUtil.createMIException(logger, FileZipErrorCodes.ERRCODE_FILE_FETCH_EXCEPTION, FileZipErrorCodes.FILE_FETCH_EXCEPTION,logTemplate, e); 
        } 
    } 

    private static String configureZipBasePathValue(String zipBaseFilePathValue){ 
        if (zipBaseFilePathValue.endsWith(File.separator)) { 
            zipBaseFilePathValue = zipBaseFilePathValue.substring(0, zipBaseFilePathValue.length() - 1); 
        } 
        return zipBaseFilePathValue; 
    } 

    private static String configureZipRelativeFilePathValue(String zipRelativeFilePathValue){ 
        if (zipRelativeFilePathValue.endsWith(File.separator)) { 
            zipRelativeFilePathValue = zipRelativeFilePathValue.substring(0, zipRelativeFilePathValue.length() - 1); 
        } 
        if (zipRelativeFilePathValue.startsWith(File.separator)) { 
            zipRelativeFilePathValue = zipRelativeFilePathValue.substring(1); 
        } 
        return zipRelativeFilePathValue; 
    } 

    private static void handleEmptyArchiveName(String archiveName, String transactionId) throws eQMIException { 
        if(archiveName.isEmpty()){ 
            String errorMessage = TRANSACTION_ID + " : [" + transactionId +"][File Zip] Archive Name expression has resolved to undefined."; 
            LogTemplate logTemplate = LogTemplate.of(errorMessage) 
                .impact(FILE_ZIP_FAIL) 
                .resolution("Check if Archive Name variable is initialized."); 
            throw eQMIExceptionUtil.createMIException(logger, 
                String.valueOf(FileZipErrorCodes.FILE_ZIP_ARCHIVE_NAME), 
                FileZipErrorCodes.FILE_ZIP_ARCHIVE_NAME , 
                logTemplate, 
                null); 
        } 
    } 

    private static String getValueFromContext(eQContext context, String key) throws eQMIException{ 
        return (isNull(context.get(key)) || context.get(key) == "null") ? "" : (String)context.get(key); 
    } 

    private static String getBasePath(EQConnection connection) throws eQMIException { 
        if (connection == null) { 
            LogTemplate logTemplate = LogTemplate.of("Connection is not present") 
                .impact(FILE_ZIP_FAIL) 
                .resolution("Select a valid connection"); 
            throw eQMIExceptionUtil.createMIException(logger, 
                FileZipErrorCodes.ERRCODE_INVALID_CONNECTION, 
                FileZipErrorCodes.INVALID_CONNECTION, 
                logTemplate, null); 
        } 

        // Fetch file path from connection configuration 
        Long connId = Long.valueOf(connection.getConnectionId()); 
        String filePath = null; 

        try { 
            filePath = getFileSystemConnectionService() 
                .getFilePathForConnections(Arrays.asList(connId)) 
                .get(connId); 
        } catch (BusinessException e) { 
            throw eQMIExceptionUtil.createMIException(logger, 
                FileZipErrorCodes.ERRCODE_NO_PATH_IN_CONNECTION, 
                FileZipErrorCodes.NO_PATH_IN_CONNECTION, 
                "Failed to fetch file path for connection", e); 
        } 

        if (filePath == null) { 
            throw eQMIExceptionUtil.createMIException(logger, 
                FileZipErrorCodes.ERRCODE_NO_PATH_IN_CONNECTION, 
                FileZipErrorCodes.NO_PATH_IN_CONNECTION, 
                "No file path specified in Connection", null); 
        } 

        return filePath; 
    } 

    private ConnectionConfigurationBean fetchConnectionBean(EQConnection eQSourceConn) throws eQMIException{ 
        PluginClient plugin = eQSourceConn.getPluginV2(); 
        try { 
            ConnectionConfigurationService connService = ServiceRegistry.getInstance().getService(ConnectionServiceInitializer.CONNECTION_CONFIGURATION_SERVICE); 
            return connService.fetch(plugin.getConnectionService().getConnectionInfo().getConnectionId()); 
        } catch (BusinessException e) { 
            String errorMessage = "Error occurred while fetching connection to get file path from context."; 
            LogTemplate logTemplate = LogTemplate.of(errorMessage).impact(FILE_ZIP_FAIL); 
            logger.error(logTemplate, e); 
            throw eQMIExceptionUtil.createMIException(logger, FileZipErrorCodes.ERRCODE_INVALID_CONNECTION_TYPE, 
                FileZipErrorCodes.INVALID_CONNECTION_TYPE, logTemplate, null); 
        } 
    } 

    private static boolean isDlpScanningEnabled() { 
        String value = getPropertyClientService().getPropertyStringValue("enable-dlp-scan"); 
        return StringUtils.isNotEmpty(value) && Boolean.parseBoolean(value); 
    } 

    private void scanAllFilesForDLP(List<FileMetaData> files) throws IOException, BusinessException { 
        for (FileMetaData fileMetaData : files) { 
            File fileToRead = new File(fileMetaData.getParentFolderPath() + File.separator + fileMetaData.getFileName()); 
            FileInputStream fis = new FileInputStream(fileToRead); 
            getDataLossPreventionService().scan(fileMetaData.getFileName(),getFileType(fileMetaData.getFileName()),fileMetaData.getFileSize(),fis); 
            fis.close(); 
        } 
    } 

    private String getFileType(String fileName){ 
        return com.google.common.io.Files.getFileExtension(fileName); 
    } 

    private static DataLossPreventionService getDataLossPreventionService() { 
        return ServiceRegistry.getInstance().getService(DLPConstants.DATA_LOSS_PREVENTION_SERVICE); 
    } 

    private static String appendSeparatorBeforeFilePath(String filepath){ 
        if (filepath!=null && !filepath.isEmpty() && !filepath.startsWith(FileZipConstants.FILE_PATH_SEPARATOR) &&!filepath.startsWith(File.separator)) 
            filepath=FileZipConstants.FILE_PATH_SEPARATOR+filepath; 
        return filepath; 
    } 

    private static String getTransactionId(eQContext context) throws eQMIException { 
        String transactionId; 
        try{ 
            transactionId = (String) context.get(eQProcessContextKeys.TRANSACTIONID.getKeyName()); 
        } catch (eQMIException ex) { 
            String errorMessage = "[File Zip] Error occurred while getting Transaction Id from process context."; 
            LogTemplate logTemplate = LogTemplate.of(errorMessage) 
                .impact(FILE_ZIP_FAIL); 
            throw eQMIExceptionUtil.createMIException(logger, FileZipErrorCodes.ERRCODE_FETCH_DATA, FileZipErrorCodes.FETCH_DATA,logTemplate,ex); 
        } 
        return transactionId; 
    } 

    private EQConnectionI getConnection(eQContext context, Map<String, Object> configMap,String conName,Long otherConnectionID)throws eQMIException{ 
        String transactionId = getTransactionId(context); 
        eQContextConnection objConnection = context.getConnection((String)configMap.get(conName)); 

        if(objConnection == null) { 
            String errorMessage = TRANSACTION_ID + " : [" + transactionId +"][File Zip] Error occurred while getting connection from context. Connection Key is either null or invalid."; 
            LogTemplate logTemplate = LogTemplate.of(errorMessage) 
                .impact(FILE_ZIP_FAIL) 
                .resolution("Make sure Connection Key is valid"); 
            logger.error(logTemplate,null); 
            throw new eQMIException(FileZipErrorCodes.ERRCODE_INVALID_CONNECTION_KEY, FileZipErrorCodes.INVALID_CONNECTION_KEY,errorMessage); 
        } 

        EQConnectionI connection = (EQConnectionI) objConnection.getConnection(); 

        if(connection==null) 
            return null; 
        try{ 
            if(connection.isClosed()) { 
                String errorMessage = TRANSACTION_ID + " : [" + transactionId +"][File Zip] Connection for connection key : "+ conName +" is already closed."; 
                logger.error(errorMessage); 
                throw new eQMIException(FileZipErrorCodes.ERRCODE_CONNECTION_CLOSED,FileZipErrorCodes.CONNECTION_CLOSED ,errorMessage); 
            } 
        }catch (SQLException e){ 
            Exception tempExp = new Exception(e.getMessage()); 
            String errorMessage = TRANSACTION_ID + " : [" + transactionId +"][File Zip] Error occurred while checking if connection is already closed."; 
            logger.error(errorMessage, tempExp); 
            throw eQMIExceptionUtil.createMIException(logger, FileZipErrorCodes.ERRCODE_CONNECTION_CLOSED, FileZipErrorCodes.CONNECTION_CLOSED,errorMessage, e); 
        } 

        ConnectionValidationResult validation = 
            getFileSystemConnectionService().validateConnection( 
                Long.valueOf(connection.getConnectionId()), otherConnectionID, 
                FileZipPluginRegistry.getPluginTypes() 
            ); 

        if (!validation.isValid()) { 
            if (!validation.isPluginClassValid()) { 
                String errorMessage = 
                    TRANSACTION_ID + " : [" + transactionId + "][File Zip] Invalid plugin class: " + 
                    validation.getPluginClass(); 

                LogTemplate logTemplate = LogTemplate.of(errorMessage) 
                    .impact(FILE_ZIP_FAIL) 
                    .resolution("Allowed plugins: FileSystemPlugin, TextFilePlugin"); 

                throw eQMIExceptionUtil.createMIException( 
                    logger, 
                    FileZipErrorCodes.ERRCODE_INVALID_CONNECTION_TYPE, 
                    FileZipErrorCodes.INVALID_CONNECTION_TYPE, 
                    logTemplate, 
                    null 
                ); 
            } 

            if (!validation.isSchemeValid()) { 
                String errorMessage = 
                    TRANSACTION_ID + " : [" + transactionId + "][File Zip] Invalid scheme: " + 
                    validation.getScheme(); 

                LogTemplate logTemplate = LogTemplate.of(errorMessage) 
                    .impact(FILE_ZIP_FAIL) 
                    .resolution("Allowed scheme: File"); 

                throw eQMIExceptionUtil.createMIException( 
                    logger, 
                    FileZipErrorCodes.ERRCODE_INVALID_CONNECTION_TYPE, 
                    FileZipErrorCodes.INVALID_CONNECTION_TYPE, 
                    logTemplate, 
                    null 
                ); 
            } 

            if (validation.isDifferentPluginSrcDest()) { 
                String errorMessage = 
                    TRANSACTION_ID + " : [" + transactionId + "][File Zip] Connection type of source and destination is not same"; 

                LogTemplate logTemplate = LogTemplate.of(errorMessage) 
                    .impact(FILE_ZIP_FAIL) 
                    .resolution("Select same connection type"); 

                throw eQMIExceptionUtil.createMIException( 
                    logger, 
                    FileZipErrorCodes.ERRCODE_INVALID_CONNECTION_TYPE, 
                    FileZipErrorCodes.INVALID_CONNECTION_TYPE, 
                    logTemplate, 
                    null 
                ); 
            } 
        } 
        return connection; 
    } 

    private String convertToRegexPattern(String pattern){ 
        return pattern.replace(".", "\\.").replace("?", ".?").replace("*", ".*?"); 
    } 

    private void getFileNames(List<FileMetaData> filData, Path dir, String regex, Boolean recursive) throws IOException { 
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir)) { 
            for (Path path : stream) { 
                if (path.toFile().isDirectory() && Boolean.TRUE.equals(recursive)) { 
                    getFileNames(filData, path, regex, true); 
                } else { 
                    if (!path.toFile().isDirectory()){ 
                        File root = path.toFile(); 
                        if (regex.isEmpty() || root.getName().matches(regex)) { 
                            BasicFileAttributes attr = Files.readAttributes(root.toPath(), BasicFileAttributes.class); 
                            FileMetaData fileMetaData = new FileMetaData(); 
                            fileMetaData.setFileName(root.getName()); 
                            fileMetaData.setFileSize((int) attr.size()); 
                            fileMetaData.setParentFolderPath(path.getParent().toFile().getPath()); 
                            fileMetaData.setCreatedOn(new Date(attr.creationTime().toMillis())); 
                            fileMetaData.setModifiedOn(new Date(attr.lastModifiedTime().toMillis())); 
                            filData.add(fileMetaData); 
                        } 
                    } 
                } 
            } 
        } 
    } 

    private static IPropertyClient getPropertyClientService(){ 
        return ServiceRegistry.getInstance().getService(ServiceNameConstants.SIMPLE_PROPERTY_INITIALIZER); 
    } 
}
