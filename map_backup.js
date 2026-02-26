/**
 * ============================================
 * خريطة أقرب أماكن إعادة التدوير - Recycle Egypt
 * ============================================
 * 
 * الوصف:
 * ملف JavaScript منفصل لعرض خريطة تفاعلية تحدد أقرب أماكن إعادة التدوير
 * للمستخدم بناءً على موقعه الجغرافي الحالي.
 * 
 * المميزات:
 * - تحديد موقع المستخدم تلقائياً باستخدام Geolocation API
 * - عرض أقرب نقاط إعادة التدوير على الخريطة
 * - تصفية النقاط حسب نوع المخلفات (بلاستيك، ورق، معادن، إلكترونيات)
 * - حساب المسافة بين المستخدم وكل نقطة
 * - نوافذ معلومات تفاعلية عند الضغط على الـ Markers
 * 
 * التقنيات المستخدمة:
 * - Leaflet.js: مكتبة خرائط خفيفة ومفتوحة المصدر
 * - OpenStreetMap: خرائط مجانية ومفتوحة المصدر
 * - Geolocation API: لتحديد موقع المستخدم
 * 
 * التوافق:
 * - جميع المتصفحات الحديثة
 * - أجهزة الموبايل والتابلت
 * - يعمل بدون API Key
 * 
 * ============================================
 */

// ============================================
// المتغيرات العامة
// ============================================

/** @type {L.Map} كائن الخريطة الرئيسي */
let map = null;

/** @type {L.Marker} ماركر موقع المستخدم */
let userMarker = null;

/** @type {L.Circle} دائرة نطاق البحث */
let searchCircle = null;

/** @type {Array<L.Marker>} مصفوفة ماركرز نقاط التدوير */
let recyclingMarkers = [];

/** @type {Object} إحداثيات موقع المستخدم الحالي */
let userLocation = null;

/** @type {string} نوع التصفية الحالي */
let currentFilter = 'all';

// ============================================
// بيانات نقاط إعادة التدوير (Sample Data)
// ============================================

/**
 * بيانات تجريبية لنقاط إعادة التدوير في مصر
 * يمكن تعديل هذه البيانات أو استبدالها ببيانات حقيقية من قاعدة بيانات
 * 
 * هيكل كل نقطة:
 * - id: معرف فريد
 * - name: اسم المكان
 * - lat: خط العرض
 * - lng: خط الطول
 * - types: أنواع المخلفات المقبولة (مصفوفة)
 * - address: العنوان التفصيلي
 * - phone: رقم الهاتف (اختياري)
 * - hours: أوقات العمل (اختياري)
 */
