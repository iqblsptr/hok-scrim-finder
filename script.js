// Global Variables
let lang = 'id';
let isLoggedIn = false;
let currentUser = null;
let teams = [];
let notifications = [];
let expandedTeam = null;
let scrimResults = []; // New: Store scrim results

// Session Storage Keys
const SESSION_KEY = 'hok_session';
const NOTIF_KEY = 'hok_notifications';
const SCRIM_KEY = 'hok_scrim_results';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    restoreSession();
    updateLanguage();
    createCSButton(); // Create Customer Service Button
});

// Create Customer Service Floating Button
function createCSButton() {
    const csButton = document.createElement('a');
    csButton.href = 'https://wa.me/6281220792589?text=Halo,%20saya%20membutuhkan%20bantuan';
    csButton.target = '_blank';
    csButton.className = 'cs-float-button';
    csButton.innerHTML = '<i class="fas fa-headset"></i>';
    csButton.title = lang === 'id' ? 'Customer Service' : 'Customer Service';
    document.body.appendChild(csButton);
}

// Restore Session from localStorage
function restoreSession() {
    console.log('Restoring session...');
    const sessionData = localStorage.getItem(SESSION_KEY);
    const notifData = localStorage.getItem(NOTIF_KEY);
    const scrimData = localStorage.getItem(SCRIM_KEY);
    
    if (sessionData) {
        try {
            const session = JSON.parse(sessionData);
            console.log('Session found:', session);
            
            currentUser = session.currentUser;
            teams = session.teams || [];
            isLoggedIn = true;
            
            showLoggedInUI();
            renderTeams();
            renderTeamInfo();
            updateUserProfile();
            
            console.log('Session restored successfully');
        } catch (error) {
            console.error('Error restoring session:', error);
            clearSession();
        }
    }
    
    if (notifData) {
        try {
            notifications = JSON.parse(notifData);
            updateNotificationBadge();
            console.log('Notifications restored:', notifications.length);
        } catch (error) {
            console.error('Error restoring notifications:', error);
        }
    }
    
    if (scrimData) {
        try {
            scrimResults = JSON.parse(scrimData);
            console.log('Scrim results restored:', scrimResults.length);
        } catch (error) {
            console.error('Error restoring scrim results:', error);
        }
    }
}

// Save Session to localStorage
function saveSession() {
    if (isLoggedIn && currentUser) {
        const sessionData = {
            currentUser,
            teams,
            timestamp: Date.now()
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        console.log('Session saved');
    }
}

// Clear Session
function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(NOTIF_KEY);
    console.log('Session cleared');
}

// Save Notifications
function saveNotifications() {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications));
}

// Save Scrim Results
function saveScrimResults() {
    localStorage.setItem(SCRIM_KEY, JSON.stringify(scrimResults));
}

// Show Logged In UI
function showLoggedInUI() {
    document.getElementById('heroSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('registerBtnHero').style.display = 'none';
    document.getElementById('loginBtn').style.display = 'none';
    document.querySelector('.notification-wrapper').style.display = 'block';
    document.getElementById('logoutBtn').style.display = 'block';
    document.getElementById('userProfile').style.display = 'flex';
}

// Update User Profile in Navbar
function updateUserProfile() {
    if (!currentUser) return;
    
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const userStatus = document.getElementById('userStatus');
    
    userName.textContent = currentUser.teamName || '-';
    
    if (currentUser.logo) {
        userAvatar.src = currentUser.logo;
        userAvatar.style.display = 'block';
    } else {
        userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.teamName || 'T')}&background=eab308&color=1f2937&size=128`;
    }
    
    const statusText = getStatusText(currentUser.status || 'available');
    userStatus.textContent = statusText;
    
    if (currentUser.status === 'searching') {
        userStatus.style.setProperty('--status-color', '#facc15');
    } else if (currentUser.status === 'inMatch') {
        userStatus.style.setProperty('--status-color', '#f87171');
    } else {
        userStatus.style.setProperty('--status-color', '#4ade80');
    }
}

// Event Listeners
function setupEventListeners() {
    document.getElementById('langBtn').addEventListener('click', toggleLanguage);
    document.getElementById('notifBtn').addEventListener('click', toggleNotificationDropdown);
    document.getElementById('btnReadAll').addEventListener('click', markAllNotificationsRead);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    document.addEventListener('click', (e) => {
        const notifWrapper = document.querySelector('.notification-wrapper');
        const notifDropdown = document.getElementById('notificationDropdown');
        
        if (notifWrapper && !notifWrapper.contains(e.target)) {
            notifDropdown.style.display = 'none';
        }
    });
}

// Toggle Notification Dropdown
function toggleNotificationDropdown(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('notificationDropdown');
    const isVisible = dropdown.style.display === 'block';
    
    dropdown.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
        renderNotificationDropdown();
    }
}

// Render Notification Dropdown
function renderNotificationDropdown() {
    const list = document.getElementById('notificationDropdownList');
    const t = translations[lang];
    
    if (notifications.length === 0) {
        list.innerHTML = `
            <div class="notification-empty">
                <i class="fas fa-bell-slash"></i>
                <p>${t.noNotifText || 'Tidak ada notifikasi'}</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = notifications.map((notif, index) => `
        <div class="notification-item-dropdown ${notif.read ? '' : 'unread'}" onclick="markNotificationRead(${index})">
            <div class="notification-item-header">
                <div class="notification-item-title">
                    <i class="fas fa-users"></i> ${notif.title || 'Tawaran Scrim'}
                </div>
                <div class="notification-item-time">${notif.time}</div>
            </div>
            <div class="notification-item-message">${notif.message}</div>
            <div class="notification-item-contact">
                <span><i class="fas fa-phone"></i> ${notif.whatsapp}</span>
                <span><i class="fas fa-envelope"></i> ${notif.email}</span>
            </div>
        </div>
    `).join('');
}

