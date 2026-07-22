// ====== SUBJECTS & EXAMS LOGIC ======
let mockSubjects = [
  { id: 'SUB001', code: 'MATH101', name: 'คณิตศาสตร์พื้นฐาน', class: 'ม.4/1', semester: '1/2569', type: 'กลางภาค', totalQuestions: 20 },
  { id: 'SUB002', code: 'ENG101', name: 'ภาษาอังกฤษ', class: 'ม.4/1', semester: '1/2569', type: 'ปลายภาค', totalQuestions: 40 },
];

function renderSubjectsPage() {
  const content = `
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0;">จัดการรายวิชาและข้อสอบ</h2>
        <button class="btn btn-primary" onclick="openSubjectModal()">
          <i class="ph ph-plus"></i> เพิ่มรายวิชา
        </button>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: var(--background-color); border-bottom: 2px solid var(--border-color); text-align: left;">
            <th style="padding: 12px;">รหัสวิชา</th>
            <th style="padding: 12px;">ชื่อวิชา</th>
            <th style="padding: 12px;">ชั้นเรียน</th>
            <th style="padding: 12px;">ประเภท</th>
            <th style="padding: 12px;">จำนวนข้อ</th>
            <th style="padding: 12px; text-align: center;">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          ${mockSubjects.map(sub => `
            <tr style="border-bottom: 1px solid var(--border-color);">
              <td style="padding: 12px;">${sub.code}</td>
              <td style="padding: 12px;">${sub.name}</td>
              <td style="padding: 12px;">${sub.class}</td>
              <td style="padding: 12px;">${sub.type}</td>
              <td style="padding: 12px;">${sub.totalQuestions}</td>
              <td style="padding: 12px; text-align: center;">
                <button class="btn btn-outline" style="padding: 6px 10px; font-size: 0.9rem;" onclick="manageKeys('${sub.id}')">
                  <i class="ph ph-list-checks"></i> เฉลย
                </button>
                <button class="btn btn-outline" style="padding: 6px 10px; font-size: 0.9rem;" onclick="printOMRSheet('${sub.id}')">
                  <i class="ph ph-printer"></i> พิมพ์กระดาษ
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Subject Modal (Hidden by default) -->
    <div id="subject-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); align-items: center; justify-content: center; z-index: 1000;">
      <div class="card" style="width: 500px; max-width: 90%;">
        <h3 style="margin-bottom: 20px;" id="subject-modal-title">เพิ่มรายวิชาใหม่</h3>
        <form onsubmit="saveSubject(event)">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">รหัสวิชา</label>
            <input type="text" id="subj-code" class="form-control" required style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font-family: Kanit;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">ชื่อวิชา</label>
            <input type="text" id="subj-name" class="form-control" required style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font-family: Kanit;">
          </div>
          <div style="display: flex; gap: 15px; margin-bottom: 15px;">
             <div style="flex: 1;">
               <label style="display: block; margin-bottom: 5px;">ชั้นเรียน</label>
               <input type="text" id="subj-class" placeholder="เช่น ม.4/1" required style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font-family: Kanit;">
             </div>
             <div style="flex: 1;">
               <label style="display: block; margin-bottom: 5px;">จำนวนข้อสอบ</label>
               <input type="number" id="subj-qty" min="20" max="100" value="20" required style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font-family: Kanit;">
             </div>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button type="button" class="btn btn-outline" onclick="closeSubjectModal()">ยกเลิก</button>
            <button type="submit" class="btn btn-primary">บันทึกข้อมูล</button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.getElementById('page-content').innerHTML = content;
}

function openSubjectModal() {
  document.getElementById('subject-modal').style.display = 'flex';
}

function closeSubjectModal() {
  document.getElementById('subject-modal').style.display = 'none';
}

function saveSubject(e) {
  e.preventDefault();
  const newSubj = {
    id: 'SUB' + Math.floor(Math.random() * 1000),
    code: document.getElementById('subj-code').value,
    name: document.getElementById('subj-name').value,
    class: document.getElementById('subj-class').value,
    semester: '1/2569',
    type: 'ทั่วไป',
    totalQuestions: parseInt(document.getElementById('subj-qty').value)
  };
  mockSubjects.push(newSubj);
  closeSubjectModal();
  Swal.fire('สำเร็จ', 'บันทึกรายวิชาเรียบร้อยแล้ว', 'success');
  renderSubjectsPage(); // Refresh
}

function manageKeys(id) {
  Swal.fire({
    title: 'จัดการเฉลย',
    text: 'ฟังก์ชันทำเฉลย (กขคง / ABCD) สำหรับรหัสวิชา: ' + id,
    icon: 'info'
  });
  // TODO: Build the answer key grid
}
