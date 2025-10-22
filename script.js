// Global Variables
let lang = 'id';
let isLoggedIn = false;
let currentUser = null;
let teams = [];
let notifications = [];
let expandedTeam = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    updateLanguage();
    
    // Check if user is logged in (using session/cookie in production)
    // For now, teams will be loaded after login
});

// Event Listeners
function setupEventListeners() {
    document.getElementById('langBtn').addEventListener('click', toggleLanguage);
    document.getElementById('notifBtn').addEventListener('click', () => switchTab('notifications'));
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

// Language Toggle
function toggleLanguage() {
    lang = lang === 'id' ? 'en' : 'id';
    updateLanguage();
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
    
    updateProvinces();
    renderTeams();
    if (currentUser) renderTeamInfo();
    if (notifications.length > 0) renderNotifications();
}

// Tab Navigation
function switchTab(tabName) {
    document.querySelectorAll('.page-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    const t = translations[lang];
    const pageId = tabName === 'notifications' ? 'notificationsPage' : 
                   tabName === 'myTeam' ? 'myTeamPage' : 'findMatchPage';
    
    document.getElementById(pageId).classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
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
        const provinceSelect = document.getElementById('modalProvince');
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

// Handle Login - FIXED VERSION
async function handleLogin(e) {
    e.preventDefault();
    const t = translations[lang];
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Show loading state
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
            // Set logged in user
            currentUser = result.team;
            isLoggedIn = true;
            
            // Set teams list from API response
            teams = result.allTeams || [];
            
            // Update UI
            document.getElementById('heroSection').style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';
            document.getElementById('registerBtnHero').style.display = 'none';
            document.getElementById('loginBtn').style.display = 'none';
            document.getElementById('notifBtn').style.display = 'block';
            document.getElementById('logoutBtn').style.display = 'block';
            
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
    
    // Update phone input
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

// Handle Register - FIXED VERSION
async function handleRegister(e) {
    e.preventDefault();
    const t = translations[lang];
    
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validations
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
    
    // Show loading state
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
        alert(lang === 'id' ? 'Gagal terhubung ke server. Periksa koneksi Anda.' : 'Failed to connect to server. Check your connection.');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Logout
function logout() {
    isLoggedIn = false;
    currentUser = null;
    teams = [];
    notifications = [];
    expandedTeam = null;
    
    document.getElementById('heroSection').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('registerBtnHero').style.display = 'block';
    document.getElementById('loginBtn').style.display = 'block';
    document.getElementById('notifBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'none';
    document.getElementById('notifBadge').style.display = 'none';
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
    
    // Group by country
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
    
    // Add event listeners
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
    
    return `
        <div class="team-card" data-team-id="${team.id}">
            <div class="team-header">
                <div class="team-header-left">
                    ${team.logo ? `<img src="${team.logo}" class="team-logo">` : '<div class="team-logo" style="background: #374151;"></div>'}
                    <div class="team-header-info">
                        <div class="team-name">${team.teamName}</div>
                        <div class="team-province">${team.province}</div>
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
            const notification = {
                id: Date.now(),
                message: lang === 'id' ? 'Ada tim yang tertarik untuk scrim dengan Anda!' : 'A team is interested in scrimming with you!',
                whatsapp: currentUser.whatsapp,
                email: currentUser.email,
                timestamp: new Date().toLocaleString()
            };
            notifications.push(notification);
            updateNotificationBadge();
            alert(lang === 'id' 
                ? `Notifikasi dikirim ke WhatsApp (${currentUser.whatsapp}) dan Email (${currentUser.email})`
                : `Notification sent to WhatsApp (${currentUser.whatsapp}) and Email (${currentUser.email})`
            );
        }, 2000);
    }
    renderTeams();
}

// Handle Send Offer
function handleSendOffer(team) {
    const t = translations[lang];
    
    const notification = {
        id: Date.now(),
        message: lang === 'id' 
            ? `${currentUser.teamName} mengirim tawaran scrim!`
            : `${currentUser.teamName} sent you a scrim offer!`,
        whatsapp: team.whatsapp,
        email: team.email,
        timestamp: new Date().toLocaleString()
    };
    notifications.push(notification);
    updateNotificationBadge();
    
    alert(lang === 'id'
        ? `Tawaran dikirim ke ${team.teamName} via WhatsApp (${team.whatsapp}) dan Email (${team.email})`
        : `Offer sent to ${team.teamName} via WhatsApp (${team.whatsapp}) and Email (${team.email})`
    );
}

// Update Notification Badge
function updateNotificationBadge() {
    const badge = document.getElementById('notifBadge');
    const count = notifications.length;
    
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// Render Team Info
function renderTeamInfo() {
    if (!currentUser) return;
    
    const t = translations[lang];
    const content = document.getElementById('teamInfoContent');
    
    content.innerHTML = `
        <div>
            ${currentUser.logo ? `<img src="${currentUser.logo}" class="team-logo-large">` : ''}
            <div class="info-section">
                <div class="info-item">
                    <span class="info-label">${t.teamName}</span>
                    <span class="info-value">${currentUser.teamName}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">${t.captainName}</span>
                    <span class="info-value">${currentUser.captainName}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">${t.whatsapp}</span>
                    <span class="info-value">${currentUser.whatsapp}</span>
                </div>
            </div>
        </div>
        <div class="info-section">
            <div class="info-item">
                <span class="info-label">${t.email}</span>
                <span class="info-value">${currentUser.email}</span>
            </div>
            <div class="info-item">
                <span class="info-label">${t.country}</span>
                <span class="info-value">${currentUser.country}</span>
            </div>
            <div class="info-item">
                <span class="info-label">${t.province}</span>
                <span class="info-value">${currentUser.province}</span>
            </div>
            <div class="info-item">
                <span class="info-label">${t.status}</span>
                <span class="info-value" style="color: ${currentUser.status === 'available' ? '#4ade80' : currentUser.status === 'searching' ? '#facc15' : '#f87171'}">${getStatusText(currentUser.status)}</span>
            </div>
        </div>
    `;
}

// Upload Results Form HTML
function getUploadResultsFormHTML() {
    const t = translations[lang];
    
    return `
        <form id="resultsForm" class="form-group" style="display: flex; flex-direction: column; gap: 1rem;">
            <div class="form-group">
                <label>${t.opponent}</label>
                <input type="text" id="opponentName" required>
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
                <input type="file" id="screenshotUpload" accept="image/*">
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
    const yourScore = document.getElementById('yourScore').value;
    const opponentScore = document.getElementById('opponentScore').value;
    
    alert(lang === 'id' 
        ? `Hasil pertandingan berhasil diupload!\nLawan: ${opponent}\nSkor: ${yourScore} - ${opponentScore}`
        : `Match result uploaded successfully!\nOpponent: ${opponent}\nScore: ${yourScore} - ${opponentScore}`
    );
    
    closeModal();
    screenshotPreviewData = null;
}

// Render Notifications
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
        ? "Fitur reset kata sandi otomatis tidak tersedia. Silakan hubungi admin kami melalui email: support@hokscrim.com"
        : "Automatic password reset is unavailable. Please contact our admin via email: support@hokscrim.com";
        
    alert(message);
}