/**
 * Database Module for interacting with Google Sheets
 */

// Run this function once from the Apps Script editor to setup sheets
function initializeDatabase() {
  Database.initialize();
}

const Database = (function() {
  
  // The Spreadsheet ID will be set by the user
  const SPREADSHEET_ID = '1BPTU_-qzsTXYG00WGT_X7HJ6O24mjPFLmTfa_7qjq8U';
  
  function getSheet(sheetName) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    return ss.getSheetByName(sheetName);
  }

  function initialize() {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const requiredSheets = [
      { name: 'Users', headers: ['Username', 'Password', 'Name', 'Role', 'Status'] },
      { name: 'Students', headers: ['StudentID', 'Name', 'Class'] },
      { name: 'Subjects', headers: ['SubjectID', 'Code', 'Name', 'Class', 'TotalQuestions', 'ExamType', 'MaxWrittenScore', 'WrittenContent'] },
      { name: 'AnswerKeys', headers: ['SubjectID', 'QuestionNo', 'CorrectAnswer'] },
      { name: 'ScanResults', headers: ['ScanID', 'SubjectID', 'StudentID', 'Score', 'Confidence', 'DriveImageURL', 'Timestamp'] },
      { name: 'Rosters', headers: ['Class', 'SeatNo', 'StudentId', 'Name'] },
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
      } else {
        // อัปเดตหัวตาราง (Row 1) ให้เป็นเวอร์ชันล่าสุดเสมอ เผื่อกรณีเพิ่มคอลัมน์ใหม่
        sheet.getRange(1, 1, 1, req.headers.length).setValues([req.headers]);
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
      
      const data = sheet.getDataRange().getValues();
      let rowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(payload.SubjectID)) {
          rowIndex = i + 1;
          break;
        }
      }
      
      const rowData = [
        payload.SubjectID, 
        payload.Code, 
        payload.Name, 
        payload.Class, 
        payload.TotalQuestions, 
        payload.ExamType || 'ทั่วไป', 
        payload.MaxWrittenScore || 0, 
        payload.WrittenContent || ''
      ];
      
      if (rowIndex > -1) {
        sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
        return { success: true, message: 'อัปเดตรายวิชาสำเร็จ' };
      } else {
        sheet.appendRow(rowData);
        return { success: true, message: 'บันทึกรายวิชาสำเร็จ' };
      }
    } catch (e) {
      return { success: false, message: e.toString() };
    }
  }

  function loginStudent(subjectCode, seatNumber) {
    try {
      if (!subjectCode || !seatNumber) {
        return { success: false, message: 'กรุณากรอกรหัสวิชาและเลขที่ให้ครบ' };
      }
      
      const subjSheet = getSheet('Subjects');
      if (!subjSheet) return { success: false, message: 'ไม่พบตาราง Subjects' };
      
      const subjects = getSheetDataAsObjects(subjSheet);
      const subject = subjects.find(s => String(s.Code).toUpperCase() === String(subjectCode).toUpperCase());
      
      if (!subject) {
        return { success: false, message: 'ไม่พบรหัสวิชานี้ในระบบ' };
      }
      
      let studentName = 'นักเรียน เลขที่ ' + seatNumber;
      
      // Try to find the student's name in Rosters if available
      const rosterSheet = getSheet('Rosters');
      if (rosterSheet) {
        const rosters = getSheetDataAsObjects(rosterSheet);
        const roster = rosters.find(r => String(r.Class) === String(subject.Class) && String(r.SeatNo) === String(seatNumber));
        if (roster && roster.Name) {
          studentName = roster.Name;
        }
      }
      
      return { 
        success: true, 
        data: { 
          role: 'student', 
          name: studentName, 
          seatNumber: seatNumber, 
          subjectId: subject.SubjectID,
          className: subject.Class
        } 
      };
      
    } catch (e) {
      return { success: false, message: e.toString() };
    }
  }
  
  function saveScanResult(payload) {
    try {
      const sheet = getSheet('ScanResults');
      if (!sheet) return { success: false, message: 'ไม่พบตาราง ScanResults' };
      const timestamp = new Date();
      sheet.appendRow([payload.ScanID, payload.SubjectID, payload.StudentID, payload.Score, payload.Confidence, payload.DriveImageURL, timestamp]);
      return { success: true, message: 'บันทึกผลสแกนสำเร็จ' };
    } catch(e) {
      return { success: false, message: e.toString() };
    }
  }

  function saveBulkScanResults(payload) {
    try {
      const sheet = getSheet('ScanResults');
      if (!sheet) return { success: false, message: 'ไม่พบตาราง ScanResults' };
      const timestamp = new Date();
      
      const rows = payload.map(p => [p.ScanID, p.SubjectID, p.StudentID, p.Score, p.Confidence, p.DriveImageURL || '', timestamp]);
      
      if (rows.length > 0) {
        sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
      }
      return { success: true, message: 'บันทึกผลสแกนแบบกลุ่มสำเร็จ ' + rows.length + ' รายการ' };
    } catch(e) {
      return { success: false, message: e.toString() };
    }
  }

  function getAnswerKeys(subjectId) {
    try {
      const sheet = getSheet('AnswerKeys');
      if (!sheet) return { success: false, message: 'ไม่พบตาราง AnswerKeys' };
      
      const allKeys = getSheetDataAsObjects(sheet);
      const keys = allKeys.filter(k => String(k.SubjectID) === String(subjectId));
      
      // Sort by QuestionNo
      keys.sort((a, b) => parseInt(a.QuestionNo) - parseInt(b.QuestionNo));
      
      return { success: true, data: keys };
    } catch (e) {
      return { success: false, message: e.toString() };
    }
  }

  function saveAnswerKeys(payload) {
    try {
      const sheet = getSheet('AnswerKeys');
      if (!sheet) return { success: false, message: 'ไม่พบตาราง AnswerKeys' };
      
      const subjectId = payload.SubjectID;
      const keys = payload.Keys; // array of { q: 1, a: 'A' }
      
      // Delete existing keys for this subject from bottom to top
      const data = sheet.getDataRange().getValues();
      for (let i = data.length - 1; i > 0; i--) {
        if (String(data[i][0]) === String(subjectId)) {
          sheet.deleteRow(i + 1);
        }
      }
      
      // Add new keys
      keys.forEach(k => {
        if (k.a) { // Only save if an answer was provided
          sheet.appendRow([subjectId, k.q, k.a]);
        }
      });
      
      return { success: true, message: 'บันทึกเฉลยสำเร็จ' };
    } catch (e) {
      return { success: false, message: e.toString() };
    }
  }

  function getUsersList() {
    try {
      const uSheet = getSheet('Users');
      const sSheet = getSheet('Students');
      
      const teachers = uSheet ? getSheetDataAsObjects(uSheet).map(u => ({ username: u.Username, name: u.Name, role: u.Role, status: u.Status })) : [];
      const students = sSheet ? getSheetDataAsObjects(sSheet).length : 0; // Just return count to save bandwidth
      
      return { success: true, data: { teachers, studentsCount: students } };
    } catch (e) {
      return { success: false, message: e.toString() };
    }
  }

  function getSettings() {
    try {
      const sheet = getSheet('Settings');
      if (!sheet) return { success: false, message: 'ไม่พบตาราง Settings' };
      
      const settings = getSheetDataAsObjects(sheet);
      return { success: true, data: settings };
    } catch (e) {
      return { success: false, message: e.toString() };
    }
  }

  function saveSettings(payload) {
    try {
      const sheet = getSheet('Settings');
      if (!sheet) return { success: false, message: 'ไม่พบตาราง Settings' };
      
      // Clear old settings
      sheet.getDataRange().clearContent();
      sheet.appendRow(['Key', 'Value']);
      
      // payload is an object { "SchoolName": "...", "DriveFolderID": "..." }
      for (const key in payload) {
        sheet.appendRow([key, payload[key]]);
      }
      return { success: true, message: 'บันทึกการตั้งค่าสำเร็จ' };
    } catch (e) {
      return { success: false, message: e.toString() };
    }
  }

  function getDashboardStats() {
    try {
      const subSheet = getSheet('Subjects');
      const scanSheet = getSheet('ScanResults');
      
      const subjectsCount = subSheet ? (subSheet.getLastRow() - 1) : 0;
      const scansCount = scanSheet ? (scanSheet.getLastRow() - 1) : 0;
      
      return { 
        success: true, 
        data: {
          totalSubjects: Math.max(0, subjectsCount),
          totalScans: Math.max(0, scansCount)
        }
      };
    } catch (e) {
      return { success: false, message: e.toString() };
    }
  }

  function deleteUser(username) {
    try {
      const sheet = getSheet('Users');
      if (!sheet) return { success: false, message: 'ไม่พบตาราง Users' };
      
      const data = sheet.getDataRange().getValues();
      for (let i = data.length - 1; i > 0; i--) {
        if (String(data[i][0]).toLowerCase() === String(username).toLowerCase()) {
          sheet.deleteRow(i + 1);
          return { success: true, message: 'ลบผู้ใช้งานสำเร็จ' };
        }
      }
      return { success: false, message: 'ไม่พบผู้ใช้งานนี้ในระบบ' };
    } catch (e) {
      return { success: false, message: e.toString() };
    }
  }

  function deleteSubject(subjectId) {
    try {
      const sheet = getSheet('Subjects');
      if (!sheet) return { success: false, message: 'ไม่พบตาราง Subjects' };
      
      const data = sheet.getDataRange().getValues();
      for (let i = data.length - 1; i > 0; i--) {
        if (String(data[i][0]) === String(subjectId)) {
          sheet.deleteRow(i + 1);
          return { success: true, message: 'ลบรายวิชาสำเร็จ' };
        }
      }
      return { success: false, message: 'ไม่พบรายวิชานี้ในระบบ' };
    } catch (e) {
      return { success: false, message: e.toString() };
    }
  }

  return {
    SPREADSHEET_ID: SPREADSHEET_ID,
    initialize: initialize,
    loginStaff: loginStaff,
    addUser: addUser,
    deleteUser: deleteUser,
    deleteSubject: deleteSubject,
    getUsersList: getUsersList,
    getSubjects: getSubjects,
    saveSubject: saveSubject,
    loginStudent: loginStudent,
    saveScanResult: saveScanResult,
    saveBulkScanResults: saveBulkScanResults,
    getScanResults: function(subjectId) {
      try {
        const sheet = getSheet('ScanResults');
        if (!sheet) return { success: false, message: 'ไม่พบตาราง ScanResults' };
        
        const allResults = getSheetDataAsObjects(sheet);
        const results = allResults.filter(r => String(r.SubjectID) === String(subjectId));
        return { success: true, data: results };
      } catch (e) {
        return { success: false, message: e.toString() };
      }
    },
    getRosters: function(className) {
      try {
        const sheet = getSheet('Rosters');
        if (!sheet) return { success: false, message: 'ไม่พบตาราง Rosters' };
        
        const allRosters = getSheetDataAsObjects(sheet);
        const rosters = allRosters.filter(r => String(r.Class) === String(className));
        return { success: true, data: rosters };
      } catch (e) {
        return { success: false, message: e.toString() };
      }
    },
    saveRosters: function(payload) {
      try {
        const sheet = getSheet('Rosters');
        if (!sheet) return { success: false, message: 'ไม่พบตาราง Rosters' };
        
        const className = payload.className;
        const students = payload.students;
        
        // Delete existing roster for this class
        const data = sheet.getDataRange().getValues();
        for (let i = data.length - 1; i > 0; i--) {
          if (String(data[i][0]) === String(className)) {
            sheet.deleteRow(i + 1);
          }
        }
        
        // Add new students
        if (students && students.length > 0) {
          const rows = students.map(s => [className, s.SeatNo, s.StudentId || '', s.Name]);
          sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
        }
        
        return { success: true, message: 'บันทึกรายชื่อนักเรียนสำเร็จ' };
      } catch (e) {
        return { success: false, message: e.toString() };
      }
    },
    getAnswerKeys: getAnswerKeys,
    saveAnswerKeys: saveAnswerKeys,
    getSettings: getSettings,
    saveSettings: saveSettings,
    getDashboardStats: getDashboardStats
  };
})();
