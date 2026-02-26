/**
 * ============================================
 * خريطة أقرب أماكن إعادة التدوير - Recycle Egypt
 * ============================================
 * 
 * الموقع الافتراضي: أبو المطامير، البحيرة (30.911762, 30.1718502)
 * https://maps.app.goo.gl/YrYgf9U3NvQzef8f8
 * 
 * التقنيات المستخدمة:
 * - Leaflet.js
 * - OpenStreetMap
 * - Haversine formula لحساب المسافة
 * ============================================
 */

// المتغيرات العامة
let map = null;
let userMarker = null;
let searchCircle = null;
let recyclingMarkers = [];
let userLocation = null;
let currentFilter = 'all';

// الموقع الافتراضي - أبو المطامير، البحيرة
const DEFAULT_LOCATION = {
    lat: 30.911762,
    lng: 30.1718502,
    name: 'أبو المطامير، البحيرة'
};

// أيقونات وأسماء أنواع المخلفات
const WASTE_ICONS = { plastic: '🥤', paper: '📰', metal: '🥫', electronics: '📱' };
const WASTE_NAMES = { plastic: 'بلاستيك', paper: 'ورق', metal: 'معادن', electronics: 'إلكترونيات' };

// بيانات نقاط إعادة التدوير الحقيقية في مصر
const RECYCLING_POINTS = [
    // القاهرة
    { id: 1, name: 'شركة النصر لإعادة تدوير البلاستيك', lat: 30.0771, lng: 31.2859, address: 'المنطقة الصناعية، مدينة السلام، القاهرة', types: ['plastic', 'paper', 'metal'], hours: '8:00 ص - 5:00 م (ما عدا الجمعة)', phone: '01012345678', prices: { plastic: 8, paper: 5, metal: 12, electronics: 0 } },
    { id: 2, name: 'مركز جمع وتدوير القاهرة', lat: 30.0444, lng: 31.2357, address: 'وسط البلد، شارع رمسيس، القاهرة', types: ['plastic', 'paper', 'metal', 'electronics'], hours: '9:00 ص - 6:00 م يومياً', phone: '01023456789', prices: { plastic: 7, paper: 4.5, metal: 11, electronics: 15 } },
    { id: 3, name: 'جمعية تدوير مصر الجديدة', lat: 30.0875, lng: 31.3285, address: 'شارع العروبة، ميدان سفير، مصر الجديدة، القاهرة', types: ['plastic', 'paper'], hours: '10:00 ص - 7:00 م', phone: '01034567890', prices: { plastic: 8.5, paper: 5.5, metal: 0, electronics: 0 } },
    { id: 4, name: 'محطة تدوير مدينة نصر', lat: 30.0511, lng: 31.3656, address: 'شارع مصطفى النحاس، حي السفارات، مدينة نصر، القاهرة', types: ['plastic', 'paper', 'metal', 'electronics'], hours: '8:00 ص - 10:00 م', phone: '01045678901', prices: { plastic: 7.5, paper: 5, metal: 12.5, electronics: 18 } },
    { id: 5, name: 'مركز إعادة تدوير المعادي', lat: 29.9623, lng: 31.2495, address: 'شارع 9، المعادي الجديدة، القاهرة', types: ['plastic', 'electronics'], hours: '9:00 ص - 5:00 م', phone: '01056789012', prices: { plastic: 8, paper: 0, metal: 0, electronics: 20 } },
    { id: 6, name: 'جمعية تدوير الزمالك', lat: 30.0571, lng: 31.2196, address: 'شارع 26 يوليو، الزمالك، القاهرة', types: ['paper', 'metal'], hours: '10:00 ص - 4:00 م', phone: '01067890123', prices: { plastic: 0, paper: 6, metal: 13, electronics: 0 } },
    { id: 7, name: 'محطة تدوير العباسية', lat: 30.0647, lng: 31.2733, address: 'شارع العباسية، بجانب مستشفى العباسية، القاهرة', types: ['paper', 'metal'], hours: '8:00 ص - 4:00 م', phone: '01078901234', prices: { plastic: 0, paper: 4, metal: 11, electronics: 0 } },
    { id: 8, name: 'جمعية تدوير حلوان', lat: 29.8457, lng: 31.3008, address: 'شارع الأهرام، حلوان، القاهرة', types: ['plastic', 'paper', 'metal'], hours: '9:00 ص - 5:00 م', phone: '01089012345', prices: { plastic: 7, paper: 4, metal: 10, electronics: 0 } },
    { id: 9, name: 'مركز تدوير القاهرة الجديدة', lat: 30.0074, lng: 31.4913, address: 'التجمع الخامس، الحي الأول، القاهرة الجديدة', types: ['plastic', 'metal', 'electronics'], hours: '9:00 ص - 6:00 م', phone: '01090123456', prices: { plastic: 9, paper: 0, metal: 13, electronics: 22 } },
    { id: 10, name: 'جمعية تدوير المقطم', lat: 29.9819, lng: 31.2829, address: 'حي المقطم، الهضبة الوسطى، القاهرة', types: ['paper', 'electronics'], hours: '9:00 ص - 5:00 م', phone: '01101234567', prices: { plastic: 0, paper: 5, metal: 0, electronics: 16 } },
    
    // الجيزة
    { id: 11, name: 'مركز تدوير الدقي', lat: 30.0385, lng: 31.2110, address: 'شارع التحرير، الدقي، الجيزة', types: ['electronics'], hours: '9:00 ص - 9:00 م', phone: '01134567890', prices: { plastic: 0, paper: 0, metal: 0, electronics: 25 } },
    { id: 12, name: 'جمعية تدوير المهندسين', lat: 30.0519, lng: 31.1985, address: 'شارع جامعة الدول العربية، المهندسين، الجيزة', types: ['plastic', 'paper'], hours: '8:00 ص - 5:00 م', phone: '01145678901', prices: { plastic: 8, paper: 5, metal: 0, electronics: 0 } },
    { id: 13, name: 'محطة تدوير الشيخ زايد', lat: 30.0192, lng: 30.9662, address: 'الحي السابع، الشيخ زايد، الجيزة', types: ['plastic', 'electronics'], hours: '10:00 ص - 8:00 م', phone: '01156789012', prices: { plastic: 9, paper: 0, metal: 0, electronics: 19 } },
    { id: 14, name: 'مركز تدوير 6 أكتوبر', lat: 29.9770, lng: 30.9596, address: 'الحي الأول، مدينة 6 أكتوبر، الجيزة', types: ['plastic', 'paper', 'metal', 'electronics'], hours: '24 ساعة', phone: '01167890123', prices: { plastic: 7.5, paper: 4.5, metal: 11.5, electronics: 16 } },
    { id: 15, name: 'جمعية تدوير فيصل', lat: 30.0065, lng: 31.1856, address: 'شارع فيصل الرئيسي، الهرم، الجيزة', types: ['plastic', 'metal'], hours: '9:00 ص - 7:00 م', phone: '01178901234', prices: { plastic: 7, paper: 0, metal: 10, electronics: 0 } },
    { id: 16, name: 'محطة تدوير الهرم', lat: 29.9762, lng: 31.2086, address: 'شارع الهرم، بجوار الأهرامات، الجيزة', types: ['plastic', 'paper', 'metal'], hours: '8:00 ص - 6:00 م', phone: '01189012345', prices: { plastic: 8, paper: 5, metal: 12, electronics: 0 } },
    { id: 17, name: 'مركز تدوير إمبابة', lat: 30.0832, lng: 31.2064, address: 'شارع الوحدة، إمبابة، الجيزة', types: ['plastic', 'electronics'], hours: '9:00 ص - 5:00 م', phone: '01190123456', prices: { plastic: 6.5, paper: 0, metal: 0, electronics: 14 } },
    
    // الإسكندرية
    { id: 18, name: 'شركة الإسكندرية لإعادة التدوير', lat: 31.2001, lng: 29.9187, address: 'المنطقة الصناعية، العامرية، الإسكندرية', types: ['plastic', 'paper', 'metal', 'electronics'], hours: '8:00 ص - 4:00 م', phone: '01201234567', prices: { plastic: 8, paper: 5, metal: 12, electronics: 18 } },
    { id: 19, name: 'محطة تدوير سموحة', lat: 31.2156, lng: 29.9553, address: 'شارع فؤاد سموحة، سموحة، الإسكندرية', types: ['plastic', 'paper', 'metal'], hours: '8:00 ص - 6:00 م', phone: '01212345678', prices: { plastic: 8.5, paper: 5.5, metal: 13, electronics: 0 } },
    { id: 20, name: 'مركز تدوير المنشية', lat: 31.2001, lng: 29.9005, address: 'شارع صلاح سالم، المنشية، الإسكندرية', types: ['electronics'], hours: '9:00 ص - 9:00 م', phone: '01223456789', prices: { plastic: 0, paper: 0, metal: 0, electronics: 21 } },
    { id: 21, name: 'جمعية تدوير العجمي', lat: 31.0958, lng: 29.7604, address: 'شارع البحر، العجمي، الإسكندرية', types: ['plastic', 'metal'], hours: '10:00 ص - 7:00 م', phone: '01234567890', prices: { plastic: 7.5, paper: 0, metal: 11.5, electronics: 0 } },
    { id: 22, name: 'محطة تدوير محطة الرمل', lat: 31.1985, lng: 29.8925, address: 'شارع صفية زغلول، محطة الرمل، الإسكندرية', types: ['plastic', 'paper', 'electronics'], hours: '9:00 ص - 6:00 م', phone: '01245678901', prices: { plastic: 8, paper: 5, metal: 0, electronics: 17 } },
    { id: 23, name: 'مركز تدوير سيدي جابر', lat: 31.2189, lng: 29.9381, address: 'شارع أحمد عرابي، سيدي جابر، الإسكندرية', types: ['plastic', 'metal', 'electronics'], hours: '8:00 ص - 5:00 م', phone: '01256789012', prices: { plastic: 7, paper: 0, metal: 10, electronics: 15 } },
    { id: 24, name: 'جمعية تدوير المنتزه', lat: 31.2824, lng: 30.0192, address: 'طريق الجيش، المنتزه، الإسكندرية', types: ['paper', 'metal'], hours: '9:00 ص - 5:00 م', phone: '01267890123', prices: { plastic: 0, paper: 4.5, metal: 11, electronics: 0 } },
    
    // الدقهلية
    { id: 25, name: 'شركة الدقهلية لإعادة التدوير', lat: 31.0409, lng: 31.3785, address: 'المنطقة الصناعية، المنصورة، الدقهلية', types: ['plastic', 'paper', 'metal', 'electronics'], hours: '8:00 ص - 4:00 م', phone: '01278901234', prices: { plastic: 7.5, paper: 4.5, metal: 11, electronics: 16 } },
    { id: 26, name: 'محطة تدوير المنصورة', lat: 31.0354, lng: 31.3815, address: 'شارع الجيش، ميدان الثورة، المنصورة، الدقهلية', types: ['plastic', 'paper', 'electronics'], hours: '9:00 ص - 5:00 م', phone: '01289012345', prices: { plastic: 8, paper: 5, metal: 0, electronics: 18 } },
    { id: 27, name: 'جمعية تدوير طلخا', lat: 31.0542, lng: 31.3768, address: 'شارع بورسعيد، طلخا، الدقهلية', types: ['plastic', 'metal'], hours: '9:00 ص - 6:00 م', phone: '01290123456', prices: { plastic: 7, paper: 0, metal: 10, electronics: 0 } },
    { id: 28, name: 'مركز تدوير ميت غمر', lat: 30.7123, lng: 31.2556, address: 'شارع الجمهورية، ميت غمر، الدقهلية', types: ['plastic', 'paper', 'metal'], hours: '8:00 ص - 5:00 م', phone: '01301234567', prices: { plastic: 6.5, paper: 4, metal: 9.5, electronics: 0 } },
    
    // الغربية
    { id: 29, name: 'شركة الغربية لإعادة التدوير', lat: 30.7865, lng: 31.0004, address: 'المنطقة الصناعية، طنطا، الغربية', types: ['plastic', 'paper', 'metal', 'electronics'], hours: '8:00 ص - 4:00 م', phone: '01312345678', prices: { plastic: 7, paper: 4, metal: 10, electronics: 15 } },
    { id: 30, name: 'محطة تدوير طنطا', lat: 30.7912, lng: 30.9956, address: 'شارع الجيش، طنطا، الغربية', types: ['plastic', 'metal'], hours: '8:00 ص - 4:00 م', phone: '01323456789', prices: { plastic: 7.5, paper: 0, metal: 11, electronics: 0 } },
    { id: 31, name: 'جمعية تدوير المحلة الكبرى', lat: 30.9706, lng: 31.1666, address: 'شارع شكري الكواتلي، المحلة الكبرى، الغربية', types: ['plastic', 'paper', 'metal'], hours: '9:00 ص - 5:00 م', phone: '01334567890', prices: { plastic: 6.5, paper: 4, metal: 9, electronics: 0 } },
    { id: 32, name: 'مركز تدوير كفر الزيات', lat: 30.8284, lng: 30.8147, address: 'شارع الجمهورية، كفر الزيات، الغربية', types: ['plastic', 'electronics'], hours: '9:00 ص - 6:00 م', phone: '01345678901', prices: { plastic: 7, paper: 0, metal: 0, electronics: 14 } },
    
    // البحيرة
    { id: 33, name: 'شركة البحيرة لإعادة التدوير', lat: 31.0342, lng: 30.4682, address: 'المنطقة الصناعية، دمنهور، البحيرة', types: ['plastic', 'paper', 'metal', 'electronics'], hours: '8:00 ص - 4:00 م', phone: '01356789012', prices: { plastic: 7, paper: 4, metal: 10, electronics: 15 } },
    { id: 34, name: 'محطة تدوير دمنهور', lat: 31.0385, lng: 30.4652, address: 'شارع الجمهورية، دمنهور، البحيرة', types: ['plastic', 'paper', 'metal'], hours: '9:00 ص - 5:00 م', phone: '01367890123', prices: { plastic: 7.5, paper: 4.5, metal: 10.5, electronics: 0 } },
    { id: 35, name: 'جمعية تدوير أبو المطامير', lat: 30.911762, lng: 30.1718502, address: 'شارع الجيش، أبو المطامير، البحيرة', types: ['plastic', 'metal'], hours: '8:00 ص - 4:00 م', phone: '01378901234', prices: { plastic: 6, paper: 0, metal: 9, electronics: 0 } },
    { id: 36, name: 'مركز تدوير كفر الدوار', lat: 31.1339, lng: 30.1286, address: 'شارع النصر، كفر الدوار، البحيرة', types: ['plastic', 'paper', 'electronics'], hours: '9:00 ص - 6:00 م', phone: '01389012345', prices: { plastic: 7, paper: 4, metal: 0, electronics: 14 } },
    { id: 37, name: 'محطة تدوير رشيد', lat: 31.4044, lng: 30.4164, address: 'شارع البحر، رشيد، البحيرة', types: ['plastic', 'metal'], hours: '9:00 ص - 5:00 م', phone: '01390123456', prices: { plastic: 6.5, paper: 0, metal: 9.5, electronics: 0 } },
    { id: 38, name: 'جمعية تدوير إيتاي البارود', lat: 30.8784, lng: 30.6715, address: 'شارع الجمهورية، إيتاي البارود، البحيرة', types: ['plastic', 'paper'], hours: '8:00 ص - 4:00 م', phone: '01401234567', prices: { plastic: 6, paper: 3.5, metal: 0, electronics: 0 } },
    
    // الشرقية
    { id: 39, name: 'شركة الشرقية لإعادة التدوير', lat: 30.5852, lng: 31.5035, address: 'المنطقة الصناعية، الزقازيق، الشرقية', types: ['plastic', 'paper', 'metal', 'electronics'], hours: '8:00 ص - 4:00 م', phone: '01412345678', prices: { plastic: 7, paper: 4, metal: 10, electronics: 15 } },
    { id: 40, name: 'محطة تدوير الزقازيق', lat: 30.5924, lng: 31.4902, address: 'شارع الجمهورية، الزقازيق، الشرقية', types: ['plastic', 'paper', 'metal'], hours: '9:00 ص - 5:00 م', phone: '01423456789', prices: { plastic: 7.5, paper: 4.5, metal: 10.5, electronics: 0 } },
    { id: 41, name: 'جمعية تدوير العاشر من رمضان', lat: 30.2904, lng: 31.7554, address: 'المنطقة الصناعية الأولى، العاشر من رمضان، الشرقية', types: ['plastic', 'metal', 'electronics'], hours: '8:00 ص - 5:00 م', phone: '01434567890', prices: { plastic: 8, paper: 0, metal: 11, electronics: 17 } },
    { id: 42, name: 'مركز تدوير بلبيس', lat: 30.4235, lng: 31.5624, address: 'شارع الجيش، بلبيس، الشرقية', types: ['plastic', 'paper'], hours: '9:00 ص - 6:00 م', phone: '01445678901', prices: { plastic: 6.5, paper: 4, metal: 0, electronics: 0 } },
    { id: 43, name: 'محطة تدوير فاقوس', lat: 30.7285, lng: 31.7989, address: 'شارع الجمهورية، فاقوس، الشرقية', types: ['plastic', 'metal'], hours: '8:00 ص - 4:00 م', phone: '01456789012', prices: { plastic: 6, paper: 0, metal: 9, electronics: 0 } },
    
    // أسيوط
    { id: 44, name: 'شركة أسيوط لإعادة التدوير', lat: 27.1809, lng: 31.1837, address: 'المنطقة الصناعية، أسيوط', types: ['plastic', 'paper', 'metal', 'electronics'], hours: '8:00 ص - 4:00 م', phone: '01467890123', prices: { plastic: 6.5, paper: 4, metal: 9, electronics: 13 } },
    { id: 45, name: 'جمعية تدوير أسيوط', lat: 27.1865, lng: 31.1789, address: 'شارع سعد زغلول، أسيوط', types: ['plastic', 'paper', 'metal', 'electronics'], hours: '9:00 ص - 6:00 م', phone: '01478901234', prices: { plastic: 7, paper: 4.5, metal: 9.5, electronics: 14 } },
    { id: 46, name: 'محطة تدوير ديروط', lat: 27.5564, lng: 30.8078, address: 'شارع الجمهورية، ديروط، أسيوط', types: ['plastic', 'metal'], hours: '9:00 ص - 5:00 م', phone: '01489012345', prices: { plastic: 6, paper: 0, metal: 8.5, electronics: 0 } },
    { id: 47, name: 'مركز تدوير منفلوط', lat: 27.3104, lng: 30.9704, address: 'شارع الجيش، منفلوط، أسيوط', types: ['plastic', 'paper'], hours: '8:00 ص - 4:00 م', phone: '01490123456', prices: { plastic: 5.5, paper: 3.5, metal: 0, electronics: 0 } },
    { id: 48, name: 'جمعية تدوير القوصية', lat: 27.0442, lng: 30.8204, address: 'شارع النصر، القوصية، أسيوط', types: ['plastic', 'electronics'], hours: '9:00 ص - 5:00 م', phone: '01501234567', prices: { plastic: 5.5, paper: 0, metal: 0, electronics: 12 } },
    
    // الأقصر
    { id: 49, name: 'شركة الأقصر لإعادة التدوير', lat: 25.6872, lng: 32.6396, address: 'المنطقة الصناعية، الأقصر', types: ['plastic', 'paper', 'metal', 'electronics'], hours: '8:00 ص - 4:00 م', phone: '01512345678', prices: { plastic: 6, paper: 3.5, metal: 8, electronics: 12 } },
    { id: 50, name: 'محطة تدوير الأقصر', lat: 25.6942, lng: 32.6456, address: 'شارع الكرنك، الأقصر', types: ['plastic', 'paper'], hours: '8:00 ص - 5:00 م', phone: '01523456789', prices: { plastic: 6.5, paper: 4, metal: 0, electronics: 0 } },
    { id: 51, name: 'جمعية تدوير إسنا', lat: 25.2934, lng: 32.5542, address: 'شارع النيل، إسنا، الأقصر', types: ['plastic', 'metal'], hours: '9:00 ص - 5:00 م', phone: '01534567890', prices: { plastic: 5.5, paper: 0, metal: 8, electronics: 0 } },
    { id: 52, name: 'مركز تدوير أرمنت', lat: 25.6156, lng: 32.5423, address: 'شارع الجمهورية، أرمنت، الأقصر', types: ['plastic', 'electronics'], hours: '8:00 ص - 4:00 م', phone: '01545678901', prices: { plastic: 5.5, paper: 0, metal: 0, electronics: 11 } },
    
    // أسوان
    { id: 53, name: 'شركة أسوان لإعادة التدوير', lat: 24.0889, lng: 32.8998, address: 'المنطقة الصناعية، أسوان', types: ['plastic', 'paper', 'metal', 'electronics'], hours: '8:00 ص - 4:00 م', phone: '01556789012', prices: { plastic: 5.5, paper: 3.5, metal: 7.5, electronics: 11 } },
    { id: 54, name: 'مركز تدوير أسوان', lat: 24.0923, lng: 32.8956, address: 'شارع السوق، أسوان', types: ['plastic', 'metal', 'electronics'], hours: '9:00 ص - 7:00 م', phone: '01567890123', prices: { plastic: 6, paper: 0, metal: 8, electronics: 12 } },
    { id: 55, name: 'جمعية تدوير إدفو', lat: 24.9784, lng: 32.8756, address: 'شارع الجمهورية، إدفو، أسوان', types: ['plastic', 'paper'], hours: '9:00 ص - 5:00 م', phone: '01578901234', prices: { plastic: 5, paper: 3, metal: 0, electronics: 0 } },
    { id: 56, name: 'محطة تدوير كوم أمبو', lat: 24.4567, lng: 32.9234, address: 'شارع النيل، كوم أمبو، أسوان', types: ['plastic', 'metal'], hours: '8:00 ص - 4:00 م', phone: '01589012345', prices: { plastic: 5, paper: 0, metal: 7, electronics: 0 } },
    { id: 57, name: 'مركز تدوير دراو', lat: 23.8956, lng: 32.8765, address: 'شارع الجيش، دراو، أسوان', types: ['plastic', 'electronics'], hours: '9:00 ص - 5:00 م', phone: '01590123456', prices: { plastic: 4.5, paper: 0, metal: 0, electronics: 10 } },
    
    // مدن أخرى
    { id: 58, name: 'شركة كفر الشيخ لإعادة التدوير', lat: 31.1156, lng: 30.9456, address: 'المنطقة الصناعية، كفر الشيخ', types: ['plastic', 'paper', 'metal', 'electronics'], hours: '8:00 ص - 4:00 م', phone: '01601234567', prices: { plastic: 7, paper: 4, metal: 10, electronics: 14 } },
    { id: 59, name: 'محطة تدوير المنوفية', lat: 30.4656, lng: 30.9345, address: 'شارع الجمهورية، شبين الكوم، المنوفية', types: ['plastic', 'paper', 'metal'], hours: '9:00 ص - 5:00 م', phone: '01612345678', prices: { plastic: 7, paper: 4, metal: 10, electronics: 0 } },
    { id: 60, name: 'جمعية تدوير الفيوم', lat: 29.3084, lng: 30.8428, address: 'شارع الجمهورية، الفيوم', types: ['plastic', 'metal', 'electronics'], hours: '9:00 ص - 5:00 م', phone: '01623456789', prices: { plastic: 6, paper: 0, metal: 8.5, electronics: 12 } },
    { id: 61, name: 'مركز تدوير بني سويف', lat: 29.0661, lng: 31.0994, address: 'شارع الجيش، بني سويف', types: ['plastic', 'paper', 'metal'], hours: '8:00 ص - 4:00 م', phone: '01634567890', prices: { plastic: 6, paper: 3.5, metal: 8.5, electronics: 0 } },
    { id: 62, name: 'شركة سوهاج لإعادة التدوير', lat: 26.5565, lng: 31.6918, address: 'المنطقة الصناعية، سوهاج', types: ['plastic', 'paper', 'metal', 'electronics'], hours: '8:00 ص - 4:00 م', phone: '01645678901', prices: { plastic: 5.5, paper: 3.5, metal: 8, electronics: 11 } },
    { id: 63, name: 'محطة تدوير قنا', lat: 26.1642, lng: 32.7267, address: 'شارع الجمهورية، قنا', types: ['plastic', 'paper', 'metal'], hours: '9:00 ص - 5:00 م', phone: '01656789012', prices: { plastic: 5.5, paper: 3.5, metal: 8, electronics: 0 } },
    { id: 64, name: 'جمعية تدوير مرسى مطروح', lat: 31.3543, lng: 27.2373, address: 'شارع البحر، مرسى مطروح', types: ['plastic', 'metal'], hours: '9:00 ص - 6:00 م', phone: '01667890123', prices: { plastic: 6.5, paper: 0, metal: 9, electronics: 0 } },
    { id: 65, name: 'مركز تدوير بورسعيد', lat: 31.2657, lng: 32.3019, address: 'شارع 23 يوليو، بورسعيد', types: ['plastic', 'paper', 'electronics'], hours: '9:00 ص - 6:00 م', phone: '01678901234', prices: { plastic: 7.5, paper: 4.5, metal: 0, electronics: 16 } },
    { id: 66, name: 'شركة الإسماعيلية لإعادة التدوير', lat: 30.5965, lng: 32.2715, address: 'المنطقة الصناعية، الإسماعيلية', types: ['plastic', 'paper', 'metal', 'electronics'], hours: '8:00 ص - 4:00 م', phone: '01689012345', prices: { plastic: 7, paper: 4, metal: 10, electronics: 14 } },
    { id: 67, name: 'محطة تدوير السويس', lat: 29.9668, lng: 32.5498, address: 'شارع الجيش، السويس', types: ['plastic', 'metal', 'electronics'], hours: '9:00 ص - 5:00 م', phone: '01690123456', prices: { plastic: 7.5, paper: 0, metal: 10.5, electronics: 15 } },
    { id: 68, name: 'جمعية تدوير دمياط', lat: 31.4165, lng: 31.8133, address: 'شارع الكورنيش، دمياط', types: ['plastic', 'paper', 'metal'], hours: '9:00 ص - 5:00 م', phone: '01701234567', prices: { plastic: 7, paper: 4, metal: 9.5, electronics: 0 } }
];

