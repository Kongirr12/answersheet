// ====== SETTINGS ======
async function renderSettingsPage() {
  document.getElementById('page-content').innerHTML = '<div style="text-align:center; padding: 50px;"><i class="ph ph-spinner ph-spin" style="font-size: 2rem;"></i> กำลังโหลดการตั้งค่า...</div>';
  
  const res = await apiCall({ action: 'getSettings' });
  let settingsObj = { 'SchoolName': '', 'DriveFolderID': '' };
  
  if (res && res.success) {
    res.data.forEach(item => {
      settingsObj[item.Key] = item.Value;
    });
  }

  const content = `
    <div class="card">
      <h2 style="margin-bottom: 20px;">ตั้งค่าระบบ</h2>
      
      <div style="max-width: 600px;">
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">ชื่อสถานศึกษา / องค์กร (แสดงบนกระดาษคำตอบ)</label>
          <input type="text" id="setting-school" class="form-control" value="${settingsObj.SchoolName || ''}" placeholder="เช่น โรงเรียนมัธยมศึกษาตัวอย่าง" style="width: 100%; font-size: 1rem;">
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">Google Drive Folder ID (สำหรับเก็บรูปสแกน)</label>
          <div style="display: flex; gap: 10px;">
            <input type="text" id="setting-drive" class="form-control" value="${settingsObj.DriveFolderID || ''}" placeholder="รหัสโฟลเดอร์ Google Drive" style="flex: 1; font-size: 1rem;">
            <button class="btn btn-outline" onclick="Swal.fire('Tip', 'ระบบจะบันทึกรูปไปยังโฟลเดอร์นี้ ถ้าเว้นว่างไว้ ระบบจะสร้างโฟลเดอร์ให้ใหม่ในหน้า Drive หลัก', 'info')">ช่วยเหลือ</button>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 5px;">ภาพกระดาษคำตอบทั้งหมดจะถูกเซฟลงในโฟลเดอร์นี้เพื่อเก็บเป็นหลักฐาน</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.4); margin: 30px 0;">
        
        <button class="btn btn-primary" onclick="saveSettings()">
          <i class="ph ph-floppy-disk"></i> บันทึกการตั้งค่า
        </button>
      </div>
    </div>
  `;
  document.getElementById('page-content').innerHTML = content;
}

async function saveSettings() {
  const payload = {
    'SchoolName': document.getElementById('setting-school').value,
    'DriveFolderID': document.getElementById('setting-drive').value
  };
  
  Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  const res = await apiCall({ action: 'saveSettings', payload: payload });
  
  if (res && res.success) {
    Swal.fire('สำเร็จ', 'บันทึกการตั้งค่าแล้ว', 'success');
  } else {
    Swal.fire('ข้อผิดพลาด', res ? res.message : 'บันทึกไม่สำเร็จ', 'error');
  }
}
