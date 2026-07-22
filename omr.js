// ====== OMR SCANNER LOGIC ======

function renderScanPage() {
  const content = `
    <div class="card" style="text-align: center;">
      <h2 style="margin-bottom: 20px;">สแกนกระดาษคำตอบ</h2>
      <p style="color: var(--text-secondary); margin-bottom: 30px;">
        ระบบจะตรวจหาจุดอ้างอิงสีดำทั้ง 4 มุม แล้วปรับภาพเอียงและตรวจ OMR ให้อัตโนมัติ<br>
        (ต้องการไลบรารี OpenCV.js ในการประมวลผล)
      </p>
      
      <div style="display: flex; gap: 20px; justify-content: center; margin-bottom: 30px;">
        <button class="btn btn-outline" style="padding: 20px; flex-direction: column; width: 180px;" onclick="document.getElementById('omr-upload').click()">
          <i class="ph ph-upload-simple" style="font-size: 2rem; margin-bottom: 10px; color: var(--primary-color);"></i>
          อัปโหลดรูปภาพ
          <span style="font-size: 0.8rem; color: #999; margin-top: 5px;">JPG, PNG, WebP</span>
        </button>
        <button class="btn btn-outline" style="padding: 20px; flex-direction: column; width: 180px;" onclick="startCamera()">
          <i class="ph ph-camera" style="font-size: 2rem; margin-bottom: 10px; color: var(--primary-color);"></i>
          ถ่ายจากกล้อง
          <span style="font-size: 0.8rem; color: #999; margin-top: 5px;">ใช้กล้องมือถือ/เว็บแคม</span>
        </button>
        <button class="btn btn-outline" style="padding: 20px; flex-direction: column; width: 180px;">
          <i class="ph ph-scanner" style="font-size: 2rem; margin-bottom: 10px; color: var(--primary-color);"></i>
          ดึงจากเครื่องสแกน
          <span style="font-size: 0.8rem; color: #999; margin-top: 5px;">ผ่าน Scanner Bridge</span>
        </button>
      </div>
      
      <input type="file" id="omr-upload" accept="image/*" style="display: none;" onchange="handleImageUpload(event)">
      
      <div id="scanner-workspace" style="display: none; background: #f9fafb; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
        <div style="display: flex; gap: 20px;">
          <div style="flex: 1;">
            <h4 style="margin-bottom: 10px;">ภาพที่สแกน</h4>
            <canvas id="omr-canvas" style="width: 100%; max-width: 400px; border: 1px dashed #ccc; background: white;"></canvas>
            <div style="margin-top: 15px; display: flex; justify-content: center; gap: 10px;">
              <button class="btn btn-outline" onclick="rotateCanvas(-90)"><i class="ph ph-arrow-u-up-left"></i> หมุนซ้าย</button>
              <button class="btn btn-outline" onclick="rotateCanvas(90)"><i class="ph ph-arrow-u-up-right"></i> หมุนขวา</button>
            </div>
          </div>
          
          <div style="flex: 1; text-align: left;">
            <h4 style="margin-bottom: 10px;">ผลการตรวจ (Preview)</h4>
            <div class="card" style="box-shadow: none; border: 1px solid var(--border-color);">
              <p><strong>รหัสนักเรียน:</strong> <span id="res-student" style="color: var(--primary-color); font-weight: bold;">-</span></p>
              <p><strong>ความมั่นใจ (Confidence):</strong> <span id="res-conf">-</span></p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 15px 0;">
              <p><strong>คะแนนที่ได้:</strong> <span id="res-score" style="font-size: 1.5rem; color: var(--secondary-color); font-weight: bold;">-</span> / 20</p>
              
              <div id="res-details" style="margin-top: 15px; max-height: 200px; overflow-y: auto; font-size: 0.9rem;">
                <!-- Result mapping injected here -->
              </div>
              
              <button class="btn btn-primary w-100" style="margin-top: 20px;" onclick="saveResult()">
                <i class="ph ph-floppy-disk"></i> บันทึกคะแนน
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('page-content').innerHTML = content;
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  document.getElementById('scanner-workspace').style.display = 'block';
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.getElementById('omr-canvas');
      const ctx = canvas.getContext('2d');
      // Scale down for preview
      const scale = 400 / img.width;
      canvas.width = 400;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Simulate OMR processing delay
      Swal.fire({
        title: 'กำลังประมวลผล OMR',
        text: 'กำลังค้นหาจุดอ้างอิงและอ่านคำตอบ...',
        timer: 1500,
        didOpen: () => { Swal.showLoading(); }
      }).then(() => {
        simulateOMRResult();
      });
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function rotateCanvas(degrees) {
  Swal.fire('หมุนภาพ', 'หมุนภาพและคำนวณ OMR ใหม่อัตโนมัติ', 'info');
  simulateOMRResult();
}

function simulateOMRResult() {
  document.getElementById('res-student').innerText = '12345 (เด็กชายทดสอบ)';
  document.getElementById('res-conf').innerHTML = '<span style="color: green;">98% (สูง)</span>';
  document.getElementById('res-score').innerText = '18';
  
  let details = '';
  for(let i=1; i<=20; i++) {
    let ans = ['A','B','C','D'][Math.floor(Math.random()*4)];
    let correct = Math.random() > 0.1;
    let color = correct ? 'green' : 'red';
    details += \`<div style="display:flex; justify-content: space-between; border-bottom: 1px solid #eee; padding: 5px 0;">
      <span>ข้อ \${i}: อ่านได้ <strong>\${ans}</strong></span>
      <span style="color: \${color};">\${correct ? '✓ ถูก' : '✗ ผิด (เฉลย A)'}</span>
    </div>\`;
  }
  document.getElementById('res-details').innerHTML = details;
}

function saveResult() {
  Swal.fire('สำเร็จ', 'บันทึกคะแนนเข้าสู่ Google Sheets เรียบร้อย', 'success');
  document.getElementById('scanner-workspace').style.display = 'none';
}

function startCamera() {
  Swal.fire('เปิดกล้อง', 'เรียกใช้ API navigator.mediaDevices.getUserMedia()', 'info');
}