const RECYCLING_POINTS = [
    // القاهرة والجيزة
    {
        id: 1,
        name: 'محطة تدوير مصر الجديدة',
        lat: 30.0875,
        lng: 31.3285,
        types: ['plastic', 'paper', 'metal'],
        address: 'شارع العروبة، مصر الجديدة، القاهرة',
        phone: '02-2415-XXXX',
        hours: '9:00 ص - 5:00 م'
    },
    {
        id: 2,
        name: 'مركز إعادة تدوير المعادي',
        lat: 29.9623,
        lng: 31.2495,
        types: ['plastic', 'electronics'],
        address: 'شارع 9، المعادي، القاهرة',
        phone: '02-2516-XXXX',
        hours: '8:00 ص - 6:00 م'
    },
    {
        id: 3,
        name: 'جمعية تدوير الزمالك',
        lat: 30.0571,
        lng: 31.2196,
        types: ['paper', 'metal'],
        address: 'شارع 26 يوليو، الزمالك، القاهرة',
        phone: '02-2735-XXXX',
        hours: '10:00 ص - 4:00 م'
    },
    {
        id: 4,
        name: 'محطة تدوير مدينة نصر',
        lat: 30.0511,
        lng: 31.3656,
        types: ['plastic', 'paper', 'metal', 'electronics'],
        address: 'شارع مصطفى النحاس، مدينة نصر، القاهرة',
        phone: '02-2272-XXXX',
        hours: '24 ساعة'
    },
    {
        id: 5,
        name: 'مركز تدوير الدقي',
        lat: 30.0385,
        lng: 31.2110,
        types: ['electronics'],
        address: 'شارع التحرير، الدقي، الجيزة',
        phone: '02-3335-XXXX',
        hours: '9:00 ص - 9:00 م'
    },
    {
        id: 6,
        name: 'جمعية تدوير المهندسين',
        lat: 30.0519,
        lng: 31.1985,
        types: ['plastic', 'paper'],
        address: 'شارع جامعة الدول العربية، المهندسين، الجيزة',
        phone: '02-3303-XXXX',
        hours: '8:00 ص - 5:00 م'
    },
    {
        id: 7,
        name: 'محطة تدوير القاهرة الجديدة',
        lat: 30.0074,
        lng: 31.4913,
        types: ['plastic', 'metal', 'electronics'],
        address: 'التجمع الخامس، القاهرة الجديدة',
        phone: '02-2617-XXXX',
        hours: '9:00 ص - 6:00 م'
    },
    {
        id: 8,
        name: 'مركز تدوير العباسية',
        lat: 30.0647,
        lng: 31.2733,
        types: ['paper', 'metal'],
        address: 'شارع العباسية، القاهرة',
        phone: '02-2484-XXXX',
        hours: '8:00 ص - 4:00 م'
    },
    {
        id: 9,
        name: 'جمعية تدوير حلوان',
        lat: 29.8457,
        lng: 31.3008,
        types: ['plastic', 'paper', 'metal'],
        address: 'شارع الأهرام، حلوان، القاهرة',
        phone: '02-2778-XXXX',
        hours: '9:00 ص - 5:00 م'
    },
    {
        id: 10,
        name: 'محطة تدوير الشيخ زايد',
        lat: 30.0192,
        lng: 30.9662,
        types: ['plastic', 'electronics'],
        address: 'الحي السابع، الشيخ زايد، الجيزة',
        phone: '02-3859-XXXX',
        hours: '10:00 ص - 8:00 م'
    },
    {
        id: 11,
        name: 'مركز تدوير 6 أكتوبر',
        lat: 29.9770,
        lng: 30.9596,
        types: ['plastic', 'paper', 'metal', 'electronics'],
        address: 'الحي الأول، 6 أكتوبر، الجيزة',
        phone: '02-3835-XXXX',
        hours: '24 ساعة'
    },
    {
        id: 12,
        name: 'جمعية تدوير المقطم',
        lat: 29.9819,
        lng: 31.2829,
        types: ['paper', 'electronics'],
        address: 'حي المقطم، القاهرة',
        phone: '02-2509-XXXX',
        hours: '9:00 ص - 5:00 م'
    },
    // الإسكندرية
    {
        id: 13,
        name: 'محطة تدوير سموحة',
        lat: 31.2156,
        lng: 29.9553,
        types: ['plastic', 'paper', 'metal'],
        address: 'شارع فؤاد، سموحة، الإسكندرية',
        phone: '03-4259-XXXX',
        hours: '8:00 ص - 6:00 م'
    },
    {
        id: 14,
        name: 'مركز تدوير المنشية',
        lat: 31.2001,
        lng: 29.9005,
        types: ['electronics'],
        address: 'شارع صلاح سالم، المنشية، الإسكندرية',
        phone: '03-4839-XXXX',
        hours: '9:00 ص - 9:00 م'
    },
    {
        id: 15,
        name: 'جمعية تدوير العجمي',
        lat: 31.0958,
        lng: 29.7604,
        types: ['plastic', 'metal'],
        address: 'شارع البحر، العجمي، الإسكندرية',
        phone: '03-5610-XXXX',
        hours: '10:00 ص - 7:00 م'
    },
    // المنصورة
    {
        id: 16,
        name: 'محطة تدوير المنصورة',
        lat: 31.0409,
        lng: 31.3785,
        types: ['plastic', 'paper', 'electronics'],
        address: 'شارع الجيش، المنصورة، الدقهلية',
        phone: '050-233-XXXX',
        hours: '9:00 ص - 5:00 م'
    },
    // طنطا
    {
        id: 17,
        name: 'مركز تدوير طنطا',
        lat: 30.7865,
        lng: 31.0004,
        types: ['plastic', 'metal'],
        address: 'شارع الجيش، طنطا، الغربية',
        phone: '040-331-XXXX',
        hours: '8:00 ص - 4:00 م'
    },
    // أسيوط
    {
        id: 18,
        name: 'جمعية تدوير أسيوط',
        lat: 27.1809,
        lng: 31.1837,
        types: ['plastic', 'paper', 'metal', 'electronics'],
        address: 'شارع سعد زغلول، أسيوط',
        phone: '088-232-XXXX',
        hours: '9:00 ص - 6:00 م'
    },
    // الأقصر
    {
        id: 19,
        name: 'محطة تدوير الأقصر',
        lat: 25.6872,
        lng: 32.6396,
        types: ['plastic', 'paper'],
        address: 'شارع الكرنك، الأقصر',
        phone: '095-227-XXXX',
        hours: '8:00 ص - 5:00 م'
    },
    // أسوان
    {
        id: 20,
        name: 'مركز تدوير أسوان',
        lat: 24.0889,
        lng: 32.8998,
        types: ['plastic', 'metal', 'electronics'],
        address: 'شارع السوق، أسوان',
        phone: '097-231-XXXX',
        hours: '9:00 ص - 7:00 م'
    }
];

