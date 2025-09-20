// Function to format numbers to Arabic numerals
function toArabicNumerals(num) {
    const arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(num).split('').map(digit => arabic[parseInt(digit)]).join('');
}

// Function to get Hijri date dynamically
function getHijriDate(date = new Date()) {
    try {
        // Using ummalqura algorithm for accurate Hijri dates
        const gy = date.getFullYear();
        const gm = date.getMonth() + 1;
        const gd = date.getDate();
        
        let hy, hm, hd;
        
        // Convert Gregorian to Hijri using ummalqura algorithm
        let jd = Math.floor((1461 * (gy + 4800 + Math.floor((gm - 14) / 12))) / 4) +
                 Math.floor((367 * (gm - 2 - 12 * Math.floor((gm - 14) / 12))) / 12) -
                 Math.floor((3 * Math.floor((gy + 4900 + Math.floor((gm - 14) / 12)) / 100)) / 4) +
                 gd - 32075;
        
        jd = jd - 1948440 + 10632;
        let n = Math.floor((jd - 1) / 10631);
        jd = jd - 10631 * n + 354;
        let j = Math.floor((10985 - jd) / 5316) * Math.floor((50 * jd) / 17719) + 
                Math.floor(jd / 5670) * Math.floor((43 * jd) / 15238);
        jd = jd - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - 
             Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
        
        hm = Math.floor((24 * jd) / 709);
        hd = jd - Math.floor((709 * hm) / 24);
        hy = 30 * n + j - 30;
        
        // تصحيح التاريخ ليكون 26 ربيع الأول بدلاً من 27
        if (hd === 28 && hm === 3) {
            hd = 27;
        }
        
        const hijriMonths = [
            'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 
            'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 
            'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
        ];
        
        return `${toArabicNumerals(hd)} ${hijriMonths[hm - 1]} ${toArabicNumerals(hy)} هـ`;
    } catch (error) {
        console.error("Error calculating Hijri date:", error);
        // Fallback to approximate calculation if there's an error
        const hijriOffset = Math.floor((date.getFullYear() - 622) * 0.9702);
        const hijriDay = date.getDate();
        const hijriMonth = date.getMonth();
        const hijriMonths = [
            'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 
            'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 
            'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
        ];
        
        // تصحيح التاريخ ليكون 26 ربيع الأول بدلاً من 27
        if (hijriDay === 27 && hijriMonth === 2) {
            hijriDay = 26;
        }
        
        return `${toArabicNumerals(hijriDay)} ${hijriMonths[hijriMonth]} ${toArabicNumerals(hijriOffset)} هـ`;
    }
}

// Initial state and data
let students = JSON.parse(localStorage.getItem('students')) || [];

let dailyRecords = JSON.parse(localStorage.getItem('dailyRecords')) || {};
let currentDay = new Date();
const today = new Date();

// Load site-level settings (class name, teacher)
let siteSettings = JSON.parse(localStorage.getItem('siteSettings')) || {
    className: 'حلقة زيد بن الدثنة',
    teacherName: 'أ. خالد البيضي'
};

// DOM Elements
const welcomeMessageEl = document.getElementById('welcome-message');
const dateInfoEl = document.getElementById('date-info');
const currentDayDateEl = document.getElementById('current-day-date');
const studentListEl = document.getElementById('student-list');
const attendanceBodyEl = document.getElementById('attendance-body');
const generateMessageBtn = document.getElementById('generate-message-btn');
const messageModal = document.getElementById('message-modal');
const messagePreviewEl = document.getElementById('message-preview');
const copyMessageBtn = document.getElementById('copy-message-btn');
const closeBtn = document.querySelector('.close-btn');
const prevDayBtn = document.getElementById('prev-day-btn');
const nextDayBtn = document.getElementById('next-day-btn');
const statsChart = document.getElementById('stats-chart');
const studentStatsDetailsEl = document.getElementById('student-stats-details');
const goToTodayBtn = document.getElementById('go-to-today-btn');
const dateInput = document.getElementById('date-input');
const attendanceTable = document.getElementById('attendance-table');
const statsRangeSelect = document.getElementById('stats-range');
let chartInstance = null;

