// ====== SUBJECTS & EXAMS LOGIC ======
let globalSubjects = [];
let currentEditingSubjectId = null;

async function renderSubjectsPage() {
  document.getElementById('page-content').innerHTML = '<div style="text-align:center; padding: 50px;"><i class="ph ph-spinner ph-spin" style="font-size: 2rem;"></i> กำลังโหลดข้อมูลรายวิชา...</div>';
  
  const res = await apiCall({ action: 'getSubjects' });
  if (res && res.success) {
    globalSubjects = res.data;
  } else {
    Swal.fire('คำเตือน', 'ดึงข้อมูลรายวิชาไม่สำเร็จ กรุณาตรวจสอบตาราง Subjects', 'warning');
    globalSubjects = [];
  }

  const content = `
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0;">จัดการรายวิชาและข้อสอบ</h2>
        <button class="btn btn-primary" onclick="openSubjectModal()">
          <i class="ph ph-plus"></i> เพิ่มรายวิชา
        </button>
      </div>
      
      <table class="glass-table">
        <thead>
            <th>รหัสวิชา</th>
            <th>ชื่อวิชา</th>
            <th>ประเภทการสอบ</th>
            <th>ชั้นเรียน</th>
            <th>จำนวนข้อ</th>
            <th style="text-align: center;">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          ${globalSubjects.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding: 20px; color:var(--text-secondary);">ยังไม่มีรายวิชา</td></tr>' : 
            globalSubjects.map(sub => `
            <tr>
              <td>${sub.Code || sub.SubjectID}</td>
              <td>${sub.Name}</td>
              <td><span style="background: rgba(79, 70, 229, 0.1); color: var(--primary-color); padding: 4px 8px; border-radius: 12px; font-size: 0.85rem; font-weight: 500;">${sub.ExamType || 'ทั่วไป'}</span></td>
              <td>${sub.Class}</td>
              <td>${sub.TotalQuestions}</td>
              <td style="text-align: center;">
                <button class="btn btn-outline" style="padding: 6px 10px; font-size: 0.9rem;" onclick="editSubject('${sub.SubjectID}')">
                  <i class="ph ph-pencil"></i> แก้ไข
                </button>
                <button class="btn btn-outline" style="padding: 6px 10px; font-size: 0.9rem;" onclick="manageKeys('${sub.SubjectID}')">
                  <i class="ph ph-list-checks"></i> เฉลย
                </button>
                <button class="btn btn-outline" style="padding: 6px 10px; font-size: 0.9rem;" onclick="confirmPrint('${sub.SubjectID}')">
                  <i class="ph ph-printer"></i> พิมพ์กระดาษ
                </button>
                <button class="btn btn-outline" style="padding: 6px 10px; font-size: 0.9rem; color: #dc2626; border-color: rgba(220, 38, 38, 0.3);" onclick="deleteSubject('${sub.SubjectID}')" title="ลบรายวิชา">
                  <i class="ph ph-trash"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Subject Modal (Hidden by default) -->
    <div id="subject-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.3); backdrop-filter: blur(5px); align-items: center; justify-content: center; z-index: 1000;">
      <div class="card" style="width: 800px; max-width: 95%; max-height: 90vh; overflow-y: auto; position: relative;">
        <button type="button" onclick="closeSubjectModal()" style="position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary);"><i class="ph ph-x"></i></button>
        <h3 style="margin-bottom: 25px; color: var(--primary-color); border-bottom: 2px solid rgba(0,0,0,0.05); padding-bottom: 15px;" id="subject-modal-title">เพิ่มรายวิชาใหม่</h3>
        <form onsubmit="saveSubject(event)">
          <div style="display: flex; gap: 15px; margin-bottom: 15px;">
            <div style="flex: 1;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">รหัสวิชา</label>
              <input type="text" id="subj-code" class="form-control" required style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font-family: Kanit;">
            </div>
            <div style="flex: 2;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">ชื่อวิชา</label>
              <input type="text" id="subj-name" class="form-control" required style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font-family: Kanit;">
            </div>
          </div>
          <div style="display: flex; gap: 15px; margin-bottom: 20px;">
             <div style="flex: 1;">
               <label style="display: block; margin-bottom: 5px; font-weight: 500;">ชั้นเรียน</label>
               <input type="text" id="subj-class" placeholder="เช่น ม.4/1" required style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font-family: Kanit;">
             </div>
             <div style="flex: 1;">
               <label style="display: block; margin-bottom: 5px; font-weight: 500;">ประเภทการสอบ</label>
               <select id="subj-type" required style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font-family: Kanit; background: white;">
                 <option value="กลางภาค">กลางภาค</option>
                 <option value="ปลายภาค">ปลายภาค</option>
                 <option value="เก็บคะแนน">สอบเก็บคะแนนทั่วไป</option>
               </select>
             </div>
             <div style="flex: 1;">
               <label style="display: block; margin-bottom: 5px; font-weight: 500;">ปรนัย (จำนวนข้อ)</label>
               <input type="number" id="subj-qty" min="0" max="100" value="20" required style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font-family: Kanit;">
             </div>
             <div style="flex: 1;">
               <label style="display: block; margin-bottom: 5px; font-weight: 500;">อัตนัย (คะแนนเต็ม)</label>
               <input type="number" id="subj-written-score" min="0" value="0" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font-family: Kanit;" placeholder="0 = ไม่มี">
             </div>
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 10px; font-weight: 500;">
              <i class="ph ph-text-aa"></i> ออกแบบข้อเขียน 
              <span style="font-size: 0.85rem; color: var(--primary-color); background: rgba(79, 70, 229, 0.1); padding: 4px 8px; border-radius: 12px; margin-left: 10px;">
                <i class="ph ph-monitor"></i> จำลองความกว้างกระดาษ A4 ของจริง
              </span>
            </label>
            
            <style>
              .tox-tinymce { border-radius: 0 !important; border: none !important; }
            </style>

            <div style="background: #e5e7eb; padding: 30px 10px; border-radius: 6px; border: 1px solid var(--border-color); display: flex; justify-content: center; overflow-x: auto; overflow-y: auto; max-height: 600px;">
              <div style="width: 210mm; flex-shrink: 0; min-height: 297mm; background: white; box-shadow: 0 8px 15px rgba(0,0,0,0.1); display: flex; flex-direction: column; padding: 20mm; box-sizing: border-box;">
                <div style="padding-bottom: 10px; margin-bottom: 15px; border-bottom: 2px dashed #ccc; font-size: 1.1rem; font-weight: 600; color: #444;">
                  ส่วนที่ 2: ข้อสอบอัตนัย
                </div>
                <div id="word-editor"></div>
              </div>
            </div>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 30px; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 20px;">
            <button type="button" class="btn btn-outline" onclick="closeSubjectModal()" style="padding: 10px 25px;">ยกเลิก</button>
            <button type="submit" class="btn btn-primary" style="padding: 10px 25px;"><i class="ph ph-floppy-disk"></i> บันทึกข้อมูล</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Answer Keys Modal -->
    <div id="keys-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.3); backdrop-filter: blur(5px); align-items: center; justify-content: center; z-index: 1000;">
      <div class="card" style="width: 600px; max-width: 90%; max-height: 90vh; display: flex; flex-direction: column;">
        <h3 style="margin-bottom: 10px;" id="keys-modal-title">จัดการเฉลย</h3>
        <p style="color: var(--text-secondary); margin-bottom: 20px;" id="keys-modal-subtitle">รหัสวิชา: -</p>
        
        <div id="keys-container" style="flex: 1; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 15px; padding-right: 10px; margin-bottom: 20px;">
          <!-- Dynamically generated inputs -->
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--border-color); padding-top: 15px;">
          <button type="button" class="btn btn-outline" onclick="closeKeysModal()">ยกเลิก</button>
          <button type="button" class="btn btn-primary" onclick="saveAnswerKeys()">บันทึกเฉลย</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('page-content').innerHTML = content;
  
  // Initialize TinyMCE Editor
  if (window.tinymce) {
    tinymce.remove('#word-editor');
    tinymce.init({
      selector: '#word-editor',
      height: 700,
      menubar: true,
      plugins: [
        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
        'insertdatetime', 'media', 'table', 'help', 'wordcount'
      ],
      toolbar: 'undo redo | fontfamily fontsize | ' +
        'bold italic underline | forecolor backcolor | ' +
        'alignleft aligncenter alignright alignjustify | ' +
        'bullist numlist outdent indent | table image | removeformat',
      content_style: "body { font-family: 'Kanit', sans-serif; font-size: 15px; margin: 0; padding: 0; overflow-wrap: break-word; word-break: break-all; } p { margin: 0 0 10px 0; }",
      font_family_formats: 'Kanit=Kanit,sans-serif; Tahoma=tahoma,arial,helvetica,sans-serif; Arial=arial,helvetica,sans-serif; Times New Roman=times new roman,times;',
      promotion: false,
      branding: false
    });
  }
}

