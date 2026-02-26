/**
 * ============================================
 * مصر تُعيد التدوير - ملف JavaScript
 * منصة ذكية لإدارة المخلفات وإشراك المواطنين
 * ============================================
 * 
 * المميزات:
 * - التنقل بين الصفحات
 * - اختيار نوع المخلفات وحساب الكمية
 * - حساب التأثير البيئي (CO2، المياه، الطاقة)
 * - حفظ البيانات في LocalStorage
 * - عرض إحصائيات شخصية
 * - أرقام متحركة للنتائج
 */

// ============================================
// المتغيرات العامة
// ============================================

// أنواع المخلفات ومعاملات التأثير البيئي
const WASTE_TYPES = {
    plastic: {
        name: 'بلاستيك',
        icon: '🥤',
        // 1 كجم بلاستيك = تقليل 2 كجم CO2
        co2Factor: 2,
        // توفير طاقة بسيط
        energyFactor: 1.5,
        // توفير مياه بسيط
        waterFactor: 5,
        // لا يوجد تأثير مباشر على الأشجار
        treeFactor: 0
    },
    paper: {
        name: 'ورق',
        icon: '📰',
        // 1 كجم ورق = تقليل 0.9 كجم CO2
        co2Factor: 0.9,
        // توفير طاقة
        energyFactor: 2,
        // 1 كجم ورق = توفير 17 لتر ماء
        waterFactor: 17,
        // 1 كجم ورق = حماية 0.02 شجرة
        treeFactor: 0.02
    },
    metal: {
        name: 'معادن',
        icon: '🥫',
        // 1 كجم معادن = تقليل 4 كجم CO2
        co2Factor: 4,
        // توفير طاقة كبير (95%)
        energyFactor: 5.5,
        // توفير مياه
        waterFactor: 10,
        treeFactor: 0
    },
    electronics: {
        name: 'إلكترونيات',
        icon: '📱',
        // 1 كجم إلكترونيات = تقليل 10 كجم CO2
        co2Factor: 10,
        // توفير طاقة كبير
        energyFactor: 8,
        // توفير مياه
        waterFactor: 50,
        // منع تلوث
        treeFactor: 0
    }
};

// المتغيرات الحالية
let currentWasteType = null;
let currentQuantity = 0;
let currentImpact = null;

// مفتاح LocalStorage
const STORAGE_KEY = 'recycle_egypt_data';

// ============================================
// دوال التهيئة والتنقل
// ============================================

/**
 * تهيئة التطبيق عند تحميل الصفحة
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    loadHistory();
    updateStatsDisplay();
});

/**
 * تهيئة روابط التنقل
 */
function initializeNavigation() {
    // روابط شريط التنقل
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            navigateTo(page);
        });
    });
    
    // زر القائمة للجوال
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinksContainer = document.querySelector('.nav-links');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinksContainer.classList.toggle('active');
        });
    }
}

/**
 * الانتقال إلى صفحة معينة
 * @param {string} page - معرف الصفحة
 */
function navigateTo(page) {
    // إخفاء جميع الصفحات
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    
    // إظهار الصفحة المطلوبة
    const targetPage = document.getElementById(page);
    if (targetPage) {
        targetPage.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // تحديث الروابط النشطة
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === page) {
            link.classList.add('active');
        }
    });
    
    // إغلاق قائمة الجوال
    const navLinksContainer = document.querySelector('.nav-links');
    if (navLinksContainer) {
        navLinksContainer.classList.remove('active');
    }
    
    // تحديث الإحصائيات إذا كانت صفحة الإحصائيات
    if (page === 'stats') {
        updateStatsDisplay();
        renderHistoryTable();
    }
}

// ============================================
// اختيار نوع المخلفات
// ============================================

/**
 * اختيار نوع المخلفات
 * @param {string} type - نوع المخلفات
 */
function selectWasteType(type) {
    currentWasteType = type;
    
    // تحديث الواجهة
    const wasteCards = document.querySelectorAll('.waste-card');
    wasteCards.forEach(card => {
        card.classList.remove('selected');
        if (card.getAttribute('data-type') === type) {
            card.classList.add('selected');
        }
    });
    
    // إظهار قسم الكمية
    const quantitySection = document.getElementById('quantitySection');
    if (quantitySection) {
        quantitySection.style.display = 'block';
        quantitySection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // تحديث اسم النوع المختار
    const selectedTypeName = document.getElementById('selectedTypeName');
    if (selectedTypeName && WASTE_TYPES[type]) {
        selectedTypeName.textContent = WASTE_TYPES[type].name + ' ' + WASTE_TYPES[type].icon;
    }
    
    // مسح حقل الكمية
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) {
        quantityInput.value = '';
        quantityInput.focus();
    }
}

// ============================================
// حساب التأثير البيئي
// ============================================

/**
 * حساب التأثير البيئي
 */
