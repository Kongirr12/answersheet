/**
 * Database Module for interacting with Google Sheets
 */

const Database = (function() {
  
  // The Spreadsheet ID (Users will need to replace this with their actual ID)
  const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
  
  function getSheet(sheetName) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    return ss.getSheetByName(sheetName);
  }

  function getSubjects() {
    try {
      const sheet = getSheet('Subjects');
      if (!sheet) return { success: false, message: 'Sheet "Subjects" not found' };
      
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const subjects = [];
      
      for (let i = 1; i < data.length; i++) {
        let obj = {};
        for (let j = 0; j < headers.length; j++) {
          obj[headers[j]] = data[i][j];
        }
        subjects.push(obj);
      }
      return { success: true, data: subjects };
    } catch (e) {
      return { success: false, message: e.toString() };
    }
  }

  function loginStudent(studentId) {
    try {
      if (!studentId || studentId.length !== 5) {
        return { success: false, message: 'รหัสนักเรียนต้องมี 5 หลัก' };
      }

      const sheet = getSheet('Students');
      if (!sheet) return { success: false, message: 'Sheet "Students" not found' };

      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      
      for (let i = 1; i < data.length; i++) {
        // Assuming column 0 is StudentID
        if (String(data[i][0]) === String(studentId)) {
          let student = {};
          for (let j = 0; j < headers.length; j++) {
            student[headers[j]] = data[i][j];
          }
          return { success: true, data: student };
        }
      }
      
      return { success: false, message: 'ไม่พบรหัสนักเรียนนี้ในระบบ' };
    } catch (e) {
      return { success: false, message: e.toString() };
    }
  }

  return {
    getSubjects: getSubjects,
    loginStudent: loginStudent
  };
})();