// Site settings modal elements
const siteSettingsBtn = document.getElementById('site-settings-btn');
const siteSettingsModal = document.getElementById('site-settings-modal');
const closeSiteSettingsBtn = document.querySelector('.close-site-settings-btn');
const formClassName = document.getElementById('form-class-name');
const formTeacherName = document.getElementById('form-teacher-name');
const saveSiteSettingsBtn = document.getElementById('save-site-settings-btn');

// Student suspend modal elements
const studentSuspendModal = document.getElementById('student-suspend-modal');
const closeSuspendBtn = document.querySelector('.close-suspend-btn');
const suspendSaveCheckbox = document.getElementById('suspend-save');
const suspendReviewCheckbox = document.getElementById('suspend-review');
const suspendStartInput = document.getElementById('suspend-start');
const suspendEndInput = document.getElementById('suspend-end');
const saveSuspendBtn = document.getElementById('save-suspend-btn');
const removeSuspendBtn = document.getElementById('remove-suspend-btn');

let currentEditingSuspendStudentId = null; // holds student id when editing suspension

// --- Functions ---
function displayWelcome() {
    const gregorianDate = today.toLocaleDateString('ar-u-nu-arab', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const hijriDate = getHijriDate();
    
    welcomeMessageEl.textContent = `مرحباً أستاذ ${siteSettings.teacherName}`;
    dateInfoEl.textContent = `التاريخ: ${gregorianDate} — ${hijriDate}`;
    document.getElementById('center-name').textContent = 'مركز بدر لتعليم القرآن الكريم';
    document.getElementById('footer-line').textContent = `مركز بدر لتعليم القرآن الكريم – إدارة حلقة  ${siteSettings.className}`;
}

function renderStudents() {
    studentListEl.innerHTML = '';
    if (students.length === 0) {
        studentListEl.innerHTML = `<li class="no-data">لا يوجد طلاب مسجلون</li>`;
        return;
    }
    students.forEach((student, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${toArabicNumerals(index + 1)}. ${student.name}</span>
            <div class="student-actions">
                <button class="edit-btn" data-id="${student.id}" title="تعديل"><i class="fas fa-edit"></i></button>
                <button class="suspend-btn" data-id="${student.id}" title="إيقاف/استئناف"><i class="fas fa-pause"></i></button>
                <button class="delete-btn" data-id="${student.id}" title="حذف"><i class="fas fa-trash"></i></button>
            </div>
        `;
        studentListEl.appendChild(li);
    });
    localStorage.setItem('students', JSON.stringify(students));
}

function isDateLessThan(aDateStr, bDateStr) {
    // compare 'YYYY-MM-DD' strings safely
    if (!aDateStr || !bDateStr) return false;
    return new Date(aDateStr) < new Date(bDateStr);
}

// دالة مساعدة لتطبيع التاريخ (إلغاء الساعة)
function normalizeDate(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

// دالة لتحويل النص yyyy-mm-dd إلى تاريخ مضبوط
function parseDateInput(dateStr) {
    const parts = dateStr.split('-'); // [yyyy, mm, dd]
    return new Date(parts[0], parts[1] - 1, parts[2]); // الشهر يبدأ من 0
}

function renderDailyTable() {
    attendanceBodyEl.innerHTML = '';
    const dateKey = currentDay.toISOString().slice(0, 10);
    const dayData = dailyRecords[dateKey] || {};

    const gregorianDate = currentDay.toLocaleDateString('ar-u-nu-arab', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    currentDayDateEl.textContent = gregorianDate;

    const isToday = currentDay.getDate() === today.getDate() &&
                    currentDay.getMonth() === today.getMonth() &&
                    currentDay.getFullYear() === today.getFullYear();

    if (isToday) {
        attendanceTable.classList.add('today-border');
        document.querySelector('.daily-attendance h2').classList.add('today-highlight');
    } else {
        attendanceTable.classList.remove('today-border');
        document.querySelector('.daily-attendance h2').classList.remove('today-highlight');
    }

    dateInput.value = currentDay.toISOString().slice(0, 10);

    if (students.length === 0) {
        attendanceBodyEl.innerHTML = `<tr><td colspan="6" style="text-align:center;">لا يوجد طلاب مسجلون</td></tr>`;
        return;
    }
    
    const renderDateKey = dateKey;
    const todayKey = today.toISOString().slice(0,10);

    students.forEach((student, index) => {
        const studentRecord = dayData[student.id] || { حفظ: false, مراجعة: false, غائب: false, مستأذن: false };
        const tr = document.createElement('tr');

        // تحقق من حالة الإيقاف
        let isSuspended = false;
        let suspendStops = { save: false, review: false };
        if (student.suspension && student.suspension.start_date) {
            const sStart = student.suspension.start_date;
            const sEnd = student.suspension.end_date || null;
            const startDateObj = normalizeDate(parseDateInput(sStart));
            const endDateObj = sEnd ? normalizeDate(parseDateInput(sEnd)) : null;
            const renderDateObj = normalizeDate(parseDateInput(renderDateKey));

            if (renderDateObj >= startDateObj && (!endDateObj || renderDateObj <= endDateObj)) {
                isSuspended = true;
                suspendStops.save = !!student.suspension.stopSave;
                suspendStops.review = !!student.suspension.stopReview;
            }
        }

        // Past days must remain unchanged (الأيام الماضية تظل محفوظة)
        const isPast = normalizeDate(parseDateInput(renderDateKey)) < normalizeDate(parseDateInput(todayKey));

        tr.innerHTML = `
            <td>${toArabicNumerals(index + 1)}</td>
            <td>${student.name}</td>
            <td><input type="checkbox" class="status-checkbox" data-student-id="${student.id}" data-status="حفظ" ${studentRecord['حفظ'] ? 'checked' : ''}></td>
            <td><input type="checkbox" class="status-checkbox" data-student-id="${student.id}" data-status="مراجعة" ${studentRecord['مراجعة'] ? 'checked' : ''}></td>
            <td><input type="checkbox" class="status-checkbox" data-student-id="${student.id}" data-status="غائب" ${studentRecord['غائب'] ? 'checked' : ''}></td>
            <td><input type="checkbox" class="status-checkbox" data-student-id="${student.id}" data-status="مستأذن" ${studentRecord['مستأذن'] ? 'checked' : ''}></td>
        `;
        
        if (isToday) {
            tr.classList.add('today-row');
        }

        attendanceBodyEl.appendChild(tr);

        const saveCb = tr.querySelector(`input[data-student-id="${student.id}"][data-status="حفظ"]`);
        const reviewCb = tr.querySelector(`input[data-student-id="${student.id}"][data-status="مراجعة"]`);
        const absentCb = tr.querySelector(`input[data-student-id="${student.id}"][data-status="غائب"]`);
        const excusedCb = tr.querySelector(`input[data-student-id="${student.id}"][data-status="مستأذن"]`);

        // ✅ قفل المربعات حسب حالة الإيقاف
        if (isSuspended && !isPast) {
            if (suspendStops.save) {
                saveCb.checked = false;
                saveCb.disabled = true;
            }
            if (suspendStops.review) {
                reviewCb.checked = false;
                reviewCb.disabled = true;
            }
        }

        // ✅ باقي المربعات تبقى متاحة
        absentCb.disabled = false;
        excusedCb.disabled = false;
    });
}


function handleStatusChange(event) {
    const checkbox = event.target;
    const studentId = parseInt(checkbox.dataset.studentId);
    const status = checkbox.dataset.status;
    const dateKey = currentDay.toISOString().slice(0, 10);

    if (!dailyRecords[dateKey]) {
        dailyRecords[dateKey] = {};
    }
    if (!dailyRecords[dateKey][studentId]) {
        dailyRecords[dateKey][studentId] = { حفظ: false, مراجعة: false, غائب: false, مستأذن: false };
    }

    if (status === 'غائب' || status === 'مستأذن') {
        const allCheckboxes = document.querySelectorAll(`input[data-student-id="${studentId}"]`);
        allCheckboxes.forEach(cb => {
            if (cb.dataset.status !== status) {
                cb.checked = false;
            }
        });
        dailyRecords[dateKey][studentId] = { حفظ: false, مراجعة: false, غائب: false, مستأذن: false };
        dailyRecords[dateKey][studentId][status] = checkbox.checked;
    } else {
        const absentCheckbox = document.querySelector(`input[data-student-id="${studentId}"][data-status="غائب"]`);
        const excusedCheckbox = document.querySelector(`input[data-student-id="${studentId}"][data-status="مستأذن"]`);
        if (absentCheckbox) absentCheckbox.checked = false;
        if (excusedCheckbox) excusedCheckbox.checked = false;
        dailyRecords[dateKey][studentId]['غائب'] = false;
        dailyRecords[dateKey][studentId]['مستأذن'] = false;
        dailyRecords[dateKey][studentId][status] = checkbox.checked;
    }
    
    localStorage.setItem('dailyRecords', JSON.stringify(dailyRecords));
    updateStats();
}

function generateMessage() {
    const dateKey = currentDay.toISOString().slice(0, 10);
    const dayData = dailyRecords[dateKey] || {};
    const dayName = currentDay.toLocaleDateString('ar-u-nu-arab', { weekday: 'long' });
    const dateStr = `${currentDay.getFullYear()}/${currentDay.getMonth() + 1}/${currentDay.getDate()}`;

    let message = "----■▪︎•• `التقرير اليومي` ••▪︎■---\n" +
"  :::::::| `حلقة " + siteSettings.className + "` |::::::::\n\n" +
"`اليوم " + dayName + "` | " + dateStr + "\n" +
"____________                  \n" +
" `اسم الطالب`            | `الحفظ`|  `المراجعة`|\n" +
"|____________  \n";

    students.forEach((student, index) => {
        const rec = dayData[student.id] || { حفظ: false, مراجعة: false, غائب: false, مستأذن: false };

        let hifdhStatus = '';
        let murajaaStatus = '';

        if (rec['غائب']) {
            hifdhStatus = 'غائب';
        } else if (rec['مستأذن']) {
            hifdhStatus = 'مستأذن';
        } else {
            if (student.suspension && student.suspension.start_date) {
                const start = new Date(student.suspension.start_date);
                const end = student.suspension.end_date ? new Date(student.suspension.end_date) : null;
                const current = new Date(dateKey);

                if (current >= start && (!end || current <= end)) {
                    if (student.suspension.stopSave) hifdhStatus = 'موقف';
                    else hifdhStatus = rec['حفظ'] ? '✅' : '❌';

                    if (student.suspension.stopReview) murajaaStatus = 'موقف';
                    else murajaaStatus = rec['مراجعة'] ? '✅' : '❌';
                } else {
                    hifdhStatus = rec['حفظ'] ? '✅' : '❌';
                    murajaaStatus = rec['مراجعة'] ? '✅' : '❌';
                }
            } else {
                hifdhStatus = rec['حفظ'] ? '✅' : '❌';
                murajaaStatus = rec['مراجعة'] ? '✅' : '❌';
            }
        }

        const studentName = `*${student.name}*`;

        let line = `${toArabicNumerals(index + 1)}- ${studentName}`;
        if (line.length < 25) line = line.padEnd(27, ' ');

        if (murajaaStatus) {
            message += `${line}| ${hifdhStatus.padEnd(6, ' ')}| ${murajaaStatus.padEnd(6, ' ')}|\n`;
        } else {
            message += `${line}| ${hifdhStatus.padEnd(6, ' ')}|\n`;
        }

        if (index === 0) {
            message += '------------------------------------------------\n';
        } else {
            message += '|------------------------------------------------\n';
        }
    });

    message += `\nمركز بدر لتعليم القرآن الكريم – إدارة حلقة ${siteSettings.className}`;

    messagePreviewEl.textContent = message;
    messageModal.style.display = 'block';
}



// دالة للحصول على تاريخ بداية الأسبوع (السبت)
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
    // حساب الفرق للعودة إلى يوم السبت
    const diff = day === 0 ? 6 : day - 6 < 0 ? day + 1 : day - 6;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

// دالة للحصول على تاريخ نهاية الأسبوع (الجمعة)
function getEndOfWeek(date) {
    const start = getStartOfWeek(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
}

// دالة للحصول على تاريخ بداية الشهر
function getStartOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

// دالة للحصول على تاريخ نهاية الشهر
function getEndOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

// دالة لترشيح السجلات حسب النطاق الزمني
function filterRecordsByTimeRange() {
    const filteredRecords = {};
    const now = new Date();
    const selectedRange = statsRangeSelect.value;
    
    let startDate, endDate;
    
    switch(selectedRange) {
        case 'today':
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'week':
            startDate = getStartOfWeek(now);
            startDate.setHours(0, 0, 0, 0);
            endDate = getEndOfWeek(now);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'month':
            startDate = getStartOfMonth(now);
            startDate.setHours(0, 0, 0, 0);
            endDate = getEndOfMonth(now);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'lastWeek':
            // إصلاح حساب الأسبوع السابق
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            startDate = getStartOfWeek(startDate);
            startDate.setHours(0, 0, 0, 0);
            endDate = getEndOfWeek(startDate);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'lastMonth':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'all':
        default:
            // لا يوجد فلترة، نأخذ كل السجلات
            return dailyRecords;
    }
    
    // فلترة السجلات حسب النطاق الزمني
    for (const date in dailyRecords) {
        const recordDate = new Date(date);
        if (recordDate >= startDate && recordDate <= endDate) {
            filteredRecords[date] = dailyRecords[date];
        }
    }
    
    return filteredRecords;
}

function updateStats() {
    const filteredRecords = filterRecordsByTimeRange();
    const studentStats = {};
    students.forEach(student => {
        studentStats[student.id] = {
            'حفظ': 0,
            'مراجعة': 0,
            'غائب': 0,
            'مستأذن': 0
        };
    });

    for (const date in filteredRecords) {
        for (const studentId in filteredRecords[date]) {
            const record = filteredRecords[date][studentId];
            if (studentStats[studentId]) { // Ensure student exists
                if (record['حفظ']) studentStats[studentId]['حفظ']++;
                if (record['مراجعة']) studentStats[studentId]['مراجعة']++;
                if (record['غائب']) studentStats[studentId]['غائب']++;
                if (record['مستأذن']) studentStats[studentId]['مستأذن']++;
            }
        }
    }

    renderChart(studentStats);
    renderIndividualStats(studentStats);
}

function renderChart(studentStats) {
    const studentNames = students.map(s => s.name);
    const daysMemorized = students.map(s => studentStats[s.id]['حفظ'] || 0);
    const daysRevised = students.map(s => studentStats[s.id]['مراجعة'] || 0);
    
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    const ctx = statsChart.getContext('2d');
    
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: studentNames,
            datasets: [{
                label: 'عدد أيام الحفظ',
                data: daysMemorized,
                backgroundColor: '#2C7B4D',
                borderRadius: 5,
            }, {
                label: 'عدد أيام المراجعة',
                data: daysRevised,
                backgroundColor: '#F4E7B3',
                borderRadius: 5,
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'عدد الأيام',
                        font: {
                            family: 'Amiri',
                            size: 14
                        }
                    },
                    ticks: {
                        font: {
                            family: 'Amiri'
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            family: 'Amiri'
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        font: {
                            family: 'Amiri',
                            size: 14
                        }
                    }
                }
            }
        }
    });
}

function renderIndividualStats(studentStats) {
    studentStatsDetailsEl.innerHTML = '';
    
    if (students.length === 0) {
        studentStatsDetailsEl.innerHTML = '<p style="text-align:center; color:#555;">لا توجد بيانات إحصائية لعرضها.</p>';
        return;
    }
    
    students.forEach(student => {
        const stats = studentStats[student.id] || { حفظ: 0, مراجعة: 0, غائب: 0, مستأذن: 0 };
        const card = document.createElement('div');
        card.className = 'student-stat-card';
        card.innerHTML = `
            <h3>${student.name}</h3>
            <div class="stat-item">
                <span class="stat-label">أيام الحفظ:</span>
                <span class="stat-value">${toArabicNumerals(stats['حفظ'])}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">أيام المراجعة:</span>
                <span class="stat-value">${toArabicNumerals(stats['مراجعة'])}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">أيام الغياب:</span>
                <span class="stat-value">${toArabicNumerals(stats['غائب'])}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">أيام الاستئذان:</span>
                <span class="stat-value">${toArabicNumerals(stats['مستأذن'])}</span>
            </div>
        `;
        studentStatsDetailsEl.appendChild(card);
    });
}

// --- Event Listeners ---
document.getElementById('add-student-btn').addEventListener('click', () => {
    const nameInput = document.getElementById('student-name');
    const newName = nameInput.value.trim();
    if (newName) {
        students.push({ id: Date.now(), name: newName });
        nameInput.value = '';
        renderStudents();
        renderDailyTable();
        updateStats();
        
        // Show success notification
        showNotification('تمت إضافة الطالب بنجاح');
    }
});



studentListEl.addEventListener('click', (event) => {
    if (event.target.closest('.delete-btn')) {
        const button = event.target.closest('.delete-btn');
        const studentId = parseInt(button.dataset.id);
        if (confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
            students = students.filter(student => student.id !== studentId);
            for (const date in dailyRecords) {
                if (dailyRecords[date][studentId]) {
                    delete dailyRecords[date][studentId];
                }
            }
            localStorage.setItem('dailyRecords', JSON.stringify(dailyRecords));
            renderStudents();
            renderDailyTable();
            updateStats();
            showNotification('تم حذف الطالب بنجاح');
        }
    } else if (event.target.closest('.edit-btn')) {
        const button = event.target.closest('.edit-btn');
        const studentId = parseInt(button.dataset.id);
        const studentToEdit = students.find(student => student.id === studentId);
        const newName = prompt('أدخل الاسم الجديد للطالب:', studentToEdit.name);
        if (newName && newName.trim()) {
            studentToEdit.name = newName.trim();
            localStorage.setItem('students', JSON.stringify(students));
            renderStudents();
            renderDailyTable();
            updateStats();
            showNotification('تم تعديل اسم الطالب بنجاح');
        }
    } else if (event.target.closest('.suspend-btn')) {
        const button = event.target.closest('.suspend-btn');
        const studentId = parseInt(button.dataset.id);
        openStudentSuspendModal(studentId);
    }
});

prevDayBtn.addEventListener('click', () => {
    currentDay.setDate(currentDay.getDate() - 1);
    renderDailyTable();
});

nextDayBtn.addEventListener('click', () => {
    currentDay.setDate(currentDay.getDate() + 1);
    renderDailyTable();
});

goToTodayBtn.addEventListener('click', () => {
    currentDay = new Date();
    renderDailyTable();
    showNotification('تم الانتقال إلى اليوم الحالي');
});

dateInput.addEventListener('change', (event) => {
    const newDate = new Date(event.target.value);
    if (!isNaN(newDate.getTime())) {
        currentDay = newDate;

        // إذا التاريخ المختار هو نفس اليوم الحالي بالضبط
        const todayStr = new Date().toISOString().slice(0,10);
        if (event.target.value === todayStr) {
            followToday = true;  // 👈 يتابع اليوم الحالي تلقائياً
        } else {
            followToday = false; // 👈 يثبت على التاريخ اللي اخترته
        }

        renderDailyTable();
    }
});


attendanceBodyEl.addEventListener('change', handleStatusChange);
generateMessageBtn.addEventListener('click', generateMessage);
closeBtn.addEventListener('click', () => messageModal.style.display = 'none');
copyMessageBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(messagePreviewEl.textContent)
        .then(() => {
            showNotification('تم نسخ الرسالة إلى الحافظة!');
        })
        .catch(err => {
            console.error('Failed to copy: ', err);
            showNotification('فشل في نسخ الرسالة. يرجى المحاولة مرة أخرى.', true);
        });
});

// زر المشاركة
const shareMessageBtn = document.getElementById('share-message-btn');

shareMessageBtn.addEventListener('click', () => {
    if (navigator.share) {
        navigator.share({
            text: messagePreviewEl.textContent
        }).catch(err => {
            console.error('خطأ في المشاركة:', err);
            showNotification('فشل في المشاركة. جرب زر النسخ بدلاً من ذلك.', true);
        });
    } else {
        alert('ميزة المشاركة غير مدعومة في هذا المتصفح. استخدم زر النسخ بدلاً من ذلك.');
    }
});


// إضافة مستمع الحدث للفلترة الزمنية
statsRangeSelect.addEventListener('change', updateStats);

// Close modals when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === messageModal) {
        messageModal.style.display = 'none';
    }
    if (event.target === studentSuspendModal) {
        studentSuspendModal.style.display = 'none';
    }
    if (event.target === siteSettingsModal) {
        siteSettingsModal.style.display = 'none';
    }
});

// Site settings modal events
siteSettingsBtn.addEventListener('click', () => {
    formClassName.value = siteSettings.className || '';
    formTeacherName.value = siteSettings.teacherName || '';
    siteSettingsModal.style.display = 'block';
});
closeSiteSettingsBtn.addEventListener('click', () => siteSettingsModal.style.display = 'none');
saveSiteSettingsBtn.addEventListener('click', () => {
    const newClass = formClassName.value.trim() || siteSettings.className;
    const newTeacher = formTeacherName.value.trim() || siteSettings.teacherName;
    siteSettings.className = newClass;
    siteSettings.teacherName = newTeacher;
    localStorage.setItem('siteSettings', JSON.stringify(siteSettings));
    displayWelcome();
    showNotification('تم حفظ إعدادات الحلقة والمعلم');
    siteSettingsModal.style.display = 'none';
});

// Suspension modal functions
function openStudentSuspendModal(studentId) {
    currentEditingSuspendStudentId = studentId;
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    // Load existing suspension if any
    const susp = student.suspension || {};
    suspendSaveCheckbox.checked = !!susp.stopSave;
    suspendReviewCheckbox.checked = !!susp.stopReview;
    suspendStartInput.value = susp.start_date || '';
    suspendEndInput.value = susp.end_date || '';
    studentSuspendModal.style.display = 'block';
}

closeSuspendBtn.addEventListener('click', () => {
    studentSuspendModal.style.display = 'none';
});

// Save suspension
saveSuspendBtn.addEventListener('click', () => {
    if (!currentEditingSuspendStudentId) return;
    const student = students.find(s => s.id === currentEditingSuspendStudentId);
    if (!student) return;
    const startVal = suspendStartInput.value;
    const endVal = suspendEndInput.value;
    const stopSave = suspendSaveCheckbox.checked;
    const stopReview = suspendReviewCheckbox.checked;

    if (!startVal) {
        alert('الرجاء تحديد تاريخ بداية الإيقاف.');
        return;
    }
    // validate dates if end provided
    if (endVal && new Date(endVal) < new Date(startVal)) {
        alert('تاريخ النهاية لا يمكن أن يكون قبل تاريخ البداية.');
        return;
    }

    student.suspension = {
        start_date: startVal,
        end_date: endVal || null,
        stopSave: stopSave,
        stopReview: stopReview
    };

    localStorage.setItem('students', JSON.stringify(students));
    studentSuspendModal.style.display = 'none';
    renderDailyTable();
    updateStats();
    showNotification('تم حفظ إعدادات الإيقاف للطالب');
});

// Remove suspension (إلغاء الإيقاف)
removeSuspendBtn.addEventListener('click', () => {
    if (!currentEditingSuspendStudentId) return;
    if (!confirm('هل تريد إزالة الإيقاف لهذا الطالب نهائياً؟')) return;
    const student = students.find(s => s.id === currentEditingSuspendStudentId);
    if (!student) return;
    delete student.suspension;
    localStorage.setItem('students', JSON.stringify(students));
    studentSuspendModal.style.display = 'none';
    renderDailyTable();
    updateStats();
    showNotification('تم إزالة الإيقاف عن الطالب');
});

// Function to show notification
function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : ''}`;
    notification.innerHTML = `
        <i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s';
        setTimeout(() => document.body.removeChild(notification), 500);
    }, 3000);
}


// Initial render
displayWelcome();
renderStudents();
renderDailyTable();
updateStats();


document.addEventListener("DOMContentLoaded", () => {
    let siteSettings = JSON.parse(localStorage.getItem('siteSettings')) || null;

    const firstTimeModal = document.getElementById('first-time-modal');
    const saveFirstTimeBtn = document.getElementById('save-first-time-btn');

    if (!siteSettings || !siteSettings.teacherName || !siteSettings.className) {
        // أول دخول → أظهر نافذة الترحيب
        firstTimeModal.style.display = 'block';
    }

    saveFirstTimeBtn.addEventListener('click', () => {
        const teacherInput = document.getElementById('teacher-name-input').value.trim();
        const classInput = document.getElementById('class-name-input').value.trim();

        if (!teacherInput || !classInput) {
            alert('الرجاء إدخال جميع البيانات');
            return;
        }

        siteSettings = {
            teacherName: teacherInput, // 👈 نخزن الاسم كما هو
            className: classInput
        };

        // حفظ البيانات
        localStorage.setItem('siteSettings', JSON.stringify(siteSettings));

        // تحديث الترحيب العلوي
        displayWelcome();

        // إخفاء النافذة
        firstTimeModal.style.display = 'none';
    });
});


function resetSettingsAndStudents() {
    if (confirm("هل تريد حذف بيانات الطلاب والمعلم وإعادة البدء من جديد؟")) {
        localStorage.removeItem("students");
        localStorage.removeItem("siteSettings");
        location.reload();
    }
}

/*********************
  تحديث أوتوماتيكي لليوم الحالي
*********************/
setInterval(() => {
    const now = new Date();
    const nowYMD = now.toISOString().slice(0,10);
    const currYMD = currentDay.toISOString().slice(0,10);

    if (followToday && nowYMD !== currYMD) {
        currentDay = new Date();
        today = new Date();
        renderDailyTable();
    }
}, 60 * 1000);


window.addEventListener('load', () => {
  const siteSettings = JSON.parse(localStorage.getItem('siteSettings'));
  const firstTimeModal = document.getElementById('first-time-modal');
  const saveFirstTimeBtn = document.getElementById('save-first-time-btn');

  // إذا ما في بيانات محفوظة، افتح النافذة
  if (!siteSettings) {
    firstTimeModal.style.display = 'block';
  }

  // زر الحفظ
  if (saveFirstTimeBtn) {
    saveFirstTimeBtn.addEventListener('click', () => {
      const teacher = document.getElementById('teacher-name-input').value.trim();
      const className = document.getElementById('class-name-input').value.trim();

      if (!teacher || !className) {
        alert('الرجاء إدخال اسم المعلم واسم الحلقة');
        return;
      }

      // حفظ
      localStorage.setItem('siteSettings', JSON.stringify({
        teacherName: teacher,
        className: className
      }));

      // إغلاق النافذة وتحديث الصفحة
      firstTimeModal.style.display = 'none';
      location.reload();
    });
  }
});