function openSubjectModal() {
  currentEditingSubjectId = null;
  document.getElementById('subject-modal-title').innerText = 'เพิ่มรายวิชาใหม่';
  document.getElementById('subj-code').value = '';
  document.getElementById('subj-name').value = '';
  document.getElementById('subj-class').value = '';
  document.getElementById('subj-type').value = 'กลางภาค';
  document.getElementById('subj-qty').value = 20;
  document.getElementById('subj-written-score').value = 0;
  if (window.tinymce && tinymce.get('word-editor')) tinymce.get('word-editor').setContent('');
  document.getElementById('subject-modal').style.display = 'flex';
}

function editSubject(id) {
  const subject = globalSubjects.find(s => s.SubjectID === id);
  if (!subject) return;
  
  currentEditingSubjectId = id;
  document.getElementById('subject-modal-title').innerText = 'แก้ไขรายวิชา';
  document.getElementById('subj-code').value = subject.Code || '';
  document.getElementById('subj-name').value = subject.Name || '';
  document.getElementById('subj-class').value = subject.Class || '';
  document.getElementById('subj-type').value = subject.ExamType || 'กลางภาค';
  document.getElementById('subj-qty').value = subject.TotalQuestions || 20;
  document.getElementById('subj-written-score').value = subject.MaxWrittenScore || 0;
  if (window.tinymce && tinymce.get('word-editor')) {
    tinymce.get('word-editor').setContent(subject.WrittenContent || '');
  }
  
  document.getElementById('subject-modal').style.display = 'flex';
}