function calculateImpact() {
    // التحقق من اختيار النوع
    if (!currentWasteType) {
        showToast('الرجاء اختيار نوع المخلفات أولاً', 'error');
        return;
    }
    
    // الحصول على الكمية
    const quantityInput = document.getElementById('quantity');
    const quantity = parseFloat(quantityInput.value);
    
    // التحقق من صحة الكمية
    if (!quantity || quantity <= 0) {
        showToast('الرجاء إدخال كمية صحيحة', 'error');
        return;
    }
    
    if (quantity > 1000) {
        showToast('الكمية كبيرة جداً، أقصى حد هو 1000 كجم', 'error');
        return;
    }
    
    currentQuantity = quantity;
    
    // حساب التأثير
    const wasteType = WASTE_TYPES[currentWasteType];
    currentImpact = {
        type: currentWasteType,
        typeName: wasteType.name,
        quantity: quantity,
        co2Reduction: quantity * wasteType.co2Factor,
        waterSaved: quantity * wasteType.waterFactor,
        energySaved: quantity * wasteType.energyFactor,
        treesSaved: quantity * wasteType.treeFactor
    };
    
    // الانتقال إلى صفحة النتائج
    navigateTo('impact');
    
    // عرض النتائج مع تأثير الأرقام المتحركة
    displayImpactResults();
}

/**
 * عرض نتائج التأثير البيئي
 */
function displayImpactResults() {
    if (!currentImpact) return;
    
    // عرض الكمية والنوع
    animateNumber('totalQuantity', currentImpact.quantity, 1);
    document.getElementById('impactTypeText').textContent = 
        currentImpact.typeName + ' ' + WASTE_TYPES[currentImpact.type].icon;
    
    // عرض النتائج البيئية
    animateNumber('co2Reduction', currentImpact.co2Reduction, 1);
    animateNumber('waterSaved', currentImpact.waterSaved, 0);
    animateNumber('energySaved', currentImpact.energySaved, 1);
    animateNumber('treesSaved', currentImpact.treesSaved, 2);
}

// ============================================
// الأرقام المتحركة
// ============================================

/**
 * تأثير العد التصاعدي للأرقام
 * @param {string} elementId - معرف العنصر
 * @param {number} targetValue - القيمة النهائية
 * @param {number} decimals - عدد المنازل العشرية
 */
function animateNumber(elementId, targetValue, decimals = 0) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // إضافة تأثير الحركة
    element.classList.add('animating');
    
    const duration = 1500; // مدة الحركة بالمللي ثانية
    const startTime = performance.now();
    const startValue = 0;
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // استخدام دالة التسارع للحركة السلسة
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = startValue + (targetValue - startValue) * easeOutQuart;
        
        element.textContent = currentValue.toFixed(decimals);
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        } else {
            element.classList.remove('animating');
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// ============================================
// LocalStorage - حفظ واسترجاع البيانات
// ============================================

/**
 * الحصول على البيانات المحفوظة
 * @returns {Array} مصفوفة السجل
 */
function getStoredData() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('خطأ في قراءة البيانات:', error);
        return [];
    }
}

/**
 * حفظ البيانات
 * @param {Array} data - مصفوفة السجل
 */
function saveData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('خطأ في حفظ البيانات:', error);
        return false;
    }
}

/**
 * حفظ المساهمة الحالية في السجل
 */
function saveToHistory() {
    if (!currentImpact) {
        showToast('لا يوجد بيانات لحفظها', 'error');
        return;
    }
    
    // إنشاء سجل جديد
    const entry = {
        id: Date.now(),
        date: new Date().toISOString(),
        type: currentImpact.type,
        typeName: currentImpact.typeName,
        quantity: currentImpact.quantity,
        co2Reduction: currentImpact.co2Reduction,
        waterSaved: currentImpact.waterSaved,
        energySaved: currentImpact.energySaved,
        treesSaved: currentImpact.treesSaved
    };
    
    // إضافة إلى السجل
    const history = getStoredData();
    history.unshift(entry); // إضافة في البداية
    
    // حفظ في LocalStorage
    if (saveData(history)) {
        showToast('تم حفظ المساهمة بنجاح!');
        updateStatsDisplay();
    } else {
        showToast('حدث خطأ أثناء الحفظ', 'error');
    }
}

/**
 * تحميل السجل
 */
function loadHistory() {
    const history = getStoredData();
    console.log(`تم تحميل ${history.length} مساهمة`);
}

/**
 * مسح السجل
 */
function clearHistory() {
    if (confirm('هل أنت متأكد من مسح جميع السجلات؟')) {
        localStorage.removeItem(STORAGE_KEY);
        updateStatsDisplay();
        renderHistoryTable();
        showToast('تم مسح السجل بنجاح');
    }
}

// ============================================
// الإحصائيات
// ============================================

