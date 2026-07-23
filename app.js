// ====== STATE ======
let currentUser = null; // { role: 'student' | 'teacher' | 'admin', name: string, id?: string }
let currentPath = '/';

const API_URL = 'https://script.google.com/macros/s/AKfycbxs-nWyPdhFRMR6ZLoToSKKn9kl51TRz9Czll0CdTKU8teXr9XnUOUv3A_gK_FtA9Tz/exec';

async function apiCall(params) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(params)
    });
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, message: 'การเชื่อมต่อขัดข้อง หรือ URL ไม่ถูกต้อง' };
  }
}

// ====== LOGIN LOGIC ======
function switchLoginRole(role) {
  document.getElementById('tab-student').classList.remove('active');
  document.getElementById('tab-staff').classList.remove('active');
  document.getElementById('student-login-form').style.display = 'none';
  document.getElementById('staff-login-form').style.display = 'none';

  if (role === 'student') {
    document.getElementById('tab-student').classList.add('active');
    document.getElementById('student-login-form').style.display = 'block';
  } else {
    document.getElementById('tab-staff').classList.add('active');
    document.getElementById('staff-login-form').style.display = 'block';
  }
}

async function handleStudentLogin(e) {
  e.preventDefault();
  const subjCode = document.getElementById('student-subj-input').value.trim().toUpperCase();
  let seatNo = document.getElementById('student-id-input').value.trim();
  
  // UX Improvement: If student types '5', auto convert to '05'
  if (seatNo.length === 1) {
    seatNo = seatNo.padStart(2, '0');
    // update the input visually too
    document.getElementById('student-id-input').value = seatNo;
  }
  
  if (!subjCode || seatNo.length !== 2) {
    Swal.fire('ข้อผิดพลาด', 'กรุณากรอกรหัสวิชา และ เลขที่ให้ครบถ้วน', 'error');
    return;
  }
  
  Swal.fire({ title: 'กำลังตรวจสอบข้อมูล...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  
  // Send Subject Code and Seat Number to backend
  const res = await apiCall({ action: 'loginStudent', subjectCode: subjCode, seatNumber: seatNo });
  if (res && res.success) {
    Swal.close();
    loginSuccess(res.data);
  } else {
    Swal.fire('ข้อผิดพลาด', res ? res.message : 'ไม่สามารถเข้าสู่ระบบได้', 'error');
  }
}

async function handleStaffLogin(e) {
  e.preventDefault();
  const username = document.getElementById('staff-username-input').value.trim();
  const password = document.getElementById('staff-password-input').value.trim();

  if (!username || !password) {
    Swal.fire('ข้อผิดพลาด', 'กรุณากรอกข้อมูลให้ครบ', 'error');
    return;
  }

  Swal.fire({ title: 'กำลังเข้าสู่ระบบ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  const res = await apiCall({ action: 'loginStaff', username: username, password: password });
  
  if (res && res.success) {
    Swal.close();
    // Normalizing role based on database response
    const user = res.data;
    loginSuccess({ role: user.Role.toLowerCase(), name: user.Name, username: user.Username });
  } else {
    Swal.fire('ข้อผิดพลาด', res ? res.message : 'เชื่อมต่อฐานข้อมูลล้มเหลว', 'error');
  }
}

function loginSuccess(user) {
  currentUser = user;
  Swal.fire({
    title: 'สำเร็จ',
    text: 'เข้าสู่ระบบสำเร็จ',
    icon: 'success',
    timer: 1500,
    showConfirmButton: false
  });
  
  // Switch UI to Main App
  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('app-screen').classList.add('active');
  
  // Setup App Profile
  document.getElementById('user-name-display').innerText = user.name;
  document.getElementById('user-avatar-display').innerText = user.name.charAt(0);
  
  navigate('/');
}

function handleLogout(e) {
  if (e) e.preventDefault();
  currentUser = null;
  document.getElementById('app-screen').classList.remove('active');
  document.getElementById('login-screen').classList.add('active');
  document.getElementById('student-id-input').value = '';
}

// ====== ROUTING LOGIC ======
function navigate(path) {
  currentPath = path;
  renderSidebar();
  renderContent();
}

function renderSidebar() {
  const navContainer = document.getElementById('sidebar-nav');
  let items = [];
  
  if (currentUser.role === 'student') {
    items.push({ path: '/', name: 'แดชบอร์ด (นักเรียน)', icon: 'ph-squares-four' });
  } else {
    items.push({ path: '/', name: 'แดชบอร์ด', icon: 'ph-squares-four' });
    items.push({ path: '/subjects', name: 'จัดการรายวิชา', icon: 'ph-books' });
    items.push({ path: '/rosters', name: 'จัดการรายชื่อนักเรียน', icon: 'ph-users-three' });
    items.push({ path: '/scan', name: 'สแกนกระดาษคำตอบ', icon: 'ph-scan' });
    items.push({ path: '/reports', name: 'รายงานผลคะแนน', icon: 'ph-chart-bar' });
    
    if (currentUser.role === 'admin') {
      items.push({ path: '/users', name: 'จัดการผู้ใช้งาน', icon: 'ph-users' });
      items.push({ path: '/settings', name: 'ตั้งค่าระบบ', icon: 'ph-gear' });
    }
  }

  navContainer.innerHTML = items.map(item => `
    <li>
      <a class="nav-item ${currentPath === item.path ? 'active' : ''}" onclick="navigate('${item.path}')">
        <i class="ph ${item.icon}"></i> ${item.name}
      </a>
    </li>
  `).join('');
}

function renderContent() {
  if (currentPath === '/') return renderDashboardPage();
  if (currentPath === '/subjects') return renderSubjectsPage();
  if (currentPath === '/rosters') return renderRostersPage();
  if (currentPath === '/scan') return renderScanPage();
  if (currentPath === '/reports') return renderReportsPage();
  if (currentPath === '/users') return renderUsersPage();
  if (currentPath === '/settings') return renderSettingsPage();
}

async function renderDashboardPage() {
  const contentContainer = document.getElementById('page-content');
  
  if (currentUser.role === 'student') {
    contentContainer.innerHTML = '';
    Swal.fire({ title: 'กำลังโหลดคะแนนของคุณ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    
    const res = await apiCall({ action: 'getScanResults', subjectId: currentUser.subjectId });
    Swal.close();
    
    let content = `
      <div class="card glass-panel" style="text-align: center; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="margin-bottom: 10px; color: var(--primary-color);">ยินดีต้อนรับ, ${currentUser.name}</h2>
        <p style="color: #666; margin-bottom: 30px;">รหัสวิชา: <strong>${currentUser.subjectId}</strong> | ห้อง: <strong>${currentUser.className}</strong></p>
    `;
    
    if (res && res.success && res.data && res.data.length > 0) {
      // Find the student's score
      let seatNoStr = currentUser.seatNumber.toString();
      if (seatNoStr.length === 1) seatNoStr = '0' + seatNoStr;
      
      const myScans = res.data.filter(s => {
        let sId = String(s.StudentID);
        if (sId.length === 1) sId = '0' + sId;
        return sId === seatNoStr;
      });
      
      if (myScans.length > 0) {
        // Get the latest scan
        const latestScan = myScans.reduce((a, b) => new Date(a.Timestamp) > new Date(b.Timestamp) ? a : b);
        
        content += `
          <div style="background: rgba(255, 255, 255, 0.8); border: 1px solid rgba(0,0,0,0.1); border-radius: 20px; padding: 40px; margin-bottom: 20px;">
            <div style="font-size: 1.2rem; color: var(--text-secondary); margin-bottom: 10px;">คะแนนรวมที่คุณได้</div>
            <div style="font-size: 5rem; font-weight: 800; color: #059669; line-height: 1;">${latestScan.Score}</div>
            <div style="font-size: 0.9rem; color: #999; margin-top: 15px;">ตรวจล่าสุดเมื่อ: ${new Date(latestScan.Timestamp).toLocaleString('th-TH')}</div>
          </div>
        `;
      } else {
        content += `
          <div style="padding: 40px; background: rgba(239, 68, 68, 0.1); border-radius: 16px; border: 1px dashed rgba(239, 68, 68, 0.5);">
            <i class="ph ph-warning-circle" style="font-size: 3rem; color: #ef4444; margin-bottom: 10px;"></i>
            <h3 style="color: #ef4444;">ยังไม่มีคะแนนในระบบ</h3>
            <p style="color: #666;">กระดาษคำตอบของคุณอาจจะยังไม่ได้ถูกสแกน หรือกรอกเลขที่ผิดพลาด กรุณาติดต่อคุณครูผู้สอน</p>
          </div>
        `;
      }
    } else {
      content += `
        <div style="padding: 40px; background: rgba(239, 68, 68, 0.1); border-radius: 16px; border: 1px dashed rgba(239, 68, 68, 0.5);">
          <i class="ph ph-warning-circle" style="font-size: 3rem; color: #ef4444; margin-bottom: 10px;"></i>
          <h3 style="color: #ef4444;">ยังไม่มีข้อมูลการสอบในวิชานี้</h3>
        </div>
      `;
    }
    
    content += `</div>`;
    contentContainer.innerHTML = content;
    return;
  }
  
  // Admin / Staff Dashboard
  contentContainer.innerHTML = '';
  Swal.fire({ title: 'กำลังโหลดภาพรวมระบบ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  
  const res = await apiCall({ action: 'getDashboardStats' });
  Swal.close();
  let stats = { totalSubjects: 0, totalScans: 0 };
  if (res && res.success) {
    stats = res.data;
  }

  const content = `
      <div class="card">
        <h2 style="margin-bottom: 16px;">ภาพรวมระบบ (Dashboard)</h2>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
          <div style="background: rgba(255, 255, 255, 0.8); color: var(--text-primary); padding: 25px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid rgba(0,0,0,0.05); backdrop-filter: blur(10px);">
            <div style="font-size: 1rem; color: var(--text-secondary); margin-bottom: 5px;"><i class="ph ph-books" style="color: var(--primary-color);"></i> จำนวนวิชาทั้งหมด</div>
            <div style="font-size: 2.5rem; font-weight: 700;">${stats.totalSubjects}</div>
          </div>
          <div style="background: rgba(255, 255, 255, 0.8); color: var(--text-primary); padding: 25px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid rgba(0,0,0,0.05); backdrop-filter: blur(10px);">
            <div style="font-size: 1rem; color: var(--text-secondary); margin-bottom: 5px;"><i class="ph ph-scan" style="color: #10B981;"></i> กระดาษคำตอบที่สแกนแล้ว</div>
            <div style="font-size: 2.5rem; font-weight: 700;">${stats.totalScans}</div>
          </div>
          <div style="background: rgba(255, 255, 255, 0.8); color: var(--text-primary); padding: 25px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid rgba(0,0,0,0.05); backdrop-filter: blur(10px);">
            <div style="font-size: 1rem; color: var(--text-secondary); margin-bottom: 5px;"><i class="ph ph-activity" style="color: #F59E0B;"></i> สถานะระบบ</div>
            <div style="font-size: 1.8rem; font-weight: 700; margin-top: 5px; color: #10B981;">ออนไลน์ปกติ</div>
          </div>
        </div>
      </div>
  `;
  contentContainer.innerHTML = content;
}

// ====== SESSION TIMEOUT ======
let idleTime = 0;
const TIMEOUT_MINUTES = 10;

function resetIdleTime() {
  idleTime = 0;
}

setInterval(() => {
  if (currentUser) {
    idleTime++;
    if (idleTime >= TIMEOUT_MINUTES) {
      Swal.fire({
        title: 'เซสชันหมดอายุ',
        text: 'ระบบได้ทำการออกจากระบบอัตโนมัติ เนื่องจากไม่มีการใช้งานเกิน 10 นาที เพื่อความปลอดภัย',
        icon: 'warning',
        confirmButtonText: 'ตกลง'
      });
      handleLogout();
    }
  }
}, 60000); // Check every 1 minute

document.addEventListener('mousemove', resetIdleTime);
document.addEventListener('keypress', resetIdleTime);
document.addEventListener('click', resetIdleTime);
document.addEventListener('scroll', resetIdleTime);