// ============================================
// أيقونات أنواع المخلفات
// ============================================

/** @type {Object} أيقونات أنواع المخلفات */
const WASTE_ICONS = {
    plastic: '🥤',
    paper: '📰',
    metal: '🥫',
    electronics: '📱'
};

/** @type {Object} أسماء أنواع المخلفات بالعربية */
const WASTE_NAMES = {
    plastic: 'بلاستيك',
    paper: 'ورق',
    metal: 'معادن',
    electronics: 'إلكترونيات'
};

// ============================================
// دوال التهيئة
// ============================================

/**
 * تهيئة الخريطة عند تحميل الصفحة
 * يتم استدعاء هذه الدالة تلقائياً عند فتح صفحة الخريطة
 */
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من وجود عنصر الخريطة
    const mapElement = document.getElementById('recyclingMap');
    if (!mapElement) return;
    
    // تهيئة الخريطة عند الانتقال لصفحة الخريطة
    const mapNavLink = document.querySelector('[data-page="map"]');
    if (mapNavLink) {
        mapNavLink.addEventListener('click', function() {
            setTimeout(initializeMap, 100);
        });
    }
});

/**
 * تهيئة الخريطة وتحديد موقع المستخدم
 */
function initializeMap() {
    // إذا كانت الخريطة موجودة بالفعل، لا تقم بإعادة إنشائها
    if (map !== null) return;
    
    // طلب إذن الموقع من المستخدم
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            // نجاح تحديد الموقع
            function(position) {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                showMap();
            },
            // فشل تحديد الموقع - استخدام موقع افتراضي (القاهرة)
            function(error) {
                console.warn('تعذر تحديد الموقع:', error.message);
                userLocation = { lat: 30.0444, lng: 31.2357 }; // القاهرة
                showMap();
            },
            // خيارات تحديد الموقع
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    } else {
        // المتصفح لا يدعم تحديد الموقع
        showMapError();
    }
}

/**
 * عرض رسالة خطأ عند عدم دعم تحديد الموقع
 */
function showMapError() {
    const loadingElement = document.getElementById('mapLoading');
    const errorElement = document.getElementById('mapError');
    
    if (loadingElement) loadingElement.style.display = 'none';
    if (errorElement) errorElement.style.display = 'block';
}

/**
 * إعادة محاولة تحديد الموقع
 */
function retryLocation() {
    const errorElement = document.getElementById('mapError');
    const loadingElement = document.getElementById('mapLoading');
    
    if (errorElement) errorElement.style.display = 'none';
    if (loadingElement) loadingElement.style.display = 'block';
    
    // إعادة تهيئة الخريطة
    map = null;
    initializeMap();
}

// ============================================
// عرض الخريطة
// ============================================

