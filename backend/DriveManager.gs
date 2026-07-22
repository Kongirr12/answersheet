/**
 * DriveManager Module for interacting with Google Drive
 */

const DriveManager = (function() {
  
  function getSetting(key) {
    try {
      const sheet = SpreadsheetApp.openById(Database.SPREADSHEET_ID || 'YOUR_SPREADSHEET_ID_HERE').getSheetByName('Settings');
      if (!sheet) return null;
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === key) return data[i][1];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  function uploadImage(base64Data, filename) {
    try {
      // Get Folder ID from Settings sheet
      const folderId = getSetting('DriveFolderID');
      let folder;
      
      if (folderId) {
        folder = DriveApp.getFolderById(folderId);
      } else {
        // Fallback: Create a folder if not set
        const folders = DriveApp.getFoldersByName('MHC-TEST-Scans');
        if (folders.hasNext()) {
          folder = folders.next();
        } else {
          folder = DriveApp.createFolder('MHC-TEST-Scans');
        }
      }

      // Parse base64
      // data:image/png;base64,iVBORw0KGgo...
      const splitBase = base64Data.split(',');
      const contentType = splitBase[0].split(';')[0].split(':')[1];
      const byteCharacters = Utilities.base64Decode(splitBase[1]);
      
      const blob = Utilities.newBlob(byteCharacters, contentType, filename);
      const file = folder.createFile(blob);
      
      // Make it accessible for viewing
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      return { success: true, url: file.getUrl(), fileId: file.getId() };
    } catch (e) {
      return { success: false, message: e.toString() };
    }
  }

  return {
    uploadImage: uploadImage
  };
})();