function closeSubjectModal() {
  document.getElementById('subject-modal').style.display = 'none';
}

function confirmPrint(subjectId) {
  Swal.fire({
    title: 'เลือกรูปแบบกระดาษคำตอบ',
    input: 'radio',
    inputOptions: {
      'circle': 'แบบวงกลม (ระบายทึบ / กากบาท)',
      'square': 'แบบช่องสี่เหลี่ยม (กากบาท)'
    },
    inputValue: 'circle',
    showCancelButton: true,
    confirmButtonText: '<i class="ph ph-printer"></i> ไปหน้าพิมพ์',
    cancelButtonText: 'ยกเลิก',
    customClass: {
      confirmButton: 'btn btn-primary',
      cancelButton: 'btn btn-outline'
    }
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      printOMRSheet(subjectId, result.value);
    }
  });
}

async function saveSubject(e) {
  e.preventDefault();
  const writtenScore = parseInt(document.getElementById('subj-written-score').value) || 0;
  // Get HTML from TinyMCE
  let writtenHTML = '';
  if (window.tinymce && tinymce.get('word-editor')) {
    writtenHTML = tinymce.get('word-editor').getContent();
  }

  const payload = {
    SubjectID: currentEditingSubjectId ? currentEditingSubjectId : ('SUB' + Date.now()),
    Code: document.getElementById('subj-code').value,
    Name: document.getElementById('subj-name').value,
    Class: document.getElementById('subj-class').value,
    ExamType: document.getElementById('subj-type').value,
    TotalQuestions: parseInt(document.getElementById('subj-qty').value),
    MaxWrittenScore: writtenScore,
    WrittenContent: writtenHTML
  };
  
  Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  const res = await apiCall({ action: 'saveSubject', payload: payload });
  
  if (res && res.success) {
    Swal.fire('สำเร็จ', 'บันทึกรายวิชาเรียบร้อยแล้ว', 'success');
    closeSubjectModal();
    renderSubjectsPage(); // Refresh
  } else {
    Swal.fire('ข้อผิดพลาด', res ? res.message : 'บันทึกไม่สำเร็จ', 'error');
  }
}