/**
 * عرض الخريطة مع موقع المستخدم
 */
function showMap() {
    const loadingElement = document.getElementById('mapLoading');
    const wrapperElement = document.getElementById('mapWrapper');
    
    if (loadingElement) loadingElement.style.display = 'none';
    if (wrapperElement) wrapperElement.style.display = 'block';
    
    // إنشاء الخريطة
    map = L.map('recyclingMap').setView([userLocation.lat, userLocation.lng], 13);
    
    // إضافة طبقة الخريطة من OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
    }).addTo(map);
    
    // إضافة ماركر موقع المستخدم
    addUserMarker();
    
    // إضافة ماركرز نقاط التدوير
    addRecyclingMarkers();
    
    // تحديث مركز الخريطة
    map.invalidateSize();
}

/**
 * إضافة ماركر موقع المستخدم
 */
function addUserMarker() {
    // أيقونة مخصصة لموقع المستخدم
    const userIcon = L.divIcon({
        className: 'user-location-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
    
    // إضافة ماركر
    userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000 // فوق باقي الماركرز
    }).addTo(map);
    
    // إضافة نافذة معلومات
    userMarker.bindPopup(`
        <div class="popup-content">
            <div class="popup-header">
                <span class="popup-icon">📍</span>
                <h4 class="popup-title">موقعك الحالي</h4>
            </div>
            <p style="color: var(--gray-600); font-size: 0.875rem;">
                يتم عرض أقرب نقاط التدوير من هذا الموقع
            </p>
        </div>
    `);
    
    // إضافة دائرة نطاق البحث
    searchCircle = L.circle([userLocation.lat, userLocation.lng], {
        color: '#2E7D32',
        fillColor: '#2E7D32',
        fillOpacity: 0.1,
        radius: 5000 // 5 كم
    }).addTo(map);
}

/**
 * إضافة ماركرز نقاط التدوير
 */
function addRecyclingMarkers() {
    // تفريغ المصفوفة
    recyclingMarkers = [];
    
    RECYCLING_POINTS.forEach(point => {
        // حساب المسافة من المستخدم
        const distance = calculateDistance(
            userLocation.lat, userLocation.lng,
            point.lat, point.lng
        );
        
        // إنشاء أيقونة مخصصة حسب نوع المخلفات
        const iconClass = getMarkerIconClass(point.types);
        const iconHtml = getMarkerIconHtml(point.types);
        
        const customIcon = L.divIcon({
            className: `custom-marker ${iconClass}`,
            html: iconHtml,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });
        
        // إنشاء ماركر
        const marker = L.marker([point.lat, point.lng], {
            icon: customIcon
        }).addTo(map);
        
        // إضافة بيانات إضافية للماركر
        marker.pointData = point;
        marker.distance = distance;
        
        // إضافة نافذة معلومات
        marker.bindPopup(createPopupContent(point, distance));
        
        // إضافة للمصفوفة
        recyclingMarkers.push(marker);
    });
    
    // ترتيب النقاط حسب المسافة
    recyclingMarkers.sort((a, b) => a.distance - b.distance);
}

// ============================================
// دوال مساعدة
// ============================================

/**
 * الحصول على كلاس الأيقونة حسب أنواع المخلفات
 * @param {Array<string>} types - أنواع المخلفات
 * @returns {string} اسم الكلاس
 */
function getMarkerIconClass(types) {
    if (types.length === 1) {
        return `marker-${types[0]}`;
    }
    return 'marker-multi';
}

/**
 * الحصول على HTML الأيقونة حسب أنواع المخلفات
 * @param {Array<string>} types - أنواع المخلفات
 * @returns {string} HTML الأيقونة
 */
function getMarkerIconHtml(types) {
    if (types.length === 1) {
        return WASTE_ICONS[types[0]];
    }
    // إذا كانت متعددة، نعرض أول نوع مع عدد إضافي
    if (types.length > 1) {
        return `${WASTE_ICONS[types[0]]}<span style="font-size: 0.6rem; position: absolute; bottom: -2px; right: -2px;">+${types.length - 1}</span>`;
    }
    return '♻️';
}

