// ====== STATE ======
let currentUser = null; // { role: 'student' | 'teacher' | 'admin', name: string, id?: string }
let currentPath = '/';

const API_URL = 'https://script.google.com/macros/s/AKfycbxStgawnWOcS78xCYyvolY-XljwWLCo_fSe_0xoTWwYtOElzGDBw6n7qp0mLlglqQM/exec';

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
  const studentId = document.getElementById('student-id-input').value.trim();
  if (studentId.length !== 5) {
    Swal.fire('ข้อผิดพลาด', 'รหัสนักเรียนต้องมี 5 หลักเท่านั้น', 'error');
    return;
  }
  
  Swal.fire({ title: 'กำลังตรวจสอบข้อมูล...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  
  const res = await apiCall({ action: 'loginStudent', studentId: studentId });
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
  e.preventDefault();
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
    items.push({ path: '/scan', name: 'สแกนกระดาษคำตอบ', icon: 'ph-scan' });
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
  if (currentPath === '/scan') return renderScanPage();
  if (currentPath === '/users') return renderUsersPage();
  if (currentPath === '/settings') return renderSettingsPage();
}

async function renderDashboardPage() {
  const contentContainer = document.getElementById('page-content');
      
      <div style="display: flex; gap: 20px;">
        <div style="flex: 1; background: #EEF2FF; padding: 30px; border-radius: 8px; text-align: center; border: 1px solid #C7D2FE;">
          <h3 style="color: var(--primary-color); font-size: 3rem; margin-bottom: 10px;">${currentUser.role === 'student' ? '5' : '12'}</h3>
          <p style="color: var(--primary-hover); font-weight: 500;">วิชาทั้งหมด</p>
        </div>
        <div style="flex: 1; background: #D1FAE5; padding: 30px; border-radius: 8px; text-align: center; border: 1px solid #A7F3D0;">
          <h3 style="color: #059669; font-size: 3rem; margin-bottom: 10px;">${currentUser.role === 'student' ? '85' : '350'}</h3>
          <p style="color: #047857; font-weight: 500;">คะแนน/กระดาษที่ตรวจแล้ว</p>
        </div>
      </div>
    </div>
  `;
}
