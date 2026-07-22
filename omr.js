// ====== OMR SCANNER LOGIC ======

let cvReady = false;
function onOpenCvReady() {
  cvReady = true;
  console.log('OpenCV.js loaded and ready.');
}

let currentScanSubject = null;
let currentAnswerKeys = [];
let lastScanResult = null; // Store result to save later

async function loadAnswerKeysForScan() {
  const subjectId = document.getElementById('scan-subject').value;
  const statusDiv = document.getElementById('scan-keys-status');
  if (!subjectId) {
    statusDiv.innerHTML = '';
    currentAnswerKeys = [];
    currentScanSubject = null;
    return;
  }
  
  currentScanSubject = globalSubjects.find(s => s.SubjectID === subjectId);
  statusDiv.innerHTML = '<i class="ph ph-spinner ph-spin"></i> กำลังโหลดเฉลย...';
  
  const res = await apiCall({ action: 'getAnswerKeys', subjectId: subjectId });
  if (res && res.success) {
    currentAnswerKeys = res.data || [];
    statusDiv.innerHTML = `<span style="color: green;"><i class="ph ph-check-circle"></i> โหลดเฉลยสำเร็จ (${currentAnswerKeys.length} ข้อ)</span>`;
  } else {
    statusDiv.innerHTML = '<span style="color: red;">โหลดเฉลยล้มเหลว กรุณาลองใหม่</span>';
  }
}

