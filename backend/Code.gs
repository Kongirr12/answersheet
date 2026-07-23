/**
 * MHC-TEST - Google Apps Script Backend
 * Handles REST API via doGet/doPost with JSONP or CORS headers.
 */

function doGet(e) {
  // If it's a simple GET, handle it. If callback is provided, wrap in JSONP
  const result = processRequest(e.parameter);
  
  if (e.parameter.callback) {
    return ContentService.createTextOutput(e.parameter.callback + '(' + JSON.stringify(result) + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let params = {};
  if (e.postData && e.postData.contents) {
    try {
      params = JSON.parse(e.postData.contents);
    } catch (err) {
      params = e.parameter;
    }
  } else {
    params = e.parameter;
  }
  
  const result = processRequest(params);
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function processRequest(params) {
  const action = params.action;
  
  if (!action) {
    return { success: false, message: 'Missing action parameter' };
  }

  // To support nested JSON payloads in standard form encoded posts, try parsing payload
  if (typeof params.payload === 'string') {
    try { params.payload = JSON.parse(params.payload); } catch(e) {}
  }

  switch (action) {
    case 'ping':
      return { success: true, message: 'pong' };
      
    case 'loginStaff':
      return Database.loginStaff(params.username, params.password);
      
    case 'addUser':
      return Database.addUser(params.payload);
      
    case 'deleteUser':
      return Database.deleteUser(params.username);
      
    case 'getSubjects':
      return Database.getSubjects();
      
    case 'saveSubject':
      return Database.saveSubject(params.payload);
      
    case 'deleteSubject':
      return Database.deleteSubject(params.subjectId);
      
    case 'getAnswerKeys':
      return Database.getAnswerKeys(params.subjectId);
      
    case 'saveAnswerKeys':
      return Database.saveAnswerKeys(params.payload);
      
    case 'loginStudent':
      return Database.loginStudent(params.subjectCode, params.seatNumber);
      
    case 'getRosters':
      return Database.getRosters(params.class);
      
    case 'saveRosters':
      return Database.saveRosters(params.payload);
      
    case 'getScanResults':
      return Database.getScanResults(params.subjectId);
      
    case 'uploadImage':
      return DriveManager.uploadImage(params.base64Data, params.filename);
      
    case 'saveScanResult':
      return Database.saveScanResult(params.payload);
      
    case 'saveBulkScanResults':
      return Database.saveBulkScanResults(params.payload);
      
    case 'getUsersList':
      return Database.getUsersList();
      
    case 'getSettings':
      return Database.getSettings();
      
    case 'saveSettings':
      return Database.saveSettings(params.payload);
      
    case 'getDashboardStats':
      return Database.getDashboardStats();

    default:
      return { success: false, message: 'Unknown action: ' + action };
  }
}