/**
 * تحديث عرض الإحصائيات
 */
function updateStatsDisplay() {
    const history = getStoredData();
    
    // حساب الإجماليات
    let totalRecycled = 0;
    let totalCO2 = 0;
    let totalWater = 0;
    
    history.forEach(entry => {
        totalRecycled += entry.quantity;
        totalCO2 += entry.co2Reduction;
        totalWater += entry.waterSaved;
    });
    
    // تحديث العناصر
    updateStatElement('statsTotalRecycled', totalRecycled, 1);
    updateStatElement('statsTotalCO2', totalCO2, 1);
    updateStatElement('statsTotalWater', totalWater, 0);
    updateStatElement('statsTotalEntries', history.length, 0);
}

/**
 * تحديث عنصر إحصائي
 * @param {string} elementId - معرف العنصر
 * @param {number} value - القيمة
 * @param {number} decimals - المنازل العشرية
 */
function updateStatElement(elementId, value, decimals) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value.toFixed(decimals);
    }
}

/**
 * عرض جدول السجل
 */
function renderHistoryTable() {
    const history = getStoredData();
    const tableBody = document.getElementById('historyTableBody');
    const emptyState = document.getElementById('emptyState');
    const table = document.getElementById('historyTable');
    
    if (!tableBody || !emptyState || !table) return;
    
    // إذا كان السجل فارغاً
    if (history.length === 0) {
        table.style.display = 'none';
        emptyState.classList.add('active');
        return;
    }
    
    // إظهار الجدول وإخفاء الحالة الفارغة
    table.style.display = 'table';
    emptyState.classList.remove('active');
    
    // إنشاء صفوف الجدول
    tableBody.innerHTML = history.map(entry => {
        const date = new Date(entry.date);
        const dateStr = date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        return `
            <tr>
                <td>${dateStr}</td>
                <td>${entry.typeName}</td>
                <td>${entry.quantity.toFixed(1)} كجم</td>
                <td>${entry.co2Reduction.toFixed(1)} كجم</td>
                <td>${entry.waterSaved.toFixed(0)} لتر</td>
            </tr>
        `;
    }).join('');
}

// ============================================
// رسائل التنبيه
// ============================================

/**
 * عرض رسالة تنبيه
 * @param {string} message - نص الرسالة
 * @param {string} type - نوع الرسالة (success/error)
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = toast.querySelector('.toast-icon');
    
    if (!toast || !toastMessage) return;
    
    // تعيين النص والأيقونة
    toastMessage.textContent = message;
    toastIcon.textContent = type === 'success' ? '✅' : '⚠️';
    
    // إظهار الرسالة
    toast.classList.add('show');
    
    // إخفاء بعد 3 ثواني
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================
// دوال مساعدة
// ============================================

/**
* الحصول على اسم نوع المخلفات
* @param {string} type - نوع المخلفات
* @returns {string} الاسم بالعربية
*/
function getWasteTypeName(type) {
    return WASTE_TYPES[type]?.name || type;
}

/**
 * الحصول على أيقونة نوع المخلفات
 * @param {string} type - نوع المخلفات
 * @returns {string} الأيقونة
 */
function getWasteTypeIcon(type) {
    return WASTE_TYPES[type]?.icon || '📦';
}

/**
 * تنسيق التاريخ
 * @param {string} dateString - نص التاريخ
 * @returns {string} التاريخ المنسق
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * التحقق من إدخال الأرقام فقط
 * @param {HTMLInputElement} input - عنصر الإدخال
 */
function validateNumberInput(input) {
    // السماح بالأرقام والنقطة العشرية فقط
    let value = input.value;
    
    // إزالة أي حروف أو رموز غير مسموح بها
    value = value.replace(/[^0-9.]/g, '');
    
    // التأكد من وجود نقطة عشرية واحدة فقط
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // التأكد من أن القيمة ضمن الحدود
    const numValue = parseFloat(value);
    if (numValue > 1000) {
        value = '1000';
    }
    
    input.value = value;
}

// ============================================
// تصدير الدوال للاستخدام العام
// ============================================

// جعل الدوال متاحة عالمياً للاستخدام في HTML
window.navigateTo = navigateTo;
window.selectWasteType = selectWasteType;
window.calculateImpact = calculateImpact;
window.saveToHistory = saveToHistory;
window.clearHistory = clearHistory;
window.validateNumberInput = validateNumberInput;

// ============================================
// رسالة في وحدة التحكم
// ============================================

console.log('%c🇪🇬 Recycle Egypt', 'font-size: 24px; font-weight: bold; color: #2E7D32;');
console.log('%cمنصة ذكية لإدارة المخلفات وإشراك المواطنين', 'font-size: 14px; color: #616161;');
console.log('%cمشروع تعليمي لمسابقة المدارس الثانوية', 'font-size: 12px; color: #9E9E9E;');