function renderScanPage() {
  const content = `
    <div class="card" style="text-align: center;">
      <h2 style="margin-bottom: 20px;">สแกนกระดาษคำตอบ (AI OMR)</h2>
      
      <div style="max-width: 500px; margin: 0 auto 30px auto; text-align: left; background: rgba(255,255,255,0.4); padding: 20px; border-radius: 12px; border: var(--glass-border);">
        <label style="font-weight: bold; margin-bottom: 8px; display: block;">1. เลือกวิชาที่ต้องการตรวจ:</label>
        <select id="scan-subject" class="form-control" style="width: 100%; padding: 10px; font-family: Kanit; margin-bottom: 10px;" onchange="loadAnswerKeysForScan()">
          <option value="">-- กรุณาเลือกวิชา --</option>
          ${globalSubjects.map(s => `<option value="${s.SubjectID}">${s.Name} (${s.Code})</option>`).join('')}
        </select>
        <div id="scan-keys-status" style="font-size: 0.85rem; color: #666;">กรุณาเลือกวิชาเพื่อดึงเฉลยจากฐานข้อมูล</div>
      </div>
      
      <div style="display: flex; gap: 20px; justify-content: center; margin-bottom: 30px;">
        <button class="btn btn-outline" style="padding: 20px; flex-direction: column; width: 180px;" onclick="triggerUpload()">
          <i class="ph ph-upload-simple" style="font-size: 2rem; margin-bottom: 10px; color: var(--primary-color);"></i>
          อัปโหลดรูปภาพ / ถ่ายภาพ
          <span style="font-size: 0.8rem; color: #999; margin-top: 5px;">JPG, PNG</span>
        </button>
      </div>
      
      <input type="file" id="omr-upload" accept="image/*" capture="environment" style="display: none;" onchange="handleImageUpload(event)">
      
      <div id="scanner-workspace" style="display: none; text-align: left;">
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
          <!-- Left: Canvas -->
          <div style="flex: 1; min-width: 300px; background: rgba(255,255,255,0.5); padding: 15px; border-radius: 12px; border: var(--glass-border);">
            <h4 style="margin-bottom: 10px; color: var(--primary-color);"><i class="ph ph-cpu"></i> ประมวลผลภาพ (Computer Vision)</h4>
            <canvas id="omr-canvas" style="width: 100%; max-width: 500px; border: 1px solid #ccc; border-radius: 4px; display: block; margin: 0 auto;"></canvas>
          </div>
          
          <!-- Right: Results -->
          <div style="flex: 1; min-width: 300px; background: rgba(255,255,255,0.5); padding: 15px; border-radius: 12px; border: var(--glass-border);">
            <h4 style="margin-bottom: 15px; color: var(--secondary-color);"><i class="ph ph-list-checks"></i> ผลการตรวจ</h4>
            
            <p style="margin-bottom: 8px;"><strong>เลขที่:</strong> <span id="res-student" style="color: var(--primary-color); font-weight: bold; font-size: 1.2rem;">-</span></p>
            <p style="margin-bottom: 8px;"><strong>ความมั่นใจ:</strong> <span id="res-conf">-</span></p>
            <hr style="border: none; border-top: 1px dashed #eee; margin: 15px 0;">
            <div style="text-align: center; margin-bottom: 15px;">
              <div style="font-size: 0.9rem; color: var(--text-secondary);">คะแนนที่ได้</div>
              <div style="font-size: 3rem; color: #059669; font-weight: bold; line-height: 1;"><span id="res-score">-</span><span style="font-size: 1.2rem; color: #666;">/${currentScanSubject ? currentScanSubject.TotalQuestions : '-'}</span></div>
            </div>
            
            <div id="res-details" style="max-height: 250px; overflow-y: auto; font-size: 0.9rem; background: rgba(255,255,255,0.3); border-radius: 8px; padding: 10px; border: var(--glass-border); margin-bottom: 15px;">
              <!-- Detail rows here -->
            </div>
            
            <div id="written-score-container" style="display:none; margin-bottom: 15px; padding: 10px; background: rgba(255,255,255,0.8); border-radius: 8px; border: var(--glass-border); text-align: center;">
              <label style="display:block; margin-bottom:5px; font-weight:bold; color: var(--primary-color);">กรอกคะแนนข้อเขียน (เต็ม <span id="max-written-label">0</span>)</label>
              <input type="number" id="input-written-score" min="0" value="0" class="form-control" style="width:100px; text-align:center; font-size:1.2rem; margin: 0 auto;" onchange="updateTotalScore()">
            </div>
            
            <button id="btn-save-result" class="btn btn-primary w-100" style="padding: 12px; font-size: 1.1rem;" onclick="saveResult()" disabled>
              <i class="ph ph-floppy-disk"></i> บันทึกเข้าระบบ
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('page-content').innerHTML = content;
}

function triggerUpload() {
  if (!currentScanSubject || currentAnswerKeys.length === 0) {
    Swal.fire('ข้อควรระวัง', 'กรุณาเลือกวิชาและรอให้ดึงเฉลยสำเร็จก่อนทำการสแกนครับ', 'warning');
    return;
  }
  if (!cvReady && !window.cv) {
    Swal.fire('ระบบกำลังเตรียมพร้อม', 'กำลังโหลดไลบรารี AI OpenCV.js กรุณารอสักครู่...', 'info');
    return;
  }
  document.getElementById('omr-upload').click();
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  document.getElementById('scanner-workspace').style.display = 'block';
  document.getElementById('btn-save-result').disabled = true;
  document.getElementById('res-details').innerHTML = '<div style="text-align:center; padding:20px;"><i class="ph ph-spinner ph-spin" style="font-size:2rem;"></i><br>กำลังใช้ AI ประมวลผลภาพ...</div>';
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      processOMRImage(img);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function processOMRImage(img) {
  const canvas = document.getElementById('omr-canvas');
  const ctx = canvas.getContext('2d');
  
  // Scale image to a standard processing size (max width 800)
  const maxW = 800;
  const scale = img.width > maxW ? maxW / img.width : 1;
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
// Helper for clustering values within a threshold
function clusterByThreshold(values, threshold) {
  if (values.length === 0) return [];
  values.sort((a, b) => a - b);
  let clusters = [];
  let currentGroup = [values[0]];
  for (let i = 1; i < values.length; i++) {
    if (values[i] - values[i-1] > threshold) {
      clusters.push(currentGroup.reduce((a,b)=>a+b,0) / currentGroup.length);
      currentGroup = [values[i]];
    } else {
      currentGroup.push(values[i]);
    }
  }
  clusters.push(currentGroup.reduce((a,b)=>a+b,0) / currentGroup.length);
  return clusters;
}

let lastExtractedAnswers = [];
let lastExtractedStudentId = "";
let lastScanConfidence = 0;

async function processImage(src) {
  const canvas = document.getElementById('omr-canvas');
  try {
    let gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    
    let blurred = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
    
    let thresh = new cv.Mat();
    cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);
    
    // Find Markers (largest 4 contours with circular/square aspect ratio)
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    
    let candidates = [];
    for (let i = 0; i < contours.size(); i++) {
      let cnt = contours.get(i);
      let rect = cv.boundingRect(cnt);
      let area = cv.contourArea(cnt);
      let aspect = rect.width / rect.height;
      if (area > 200 && aspect > 0.6 && aspect < 1.4) {
        candidates.push({ rect, area, center: { x: rect.x + rect.width/2, y: rect.y + rect.height/2 } });
      }
    }
    
    candidates.sort((a, b) => b.area - a.area);
    let markers = candidates.slice(0, 4);
    
    if (markers.length < 4) {
      throw new Error("ไม่พบจุดอ้างอิง 4 มุมกระดาษ (Markers)");
    }
    
    // Sort markers: top-left, top-right, bottom-right, bottom-left
    markers.sort((a, b) => a.center.y - b.center.y);
    let topM = markers.slice(0, 2).sort((a, b) => a.center.x - b.center.x);
    let botM = markers.slice(2, 4).sort((a, b) => a.center.x - b.center.x);
    let tl = topM[0].center, tr = topM[1].center;
    let bl = botM[0].center, br = botM[1].center;
    
    // Warp Perspective to 840 x 1224 (A4 ratio approximation)
    let w = 840, h = 1224;
    let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y]);
    let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, w, 0, w, h, 0, h]);
    let M = cv.getPerspectiveTransform(srcTri, dstTri);
    
    let warped = new cv.Mat();
    cv.warpPerspective(src, warped, M, new cv.Size(w, h), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
    
    let wGray = new cv.Mat();
    cv.cvtColor(warped, wGray, cv.COLOR_RGBA2GRAY);
    let wThresh = new cv.Mat();
    cv.adaptiveThreshold(wGray, wThresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 15, 5);
    
    // Find all bubbles in warped image
    let wContours = new cv.MatVector();
    cv.findContours(wThresh, wContours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    
    let bubbles = [];
    for (let i = 0; i < wContours.size(); i++) {
      let rect = cv.boundingRect(wContours.get(i));
      let area = cv.contourArea(wContours.get(i));
      let aspect = rect.width / rect.height;
      if (area > 200 && area < 1500 && aspect > 0.6 && aspect < 1.4) {
        bubbles.push({ rect, center: { x: rect.x + rect.width/2, y: rect.y + rect.height/2 } });
      }
    }
    
    // Split into ID Grid (< 30% width) and Answers Grid (> 30% width)
    let splitX = w * 0.3;
    let idBubbles = bubbles.filter(b => b.center.x < splitX);
    let ansBubbles = bubbles.filter(b => b.center.x > splitX);
    
    // Process ID Grid (Seat Number)
    let idXClusters = clusterByThreshold(idBubbles.map(b => b.center.x), 15);
    let idYClusters = clusterByThreshold(idBubbles.map(b => b.center.y), 15);
    
    if (idXClusters.length !== 2 || idYClusters.length !== 10) {
      console.warn("ID Grid fallback", idXClusters.length, idYClusters.length);
      if(idXClusters.length < 2) idXClusters = [61, 95]; 
      if(idYClusters.length < 10) idYClusters = [150, 185, 220, 255, 290, 325, 360, 395, 430, 465];
    }
    
    let seatNumber = "";
    for (let col = 0; col < 2; col++) {
      let maxDensity = 0;
      let selectedDigit = "?";
      for (let row = 0; row < 10; row++) {
        let bx = idXClusters[col] - 12; // box size ~24x24
        let by = idYClusters[row] - 12;
        let rect = new cv.Rect(Math.max(0, Math.floor(bx)), Math.max(0, Math.floor(by)), 24, 24);
        let roi = wThresh.roi(rect);
        let density = cv.countNonZero(roi) / (24 * 24);
        roi.delete();
        cv.rectangle(warped, new cv.Point(bx, by), new cv.Point(bx+24, by+24), new cv.Scalar(255,0,0,255), 1);
        if (density > maxDensity && density > 0.30) {
          maxDensity = density;
          selectedDigit = row.toString();
        }
      }
      seatNumber += selectedDigit;
    }
    
    // Process Answers Grid
    const totalQ = currentScanSubject ? parseInt(currentScanSubject.TotalQuestions) || 20 : 20;
    const choicesList = ['ก','ข','ค','ง'];
    
    let ansXClusters = clusterByThreshold(ansBubbles.map(b => b.center.x), 15);
    let ansYClusters = clusterByThreshold(ansBubbles.map(b => b.center.y), 15);
    
    let expectedCols = Math.ceil(totalQ / 10) * 4;
    
    // Fallback if clustering misses columns/rows due to faint print
    if (ansYClusters.length < 10) ansYClusters = [115,150,185,220,255,290,325,360,395,430];
    
    let extractedAnswers = [];
    let detectedCount = 0;
    
    for (let q = 1; q <= totalQ; q++) {
      let colIdx = Math.floor((q - 1) / 10);
      let rowIdx = (q - 1) % 10;
      
      let maxDensity = 0;
      let selectedChoice = "?";
      
      for (let c = 0; c < 4; c++) {
        let xIdx = colIdx * 4 + c;
        if (xIdx >= ansXClusters.length || rowIdx >= ansYClusters.length) continue;
        
        let bx = ansXClusters[xIdx] - 12;
        let by = ansYClusters[rowIdx] - 12;
        let rect = new cv.Rect(Math.max(0, Math.floor(bx)), Math.max(0, Math.floor(by)), 24, 24);
        
        let roi = wThresh.roi(rect);
        let density = cv.countNonZero(roi) / (24 * 24);
        roi.delete();
        
        cv.rectangle(warped, new cv.Point(bx, by), new cv.Point(bx+24, by+24), new cv.Scalar(0,255,0,255), 1);
        
        if (density > maxDensity && density > 0.30) { // 30% threshold for cross/shade
          maxDensity = density;
          selectedChoice = choicesList[c];
        }
      }
      
      if (selectedChoice !== "?") detectedCount++;
      extractedAnswers.push({ q: q, ans: selectedChoice });
    }
    
    lastExtractedStudentId = seatNumber.includes("?") ? "XX" : seatNumber;
    lastExtractedAnswers = extractedAnswers;
    lastScanConfidence = Math.round((detectedCount / totalQ) * 100);
    
    cv.imshow(canvas, warped); // Show aligned output
    
    src.delete(); gray.delete(); blurred.delete(); thresh.delete(); contours.delete(); hierarchy.delete();
    warped.delete(); wGray.delete(); wThresh.delete(); wContours.delete(); srcTri.delete(); dstTri.delete(); M.delete();
    
    setTimeout(() => gradeOMR(), 100);
    
  } catch (err) {
    console.error("OpenCV Error:", err);
    Swal.fire('ข้อผิดพลาดจาก AI', 'อ่านกระดาษล้มเหลว โปรดตรวจสอบว่าเห็นจุดดำ 4 มุมครบถ้วน หรือมีแสงสว่างเพียงพอ', 'error');
    document.getElementById('res-details').innerHTML = '<span style="color:red;">สแกนล้มเหลว</span>';
  }
}

function gradeOMR() {
  const totalQ = currentScanSubject ? parseInt(currentScanSubject.TotalQuestions) || 20 : 20;
  let score = 0;
  let detailHtml = '';
  
  for (let i = 1; i <= totalQ; i++) {
    const keyObj = currentAnswerKeys.find(k => parseInt(k.QuestionNo) === i);
    const correctAns = keyObj ? keyObj.CorrectAnswer : 'ก';
    
    const readAnsObj = lastExtractedAnswers.find(a => a.q === i);
    const readAns = readAnsObj ? readAnsObj.ans : "?";
    
    const isCorrect = (readAns === correctAns);
    if (isCorrect) score++;
    
    detailHtml += `
      <div style="display:flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.4); padding: 8px 0;">
        <span>ข้อ ${i}: ตรวจพบ <strong>${readAns}</strong></span>
        ${isCorrect 
          ? '<span style="color: #059669; font-weight:bold;"><i class="ph ph-check"></i> ถูก (+1)</span>' 
          : `<span style="color: #dc2626;"><i class="ph ph-x"></i> ผิด (เฉลย ${correctAns})</span>`}
      </div>
    `;
  }
  
  document.getElementById('res-student').innerText = lastExtractedStudentId;
  let confColor = lastScanConfidence > 90 ? 'green' : (lastScanConfidence > 70 ? 'orange' : 'red');
  document.getElementById('res-conf').innerHTML = `<span style="color: ${confColor};">${lastScanConfidence}%</span>`;
  document.getElementById('res-score').innerText = score;
  document.getElementById('res-details').innerHTML = detailHtml;
  
  document.getElementById('btn-save-result').disabled = false;
  
  const maxWritten = currentScanSubject ? parseInt(currentScanSubject.MaxWrittenScore) || 0 : 0;
  if (maxWritten > 0) {
    document.getElementById('written-score-container').style.display = 'block';
    document.getElementById('max-written-label').innerText = maxWritten;
    document.getElementById('input-written-score').max = maxWritten;
    document.getElementById('input-written-score').value = 0;
  } else {
    document.getElementById('written-score-container').style.display = 'none';
  }
  
  lastScanResult = {
    StudentID: lastExtractedStudentId,
    Score: score,
    Confidence: lastScanConfidence + '%',
    WrittenScore: 0,
    TotalScore: score
  };
}

window.updateTotalScore = function() {
  if (!lastScanResult) return;
  const writtenInput = document.getElementById('input-written-score');
  let writtenScore = parseInt(writtenInput.value) || 0;
  const maxWritten = parseInt(document.getElementById('max-written-label').innerText) || 0;
  
  if (writtenScore > maxWritten) {
    writtenScore = maxWritten;
    writtenInput.value = maxWritten;
  }
  if (writtenScore < 0) {
    writtenScore = 0;
    writtenInput.value = 0;
  }
  
  lastScanResult.WrittenScore = writtenScore;
  lastScanResult.TotalScore = lastScanResult.Score + writtenScore;
  
  document.getElementById('res-score').innerText = lastScanResult.TotalScore;
};

async function saveResult() {
  if (!lastScanResult || !currentScanSubject) return;
  
  Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  
  const canvas = document.getElementById('omr-canvas');
  let base64Image = '';
  try { base64Image = canvas.toDataURL('image/jpeg', 0.8); } catch(e) { }

  let driveUrl = '';
  if (base64Image) {
    const uploadRes = await apiCall({ 
      action: 'uploadImage', 
      base64Data: base64Image,
      filename: `SCAN_${lastScanResult.StudentID}_${Date.now()}.jpg`
    });
    if (uploadRes && uploadRes.success) driveUrl = uploadRes.url;
  }

  const payload = {
    ScanID: 'SCN-' + Date.now(),
    SubjectID: currentScanSubject.SubjectID,
    StudentID: lastScanResult.StudentID,
    Score: lastScanResult.TotalScore,
    Confidence: lastScanResult.Confidence,
    DriveImageURL: driveUrl
  };
  
  const res = await apiCall({ action: 'saveScanResult', payload: payload });
  
  if (res && res.success) {
    Swal.fire('สำเร็จ', 'บันทึกคะแนนและรูปภาพเข้าฐานข้อมูลเรียบร้อยแล้ว', 'success');
    document.getElementById('btn-save-result').disabled = true;
  } else {
    Swal.fire('ข้อผิดพลาด', 'บันทึกไม่สำเร็จ: ' + (res ? res.message : ''), 'error');
  }
}
