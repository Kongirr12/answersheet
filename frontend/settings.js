// ====== SETTINGS ======
function renderSettingsPage() {
  const content = `
    <div class="card">
      <h2 style="margin-bottom: 20px;">ตั้งค่าระบบ</h2>
      
      <div style="max-width: 600px;">
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">ชื่อสถานศึกษา / องค์กร (แสดงบนกระดาษคำตอบ)</label>
          <input type="text" class="form-control" value="โรงเรียนมัธยมศึกษาตัวอย่าง" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font-family: Kanit; font-size: 1rem;">
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">Google Drive Folder ID (สำหรับเก็บรูปสแกน)</label>
          <div style="display: flex; gap: 10px;">
            <input type="text" class="form-control" value="1A2B3C4D5E6F7G8H9I" style="flex: 1; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font-family: Kanit; font-size: 1rem;">
            <button class="btn btn-outline" onclick="Swal.fire('เชื่อมต่อสำเร็จ', 'สามารถอัปโหลดไฟล์ไปที่ Drive นี้ได้', 'success')">ทดสอบเชื่อมต่อ</button>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 5px;">ภาพกระดาษคำตอบทั้งหมดจะถูกเซฟลงในโฟลเดอร์นี้เพื่อเก็บเป็นหลักฐาน</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid var(--border-color); margin: 30px 0;">
        
        <button class="btn btn-primary" onclick="Swal.fire('บันทึก', 'บันทึกการตั้งค่าแล้ว', 'success')">
          <i class="ph ph-floppy-disk"></i> บันทึกการตั้งค่า
        </button>
      </div>
    </div>
  `;
  document.getElementById('page-content').innerHTML = content;
}