async function deleteSubject(id) {
  const result = await Swal.fire({
    title: 'ยืนยันการลบวิชา?',
    text: "คุณต้องการลบรายวิชานี้ใช่หรือไม่? (หากลบแล้วข้อมูลนี้จะหายไปจากระบบ)",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: '<i class="ph ph-trash"></i> ลบรายวิชา',
    cancelButtonText: 'ยกเลิก'
  });

  if (result.isConfirmed) {
    Swal.fire({ title: 'กำลังลบ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const res = await apiCall({ action: 'deleteSubject', subjectId: id });
    if (res && res.success) {
      Swal.fire('สำเร็จ', 'ลบรายวิชาสำเร็จแล้ว', 'success');
      renderSubjectsPage();
    } else {
      Swal.fire('ข้อผิดพลาด', res ? res.message : 'ลบรายวิชาล้มเหลว', 'error');
    }
  }
}

let currentKeysSubjectId = '';

async function manageKeys(id) {
  const subject = globalSubjects.find(s => s.SubjectID === id);
  if (!subject) return;

  currentKeysSubjectId = id;
  document.getElementById('keys-modal-title').innerText = `จัดการเฉลย: ${subject.Name}`;
  document.getElementById('keys-modal-subtitle').innerText = `รหัสวิชา: ${subject.Code} | จำนวน: ${subject.TotalQuestions} ข้อ`;
  
  Swal.fire({ title: 'กำลังดึงข้อมูลเฉลย...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  const res = await apiCall({ action: 'getAnswerKeys', subjectId: id });
  let existingKeys = [];
  if (res && res.success) {
    existingKeys = res.data;
  }
  Swal.close();

  // Generate grid
  let html = '';
  for (let i = 1; i <= subject.TotalQuestions; i++) {
    const existing = existingKeys.find(k => k.QuestionNo == i);
    const ans = existing ? existing.CorrectAnswer : '';
    
    html += `
      <div style="background: rgba(255,255,255,0.4); padding: 10px; border-radius: 10px; text-align: center; border: var(--glass-border);">
        <div style="font-weight: bold; margin-bottom: 5px; color: var(--primary-color);">ข้อ ${i}</div>
        <select id="key-input-${i}" class="form-control" style="width: 100%; padding: 5px; text-align: center;">
          <option value="">-</option>
          <option value="A" ${ans === 'A' ? 'selected' : ''}>A</option>
          <option value="B" ${ans === 'B' ? 'selected' : ''}>B</option>
          <option value="C" ${ans === 'C' ? 'selected' : ''}>C</option>
          <option value="D" ${ans === 'D' ? 'selected' : ''}>D</option>
        </select>
      </div>
    `;
  }
  
  document.getElementById('keys-container').innerHTML = html;
  document.getElementById('keys-modal').style.display = 'flex';
}

function closeKeysModal() {
  document.getElementById('keys-modal').style.display = 'none';
}

async function saveAnswerKeys() {
  const subject = globalSubjects.find(s => s.SubjectID === currentKeysSubjectId);
  if (!subject) return;

  const keys = [];
  for (let i = 1; i <= subject.TotalQuestions; i++) {
    const val = document.getElementById(`key-input-${i}`).value;
    if (val) {
      keys.push({ q: i, a: val });
    }
  }

  Swal.fire({ title: 'กำลังบันทึกเฉลย...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  const res = await apiCall({ 
    action: 'saveAnswerKeys', 
    payload: { SubjectID: currentKeysSubjectId, Keys: keys } 
  });
  
  if (res && res.success) {
    Swal.fire('สำเร็จ', 'บันทึกเฉลยเรียบร้อยแล้ว', 'success');
    closeKeysModal();
  } else {
    Swal.fire('ข้อผิดพลาด', res ? res.message : 'บันทึกไม่สำเร็จ', 'error');
  }
}
