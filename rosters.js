let currentRosterClass = '';
let currentRosterData = [];

function renderRostersPage() {
  const contentContainer = document.getElementById('page-content');
  
  const content = `
    <div class="card glass-panel" style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
        <h2><i class="ph ph-users-three" style="color: var(--primary-color);"></i> จัดการรายชื่อนักเรียน (Rosters)</h2>
      </div>
      <p class="text-secondary" style="margin-bottom: 20px;">นำเข้ารายชื่อนักเรียนเพื่อให้ระบบจับคู่เลขที่ กับ ชื่อ-นามสกุล ในหน้ารายงานคะแนนได้โดยอัตโนมัติ</p>
      
      <div class="input-group" style="max-width: 400px; margin-bottom: 20px;">
        <i class="ph ph-chalkboard-teacher"></i>
        <input type="text" id="roster-class-input" placeholder="พิมพ์ชื่อห้องเรียน (เช่น ม.1/1)" onchange="loadRosterData(this.value.trim())">
      </div>
      <button class="btn btn-primary" onclick="loadRosterData(document.getElementById('roster-class-input').value.trim())">ดึงรายชื่อ</button>
    </div>
    
    <div id="roster-workspace" class="card glass-panel" style="display: none;">
      <h3 style="margin-bottom: 15px; color: var(--primary-color);">รายชื่อห้อง <span id="roster-class-display"></span></h3>
      
      <div style="margin-bottom: 20px; background: rgba(255,255,255,0.5); padding: 15px; border-radius: 12px; border: var(--glass-border);">
        <label style="display:block; margin-bottom: 10px; font-weight: bold;"><i class="ph ph-file-xls"></i> นำเข้าข้อมูล (Paste / CSV)</label>
        <p style="font-size: 0.9rem; color: #666; margin-bottom: 10px;">ก๊อปปี้ 3 คอลัมน์จาก Excel: <strong>เลขที่ | รหัสนักเรียน (ถ้ามี) | ชื่อ-นามสกุล</strong> แล้วนำมาวาง หรือ <strong>อัปโหลดไฟล์ CSV</strong> ที่มีโครงสร้างเดียวกัน</p>
        <textarea id="roster-paste-area" class="form-control" rows="3" placeholder="วางข้อมูลจาก Excel ตรงนี้..." style="width: 100%; border-radius: 8px; padding: 10px;"></textarea>
        <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <input type="file" id="csv-upload-input" accept=".csv" style="display: none;" onchange="handleCSVUpload(event)">
            <button class="btn btn-outline" style="background: white;" onclick="document.getElementById('csv-upload-input').click()"><i class="ph ph-upload-simple"></i> อัปโหลดไฟล์ .CSV</button>
          </div>
          <button class="btn btn-outline" onclick="parseExcelPaste()"><i class="ph ph-magic-wand"></i> แปลงข้อมูลจากช่องวาง</button>
        </div>
      </div>
      
      <div style="overflow-x: auto;">
        <table class="table" id="roster-table">
          <thead>
            <tr>
              <th width="80">เลขที่</th>
              <th width="120">รหัสนักเรียน</th>
              <th>ชื่อ-นามสกุล</th>
              <th width="60">ลบ</th>
            </tr>
          </thead>
          <tbody>
            <!-- Roster rows -->
          </tbody>
        </table>
      </div>
      
      <div style="margin-top: 15px; display: flex; gap: 10px;">
        <button class="btn btn-outline" onclick="addEmptyRosterRow()"><i class="ph ph-plus"></i> เพิ่ม 1 แถว</button>
        <button class="btn btn-primary" onclick="saveRosters()" style="margin-left: auto;"><i class="ph ph-floppy-disk"></i> บันทึกรายชื่อ</button>
      </div>
    </div>
  `;
  contentContainer.innerHTML = content;
}

