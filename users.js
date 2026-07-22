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
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0;">จัดการผู้ใช้งาน</h2>
      </div>
      
      <div style="display: flex; gap: 20px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 300px; border-right: 1px solid var(--border-color); padding-right: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0;">บัญชีผู้ดูแล/คุณครู</h3>
            <button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.9rem;" onclick="showAddUserModal()">+ เพิ่มบัญชี</button>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border-color); text-align: left;">
                <th style="padding: 10px;">ชื่อ / Username</th>
                <th style="padding: 10px;">บทบาท</th>
                <th style="padding: 10px;">สถานะ</th>
                <th style="padding: 10px; text-align: center;">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              ${teachers.length === 0 ? '<tr><td colspan="4" style="text-align:center; padding: 10px;">ไม่มีข้อมูล</td></tr>' : 
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
                  <td style="padding: 10px; text-align: center;">
                    ${(t.username.toLowerCase() !== 'admin' && t.username !== currentUser.username) 
                      ? `<button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.85rem; color: var(--danger-color); border-color: var(--danger-color);" onclick="deleteUser('${t.username}')"><i class="ph ph-trash"></i> ลบ</button>` 
                      : '<span style="font-size: 0.8rem; color: #ccc;">-</span>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
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

function showAddUserModal() {
  Swal.fire({
    title: 'เพิ่มบัญชีผู้ใช้งาน',
    html: `
      <input id="swal-name" class="swal2-input" placeholder="ชื่อ-นามสกุล" style="font-family: Kanit; width: 80%;">
      <input id="swal-user" class="swal2-input" placeholder="Username (สำหรับล็อกอิน)" style="font-family: Kanit; width: 80%;">
      <input id="swal-pass" class="swal2-input" placeholder="Password" type="password" style="font-family: Kanit; width: 80%;">
      <select id="swal-role" class="swal2-input" style="font-family: Kanit; width: 80%; margin-top: 15px;">
        <option value="teacher">คุณครู (Teacher)</option>
        <option value="admin">ผู้ดูแลระบบ (Admin)</option>
      </select>
    `,
    showCancelButton: true,
    confirmButtonText: 'บันทึก',
    cancelButtonText: 'ยกเลิก',
    preConfirm: () => {
      const name = document.getElementById('swal-name').value;
      const user = document.getElementById('swal-user').value;
      const pass = document.getElementById('swal-pass').value;
      const role = document.getElementById('swal-role').value;
      if (!name || !user || !pass) {
        Swal.showValidationMessage('กรุณากรอกข้อมูลให้ครบถ้วน');
        return false;
      }
      return { Name: name, Username: user, Password: pass, Role: role };
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const res = await apiCall({ action: 'addUser', payload: result.value });
      if (res && res.success) {
        Swal.fire('สำเร็จ', 'เพิ่มบัญชีเรียบร้อยแล้ว', 'success');
        renderUsersPage();
      } else {
        Swal.fire('ข้อผิดพลาด', res ? res.message : 'บันทึกไม่สำเร็จ', 'error');
      }
    }
  });
}

function deleteUser(username) {
  Swal.fire({
    title: 'ยืนยันการลบ',
    text: `คุณต้องการลบบัญชี "${username}" ใช่หรือไม่?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'ใช่, ลบเลย!',
    cancelButtonText: 'ยกเลิก'
  }).then(async (result) => {
    if (result.isConfirmed) {
      Swal.fire({ title: 'กำลังลบ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const res = await apiCall({ action: 'deleteUser', username: username });
      if (res && res.success) {
        Swal.fire('สำเร็จ', 'ลบบัญชีแล้ว', 'success');
        renderUsersPage();
      } else {
        Swal.fire('ข้อผิดพลาด', res ? res.message : 'ลบไม่สำเร็จ', 'error');
      }
    }
  });
}
