let currentReportSubject = null;
let currentReportData = [];

async function renderReportsPage() {
  const contentContainer = document.getElementById('page-content');
  
  contentContainer.innerHTML = \`<div style="text-align:center; padding: 50px;"><i class="ph ph-spinner ph-spin" style="font-size: 2rem;"></i> กำลังโหลดข้อมูล...</div>\`;
  
  const res = await apiCall({ action: 'getSubjects' });
  let subjects = [];
  if (res && res.success) {
    subjects = res.data;
  }
  
  const content = \`
    <div class="card glass-panel" style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
        <h2><i class="ph ph-chart-bar" style="color: var(--primary-color);"></i> รายงานผลคะแนน</h2>
        <button class="btn btn-outline" id="btn-export-csv" onclick="exportToCSV()" disabled style="display: none;">
          <i class="ph ph-download-simple"></i> ดาวน์โหลด Excel (.csv)
        </button>
      </div>
      
      <div class="input-group" style="max-width: 400px; margin-bottom: 10px;">
        <i class="ph ph-books"></i>
        <select id="report-subject-select" class="form-control" onchange="loadReportData(this.value)">
          <option value="">-- เลือกรายวิชา --</option>
          \${subjects.map(s => \`<option value="\${s.SubjectID}">\${s.Code} \${s.Name} (\${s.Class})</option>\`).join('')}
        </select>
      </div>
    </div>
    
    <div id="report-workspace" class="card glass-panel" style="display: none;">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 15px;">
        <h3 style="color: var(--primary-color);">สรุปคะแนนวิชา: <span id="report-subject-name"></span></h3>
        <div style="font-size: 0.9rem; color: #666;">
          ส่งคำตอบแล้ว: <strong id="report-count">0</strong> คน
        </div>
      </div>
      
      <div style="overflow-x: auto;">
        <table class="table" id="report-table">
          <thead>
            <tr>
              <th width="80">เลขที่</th>
              <th>ชื่อ-นามสกุล</th>
              <th width="100" class="text-center">คะแนนที่ได้</th>
              <th width="150">เวลาที่ส่ง</th>
            </tr>
          </thead>
          <tbody>
            <!-- Report rows -->
          </tbody>
        </table>
      </div>
    </div>
  \`;
  contentContainer.innerHTML = content;
}

async function loadReportData(subjectId) {
  if (!subjectId) {
    document.getElementById('report-workspace').style.display = 'none';
    document.getElementById('btn-export-csv').style.display = 'none';
    return;
  }
  
  const select = document.getElementById('report-subject-select');
  const subjectName = select.options[select.selectedIndex].text;
  document.getElementById('report-subject-name').innerText = subjectName;
  
  // Extract class name from the subject name, e.g., "MTH101 Math (ม.1/1)" -> "ม.1/1"
  const match = subjectName.match(/\\(([^)]+)\\)$/);
  const className = match ? match[1] : '';
  
  Swal.fire({ title: 'กำลังดึงข้อมูลคะแนน...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  
  // Fetch Results and Roster in parallel
  const [resScan, resRoster] = await Promise.all([
    apiCall({ action: 'getScanResults', subjectId: subjectId }),
    apiCall({ action: 'getRosters', class: className })
  ]);
  
  if (resScan && resScan.success) {
    Swal.close();
    
    let scans = resScan.data || [];
    let rosters = (resRoster && resRoster.success) ? (resRoster.data || []) : [];
    
    // Map Roster names to Scans
    // Sometimes a student scans multiple times. We should keep the highest or the latest? Let's just show all for now, or group by latest.
    // Let's group by StudentID (SeatNo), keeping the latest scan.
    let studentMap = {};
    scans.forEach(scan => {
      let seatNo = String(scan.StudentID);
      if (seatNo.length === 1) seatNo = '0' + seatNo;
      
      if (!studentMap[seatNo] || new Date(scan.Timestamp) > new Date(studentMap[seatNo].Timestamp)) {
        studentMap[seatNo] = scan;
      }
    });
    
    // Create final report array based on Roster (to show missing students too)
    let finalReport = [];
    
    if (rosters.length > 0) {
      rosters.forEach(r => {
        let seatNo = String(r.SeatNo);
        if (seatNo.length === 1) seatNo = '0' + seatNo;
        
        let scan = studentMap[seatNo];
        finalReport.push({
          SeatNo: seatNo,
          StudentId: r.StudentId || '',
          Name: r.Name || '',
          Score: scan ? scan.Score : 'ขาดสอบ',
          Timestamp: scan ? new Date(scan.Timestamp).toLocaleString('th-TH') : '-'
        });
      });
    } else {
      // If no roster, just show the scans
      Object.values(studentMap).forEach(scan => {
        let seatNo = String(scan.StudentID);
        if (seatNo.length === 1) seatNo = '0' + seatNo;
        
        finalReport.push({
          SeatNo: seatNo,
          StudentId: '',
          Name: 'นักเรียน เลขที่ ' + seatNo,
          Score: scan.Score,
          Timestamp: new Date(scan.Timestamp).toLocaleString('th-TH')
        });
      });
    }
    
    // Sort by SeatNo
    finalReport.sort((a, b) => parseInt(a.SeatNo) - parseInt(b.SeatNo));
    
    currentReportData = finalReport;
    currentReportSubject = subjectName;
    
    renderReportTable();
    
    document.getElementById('report-workspace').style.display = 'block';
    document.getElementById('report-count').innerText = Object.keys(studentMap).length;
    
    const btnExport = document.getElementById('btn-export-csv');
    btnExport.style.display = 'inline-block';
    btnExport.disabled = finalReport.length === 0;
    
  } else {
    Swal.fire('ข้อผิดพลาด', resScan ? resScan.message : 'ดึงข้อมูลไม่สำเร็จ', 'error');
  }
}

function renderReportTable() {
  const tbody = document.querySelector('#report-table tbody');
  tbody.innerHTML = '';
  
  if (currentReportData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-secondary">ยังไม่มีข้อมูล</td></tr>';
    return;
  }
  
  currentReportData.forEach(r => {
    let scoreColor = r.Score === 'ขาดสอบ' ? 'color: red;' : 'color: #059669; font-weight: bold;';
    let tr = document.createElement('tr');
    tr.innerHTML = \`
      <td>\${r.SeatNo}</td>
      <td>\${r.Name}</td>
      <td class="text-center" style="\${scoreColor}">\${r.Score}</td>
      <td style="font-size: 0.85rem; color: #666;">\${r.Timestamp}</td>
    \`;
    tbody.appendChild(tr);
  });
}

function exportToCSV() {
  if (currentReportData.length === 0) return;
  
  // BOM for UTF-8 in Excel
  let csvContent = "\\uFEFFเลขที่,รหัสนักเรียน,ชื่อ-นามสกุล,คะแนน,เวลาที่ส่ง\\n";
  
  currentReportData.forEach(r => {
    let row = [\`"\${r.SeatNo}"\`, \`"\${r.StudentId}"\`, \`"\${r.Name}"\`, \`"\${r.Score}"\`, \`"\${r.Timestamp}"\`];
    csvContent += row.join(",") + "\\n";
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", \`คะแนน_\${currentReportSubject}.csv\`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