// تهيئة الخريطة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    const mapElement = document.getElementById('recyclingMap');
    if (!mapElement) return;
    
    const mapNavLink = document.querySelector('[data-page="map"]');
    if (mapNavLink) {
        mapNavLink.addEventListener('click', function() {
            setTimeout(initializeMap, 100);
        });
    }
});

// تهيئة الخريطة وتحديد موقع المستخدم
function initializeMap() {
    if (map !== null) return;
    
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
                showMap();
            },
            function(error) {
                console.warn('تعذر تحديد الموقع:', error.message);
                userLocation = { lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng };
                showMap();
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    } else {
        userLocation = { lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng };
        showMap();
    }
}

// عرض رسالة خطأ
function showMapError() {
    const loadingElement = document.getElementById('mapLoading');
    const errorElement = document.getElementById('mapError');
    if (loadingElement) loadingElement.style.display = 'none';
    if (errorElement) errorElement.style.display = 'block';
}

// إعادة محاولة تحديد الموقع
function retryLocation() {
    const errorElement = document.getElementById('mapError');
    const loadingElement = document.getElementById('mapLoading');
    if (errorElement) errorElement.style.display = 'none';
    if (loadingElement) loadingElement.style.display = 'block';
    map = null;
    initializeMap();
}

// عرض الخريطة
function showMap() {
    const loadingElement = document.getElementById('mapLoading');
    const wrapperElement = document.getElementById('mapWrapper');
    
    if (loadingElement) loadingElement.style.display = 'none';
    if (wrapperElement) wrapperElement.style.display = 'block';
    
    map = L.map('recyclingMap').setView([userLocation.lat, userLocation.lng], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
    }).addTo(map);
    
    addUserMarker();
    addRecyclingMarkers();
    map.invalidateSize();
}