// Mark Notification as Read
function markNotificationRead(index) {
    if (notifications[index]) {
        notifications[index].read = true;
        updateNotificationBadge();
        renderNotificationDropdown();
        saveNotifications();
    }
}

// Mark All Notifications as Read
function markAllNotificationsRead() {
    notifications.forEach(notif => notif.read = true);
    updateNotificationBadge();
    renderNotificationDropdown();
    saveNotifications();
}

// Add Notification
function addNotification(title, message, whatsapp, email) {
    const notification = {
        id: Date.now(),
        title: title,
        message: message,
        whatsapp: whatsapp,
        email: email,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date().toISOString(),
        read: false
    };
    
    notifications.unshift(notification);
    
    if (notifications.length > 50) {
        notifications = notifications.slice(0, 50);
    }
    
    updateNotificationBadge();
    saveNotifications();
}

// Update Notification Badge
function updateNotificationBadge() {
    const badge = document.getElementById('notifBadge');
    const unreadCount = notifications.filter(n => !n.read).length;
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// Language Toggle
function toggleLanguage() {
    lang = lang === 'id' ? 'en' : 'id';
    updateLanguage();
    
    // Update CS button text
    const csButton = document.querySelector('.cs-float-button');
    if (csButton) {
        csButton.title = lang === 'id' ? 'Customer Service' : 'Customer Service';
    }
}

function updateLanguage() {
    const t = translations[lang];
    
    document.getElementById('langText').textContent = lang === 'id' ? 'EN' : 'ID';
    document.getElementById('heroTitle').textContent = t.title;
    document.getElementById('heroSubtitle').textContent = t.tagline;
    document.getElementById('loginText').textContent = t.login;
    document.getElementById('registerText').textContent = t.register;
    document.getElementById('findMatchText').textContent = t.findMatch;
    document.getElementById('myTeamText').textContent = t.myTeam;
    document.getElementById('uploadResultsText').textContent = t.uploadResults;
    document.getElementById('countryLabel').textContent = t.country;
    document.getElementById('provinceLabel').textContent = t.province;
    document.getElementById('searchText').textContent = t.searchingMatch;
    document.getElementById('searchingText').textContent = t.searching + '...';
    document.getElementById('teamInfoTitle').textContent = t.teamInfo;
    document.getElementById('notificationsTitle').textContent = t.notifications;
    document.getElementById('logoutText').textContent = t.logout;
    document.getElementById('notifHeaderText').textContent = t.notifications;
    document.getElementById('readAllText').textContent = lang === 'id' ? 'Tandai Semua Dibaca' : 'Mark All Read';
    document.getElementById('noNotifText').textContent = lang === 'id' ? 'Tidak ada notifikasi' : 'No notifications';
    
    updateProvinces();
    if (isLoggedIn) {
        renderTeams();
        renderTeamInfo();
        updateUserProfile();
    }
    if (notifications.length > 0) {
        renderNotifications();
        renderNotificationDropdown();
    }
}

// Tab Navigation
function switchTab(tabName) {
    document.querySelectorAll('.page-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    const pageId = tabName === 'notifications' ? 'notificationsPage' : 
                   tabName === 'myTeam' ? 'myTeamPage' : 'findMatchPage';
    
    document.getElementById(pageId).classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    if (tabName === 'myTeam' && currentUser) {
        renderTeamInfo();
    }
}

// Modal Functions
function openModal(type) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const t = translations[lang];
    
    if (type === 'login') {
        modalTitle.textContent = t.login;
        modalBody.innerHTML = getLoginFormHTML();
        
        document.getElementById('loginForm').addEventListener('submit', handleLogin);
        document.getElementById('toggleToRegister').addEventListener('click', () => {
            openModal('register');
        });
        document.getElementById('forgotPasswordLink').addEventListener('click', handleForgotPassword);
    } else if (type === 'register') {
        modalTitle.textContent = t.register;
        modalBody.innerHTML = getRegisterFormHTML();
        
        const countrySelect = document.getElementById('modalCountry');
        countrySelect.addEventListener('change', () => updateModalProvinces());
        document.getElementById('logoUpload').addEventListener('change', handleLogoUpload);
        document.getElementById('registerForm').addEventListener('submit', handleRegister);
        
        document.getElementById('toggleToLogin').addEventListener('click', () => {
            openModal('login');
        });
    } else if (type === 'uploadResults') {
        modalTitle.textContent = t.uploadResults;
        modalBody.innerHTML = getUploadResultsFormHTML();
        document.getElementById('screenshotUpload').addEventListener('change', handleScreenshotUpload);
        document.getElementById('resultsForm').addEventListener('submit', handleUploadResults);
    } else if (type === 'editProfile') {
        modalTitle.textContent = lang === 'id' ? 'Edit Profil Tim' : 'Edit Team Profile';
        modalBody.innerHTML = getEditProfileFormHTML();
        
        const countrySelect = document.getElementById('editCountry');
        countrySelect.addEventListener('change', () => updateEditProvinces());
        document.getElementById('editLogoUpload').addEventListener('change', handleEditLogoUpload);
        document.getElementById('editProfileForm').addEventListener('submit', handleEditProfile);
        
        // Populate current data
        updateEditProvinces();
    }
    
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

window.addEventListener('click', (e) => {
    const modal = document.getElementById('modal');
    if (e.target === modal) closeModal();
});

// Login Form HTML
function getLoginFormHTML() {
    const t = translations[lang];
    
    return `
        <form id="loginForm" class="form-group" style="display: flex; flex-direction: column; gap: 1rem;">
            <div class="form-group">
                <label>${t.email}</label>
                <input type="email" id="loginEmail" required placeholder="nama@email.com">
            </div>
            
            <div class="form-group">
                <label>${t.password}</label>
                <input type="password" id="loginPassword" required placeholder="${t.password}">
            </div>
            
            <button type="submit" class="btn-submit">${t.login}</button>
            
            <div class="auth-form-toggle" style="border-top: none; padding-top: 0;">
                <a href="#" id="forgotPasswordLink" style="color: #fcd34d; font-size: 0.875rem; text-decoration: none;">${t.forgotPassword}</a>
            </div>
            
            <div class="auth-form-toggle">
                <p>${t.dontHaveAccount}</p>
                <button type="button" id="toggleToRegister">${t.registerNow}</button>
            </div>
        </form>
    `;
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    const t = translations[lang];
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = lang === 'id' ? 'Memproses...' : 'Processing...';
    submitBtn.disabled = true;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (response.ok && result.team) {
            currentUser = {
                id: result.team.id,
                teamName: result.team.teamName,
                logo: result.team.logo,
                country: result.team.country,
                province: result.team.province,
                status: result.team.status || 'available',
                captainName: result.team.captainName,
                whatsapp: result.team.whatsapp,
                email: result.team.email
            };
            
            isLoggedIn = true;
            teams = result.allTeams || [];
            
            saveSession();
            showLoggedInUI();
            updateUserProfile();
            
            closeModal();
            renderTeams();
            renderTeamInfo();
            switchTab('findMatch');
            
            alert(`${t.welcome} ${currentUser.teamName}!`);
            
        } else {
            alert(result.message || t.invalidCredentials);
        }
    } catch (error) {
        console.error('Login Error:', error);
        alert(lang === 'id' ? 'Gagal terhubung ke server' : 'Failed to connect to server');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Register Form HTML
function getRegisterFormHTML() {
    const t = translations[lang];
    
    return `
        <form id="registerForm" class="form-group" style="display: flex; flex-direction: column; gap: 1rem;">
            <div class="form-group">
                <label>${t.teamLogo}</label>
                <input type="file" id="logoUpload" accept="image/*">
                <img id="logoPreview" class="logo-preview" style="display: none;">
            </div>
            
            <div class="form-group">
                <label>${t.teamName}</label>
                <input type="text" id="teamName" required>
            </div>
            
            <div class="form-group">
                <label>${t.captainName}</label>
                <input type="text" id="captainName" required>
            </div>
            
            <div class="form-group">
                <label>${t.country}</label>
                <select id="modalCountry" required>
                    <option value="">${t.selectCountry}</option>
                    <option value="Indonesia">${t.indonesia}</option>
                    <option value="Malaysia">${t.malaysia}</option>
                    <option value="Philippines">${t.philippines}</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>${t.province}</label>
                <select id="modalProvince" required>
                    <option value="">${t.selectProvince}</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>${t.whatsapp}</label>
                <div class="phone-input-group">
                    <span class="phone-prefix" id="phonePrefix">+62</span>
                    <input type="tel" id="whatsapp" placeholder="8123456789" required>
                </div>
                <div class="hint-text" id="phoneHint">Contoh: 8123456789 (tanpa +62)</div>
            </div>
            
            <div class="form-group">
                <label>${t.email}</label>
                <input type="email" id="email" required placeholder="nama@email.com">
            </div>
            
            <div class="form-group">
                <label>${t.password}</label>
                <input type="password" id="password" required placeholder="Minimal 6 karakter">
            </div>
            
            <div class="form-group">
                <label>${t.confirmPassword}</label>
                <input type="password" id="confirmPassword" required placeholder="Ulangi kata sandi">
            </div>
            
            <button type="submit" class="btn-submit">${t.submit}</button>
            
            <div class="auth-form-toggle">
                <p>${t.alreadyHaveAccount}</p>
                <button type="button" id="toggleToLogin">${t.loginNow}</button>
            </div>
        </form>
    `;
}

// Update Modal Provinces
function updateModalProvinces() {
    const country = document.getElementById('modalCountry').value;
    const provinceSelect = document.getElementById('modalProvince');
    const phonePrefixEl = document.getElementById('phonePrefix');
    const phoneHint = document.getElementById('phoneHint');
    const whatsappInput = document.getElementById('whatsapp');
    const t = translations[lang];
    
    provinceSelect.innerHTML = `<option value="">${t.selectProvince}</option>`;
    provinceSelect.disabled = !country;
    
    if (country && regions[country]) {
        regions[country].forEach(province => {
            const option = document.createElement('option');
            option.value = province;
            option.textContent = province;
            provinceSelect.appendChild(option);
        });
    }
    
    if (country && phonePatterns[country]) {
        const pattern = phonePatterns[country];
        phonePrefixEl.textContent = pattern.prefix;
        whatsappInput.placeholder = pattern.placeholder;
        phoneHint.textContent = `Contoh: ${pattern.example}`;
        whatsappInput.pattern = pattern.pattern.source;
    }
}

// Handle Logo Upload
let logoBase64Data = null;

function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (file && file.size <= 10 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onloadend = () => {
            logoBase64Data = reader.result;
            document.getElementById('logoPreview').src = reader.result;
            document.getElementById('logoPreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        alert(lang === 'id' ? 'Ukuran file maksimal 10MB' : 'Maximum file size is 10MB');
        logoBase64Data = null;
    }
}

// Handle Register
async function handleRegister(e) {
    e.preventDefault();
    const t = translations[lang];
    
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password.length < 6) {
        alert(t.passwordTooShort);
        return;
    }
    if (password !== confirmPassword) {
        alert(t.passwordMismatch);
        return;
    }
    
    const country = document.getElementById('modalCountry').value;
    const whatsapp = document.getElementById('whatsapp').value;
    
    if (!country || !phonePatterns[country]) {
        alert(lang === 'id' ? 'Pilih negara terlebih dahulu' : 'Please select a country');
        return;
    }
    
    const pattern = phonePatterns[country];
    if (!pattern.pattern.test(whatsapp)) {
        alert(lang === 'id' 
            ? `Format WhatsApp tidak valid untuk ${country}. Contoh: ${pattern.example}`
            : `Invalid WhatsApp format for ${country}. Example: ${pattern.example}`
        );
        return;
    }
    
    const fullWhatsapp = pattern.prefix + whatsapp;
    const email = document.getElementById('email').value;
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = lang === 'id' ? 'Mendaftar...' : 'Registering...';
    submitBtn.disabled = true;
    
    const registrationData = {
        teamName: document.getElementById('teamName').value,
        captainName: document.getElementById('captainName').value,
        whatsapp: fullWhatsapp,
        email: email,
        password: password,
        country: country,
        province: document.getElementById('modalProvince').value,
        logoBase64: logoBase64Data,
        status: 'available',
    };
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registrationData),
        });

        const result = await response.json();

        if (response.ok && result.team) {
            alert(t.registerSuccess + ' ' + (lang === 'id' ? 'Silakan login' : 'Please login'));
            openModal('login');
        } else {
            if (result.code === 'emailAlreadyExists') {
                alert(t.emailAlreadyExists);
            } else {
                alert(result.message || (lang === 'id' ? 'Pendaftaran gagal.' : 'Registration failed.'));
            }
        }
    } catch (error) {
        console.error('Registration Error:', error);
        alert(lang === 'id' ? 'Gagal terhubung ke server' : 'Failed to connect to server');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Edit Profile Form HTML
function getEditProfileFormHTML() {
    const t = translations[lang];
    
    return `
        <form id="editProfileForm" class="form-group" style="display: flex; flex-direction: column; gap: 1rem;">
            <div class="form-group">
                <label>${t.teamLogo}</label>
                <input type="file" id="editLogoUpload" accept="image/*">
                <img id="editLogoPreview" class="logo-preview" src="${currentUser.logo || ''}" style="${currentUser.logo ? 'display: block;' : 'display: none;'}">
            </div>
            
            <div class="form-group">
                <label>${t.teamName}</label>
                <input type="text" id="editTeamName" value="${currentUser.teamName || ''}" required>
            </div>
            
            <div class="form-group">
                <label>${t.captainName}</label>
                <input type="text" id="editCaptainName" value="${currentUser.captainName || ''}" required>
            </div>
            
            <div class="form-group">
                <label>${t.country}</label>
                <select id="editCountry" required>
                    <option value="">${t.selectCountry}</option>
                    <option value="Indonesia" ${currentUser.country === 'Indonesia' ? 'selected' : ''}>${t.indonesia}</option>
                    <option value="Malaysia" ${currentUser.country === 'Malaysia' ? 'selected' : ''}>${t.malaysia}</option>
                    <option value="Philippines" ${currentUser.country === 'Philippines' ? 'selected' : ''}>${t.philippines}</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>${t.province}</label>
                <select id="editProvince" required>
                    <option value="">${t.selectProvince}</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>${t.whatsapp}</label>
                <div class="phone-input-group">
                    <span class="phone-prefix" id="editPhonePrefix">+62</span>
                    <input type="tel" id="editWhatsapp" value="${currentUser.whatsapp ? currentUser.whatsapp.replace(/^\+\d+/, '') : ''}" placeholder="8123456789" required>
                </div>
                <div class="hint-text" id="editPhoneHint">Contoh: 8123456789 (tanpa +62)</div>
            </div>
            
            <button type="submit" class="btn-submit">${lang === 'id' ? 'Simpan Perubahan' : 'Save Changes'}</button>
        </form>
    `;
}

// Update Edit Provinces
function updateEditProvinces() {
    const country = document.getElementById('editCountry').value;
    const provinceSelect = document.getElementById('editProvince');
    const phonePrefixEl = document.getElementById('editPhonePrefix');
    const phoneHint = document.getElementById('editPhoneHint');
    const whatsappInput = document.getElementById('editWhatsapp');
    const t = translations[lang];
    
    provinceSelect.innerHTML = `<option value="">${t.selectProvince}</option>`;
    provinceSelect.disabled = !country;
    
    if (country && regions[country]) {
        regions[country].forEach(province => {
            const option = document.createElement('option');
            option.value = province;
            option.textContent = province;
            if (province === currentUser.province) {
                option.selected = true;
            }
            provinceSelect.appendChild(option);
        });
    }
    
    if (country && phonePatterns[country]) {
        const pattern = phonePatterns[country];
        phonePrefixEl.textContent = pattern.prefix;
        whatsappInput.placeholder = pattern.placeholder;
        phoneHint.textContent = `Contoh: ${pattern.example}`;
        whatsappInput.pattern = pattern.pattern.source;
    }
}

// Handle Edit Logo Upload
let editLogoBase64Data = null;

function handleEditLogoUpload(e) {
    const file = e.target.files[0];
    if (file && file.size <= 10 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onloadend = () => {
            editLogoBase64Data = reader.result;
            document.getElementById('editLogoPreview').src = reader.result;
            document.getElementById('editLogoPreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        alert(lang === 'id' ? 'Ukuran file maksimal 10MB' : 'Maximum file size is 10MB');
        editLogoBase64Data = null;
    }
}

// Handle Edit Profile
function handleEditProfile(e) {
    e.preventDefault();
    const t = translations[lang];
    
    const country = document.getElementById('editCountry').value;
    const whatsapp = document.getElementById('editWhatsapp').value;
    
    if (!country || !phonePatterns[country]) {
        alert(lang === 'id' ? 'Pilih negara terlebih dahulu' : 'Please select a country');
        return;
    }
    
    const pattern = phonePatterns[country];
    if (!pattern.pattern.test(whatsapp)) {
        alert(lang === 'id' 
            ? `Format WhatsApp tidak valid untuk ${country}. Contoh: ${pattern.example}`
            : `Invalid WhatsApp format for ${country}. Example: ${pattern.example}`
        );
        return;
    }
    
    const fullWhatsapp = pattern.prefix + whatsapp;
    
    // Update currentUser
    currentUser.teamName = document.getElementById('editTeamName').value;
    currentUser.captainName = document.getElementById('editCaptainName').value;
    currentUser.country = country;
    currentUser.province = document.getElementById('editProvince').value;
    currentUser.whatsapp = fullWhatsapp;
    
    if (editLogoBase64Data) {
        currentUser.logo = editLogoBase64Data;
    }
    
    // Update in teams array
    const teamIndex = teams.findIndex(t => t.id === currentUser.id);
    if (teamIndex !== -1) {
        teams[teamIndex] = {...teams[teamIndex], ...currentUser};
    }
    
    saveSession();
    updateUserProfile();
    renderTeamInfo();
    renderTeams();
    
    closeModal();
    alert(lang === 'id' ? 'Profil berhasil diperbarui!' : 'Profile updated successfully!');
}

// Logout
function logout() {
    const confirmLogout = confirm(lang === 'id' ? 'Yakin ingin keluar?' : 'Are you sure you want to logout?');
    
    if (!confirmLogout) return;
    
    isLoggedIn = false;
    currentUser = null;
    teams = [];
    notifications = [];
    expandedTeam = null;
    
    clearSession();
    
    document.getElementById('heroSection').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('registerBtnHero').style.display = 'block';
    document.getElementById('loginBtn').style.display = 'block';
    document.querySelector('.notification-wrapper').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'none';
    document.getElementById('notifBadge').style.display = 'none';
    document.getElementById('userProfile').style.display = 'none';
}

// Update Provinces Filter
function updateProvinces() {
    const country = document.getElementById('countryFilter').value;
    const provinceSelect = document.getElementById('provinceFilter');
    const t = translations[lang];
    
    provinceSelect.innerHTML = `<option value="">${t.selectProvince}</option>`;
    provinceSelect.disabled = !country;
    
    if (country && regions[country]) {
        regions[country].forEach(province => {
            const option = document.createElement('option');
            option.value = province;
            option.textContent = province;
            provinceSelect.appendChild(option);
        });
    }
}

// Get Team Scrim Stats
function getTeamScrimStats(teamId) {
    const teamResults = scrimResults.filter(r => r.teamId === teamId);
    const wins = teamResults.filter(r => r.yourScore > r.opponentScore).length;
    const losses = teamResults.filter(r => r.yourScore < r.opponentScore).length;
    const draws = teamResults.filter(r => r.yourScore === r.opponentScore).length;
    
    return {
        total: teamResults.length,
        wins,
        losses,
        draws,
        results: teamResults
    };
}

// Render Teams
function renderTeams() {
    const t = translations[lang];
    const country = document.getElementById('countryFilter').value;
    const province = document.getElementById('provinceFilter').value;
    
    let filteredTeams = teams.filter(team => {
        if (team.id === currentUser?.id) return false;
        if (country && team.country !== country) return false;
        if (province && team.province !== province) return false;
        return true;
    });
    
    const grouped = {};
    filteredTeams.forEach(team => {
        if (!grouped[team.country]) grouped[team.country] = [];
        grouped[team.country].push(team);
    });
    
    const teamsList = document.getElementById('teamsList');
    
    if (Object.keys(grouped).length === 0) {
        teamsList.innerHTML = `<div class="empty-state">${t.noTeams}</div>`;
        return;
    }
    
    let html = '';
    Object.keys(grouped).sort().forEach(countryName => {
        const countryDisplay = countryName === 'Indonesia' ? t.indonesia : 
                              countryName === 'Malaysia' ? t.malaysia : t.philippines;
        
        html += `
            <div class="teams-group">
                <div class="teams-group-header">
                    <i class="fas fa-map-pin"></i>
                    <h2>${t.teamsFrom} ${countryDisplay}</h2>
                </div>
                <div class="teams-group-list">
                    ${grouped[countryName].map(team => renderTeamCard(team)).join('')}
                </div>
            </div>
        `;
    });
    
    teamsList.innerHTML = html;
    
    document.querySelectorAll('.team-header').forEach(header => {
        header.addEventListener('click', (e) => {
            const teamCard = e.currentTarget.closest('.team-card');
            const teamId = parseInt(teamCard.dataset.teamId);
            toggleTeamDetails(teamId);
        });
    });
    
    document.querySelectorAll('.btn-send-offer').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const teamId = parseInt(e.target.closest('.team-card').dataset.teamId);
            const team = teams.find(t => t.id === teamId);
            handleSendOffer(team);
        });
    });
}