/**
 * إنشاء محتوى نافذة المعلومات
 * @param {Object} point - بيانات النقطة
 * @param {number} distance - المسافة بالكيلومتر
 * @returns {string} HTML النافذة
 */
function createPopupContent(point, distance) {
    // إنشاء وسوم أنواع المخلفات
    const typesTags = point.types.map(type => `
        <span class="type-tag ${type}">
            ${WASTE_ICONS[type]} ${WASTE_NAMES[type]}
        </span>
    `).join('');
    
    // تنسيق المسافة
    let distanceText;
    if (distance < 1) {
        distanceText = `${Math.round(distance * 1000)} متر`;
    } else {
        distanceText = `${distance.toFixed(1)} كم`;
    }
    
    return `
        <div class="popup-content">
            <div class="popup-header">
                <span class="popup-icon">♻️</span>
                <h4 class="popup-title">${point.name}</h4>
            </div>
            
            <div class="popup-types">
                <span class="popup-types-label">المخلفات المقبولة:</span>
                <div class="popup-types-list">
                    ${typesTags}
                </div>
            </div>
            
            <div class="popup-distance">
                <span class="distance-icon">📍</span>
                <span class="distance-text">المسافة: ${distanceText}</span>
            </div>
            
            <div class="popup-address">
                <span class="address-icon">📌</span>
                <span>${point.address}</span>
            </div>
            
            ${point.phone ? `
            <div class="popup-address" style="margin-top: 8px;">
                <span class="address-icon">📞</span>
                <span>${point.phone}</span>
            </div>
            ` : ''}
            
            ${point.hours ? `
            <div class="popup-address" style="margin-top: 8px;">
                <span class="address-icon">🕐</span>
                <span>أوقات العمل: ${point.hours}</span>
            </div>
            ` : ''}
        </div>
    `;
}

/**
 * حساب المسافة بين نقطتين باستخدام صيغة هافرساين
 * @param {number} lat1 - خط عرض النقطة الأولى
 * @param {number} lng1 - خط طول النقطة الأولى
 * @param {number} lat2 - خط عرض النقطة الثانية
 * @param {number} lng2 - خط طول النقطة الثانية
 * @returns {number} المسافة بالكيلومتر
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
}

/**
 * تحويل الدرجات إلى راديان
 * @param {number} degrees - الدرجات
 * @returns {number} الراديان
 */
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// ============================================
// التصفية
// ============================================

/**
 * تصفية الـ Markers حسب نوع المخلفات
 * @param {string} filterType - نوع التصفية ('all' أو نوع المخلفات)
 */
function filterMarkers(filterType) {
    currentFilter = filterType;
    
    // تحديث أزرار التصفية
    updateFilterButtons(filterType);
    
    // تصفية الماركرز
    recyclingMarkers.forEach(marker => {
        const point = marker.pointData;
        
        if (filterType === 'all') {
            // إظهار جميع النقاط
            marker.addTo(map);
        } else {
            // إظهار النقاط التي تقبل هذا النوع فقط
            if (point.types.includes(filterType)) {
                marker.addTo(map);
            } else {
                marker.remove();
            }
        }
    });
}

/**
 * تحديث حالة أزرار التصفية
 * @param {string} activeFilter - النوع النشط
 */
function updateFilterButtons(activeFilter) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        const btnFilter = btn.getAttribute('data-filter');
        if (btnFilter === activeFilter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// ============================================
// تصدير الدوال للاستخدام العام
// ============================================

// جعل الدوال متاحة عالمياً
window.initializeMap = initializeMap;
window.retryLocation = retryLocation;
window.filterMarkers = filterMarkers;

// ============================================
// رسالة في وحدة التحكم
// ============================================

console.log('%c🗺️ خريطة أقرب أماكن إعادة التدوير', 'font-size: 18px; font-weight: bold; color: #2E7D32;');
console.log('%cتم تحميل ملف map.js بنجاح', 'font-size: 12px; color: #616161;');
console.log('%cعدد نقاط التدوير المتاحة: ' + RECYCLING_POINTS.length, 'font-size: 12px; color: #616161;');
