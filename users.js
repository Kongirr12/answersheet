// ====== USERS MANAGEMENT ======

async function renderUsersPage() {
  document.getElementById('page-content').innerHTML = '<div style="text-align:center; padding: 50px;"><i class="ph ph-spinner ph-spin" style="font-size: 2rem;"></i> กำลังโหลดข้อมูลผู้ใช้งาน...</div>';
  
  const res = await apiCall({ action: 'getUsersList' });
  let teachers = [];
  let studentsCount = 0;
  
  if (res && res.success) {
    teachers = res.data.teachers;
    studentsCount = res.data.studentsCount;
  }

  const content = `
    <div class="card">
      <h2 style="margin-bottom: 20px;">จัดการผู้ใช้งาน</h2>
      
      <div style="display: flex; gap: 20px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 300px; border-right: 1px solid var(--border-color); padding-right: 20px;">
          <h3 style="margin-bottom: 15px;">บัญชีผู้ดูแล/คุณครู</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border-color); text-align: left;">
                <th style="padding: 10px;">ชื่อ / Username</th>
                <th style="padding: 10px;">บทบาท</th>
                <th style="padding: 10px;">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              ${teachers.length === 0 ? '<tr><td colspan="3" style="text-align:center; padding: 10px;">ไม่มีข้อมูล</td></tr>' : 
                teachers.map(t => `
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 10px;">
                    <div>${t.name}</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">${t.username}</div>
                  </td>
                  <td style="padding: 10px;">${t.role}</td>
                  <td style="padding: 10px;">
                    <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; background: ${t.status === 'Active' ? '#D1FAE5' : '#FEF3C7'}; color: ${t.status === 'Active' ? '#059669' : '#D97706'};">
                      ${t.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 15px;">หากต้องการเพิ่ม แก้ไข หรือลบบัญชี กรุณาจัดการใน Google Sheets (ชีต Users)</p>
        </div>
        
        <div style="flex: 1; min-width: 300px;">
          <h3 style="margin-bottom: 15px;">ฐานข้อมูลนักเรียน</h3>
          <div style="font-size: 2rem; font-weight: bold; color: var(--primary-color); margin-bottom: 10px;">${studentsCount} คน</div>
          <p style="color: var(--text-secondary); margin-bottom: 15px; font-size: 0.95rem;">
            รายชื่อและรหัสของนักเรียนจะถูกซิงค์มาจาก Google Sheets อัตโนมัติ (ชีต Students) 
          </p>
          <button class="btn btn-outline w-100" style="justify-content: center;" onclick="Swal.fire('Google Sheets', 'กรุณาเปิดไฟล์ตาราง Google Sheets ของคุณเพื่อจัดการข้อมูล', 'info')">
            <i class="ph ph-table"></i> เปิดตาราง (Google Sheets)
          </button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('page-content').innerHTML = content;
}