// Render Team Card
function renderTeamCard(team) {
    const t = translations[lang];
    const isExpanded = expandedTeam === team.id;
    const statusClass = `status-${team.status}`;
    const stats = getTeamScrimStats(team.id);
    
    return `
        <div class="team-card" data-team-id="${team.id}">
            <div class="team-header">
                <div class="team-header-left">
                    ${team.logo ? `<img src="${team.logo}" class="team-logo" alt="${team.teamName}">` : '<div class="team-logo" style="background: #374151;"></div>'}
                    <div class="team-header-info">
                        <div class="team-name">${team.teamName}</div>
                        <div class="team-province">${team.province}</div>
                        ${stats.total > 0 ? `<div class="team-stats">${lang === 'id' ? 'Pertandingan' : 'Matches'}: ${stats.total} | ${lang === 'id' ? 'M' : 'W'}: ${stats.wins} ${lang === 'id' ? 'K' : 'L'}: ${stats.losses}</div>` : ''}
                    </div>
                </div>
                <div class="team-header-right">
                    <span class="status-badge ${statusClass}">${getStatusText(team.status)}</span>
                    <i class="fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}"></i>
                </div>
            </div>
            
            ${isExpanded ? `
                <div class="team-details active">
                    <div class="team-details-grid">
                        <div class="detail-field">
                            <span class="detail-label">${t.captainName}</span>
                            <span class="detail-value">${team.captainName}</span>
                        </div>
                        <div class="detail-field">
                            <span class="detail-label">${t.country}</span>
                            <span class="detail-value">${team.country}</span>
                        </div>
                        <div class="detail-field">
                            <span class="detail-label"><i class="fas fa-phone"></i> ${t.whatsapp}</span>
                            <span class="detail-value">${team.whatsapp}</span>
                        </div>
                        <div class="detail-field">
                            <span class="detail-label"><i class="fas fa-envelope"></i> ${t.email}</span>
                            <span class="detail-value">${team.email}</span>
                        </div>
                    </div>
                    ${stats.total > 0 ? `
                        <div class="scrim-history">
                            <h4>${lang === 'id' ? 'Riwayat Scrim' : 'Scrim History'}</h4>
                            <div class="scrim-history-list">
                                ${stats.results.slice(0, 3).map(r => `
                                    <div class="scrim-result-item">
                                        <span>${r.opponent}</span>
                                        <span class="scrim-score ${r.yourScore > r.opponentScore ? 'win' : r.yourScore < r.opponentScore ? 'loss' : 'draw'}">${r.yourScore} - ${r.opponentScore}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    <button class="btn-send-offer" ${team.status === 'inMatch' ? 'disabled' : ''}>${t.sendOffer}</button>
                </div>
            ` : ''}
        </div>
    `;
}

// Toggle Team Details
function toggleTeamDetails(teamId) {
    expandedTeam = expandedTeam === teamId ? null : teamId;
    renderTeams();
}

// Get Status Text
function getStatusText(status) {
    const t = translations[lang];
    switch(status) {
        case 'available': return t.available;
        case 'searching': return t.searching;
        case 'inMatch': return t.inMatch;
        default: return status;
    }
}

// Handle Search Match
function handleSearchMatch() {
    const t = translations[lang];
    if (!currentUser) return;
    
    if (currentUser.status === 'searching') {
        currentUser.status = 'available';
        document.getElementById('searchBtn').innerHTML = `<i class="fas fa-search"></i><span>${t.searchingMatch}</span>`;
        document.getElementById('searchingIndicator').style.display = 'none';
    } else {
        currentUser.status = 'searching';
        document.getElementById('searchBtn').innerHTML = `<i class="fas fa-times"></i><span>${t.cancelSearch}</span>`;
        document.getElementById('searchingIndicator').style.display = 'flex';
        
        setTimeout(() => {
            const title = lang === 'id' ? 'Tim Tertarik' : 'Team Interested';
            const message = lang === 'id' ? 'Ada tim yang tertarik untuk scrim dengan Anda!' : 'A team is interested in scrimming with you!';
            
            addNotification(title, message, currentUser.whatsapp, currentUser.email);
            
            alert(lang === 'id' 
                ? `Notifikasi dikirim ke WhatsApp (${currentUser.whatsapp}) dan Email (${currentUser.email})`
                : `Notification sent to WhatsApp (${currentUser.whatsapp}) and Email (${currentUser.email})`
            );
        }, 3000);
    }
    
    saveSession();
    updateUserProfile();
    renderTeamInfo();
}

// Handle Send Offer - WITH AUTO WHATSAPP & EMAIL
function handleSendOffer(team) {
    const t = translations[lang];
    
    const title = lang === 'id' ? 'Tawaran Scrim' : 'Scrim Offer';
    const message = lang === 'id' 
        ? `${currentUser.teamName} mengirim tawaran scrim!`
        : `${currentUser.teamName} sent you a scrim offer!`;
    
    addNotification(title, message, team.whatsapp, team.email);
    
    // WhatsApp Message
    const waMessage = lang === 'id'
        ? `Halo ${team.teamName}! 👋\n\nSaya dari tim *${currentUser.teamName}* ingin mengajukan scrim dengan tim Anda.\n\n📋 Detail Tim Kami:\n- Kapten: ${currentUser.captainName}\n- Negara: ${currentUser.country}\n- Provinsi: ${currentUser.province}\n\n📞 Kontak:\n- WhatsApp: ${currentUser.whatsapp}\n- Email: ${currentUser.email}\n\nMohon konfirmasinya. Terima kasih! 🙏`
        : `Hello ${team.teamName}! 👋\n\nI'm from team *${currentUser.teamName}* and would like to propose a scrim with your team.\n\n📋 Our Team Details:\n- Captain: ${currentUser.captainName}\n- Country: ${currentUser.country}\n- Province: ${currentUser.province}\n\n📞 Contact:\n- WhatsApp: ${currentUser.whatsapp}\n- Email: ${currentUser.email}\n\nPlease confirm. Thank you! 🙏`;
    
    const waUrl = `https://wa.me/${team.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(waMessage)}`;
    
    // Email Message
    const emailSubject = lang === 'id' ? 'Tawaran Scrim dari ' + currentUser.teamName : 'Scrim Offer from ' + currentUser.teamName;
    const emailBody = lang === 'id'
        ? `Halo ${team.teamName}!\n\nSaya dari tim ${currentUser.teamName} ingin mengajukan scrim dengan tim Anda.\n\nDetail Tim Kami:\n- Kapten: ${currentUser.captainName}\n- Negara: ${currentUser.country}\n- Provinsi: ${currentUser.province}\n\nKontak:\n- WhatsApp: ${currentUser.whatsapp}\n- Email: ${currentUser.email}\n\nMohon konfirmasinya. Terima kasih!`
        : `Hello ${team.teamName}!\n\nI'm from team ${currentUser.teamName} and would like to propose a scrim with your team.\n\nOur Team Details:\n- Captain: ${currentUser.captainName}\n- Country: ${currentUser.country}\n- Province: ${currentUser.province}\n\nContact:\n- WhatsApp: ${currentUser.whatsapp}\n- Email: ${currentUser.email}\n\nPlease confirm. Thank you!`;
    
    const mailtoUrl = `mailto:${team.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    
    // Show options
    const choice = confirm(lang === 'id'
        ? `Tawaran akan dikirim ke ${team.teamName}!\n\nKlik OK untuk kirim via WhatsApp\nKlik Cancel untuk kirim via Email`
        : `Offer will be sent to ${team.teamName}!\n\nClick OK to send via WhatsApp\nClick Cancel to send via Email`
    );
    
    if (choice) {
        window.open(waUrl, '_blank');
    } else {
        window.open(mailtoUrl, '_blank');
    }
}

// Render Team Info - FIXED
function renderTeamInfo() {
    if (!currentUser) return;
    
    const t = translations[lang];
    const content = document.getElementById('teamInfoContent');
    
    if (!content) return;
    
    const logoSrc = currentUser.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.teamName)}&background=eab308&color=1f2937&size=256`;
    const stats = getTeamScrimStats(currentUser.id);
    
    content.innerHTML = `
        <div class="team-info-section">
            <img src="${logoSrc}" class="team-logo-large" alt="${currentUser.teamName}">
            <button class="btn-edit-profile" onclick="openModal('editProfile')">
                <i class="fas fa-edit"></i>
                <span>${lang === 'id' ? 'Edit Profil' : 'Edit Profile'}</span>
            </button>
        </div>
        <div class="team-info-section">
            <div class="info-section">
                <div class="info-item">
                    <span class="info-label">${t.teamName}</span>
                    <span class="info-value">${currentUser.teamName || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">${t.captainName}</span>
                    <span class="info-value">${currentUser.captainName || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">${t.whatsapp}</span>
                    <span class="info-value">${currentUser.whatsapp || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">${t.email}</span>
                    <span class="info-value">${currentUser.email || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">${t.country}</span>
                    <span class="info-value">${currentUser.country || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">${t.province}</span>
                    <span class="info-value">${currentUser.province || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">${t.status}</span>
                    <span class="info-value" style="color: ${currentUser.status === 'available' ? '#4ade80' : currentUser.status === 'searching' ? '#facc15' : '#f87171'}">${getStatusText(currentUser.status || 'available')}</span>
                </div>
            </div>
            
            ${stats.total > 0 ? `
                <div class="info-section" style="margin-top: 1.5rem;">
                    <h3 style="color: #fcd34d; margin-bottom: 1rem;">${lang === 'id' ? 'Statistik Scrim' : 'Scrim Statistics'}</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-value">${stats.total}</div>
                            <div class="stat-label">${lang === 'id' ? 'Total' : 'Total'}</div>
                        </div>
                        <div class="stat-item win">
                            <div class="stat-value">${stats.wins}</div>
                            <div class="stat-label">${lang === 'id' ? 'Menang' : 'Wins'}</div>
                        </div>
                        <div class="stat-item loss">
                            <div class="stat-value">${stats.losses}</div>
                            <div class="stat-label">${lang === 'id' ? 'Kalah' : 'Losses'}</div>
                        </div>
                        <div class="stat-item draw">
                            <div class="stat-value">${stats.draws}</div>
                            <div class="stat-label">${lang === 'id' ? 'Seri' : 'Draws'}</div>
                        </div>
                    </div>
                    
                    <h4 style="color: #93c5fd; margin: 1rem 0 0.5rem 0;">${lang === 'id' ? 'Riwayat Terakhir' : 'Recent History'}</h4>
                    <div class="scrim-history-list">
                        ${stats.results.slice(0, 5).map(r => `
                            <div class="scrim-result-item-full">
                                <div class="scrim-result-header">
                                    <span class="scrim-opponent">${r.opponent}</span>
                                    <span class="scrim-date">${new Date(r.timestamp).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US')}</span>
                                </div>
                                <div class="scrim-result-score ${r.yourScore > r.opponentScore ? 'win' : r.yourScore < r.opponentScore ? 'loss' : 'draw'}">
                                    ${r.yourScore} - ${r.opponentScore}
                                    ${r.screenshot ? `<button class="btn-view-screenshot" onclick="viewScreenshot('${r.screenshot}')"><i class="fas fa-image"></i></button>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

// View Screenshot
function viewScreenshot(screenshot) {
    const modal = document.createElement('div');
    modal.className = 'screenshot-modal';
    modal.innerHTML = `
        <div class="screenshot-modal-content">
            <button class="btn-close-screenshot" onclick="this.closest('.screenshot-modal').remove()">
                <i class="fas fa-times"></i>
            </button>
            <img src="${screenshot}" alt="Screenshot">
        </div>
    `;
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Upload Results Form HTML
function getUploadResultsFormHTML() {
    const t = translations[lang];
    
    return `
        <form id="resultsForm" class="form-group" style="display: flex; flex-direction: column; gap: 1rem;">
            <div class="form-group">
                <label>${t.opponent}</label>
                <input type="text" id="opponentName" required placeholder="${lang === 'id' ? 'Nama tim lawan' : 'Opponent team name'}">
            </div>
            
            <div class="form-group-row">
                <div class="form-group">
                    <label>${t.yourScore}</label>
                    <input type="number" id="yourScore" min="0" required>
                </div>
                <div class="form-group">
                    <label>${t.opponentScore}</label>
                    <input type="number" id="opponentScore" min="0" required>
                </div>
            </div>
            
            <div class="form-group">
                <label>${t.uploadScreenshot}</label>
                <input type="file" id="screenshotUpload" accept="image/*" required>
                <img id="screenshotPreview" style="max-width: 100%; max-height: 256px; margin-top: 0.5rem; border-radius: 0.5rem; display: none;">
            </div>
            
            <button type="submit" class="btn-submit">${t.submit}</button>
        </form>
    `;
}

// Handle Screenshot Upload
let screenshotPreviewData = null;
function handleScreenshotUpload(e) {
    const file = e.target.files[0];
    if (file && file.size <= 10 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onloadend = () => {
            screenshotPreviewData = reader.result;
            document.getElementById('screenshotPreview').src = reader.result;
            document.getElementById('screenshotPreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        alert(lang === 'id' ? 'Ukuran file maksimal 10MB' : 'Maximum file size is 10MB');
    }
}

// Handle Upload Results
function handleUploadResults(e) {
    e.preventDefault();
    const t = translations[lang];
    
    const opponent = document.getElementById('opponentName').value;
    const yourScore = parseInt(document.getElementById('yourScore').value);
    const opponentScore = parseInt(document.getElementById('opponentScore').value);
    
    if (!screenshotPreviewData) {
        alert(lang === 'id' ? 'Screenshot wajib diupload!' : 'Screenshot is required!');
        return;
    }
    
    // Add to scrim results
    const result = {
        id: Date.now(),
        teamId: currentUser.id,
        teamName: currentUser.teamName,
        opponent: opponent,
        yourScore: yourScore,
        opponentScore: opponentScore,
        screenshot: screenshotPreviewData,
        timestamp: new Date().toISOString()
    };
    
    scrimResults.unshift(result);
    saveScrimResults();
    
    alert(lang === 'id' 
        ? `Hasil pertandingan berhasil diupload!\nLawan: ${opponent}\nSkor: ${yourScore} - ${opponentScore}`
        : `Match result uploaded successfully!\nOpponent: ${opponent}\nScore: ${yourScore} - ${opponentScore}`
    );
    
    closeModal();
    screenshotPreviewData = null;
    
    // Refresh display
    renderTeamInfo();
    renderTeams();
}

// Render Notifications (for notifications page)
function renderNotifications() {
    const notifsList = document.getElementById('notificationsList');
    
    if (notifications.length === 0) {
        notifsList.innerHTML = `<div class="empty-state">${lang === 'id' ? 'Tidak ada notifikasi' : 'No notifications'}</div>`;
        return;
    }
    
    notifsList.innerHTML = notifications.map(notif => `
        <div class="notification-item">
            <div class="notification-message">${notif.message}</div>
            <div class="notification-time">${notif.timestamp}</div>
            <div class="notification-contact">WhatsApp: ${notif.whatsapp} | Email: ${notif.email}</div>
        </div>
    `).join('');
}

// Handle Forgot Password
function handleForgotPassword(e) {
    e.preventDefault();
    const t = translations[lang];
    
    const message = lang === 'id' 
        ? "Fitur reset kata sandi otomatis tidak tersedia. Silakan hubungi admin kami melalui WhatsApp: +6281220792589"
        : "Automatic password reset is unavailable. Please contact our admin via WhatsApp: +6281220792589";
        
    const confirm = window.confirm(message + '\n\n' + (lang === 'id' ? 'Hubungi sekarang?' : 'Contact now?'));
    
    if (confirm) {
        window.open('https://wa.me/6281220792589?text=Halo,%20saya%20lupa%20password%20akun%20saya', '_blank');
    }
}