async function loadRosterData(className) {
  if (!className) {
    Swal.fire('ข้อผิดพลาด', 'กรุณาพิมพ์ชื่อห้องเรียน เช่น ม.1/1', 'warning');
    return;
  }
  
  currentRosterClass = className;
  document.getElementById('roster-class-display').innerText = className;
  
  Swal.fire({ title: 'กำลังดึงข้อมูล...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  
  const res = await apiCall({ action: 'getRosters', class: className });
  
  if (res && res.success) {
    Swal.close();
    currentRosterData = res.data || [];
    currentRosterData.sort((a, b) => parseInt(a.SeatNo) - parseInt(b.SeatNo));
    
    document.getElementById('roster-workspace').style.display = 'block';
    renderRosterTable();
  } else {
    Swal.fire('ข้อผิดพลาด', res ? res.message : 'เชื่อมต่อล้มเหลว', 'error');
  }
}

function parseExcelPaste() {
  const pasteArea = document.getElementById('roster-paste-area');
  const text = pasteArea.value.trim();
  if (!text) return;
  
  const lines = text.split('\n');
  const newData = [];
  
  for (let line of lines) {
    const cols = line.split('\t');
    if (cols.length >= 2) {
      let seatNo = cols[0].trim();
      if (seatNo.length === 1) seatNo = '0' + seatNo;
      
      let studentId = cols.length >= 3 ? cols[1].trim() : '';
      let name = cols.length >= 3 ? cols[2].trim() : cols[1].trim();
      
      newData.push({
        SeatNo: seatNo,
        StudentId: studentId,
        Name: name
      });
    }
  }
  
  if (newData.length > 0) {
    if (currentRosterData.length === 0) {
      currentRosterData = newData;
    } else {
      currentRosterData = currentRosterData.concat(newData);
    }
    
    currentRosterData.sort((a, b) => parseInt(a.SeatNo || 0) - parseInt(b.SeatNo || 0));
    
    renderRosterTable();
    pasteArea.value = '';
    Swal.fire('สำเร็จ', `นำเข้าข้อมูล ${newData.length} รายการ เรียบร้อย (อย่าลืมกดบันทึก)`, 'success');
  } else {
    Swal.fire('รูปแบบไม่ถูกต้อง', 'กรุณาก๊อปปี้ข้อมูลที่มีอย่างน้อย 2 คอลัมน์ (เลขที่ และ ชื่อ)', 'error');
  }
}

function handleCSVUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    const lines = text.split(/\r\n|\n/);
    const newData = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      if (i === 0 && (line.includes('เลข') || line.includes('ชื่อ') || line.includes('Name'))) continue;
      
      const cols = line.split(',');
      if (cols.length >= 2) {
        let seatNo = cols[0].replace(/"/g, '').trim();
        if (seatNo.length === 1) seatNo = '0' + seatNo;
        
        let studentId = cols.length >= 3 ? cols[1].replace(/"/g, '').trim() : '';
        let name = cols.length >= 3 ? cols[2].replace(/"/g, '').trim() : cols[1].replace(/"/g, '').trim();
        
        if (!isNaN(parseInt(seatNo))) {
          newData.push({
            SeatNo: seatNo,
            StudentId: studentId,
            Name: name
          });
        }
      }
    }
    
    if (newData.length > 0) {
      if (currentRosterData.length === 0) {
        currentRosterData = newData;
      } else {
        currentRosterData = currentRosterData.concat(newData);
      }
      
      currentRosterData.sort((a, b) => parseInt(a.SeatNo || 0) - parseInt(b.SeatNo || 0));
      renderRosterTable();
      Swal.fire('สำเร็จ', `นำเข้าข้อมูลจาก CSV จำนวน ${newData.length} รายการ เรียบร้อย (อย่าลืมกดบันทึก)`, 'success');
    } else {
      Swal.fire('รูปแบบไม่ถูกต้อง', 'ไม่พบข้อมูล หรือไฟล์ CSV ไม่ตรงตามรูปแบบ (เลขที่, รหัส, ชื่อ)', 'error');
    }
    
    event.target.value = '';
  };
  
  // Need to handle Thai characters properly in CSV, TIS-620 is common but let's try UTF-8 first.
  reader.readAsText(file, 'UTF-8');
}

function renderRosterTable() {
  const tbody = document.querySelector('#roster-table tbody');
  tbody.innerHTML = '';
  
  if (currentRosterData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-secondary">ยังไม่มีข้อมูลในระบบ</td></tr>';
    return;
  }
  
  currentRosterData.forEach((r, index) => {
    let tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" class="form-control" style="padding: 8px; width: 60px;" value="${r.SeatNo}" onchange="updateRosterData(${index}, 'SeatNo', this.value)"></td>
      <td><input type="text" class="form-control" style="padding: 8px;" value="${r.StudentId || ''}" onchange="updateRosterData(${index}, 'StudentId', this.value)"></td>
      <td><input type="text" class="form-control" style="padding: 8px;" value="${r.Name || ''}" onchange="updateRosterData(${index}, 'Name', this.value)"></td>
      <td><button class="btn btn-sm btn-outline" style="color: red; border-color: red; padding: 5px 10px;" onclick="removeRosterRow(${index})"><i class="ph ph-trash"></i></button></td>
    `;
    tbody.appendChild(tr);
  });
}

function updateRosterData(index, field, value) {
  if (field === 'SeatNo' && value.length === 1) {
    value = '0' + value; // Auto pad
  }
  currentRosterData[index][field] = value;
}

function addEmptyRosterRow() {
  let nextSeat = '01';
  if (currentRosterData.length > 0) {
    const lastSeat = parseInt(currentRosterData[currentRosterData.length - 1].SeatNo) || 0;
    nextSeat = (lastSeat + 1).toString().padStart(2, '0');
  }
  
  currentRosterData.push({ SeatNo: nextSeat, StudentId: '', Name: '' });
  renderRosterTable();
}

function removeRosterRow(index) {
  currentRosterData.splice(index, 1);
  renderRosterTable();
}

async function saveRosters() {
  const validData = currentRosterData.filter(r => r.SeatNo.trim() !== '' && r.Name.trim() !== '');
  
  Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  
  const payload = {
    className: currentRosterClass,
    students: validData
  };
  
  const res = await apiCall({ action: 'saveRosters', payload: payload });
  
  if (res && res.success) {
    Swal.fire('สำเร็จ', res.message, 'success');
  } else {
    Swal.fire('ข้อผิดพลาด', res ? res.message : 'บันทึกไม่สำเร็จ', 'error');
  }
}
