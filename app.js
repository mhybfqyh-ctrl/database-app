console.log("اليقين يعمل");

// app.js - تطبيق تخزين محلي بسيط (localStorage)
// مفترض أن index.html يحمل عناصر بعينها: #peopleCount, #facilityCount, #totalCount, #recordsList
(() => {
  const STORAGE_KEY = 'yqeen_records_v1';

  // DOM references
  const peopleCountEl = document.getElementById('peopleCount');
  const facilityCountEl = document.getElementById('facilityCount');
  const totalCountEl = document.getElementById('totalCount');
  const recordsListEl = document.getElementById('recordsList');
  const headerEl = document.querySelector('.app-header');

  // تحميل السجلات
  function loadRecords() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('فشل تحميل السجلات', e);
      return [];
    }
  }

  // حفظ السجلات
  function saveRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  // إنشاء هوية فريدة
  function genId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8);
  }

  // تنسيق التاريخ بالعربية
  function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleString('ar-EG', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
  }

  // إضافة سجل عام
  function createRecord(type, name, details = '') {
    const rec = {
      id: genId(),
      type, // 'person' | 'facility'
      name: name || (type === 'person' ? 'شخص' : 'منشأة'),
      details,
      createdAt: Date.now()
    };
    const records = loadRecords();
    records.push(rec);
    saveRecords(records);
    render();
  }

  // حذف سجل بـ id
  function deleteRecord(id) {
    let records = loadRecords();
    records = records.filter(r => r.id !== id);
    saveRecords(records);
    render();
  }

  // حذف كل السجلات بعد تأكيد
  function clearAll() {
    if (!confirm('هل أنت متأكد من حذف جميع السجلات؟ هذا الإجراء لا يمكن التراجع عنه.')) return;
    localStorage.removeItem(STORAGE_KEY);
    render();
  }

  // تصدير السجلات كملف JSON
  function exportJSON() {
    const records = loadRecords();
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'yqeen-records.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  // عرض السجلات والأعداد
  function render() {
    const records = loadRecords();

    const peopleCount = records.filter(r => r.type === 'person').length;
    const facilityCount = records.filter(r => r.type === 'facility').length;
    peopleCountEl.textContent = peopleCount;
    facilityCountEl.textContent = facilityCount;
    totalCountEl.textContent = records.length;

    // Render list (أحدث أولاً)
    recordsListEl.innerHTML = '';
    if (records.length === 0) {
      const p = document.createElement('p');
      p.className = 'empty';
      p.textContent = 'لا توجد سجلات حتى الآن';
      recordsListEl.appendChild(p);
      return;
    }

    const sorted = records.slice().sort((a,b) => b.createdAt - a.createdAt);
    sorted.forEach(rec => {
      const card = document.createElement('div');
      card.className = 'record';

      const left = document.createElement('div');
      left.className = 'left';

      const emoji = document.createElement('div');
      emoji.textContent = rec.type === 'person' ? '👤' : '🏢';
      emoji.style.fontSize = '1.6rem';

      const info = document.createElement('div');
      const title = document.createElement('div');
      title.style.fontWeight = '700';
      title.textContent = rec.name;
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = `${rec.type === 'person' ? 'شخص' : 'منشأة'} · ${formatTime(rec.createdAt)}`;
      const details = document.createElement('div');
      details.className = 'meta';
      details.style.marginTop = '6px';
      details.textContent = rec.details || '';

      info.appendChild(title);
      info.appendChild(meta);
      if (rec.details) info.appendChild(details);

      left.appendChild(emoji);
      left.appendChild(info);

      const actions = document.createElement('div');
      actions.className = 'actions';

      const del = document.createElement('button');
      del.className = 'btn-danger';
      del.textContent = 'حذف';
      del.onclick = () => {
        if (confirm('هل تريد حذف هذا السجل؟')) deleteRecord(rec.id);
      };

      actions.appendChild(del);

      card.appendChild(left);
      card.appendChild(actions);

      recordsListEl.appendChild(card);
    });
  }

  // واجهات إضافة عناصر (تستخدم prompt للبساطة)
  window.addPerson = function() {
    const name = prompt('أدخل اسم الشخص:');
    if (!name) return;
    const details = prompt('ملاحظة أو بيانات إضافية (اختياري):') || '';
    createRecord('person', name.trim(), details.trim());
  };

  window.addFacility = function() {
    const name = prompt('أدخل اسم المنشأة:');
    if (!name) return;
    const location = prompt('موقع / ملاحظة (اختياري):') || '';
    createRecord('facility', name.trim(), location.trim());
  };

  // حقن أزرار إضافية في الهيدر (تصدير / مسح)
  function injectHeaderControls() {
    if (!headerEl) return;
    const controls = document.createElement('div');
    controls.className = 'header-controls';

    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn-ghost';
    exportBtn.textContent = 'تصدير JSON';
    exportBtn.onclick = exportJSON;

    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn-ghost';
    clearBtn.textContent = 'حذف الكل';
    clearBtn.onclick = clearAll;

    controls.appendChild(exportBtn);
    controls.appendChild(clearBtn);

    // right side in header (بما أن الصفحة RTL، نضعها في اليمين بتنسيق flex)
    headerEl.appendChild(controls);
  }

  // تهيئة عند التحميل
  function init() {
    injectHeaderControls();
    render();
  }

  // بدء
  document.addEventListener('DOMContentLoaded', init);
})();
