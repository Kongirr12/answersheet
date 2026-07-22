// ====== USERS MANAGEMENT ======
let mockTeachers = [
  { name: 'คุณครู สมศรี', email: 'somsri@school.ac.th', status: 'อนุมัติแล้ว' },
  { name: 'คุณครู สมชาย', email: 'somchai@school.ac.th', status: 'รออนุมัติ' },
];

function renderUsersPage() {
  const content = `
    <div class="card">
      <h2 style="margin-bottom: 20px;">จัดการผู้ใช้งาน</h2>
      
      <div style="display: flex; gap: 20px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 300px; border-right: 1px solid var(--border-color); padding-right: 20px;">
          <h3 style="margin-bottom: 15px;">บัญชีคุณครู</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border-color); text-align: left;">
                <th style="padding: 10px;">ชื่อ</th>
                <th style="padding: 10px;">สถานะ</th>
                <th style="padding: 10px; text-align: center;">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              ${mockTeachers.map(t => `
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 10px;">
                    <div>${t.name}</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">${t.email}</div>
                  </td>
                  <td style="padding: 10px;">
                    <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; background: ${t.status === 'รออนุมัติ' ? '#FEF3C7' : '#D1FAE5'}; color: ${t.status === 'รออนุมัติ' ? '#D97706' : '#059669'};">
                      ${t.status}
                    </span>
                  </td>
                  <td style="padding: 10px; text-align: center;">
                    ${t.status === 'รออนุมัติ' 
                      ? `<button class="btn btn-primary" style="padding: 4px 8px; font-size: 0.85rem;" onclick="approveTeacher('${t.email}')">อนุมัติ</button>` 
                      : `<button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.85rem; color: var(--danger-color);">ยกเลิกสิทธิ์</button>`}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div style="flex: 1; min-width: 300px;">
          <h3 style="margin-bottom: 15px;">ฐานข้อมูลนักเรียน</h3>
          <p style="color: var(--text-secondary); margin-bottom: 15px; font-size: 0.95rem;">
            รายชื่อและรหัสผ่านของนักเรียนจะถูกซิงค์มาจาก Google Sheets อัตโนมัติ หากต้องการเพิ่มหรือลบนักเรียน กรุณาจัดการที่ Google Sheets
          </p>
          <button class="btn btn-outline w-100" style="justify-content: center;" onclick="Swal.fire('Google Sheets', 'เปิดลิงก์ไปยัง Google Sheets', 'info')">
            <i class="ph ph-table"></i> เปิดตาราง Students (Google Sheets)
          </button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('page-content').innerHTML = content;
}

function approveTeacher(email) {
  const t = mockTeachers.find(x => x.email === email);
  if (t) t.status = 'อนุมัติแล้ว';
  renderUsersPage();
  Swal.fire('สำเร็จ', 'อนุมัติสิทธิ์คุณครูแล้ว', 'success');
}