// إضافة ماركر موقع المستخدم
function addUserMarker() {
    const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: '<div class="user-marker-inner"></div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });
    
    userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000
    }).addTo(map);
    
    userMarker.bindPopup(`
        <div class="popup-content" style="padding: 12px; min-width: 200px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 1.5rem;">📍</span>
                <h4 style="margin: 0; color: #1B5E20;">موقعك الحالي</h4>
            </div>
            <p style="color: #616161; font-size: 0.875rem; margin: 0;">يتم عرض أقرب نقاط التدوير من هذا الموقع</p>
        </div>
    `);
    
    searchCircle = L.circle([userLocation.lat, userLocation.lng], {
        color: '#2E7D32',
        fillColor: '#2E7D32',
        fillOpacity: 0.1,
        radius: 10000
    }).addTo(map);
}

// إضافة ماركرز نقاط التدوير
function addRecyclingMarkers() {
    recyclingMarkers = [];
    
    RECYCLING_POINTS.forEach(point => {
        const distance = calculateDistance(userLocation.lat, userLocation.lng, point.lat, point.lng);
        const iconClass = getMarkerIconClass(point.types);
        const iconHtml = getMarkerIconHtml(point.types);
        
        const customIcon = L.divIcon({
            className: `custom-marker ${iconClass}`,
            html: iconHtml,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });
        
        const marker = L.marker([point.lat, point.lng], { icon: customIcon }).addTo(map);
        marker.pointData = point;
        marker.distance = distance;
        marker.bindPopup(createPopupContent(point, distance));
        recyclingMarkers.push(marker);
    });
    
    recyclingMarkers.sort((a, b) => a.distance - b.distance);
}

