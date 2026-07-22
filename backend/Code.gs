/**
 * MHC-TEST - Google Apps Script Backend
 * 
 * This file handles the REST API endpoints using doGet and doPost.
 */

// Function to handle GET requests
function doGet(e) {
  return handleRequest(e);
}

// Function to handle POST requests
function doPost(e) {
  return handleRequest(e);
}

// Main router for handling actions
function handleRequest(e) {
  try {
    let action = '';
    let payload = {};
    
    // Check URL parameters
    if (e.parameter && e.parameter.action) {
      action = e.parameter.action;
    }
    
    // Check POST body
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
      if (payload.action) action = payload.action;
    }

    let result = { success: false, message: 'Invalid action' };

    switch (action) {
      case 'ping':
        result = { success: true, message: 'pong' };
        break;
      case 'getSubjects':
        result = Database.getSubjects();
        break;
      case 'loginStudent':
        result = Database.loginStudent(payload.studentId);
        break;
      default:
        result = { success: false, message: 'Action not found: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString(),
      stack: error.stack
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
