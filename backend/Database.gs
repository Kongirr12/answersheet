/**
 * Database Module for interacting with Google Sheets
 */

// Run this function once from the Apps Script editor to setup sheets
function initializeDatabase() {
  Database.initialize();
}

const Database = (function() {
  
  // The Spreadsheet ID will be set by the user
  const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
  
  function getSheet(sheetName) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    return ss.getSheetByName(sheetName);
  }

  function initialize() {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const requiredSheets = [
      { name: 'Users', headers: ['Username', 'Password', 'Name', 'Role', 'Status'] },
      { name: 'Students', headers: ['StudentID', 'Name', 'Class'] },
      { name: 'Subjects', headers: ['SubjectID', 'Code', 'Name', 'Class', 'TotalQuestions'] },
      { name: 'ScanResults', headers: ['ScanID', 'SubjectID', 'StudentID', 'Score', 'Confidence', 'DriveImageURL', 'Timestamp'] },
      { name: 'Settings', headers: ['Key', 'Value'] }
    ];

    requiredSheets.forEach(req => {
      let sheet = ss.getSheetByName(req.name);
      if (!sheet) {
        sheet = ss.insertSheet(req.name);
        sheet.appendRow(req.headers);
        
        // Auto-populate default admin if it's the Users sheet
        if (req.name === 'Users') {
          sheet.appendRow(['admin', '1234', 'แอดมินระบบ', 'admin', 'Active']);
        }
      }
    });
  }

  function getSheetDataAsObjects(sheet) {
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return []; // Only headers or empty
    const headers = data[0];
    const objects = [];
    for (let i = 1; i < data.length; i++) {
      let obj = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = data[i][j];
      }
      // Store row index for updating/deleting later
      obj._rowIndex = i + 1;
      objects.push(obj);
    }
    return objects;
  }

  function loginStaff(username, password) {
    try {
      const sheet = getSheet('Users');
      if (!sheet) return { success: false, message: 'ไม่พบตาราง Users' };
      
      const users = getSheetDataAsObjects(sheet);
      const user = users.find(u => String(u.Username).toLowerCase() === String(username).toLowerCase() && String(u.Password) === String(password));
      
      if (user) {
        if (user.Status !== 'Active') {
          return { success: false, message: 'บัญชีนี้ถูกระงับการใช้งานหรือรอการอนุมัติ' };
        }
        // Remove password before sending to frontend
        delete user.Password;
        return { success: true, data: user };
      }
      return { success: false, message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' };
    } catch (e) {
      return { success: false, message: e.toString() };
    }
  }

  function addUser(payload) {
    try {
      const sheet = getSheet('Users');
      if (!sheet) return { success: false, message: 'ไม่พบตาราง Users' };
      
      // payload = { Username, Password, Name, Role }
      // Default status is 'Active' since admin is creating it
      const status = 'Active'; 
      sheet.appendRow([payload.Username, payload.Password, payload.Name, payload.Role, status]);
      return { success: true, message: 'เพิ่มผู้ใช้งานสำเร็จ' };
    } catch (e) {
      return { success: false, message: e.toString() };
    }
  }

  function getSubjects() {
    try {
      const sheet = getSheet('Subjects');
      if (!sheet) return { success: false, message: 'ไม่พบตาราง Subjects' };
      
      return { success: true, data: getSheetDataAsObjects(sheet) };
    } catch (e) {
      return { success: false, message: e.toString() };
    }
  }

  function saveSubject(payload) {
    try {
      const sheet = getSheet('Subjects');
      if (!sheet) return { success: false, message: 'ไม่พบตาราง Subjects' };
      // payload = { SubjectID, Code, Name, Class, TotalQuestions }
      sheet.appendRow([payload.SubjectID, payload.Code, payload.Name, payload.Class, payload.TotalQuestions]);
      return { success: true, message: 'บันทึกรายวิชาสำเร็จ' };
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
      if (!sheet) return { success: false, message: 'ไม่พบตาราง Students' };

      const students = getSheetDataAsObjects(sheet);
      const student = students.find(s => String(s.StudentID) === String(studentId));
      
      if (student) {
        return { success: true, data: student };
      }
      return { success: false, message: 'ไม่พบรหัสนักเรียนนี้ในระบบ' };
    } catch (e) {
      return { success: false, message: e.toString() };
    }
  }
  
  function saveScanResult(payload) {
    try {
      const sheet = getSheet('ScanResults');
      if (!sheet) return { success: false, message: 'ไม่พบตาราง ScanResults' };
      // payload = { ScanID, SubjectID, StudentID, Score, Confidence, DriveImageURL }
      const timestamp = new Date();
      sheet.appendRow([payload.ScanID, payload.SubjectID, payload.StudentID, payload.Score, payload.Confidence, payload.DriveImageURL, timestamp]);
      return { success: true, message: 'บันทึกผลสแกนสำเร็จ' };
    } catch(e) {
      return { success: false, message: e.toString() };
    }
  }

  return {
    initialize: initialize,
    loginStaff: loginStaff,
    addUser: addUser,
    getSubjects: getSubjects,
    saveSubject: saveSubject,
    loginStudent: loginStudent,
    saveScanResult: saveScanResult
  };
})();