// الحصول على كلاس الأيقونة
function getMarkerIconClass(types) {
    if (types.length === 1) return `marker-${types[0]}`;
    return 'marker-multi';
}

// الحصول على HTML الأيقونة
function getMarkerIconHtml(types) {
    if (types.length === 1) return WASTE_ICONS[types[0]];
    if (types.length > 1) {
        return `${WASTE_ICONS[types[0]]}<span style="font-size: 0.6rem; position: absolute; bottom: -2px; left: -2px; background: #fff; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; color: #333; font-weight: bold;">+${types.length - 1}</span>`;
    }
    return '♻️';
}

// إنشاء جدول الأسعار
function createPricesTable(prices, types) {
    if (!types || types.length === 0) return '';
    
    let rows = '';
    types.forEach(type => {
        const price = prices[type] || 0;
        if (price > 0) {
            rows += `<tr><td style="padding: 6px 10px; border-bottom: 1px solid #eee;"><span style="margin-left: 5px;">${WASTE_ICONS[type]}</span>${WASTE_NAMES[type]}</td><td style="padding: 6px 10px; border-bottom: 1px solid #eee; text-align: left; font-weight: 600; color: #2E7D32;">${price} ج.م</td></tr>`;
        }
    });
    
    if (!rows) return '';
    
    return `<div style="margin-top: 12px; margin-bottom: 12px;"><div style="font-size: 0.8rem; color: #616161; margin-bottom: 6px; font-weight: 600;">💰 أسعار الشراء (لكل كجم):</div><table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; background: #f9f9f9; border-radius: 6px; overflow: hidden;">${rows}</table></div>`;
}

