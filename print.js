// ====== PRINT OMR SHEET LOGIC ======

function printOMRSheet(subjectId, format = 'circle') {
  const subject = globalSubjects.find(s => s.SubjectID === subjectId) || { Code: 'XXXX', Name: 'ไม่ระบุ', Class: 'ไม่ระบุ', TotalQuestions: 20, SubjectID: subjectId };
  
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <title>กระดาษคำตอบ - ${subject.Name}</title>
      <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;600&display=swap" rel="stylesheet">
      <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;600&display=swap" rel="stylesheet">
      <style>
        .subjective-content table { border-collapse: collapse; width: 100%; }
        .subjective-content table, .subjective-content th, .subjective-content td { border: 1px solid black; padding: 5px; }
        .subjective-content { overflow-wrap: break-word; word-break: break-all; max-width: 100%; }
        body { font-family: 'Kanit', sans-serif; margin: 0; padding: 0; background: #fff; }
        .page { width: 210mm; height: 297mm; position: relative; padding: 20mm; box-sizing: border-box; }
        .marker { width: 30px; height: 30px; background: black; position: absolute; border-radius: 50%; }
        .m-tl { top: 10mm; left: 10mm; }
        .m-tr { top: 10mm; right: 10mm; }
        .m-bl { bottom: 10mm; left: 10mm; }
        .m-br { bottom: 10mm; right: 10mm; }
        
        .header { text-align: center; margin-bottom: 20mm; }
        .header h1 { margin: 0 0 10px 0; font-size: 24px; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
        
        .omr-section { display: flex; justify-content: space-between; margin-top: 20px; }
        
        /* Student ID Grid */
        .id-grid { margin-right: 40px; }
        .id-grid table { border-collapse: collapse; }
        .id-grid th { font-weight: normal; font-size: 12px; }
        .bubble { 
          width: 22px; 
          height: 22px; 
          border: 1.5px solid black; 
          border-radius: ${format === 'square' ? '4px' : '50%'}; 
          display: inline-flex; 
          align-items: center; 
          justify-content: center; 
          margin: 3px; 
          font-size: 11px;
          box-sizing: border-box;
          flex-shrink: 0;
        }
        
        /* Answers Grid */
        .answers-grid { flex: 1; display: flex; flex-wrap: wrap; gap: 20px; }
        .q-col { width: 125px; }
        .q-row { display: flex; align-items: center; margin-bottom: 6px; }
        .q-num { width: 25px; text-align: right; margin-right: 10px; font-size: 14px; }
        
        @media print {
          @page { margin: 0; size: A4; }
          body { -webkit-print-color-adjust: exact; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="padding: 20px; background: #f3f4f6; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; background: #4F46E5; color: white; border: none; border-radius: 5px;">
          พิมพ์กระดาษคำตอบ
        </button>
        <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; background: white; color: black; border: 1px solid #ccc; border-radius: 5px; margin-left: 10px;">
          ปิดหน้าต่าง
        </button>
      </div>

      <div class="page">
        <!-- Markers -->
        <div class="marker m-tl"></div>
        <div class="marker m-tr"></div>
        <div class="marker m-bl"></div>
        <div class="marker m-br"></div>

        <div style="display: flex; gap: 30px;">
          <!-- ID Marking on Left -->
          <div class="id-grid" style="margin-right: 0; margin-top: 10px; width: 85px;">
            <h3 style="font-size: 14px; margin-bottom: 5px;">เลขที่ (2 หลัก)</h3>
            <div style="font-size: 11px; color: #666; margin-bottom: 5px;">(เช่น เลขที่ 5 ให้ฝน 05)</div>
            <table>
              <tr>
                ${[1,2].map(() => `<td style="border:1px solid #ccc; width: 25px; height: 30px;"></td>`).join('')}
              </tr>
              ${[0,1,2,3,4,5,6,7,8,9].map(num => `
                <tr>
                  ${[1,2].map(() => `<td><div class="bubble">${num}</div></td>`).join('')}
                </tr>
              `).join('')}
            </table>
          </div>

          <!-- Header and Answers on Right -->
          <div style="flex: 1;">
            <div class="header" style="margin-bottom: 10px; text-align: center;">
              <h1>กระดาษคำตอบ (OMR)</h1>
              <div style="font-size: 11px; color: #666; margin-top: -8px; margin-bottom: 15px;">พัฒนาโดย คุณครูก้องนที อุ่นเจริญ</div>
              
              <div class="info-row">
                <span><strong>วิชา:</strong> ${subject.Name} (${subject.Code})</span>
                <span><strong>ประเภท:</strong> ${subject.ExamType || 'ทั่วไป'}</span>
                <span><strong>ชั้นเรียน:</strong> ${subject.Class}</span>
              </div>
              <div class="info-row" style="margin-top: 10px;">
                <span><strong>ชื่อ-สกุล:</strong> ___________________________________</span>
                <span><strong>รหัสข้อสอบ:</strong> ${subject.SubjectID}</span>
              </div>
              <div style="margin-top: 10px; font-size: 13px; color: #444; border: 1px solid #ccc; padding: 5px; border-radius: 4px; display: inline-block;">
                <strong>คำชี้แจง:</strong> ให้นักเรียน <u>ระบายทึบ</u> หรือ <u>กากบาท (X)</u> ลงใน${format === 'square' ? 'ช่องสี่เหลี่ยม' : 'วงกลม'}ให้ชัดเจน
              </div>
            </div>

            <div class="answers-grid" style="margin-top: 20px;">
              ${generateAnswerColumns(subject.TotalQuestions)}
            </div>
          </div>
        </div>
        
        ${subject.WrittenContent ? `
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px dashed #ccc;">
            <h3 style="font-size: 16px; margin-bottom: 15px;">ส่วนที่ 2: ข้อสอบอัตนัย (${subject.MaxWrittenScore || 0} คะแนน)</h3>
            <div class="subjective-content" style="padding: 0; font-family: 'Kanit', sans-serif; font-size: 15px;">
              ${subject.WrittenContent}
            </div>
          </div>
        ` : `
          <div style="margin-top: 30px; border: 1px dashed #ccc; padding: 20px; height: 200px;">
            <h3 style="font-size: 14px; color: #666; margin: 0;">พื้นที่สำหรับข้อเขียน (ไม่กระทบการอ่าน OMR)</h3>
          </div>
        `}
      </div>
    </body>
    </html>
  `;
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

function generateAnswerColumns(total) {
  let html = '';
  const choices = ['A', 'B', 'C', 'D'];
  // Group into columns of 10
  for (let i = 0; i < total; i += 10) {
    html += '<div class="q-col">';
    for (let j = 1; j <= 10 && i + j <= total; j++) {
      let qNum = i + j;
      html += `
        <div class="q-row">
          <div class="q-num">${qNum}.</div>
          ${choices.map(c => `<div class="bubble">${c}</div>`).join('')}
        </div>
      `;
    }
    html += '</div>';
  }
  return html;
}