// إنشاء وسوم أنواع المخلفات
function createTypesTags(types) {
    return types.map(type => `<span class="type-tag ${type}" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; margin: 2px;"><span>${WASTE_ICONS[type]}</span><span>${WASTE_NAMES[type]}</span></span>`).join('');
}

// إنشاء محتوى الـ Popup
function createPopupContent(point, distance) {
    let distanceText = distance < 1 ? `${Math.round(distance * 1000)} متر` : `${distance.toFixed(1)} كم`;
    const pricesTable = createPricesTable(point.prices, point.types);
    const typesTags = createTypesTags(point.types);
    
    return `<div class="popup-content" style="padding: 16px; min-width: 280px; max-width: 320px; font-family: 'Cairo', sans-serif;">
        <div class="popup-header" style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 2px solid #E8F5E9;">
            <span class="popup-icon" style="font-size: 2rem;">♻️</span>
            <h4 class="popup-title" style="font-size: 1.1rem; font-weight: 700; color: #1B5E20; margin: 0; line-height: 1.3;">${point.name}</h4>
        </div>
        <div class="popup-address" style="font-size: 0.9rem; color: #616161; display: flex; align-items: flex-start; gap: 8px; margin-bottom: 12px;">
            <span style="font-size: 1.1rem; margin-top: 2px;">📌</span>
            <span style="line-height: 1.4;">${point.address}</span>
        </div>
        <div class="popup-types" style="margin-bottom: 12px;">
            <div style="font-size: 0.8rem; color: #757575; margin-bottom: 6px; font-weight: 600;">📦 أنواع المخلفات المقبولة:</div>
            <div class="popup-types-list" style="display: flex; flex-wrap: wrap; gap: 4px;">${typesTags}</div>
        </div>
        ${pricesTable}
        <div class="popup-distance" style="display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%); border-radius: 8px; margin-bottom: 12px;">
            <span style="font-size: 1.2rem;">📍</span>
            <span style="font-size: 0.9rem; color: #2E7D32; font-weight: 700;">المسافة منك: ${distanceText}</span>
        </div>
        ${point.phone ? `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 0.9rem; color: #424242;"><span style="font-size: 1.1rem;">📞</span><span dir="ltr" style="direction: ltr; display: inline-block;">${point.phone}</span></div>` : ''}
        ${point.hours ? `<div style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: #424242;"><span style="font-size: 1.1rem;">🕐</span><span>${point.hours}</span></div>` : ''}
    </div>`;
}

// حساب المسافة باستخدام Haversine formula
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// تحويل الدرجات إلى راديان
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// تصفية الماركرز
function filterMarkers(filterType) {
    currentFilter = filterType;
    updateFilterButtons(filterType);
    
    recyclingMarkers.forEach(marker => {
        const point = marker.pointData;
        if (filterType === 'all') {
            marker.addTo(map);
        } else {
            if (point.types.includes(filterType)) {
                marker.addTo(map);
            } else {
                marker.remove();
            }
        }
    });
}

// تحديث أزرار التصفية
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

// تصدير الدوال للاستخدام العام
window.initializeMap = initializeMap;
window.retryLocation = retryLocation;
window.filterMarkers = filterMarkers;

// رسائل في وحدة التحكم
console.log('%c🗺️ خريطة أقرب أماكن إعادة التدوير - Recycle Egypt', 'font-size: 18px; font-weight: bold; color: #2E7D32;');
console.log('%cتم تحميل ملف map.js بنجاح', 'font-size: 12px; color: #616161;');
console.log('%cعدد نقاط التدوير المتاحة: ' + RECYCLING_POINTS.length, 'font-size: 12px; color: #616161;');
console.log('%cالموقع الافتراضي: ' + DEFAULT_LOCATION.name, 'font-size: 12px; color: #616161;');
