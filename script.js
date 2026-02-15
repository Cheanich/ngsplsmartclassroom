// ================= CANVAS SETUP =================
let wheelSize = 300; // បង្កើតអថេរសម្រាប់រក្សាទំហំកង់

function setupCanvas(canvas, ctx) {
  const dpr = window.devicePixelRatio || 1;
  const scale = 2;
  
  // កែសម្រួលទំហំឱ្យប្រែប្រួលតាមអេក្រង់ (Responsive)
  // Fix: Use actual window dimensions instead of forcing a minimum 1300px
  const safeWidth = window.innerWidth;
  const safeHeight = window.innerHeight;
  
  // Calculate size: On mobile use width, on desktop use height/width ratio
  const baseSize = Math.min(safeWidth * 0.9, safeHeight * 0.85);
  wheelSize = Math.max(300, Math.min(baseSize, 1050) - 150); // ⭐ បន្ថយទំហំ 4cm (150px)

  canvas.width = wheelSize * dpr * scale;
  canvas.height = wheelSize * dpr * scale;
  canvas.style.width = wheelSize + 'px';
  canvas.style.height = wheelSize + 'px';

  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
}

// ================= AUDIO =================
const spinSound = document.getElementById('spinSound');
const resultSound = document.getElementById('resultSound');
const tickSound = document.getElementById('tickSound');
const splashSound = document.getElementById('splashSound');
const tensionSound = document.getElementById('tensionSound');
const applauseSound = document.getElementById('applauseSound');

function stopAllAudio() {
  [spinSound, resultSound, tickSound, splashSound, tensionSound, applauseSound].forEach(s => {
    if (s) {
      s.pause();
      s.currentTime = 0;
    }
  });
}

// ================= RESULT PANEL =================
const panel = document.getElementById('resultPanel');
const btnAdd = document.getElementById('btnAdd');
const btnRemove = document.getElementById('btnRemove');
const btnClose = document.getElementById('btnClose');

btnClose.onclick = () => panel.classList.add('hidden');
btnAdd.onclick = () => panel.classList.add('hidden');

btnRemove.onclick = () => {
  const idx = Number(panel.dataset.current);
  if (!isNaN(idx)) {
    names.splice(idx, 1);
    renderNamesTable();
    drawWheel();
  }
  panel.classList.add('hidden');
};

// ================= SPIN SECTION (UNCHANGED) =================
const nameInput = document.getElementById('nameInput');
const importNames = document.getElementById('importNames');
const exportNames = document.getElementById('exportNames');
const clearNames = document.getElementById('clearNames');
const namesTableBody = document.querySelector('#namesTable tbody');

let names = ['សុនិតា', 'ចីរកាល', 'ជានិច្ច'];

importNames.onclick = () => {
  names = nameInput.value.split(/\r?\n/).map(n => n.trim()).filter(Boolean);
  renderNamesTable();
  drawWheel();
};

exportNames.onclick = () => {
  if (names.length === 0) {
    document.getElementById('emptyInputModal').style.display = 'block';
    return;
  }
  const wsData = names.map((name, index) => ({ "ល.រ": index + 1, "ឈ្មោះសិស្ស": name }));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "បញ្ជីឈ្មោះ");
  XLSX.writeFile(wb, "student_names.xlsx");
};

clearNames.onclick = () => {
  names = [];
  renderNamesTable();
  drawWheel();
};

function renderNamesTable() {
  namesTableBody.innerHTML = '';
  names.forEach((name, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${name}</td>
      <td>
        <div class="table-buttons">
          <button class="btn-add" onclick="addName(${i})">បន្ថែម</button>
          <button class="btn-remove" onclick="removeName(${i})">បិទ</button>
        </div>
      </td>`;
    namesTableBody.appendChild(tr);
  });
  document.getElementById('totalNames').textContent = `សរុប: ${toKhmer(names.length)} នាក់`;
}

window.addName = i => {
  names.splice(i + 1, 0, names[i]);
  renderNamesTable();
  drawWheel();
};

window.removeName = i => {
  names.splice(i, 1);
  renderNamesTable();
  drawWheel();
};

// ================= WHEEL =================
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const spinButton = document.getElementById('spinButton');
const wheelContainer = document.querySelector('.wheel-container');

setupCanvas(canvas, ctx);

let startAngle = 0;
let arc = 0;
const colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#F473B9', '#A6E3E9', '#FF9F45', '#845EC2'];

function drawWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!names.length) return;

  arc = 2 * Math.PI / names.length;
  const center = wheelSize / 2;
  const radius = (wheelSize / 2) - 10; // ដក 10px ទុកគែម

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // កំណត់ទំហំអក្សរតាមទំហំកង់ (Dynamic Font Size)
  ctx.font = `bold ${Math.max(12, wheelSize / 28)}px Khmer OS Battambang`;

  names.forEach((name, i) => {
    const angle = startAngle + i * arc;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, angle, angle + arc);
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    ctx.save();
    ctx.translate(
      center + Math.cos(angle + arc / 2) * radius * 0.62,
      center + Math.sin(angle + arc / 2) * radius * 0.62
    );
    ctx.rotate(angle + arc / 2);
    ctx.fillStyle = '#000';
    ctx.fillText(name, 0, 0);
    ctx.restore();
  });
}

// បង្ហាញទិន្នន័យលំនាំដើម
renderNamesTable();
drawWheel();

// Add Resize Listener (ឱ្យកង់វិលប្តូរទំហំតាមអេក្រង់ពេលប្តូរ Monitor ឬ Resize)
window.addEventListener('resize', () => {
  setupCanvas(canvas, ctx);
  drawWheel();
});

// ================= SPIN LOGIC =================
spinButton.onclick = () => {
  if (!names.length) return;

  const pointer = document.querySelector('.pointer');
  let pointerAngle = 0;

  stopAllAudio(); // Reset សំឡេងចាស់ៗមុនពេលចាប់ផ្តើមថ្មី
  spinSound.loop = true;
  spinSound.volume = 0.3; // កំណត់កម្រិតសំឡេង background ឱ្យល្មម (៣០%)
  spinSound.play().catch(() => {});

  const totalSpins = Math.random() * 2 + 5; // កាត់បន្ថយចំនួនជុំ (៥ ទៅ ៧ ជុំ) ដើម្បីឱ្យវិលយឺតៗ
  const finalAngle = Math.random() * Math.PI * 2;
  const duration = 10000;
  const start = performance.now();
  let lastIdx = -1;

  panel.classList.add('hidden');

  function animate(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 4);

    startAngle = totalSpins * 2 * Math.PI * ease + finalAngle;

    // បន្ថយសំឡេង spin បន្តិចម្តងៗនៅពេលជិតឈប់ (ក្នុង ១ វិនាទីចុងក្រោយ)
    if (t > 0.9) {
      spinSound.volume = Math.max(0, 0.3 * (1 - (t - 0.9) / 0.1));
    }

    // Tick Sound Logic (សំឡេងកកិតពេលបង្វិលកាត់ឈ្មោះ)
    const norm = (2 * Math.PI - startAngle % (2 * Math.PI)) % (2 * Math.PI);
    const currentIdx = Math.floor(norm / arc) % names.length;
    
    pointerAngle *= 0.9; // ធ្វើឱ្យ Pointer ត្រឡប់មកទីតាំងដើមវិញបន្តិចម្តងៗ
    if (lastIdx !== -1 && currentIdx !== lastIdx) {
      // ប្រើ cloneNode ដើម្បីឱ្យសំឡេងកកិតអាចលាន់ត្រួតគ្នាបាន (ស្តាប់ទៅរលូនជាងពេលវិលលឿន)
      const tick = tickSound.cloneNode();
      tick.volume = 0.4;
      tick.play().catch(() => {});
      pointerAngle = 15 * Math.pow(1 - t, 2); // ធ្វើឱ្យ Pointer ញ៉ខ្លាំងឬតិចទៅតាមល្បឿន (t)
    }
    pointer.style.transform = `translateY(-50%) rotate(${pointerAngle}deg)`;
    lastIdx = currentIdx;

    drawWheel();

    if (t < 1) requestAnimationFrame(animate);
    else {
      pointer.style.transform = `translateY(-50%) rotate(0deg)`;
      spinSound.pause();
      const norm = (2 * Math.PI - startAngle % (2 * Math.PI)) % (2 * Math.PI);
      const idx = Math.floor(norm / arc) % names.length;
      panel.dataset.current = idx;
      document.getElementById('panelResult').textContent = names[idx];
      panel.classList.remove('hidden');
      resultSound.volume = 1.0; // ធានាថាសំឡេងលទ្ធផលឮច្បាស់
      resultSound.play().catch(() => {});

      // បង្ហាញផាវ (Confetti)
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 2000,
        colors: ['#FFD700', '#FF0000'] // ពណ៌មាស និង ក្រហម
      });
    }
  }
  requestAnimationFrame(animate);
};

// ================= GROUP WORK (FIXED + RE-SHUFFLE) =================
const groupNameInput = document.getElementById('groupNameInput');
const importGroupNames = document.getElementById('importGroupNames');
const exportGroupNames = document.getElementById('exportGroupNames');
const clearGroupNames = document.getElementById('clearGroupNames');
const groupCountInput = document.getElementById('groupCount');
const distributeBtn = document.getElementById('distributeGroups');
const groupTableBody = document.querySelector('#groupNamesTable tbody');
const groupsContainer = document.getElementById('groupsContainer');
const saveImageBtn = document.getElementById('saveImage');
const savePdfBtn = document.getElementById('savePdf');
const fullscreenBtn = document.getElementById('fullscreenBtn');

let groupNames = ['សុនិតា', 'ចីរកាល', 'ជានិច្ច'];
let lastBuckets = null;
let groupTitles = [];
let groupColors = [];

saveImageBtn.style.display = 'none';
savePdfBtn.style.display = 'none';
fullscreenBtn.style.display = 'none';

importGroupNames.onclick = () => {
  groupNames = groupNameInput.value.split(/\r?\n/).map(n => n.trim()).filter(Boolean);
  renderGroupTable();
};

exportGroupNames.onclick = () => {
  if (groupNames.length === 0) {
    document.getElementById('emptyInputModal').style.display = 'block';
    return;
  }
  const wsData = groupNames.map((name, index) => ({ "ល.រ": index + 1, "ឈ្មោះសិស្ស": name }));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "បញ្ជីឈ្មោះក្រុម");
  XLSX.writeFile(wb, "group_student_names.xlsx");
};

clearGroupNames.onclick = () => {
  groupNames = [];
  groupNameInput.value = '';
  groupTableBody.innerHTML = '';
  groupsContainer.innerHTML = '';
  saveImageBtn.style.display = 'none';
  savePdfBtn.style.display = 'none';
  fullscreenBtn.style.display = 'none';
  lastBuckets = null;
  groupTitles = [];
  groupColors = [];
};

function renderGroupTable() {
  groupTableBody.innerHTML = '';
  groupNames.forEach((name, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${toKhmer(i + 1)}</td>
      <td>${name}</td>
      <td>
        <div class="table-buttons">
          <button class="btn-add" onclick="addGroupName(${i})">បន្ថែម</button>
          <button class="btn-remove" onclick="removeGroupName(${i})">បិទ</button>
        </div>
      </td>`;
    groupTableBody.appendChild(tr);
  });
  document.getElementById('totalGroupNames').textContent = `សរុប: ${toKhmer(groupNames.length)} នាក់`;
}

window.addGroupName = i => {
  groupNames.splice(i + 1, 0, groupNames[i]);
  renderGroupTable();
};

window.removeGroupName = i => {
  groupNames.splice(i, 1);
  renderGroupTable();
};

// ================= GROUP WORK 2 (DUPLICATE) =================
const groupNameInput2 = document.getElementById('groupNameInput2');
const importGroupNames2 = document.getElementById('importGroupNames2');
const exportGroupNames2 = document.getElementById('exportGroupNames2');
const clearGroupNames2 = document.getElementById('clearGroupNames2');
const groupCountInput2 = document.getElementById('groupCount2');
const distributeBtn2 = document.getElementById('distributeGroups2');
const groupTableBody2 = document.querySelector('#groupNamesTable2 tbody');
const groupsContainer2 = document.getElementById('groupsContainer2');
const saveImageBtn2 = document.getElementById('saveImage2');
const savePdfBtn2 = document.getElementById('savePdf2');
const fullscreenBtn2 = document.getElementById('fullscreenBtn2');

let groupNames2 = ['ជានិច្ច', 'សុនិតា', 'ចីរកាល'];
let lastBuckets2 = null;
let groupTitles2 = [];
let groupColors2 = [];
let currentBookPage = 0; // Track current page for Magic Book

if(saveImageBtn2) saveImageBtn2.style.display = 'none';
if(savePdfBtn2) savePdfBtn2.style.display = 'none';
if(fullscreenBtn2) fullscreenBtn2.style.display = 'none';

if(importGroupNames2) importGroupNames2.onclick = () => {
  groupNames2 = groupNameInput2.value.split(/\r?\n/).map(n => n.trim()).filter(Boolean);
  renderGroupTable2();
};

if(exportGroupNames2) exportGroupNames2.onclick = () => {
  if (groupNames2.length === 0) {
    document.getElementById('emptyInputModal').style.display = 'block';
    return;
  }
  const wsData = groupNames2.map((name, index) => ({ "ល.រ": index + 1, "ឈ្មោះសិស្ស": name }));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "បញ្ជីឈ្មោះក្រុម២");
  XLSX.writeFile(wb, "group_student_names_2.xlsx");
};

if(clearGroupNames2) clearGroupNames2.onclick = () => {
  groupNames2 = [];
  groupNameInput2.value = '';
  groupTableBody2.innerHTML = '';
  groupsContainer2.innerHTML = '';
  saveImageBtn2.style.display = 'none';
  savePdfBtn2.style.display = 'none';
  fullscreenBtn2.style.display = 'none';
  lastBuckets2 = null;
  groupTitles2 = [];
  groupColors2 = [];
};

function renderGroupTable2() {
  if(!groupTableBody2) return;
  groupTableBody2.innerHTML = '';
  groupNames2.forEach((name, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${toKhmer(i + 1)}</td>
      <td>${name}</td>
      <td>
        <div class="table-buttons">
          <button class="btn-add" onclick="addGroupName2(${i})">បន្ថែម</button>
          <button class="btn-remove" onclick="removeGroupName2(${i})">បិទ</button>
        </div>
      </td>`;
    groupTableBody2.appendChild(tr);
  });
  const totalEl = document.getElementById('totalGroupNames2');
  if(totalEl) totalEl.textContent = `សរុប: ${toKhmer(groupNames2.length)} នាក់`;
}

window.addGroupName2 = i => {
  groupNames2.splice(i + 1, 0, groupNames2[i]);
  renderGroupTable2();
};

window.removeGroupName2 = i => {
  groupNames2.splice(i, 1);
  renderGroupTable2();
};

if(distributeBtn2) distributeBtn2.onclick = () => {
  const count = Number(groupCountInput2.value);
  if (!count || count < 1) {
    alert('សូមបញ្ចូលចំនួនក្រុម');
    return;
  }
  const shuffled = shuffle(groupNames2);
  const buckets = Array.from({ length: count }, () => []);
  shuffled.forEach((n, i) => buckets[i % count].push(n));
  lastBuckets2 = buckets;
  groupTitles2 = [];
  groupColors2 = [];
  currentBookPage = 0; // Reset to first page
  renderGroups2(buckets, true);
  saveImageBtn2.style.display = 'inline-block';
  savePdfBtn2.style.display = 'inline-block';
  fullscreenBtn2.style.display = 'inline-block';
};

function renderGroups2(buckets, animate = false) {
  if (!buckets) {
    groupsContainer2.innerHTML = '';
    return;
  }

  groupsContainer2.className = 'magic-book-container'; // Switch to book view
  
  // Calculate total pages (2 groups per view: Left & Right)
  const totalViews = Math.ceil(buckets.length / 2);
  
  // Ensure current page is valid
  if (currentBookPage >= totalViews) currentBookPage = 0;
  if (currentBookPage < 0) currentBookPage = 0;
  
  const groupLeftIndex = currentBookPage * 2;
  const groupRightIndex = currentBookPage * 2 + 1;
  
  const groupLeft = buckets[groupLeftIndex];
  const groupRight = buckets[groupRightIndex];
  
  const html = `
  <div class="magic-book ${animate ? 'shuffle' : ''}">
      <div class="book-spine"></div>
      
      <div class="book-page left">
          ${groupLeft ? renderMagicGroup(groupLeft, groupLeftIndex) : ''}
      </div>
      
      <div class="book-page right">
          ${groupRight ? renderMagicGroup(groupRight, groupRightIndex) : ''}
      </div>
  </div>
  
  <div class="book-controls">
      <button onclick="changeBookPage(-1)" ${currentBookPage === 0 ? 'disabled' : ''}>◀ Previous</button>
      <span style="color: white; font-weight: bold; font-family: 'Khmer OS Battambang'; font-size: 1.2rem;">ទំព័រ ${toKhmer(currentBookPage + 1)} / ${toKhmer(totalViews)}</span>
      <button onclick="changeBookPage(1)" ${currentBookPage >= totalViews - 1 ? 'disabled' : ''}>Next ▶</button>
  </div>
  `;
  
  groupsContainer2.innerHTML = html;

  // Add listeners for drag and drop groups in Magic Book
  groupsContainer2.querySelectorAll('.group').forEach(div => {
    div.setAttribute('draggable', 'true');
    div.addEventListener('dragstart', handleGroupDragStart);
    div.addEventListener('dragenter', handleGroupDragEnter);
    div.addEventListener('dragover', handleGroupDragOver);
    div.addEventListener('dragleave', handleGroupDragLeave);
    div.addEventListener('drop', handleGroupDrop);
    div.addEventListener('dragend', handleGroupDragEnd);
  });
}

function renderMagicGroup(members, index) {
  const lang = window.currentLang || 'kh';
  const customTitle = groupTitles2[index] || (lang === 'kh' ? `ក្រុមទី${toKhmer(index + 1)}` : `Group ${index + 1}`);
  const color = groupColors2[index];
  const style = color ? `style="color: ${color} !important; border-color: ${color} !important;"` : '';
  return `
  <div class="group" data-index="${index}">
      <div class="group-header" ${style}>
          <h4 contenteditable="false" ondblclick="enableGroupTitleEdit(this)" spellcheck="false" style="outline:none; cursor:pointer;" data-tooltip="ចុចពីរដងដើម្បីកែឈ្មោះក្រុម" onblur="updateGroupTitle(this, ${index}, 'group2')" ${style}>${customTitle}</h4>
          <div class="header-actions">
            <input type="color" class="color-picker-btn" value="${color || '#3e2723'}" oninput="updateGroupColor(this, ${index}, 'group2')" data-tooltip="ប្តូរពណ៌">
            <button class="copy-btn" onclick="copyGroup(${index}, this)">📋</button>
          </div>
      </div>
      <ul style="zoom: ${zoomLevel2}" ondrop="drop(event)" ondragover="allowDrop(event)" ondragenter="dragEnter(event)" ondragleave="dragLeave(event)">
          ${members.map((m, j) => `<li draggable="true" ondragstart="drag(event)" data-name="${m}">${toKhmer(j + 1)}. ${m}</li>`).join('')}
      </ul>
  </div>
  `;
}

window.enableGroupTitleEdit = (element) => {
  // Disable drag on parent to fix cursor/selection issues (Arrow keys support)
  const groupDiv = element.closest('.group');
  if (groupDiv) groupDiv.setAttribute('draggable', 'false');

  element.contentEditable = "true";
  element.focus();
  
  // Visual feedback
  element.classList.add('editing');

  // Select all text
  const range = document.createRange();
  range.selectNodeContents(element);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  // Handle cleanup on blur
  const cleanup = () => {
    element.classList.remove('editing');
    // Re-enable drag
    if (groupDiv) groupDiv.setAttribute('draggable', 'true');
    element.removeEventListener('blur', cleanup);
  };
  element.addEventListener('blur', cleanup);

  // Add Enter key listener to save
  element.onkeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      element.blur();
    }
  };
};

window.updateGroupTitle = (element, index, type) => {
  const newTitle = element.innerText.trim();
  if (type === 'group1') {
    groupTitles[index] = newTitle;
  } else if (type === 'group2') {
    groupTitles2[index] = newTitle;
  }
  element.contentEditable = "false"; // Disable editing after blur
  window.getSelection().removeAllRanges(); // Deselect text
}

window.updateGroupColor = (input, index, type) => {
  const color = input.value;
  if (type === 'group1') {
    groupColors[index] = color;
    const groupHeader = document.querySelector(`#groupsContainer .group[data-index="${index}"] .group-header`);
    const groupH4 = document.querySelector(`#groupsContainer .group[data-index="${index}"] h4`);
    if(groupHeader) { groupHeader.style.borderColor = color; groupHeader.style.color = color; }
    if(groupH4) groupH4.style.color = color;
  } else if (type === 'group2') {
    groupColors2[index] = color;
    const groupHeader = document.querySelector(`#groupsContainer2 .group[data-index="${index}"] .group-header`);
    const groupH4 = document.querySelector(`#groupsContainer2 .group[data-index="${index}"] h4`);
    if(groupHeader) {
        groupHeader.style.setProperty('color', color, 'important');
        groupHeader.style.setProperty('border-color', color, 'important');
    }
    if(groupH4) groupH4.style.setProperty('color', color, 'important');
  }
};

window.changeBookPage = (delta) => {
  const totalViews = Math.ceil(lastBuckets2.length / 2);
  const newPage = currentBookPage + delta;

  if (newPage < 0 || newPage >= totalViews) return;

  // Mobile check: if single column (responsive), just render without animation
  if (window.innerWidth <= 768) {
    currentBookPage = newPage;
    renderGroups2(lastBuckets2);
    return;
  }

  // Prepare Content for Animation
  const currLeftIdx = currentBookPage * 2;
  const currRightIdx = currentBookPage * 2 + 1;
  const nextLeftIdx = newPage * 2;
  const nextRightIdx = newPage * 2 + 1;

  const currLeftGroup = lastBuckets2[currLeftIdx];
  const currRightGroup = lastBuckets2[currRightIdx];
  const nextLeftGroup = lastBuckets2[nextLeftIdx];
  const nextRightGroup = lastBuckets2[nextRightIdx];

  let flipperHTML = '';
  let staticLeftHTML = '';
  let staticRightHTML = '';

  if (delta > 0) {
    // NEXT: Flip Right to Left
    staticLeftHTML = currLeftGroup ? renderMagicGroup(currLeftGroup, currLeftIdx) : '';
    staticRightHTML = nextRightGroup ? renderMagicGroup(nextRightGroup, nextRightIdx) : '';
    
    const frontContent = currRightGroup ? renderMagicGroup(currRightGroup, currRightIdx) : '';
    const backContent = nextLeftGroup ? renderMagicGroup(nextLeftGroup, nextLeftIdx) : '';

    flipperHTML = `
      <div class="flipping-page animate-flip-next">
        <div class="page-content front style-right">${frontContent}</div>
        <div class="page-content back style-left">${backContent}</div>
      </div>`;
  } else {
    // PREV: Flip Left to Right
    staticLeftHTML = nextLeftGroup ? renderMagicGroup(nextLeftGroup, nextLeftIdx) : '';
    staticRightHTML = currRightGroup ? renderMagicGroup(currRightGroup, currRightIdx) : '';

    const frontContent = currLeftGroup ? renderMagicGroup(currLeftGroup, currLeftIdx) : '';
    const backContent = nextRightGroup ? renderMagicGroup(nextRightGroup, nextRightIdx) : '';

    flipperHTML = `
      <div class="flipping-page animate-flip-prev">
        <div class="page-content front style-left">${frontContent}</div>
        <div class="page-content back style-right">${backContent}</div>
      </div>`;
  }

  // Inject Animation HTML
  groupsContainer2.innerHTML = `
    <div class="magic-book">
      <div class="book-spine"></div>
      <div class="book-page left">${staticLeftHTML}</div>
      <div class="book-page right">${staticRightHTML}</div>
      ${flipperHTML}
    </div>
    <div class="book-controls">
      <button disabled>◀ Previous</button>
      <span style="color: white; font-weight: bold; font-family: 'Khmer OS Battambang'; font-size: 1.2rem;">កំពុងប្តូរ...</span>
      <button disabled>Next ▶</button>
    </div>`;

  // Wait for animation to finish then render final state
  setTimeout(() => {
    currentBookPage = newPage;
    renderGroups2(lastBuckets2);
  }, 800);
}

// ================= GROUP DRAG AND DROP =================
let draggedGroupIndex = null;
let draggedGroupContainerId = null;

function handleGroupDragStart(e) {
    // This function is attached to the .group div.
    // The drag event on the child `li` has stopPropagation, so this won't fire for `li`.
    draggedGroupIndex = parseInt(e.currentTarget.dataset.index);
    const container = e.currentTarget.closest('#groupsContainer, #groupsContainer2');
    draggedGroupContainerId = container ? container.id : null;

    e.dataTransfer.setData('text/plain', draggedGroupIndex); // Necessary for Firefox
    
    // Use setTimeout to allow the browser to create the drag image before adding the class
    setTimeout(() => {
        e.currentTarget.classList.add('dragging-source');
    }, 0);
}

function handleGroupDragEnter(e) {
    e.preventDefault();
    const targetGroup = e.currentTarget;
    const targetIndex = parseInt(targetGroup.dataset.index);
    if (draggedGroupIndex !== null && draggedGroupIndex !== targetIndex) {
        targetGroup.classList.add('drop-target-highlight');
    }
}

function handleGroupDragOver(e) {
    e.preventDefault(); // This is necessary to allow a drop
}

function handleGroupDragLeave(e) {
    e.currentTarget.classList.remove('drop-target-highlight');
}

function handleGroupDrop(e) {
    e.preventDefault();
    e.stopPropagation(); // Prevent drop on ul if it bubbles
    e.currentTarget.classList.remove('drop-target-highlight');
    
    if (draggedGroupIndex === null) return;

    const targetGroup = e.currentTarget;
    const targetContainer = targetGroup.closest('#groupsContainer, #groupsContainer2');

    // Ensure we are dropping in the same container
    if (!targetContainer || targetContainer.id !== draggedGroupContainerId) return;

    const sourceIndex = draggedGroupIndex;
    const targetIndex = parseInt(targetGroup.dataset.index);

    if (sourceIndex !== targetIndex) {
        const reorder = (arr, from, to) => {
            if (arr && arr.length > from) {
                const [item] = arr.splice(from, 1);
                arr.splice(to, 0, item);
            }
        };

        if (targetContainer.id === 'groupsContainer') {
            reorder(lastBuckets, sourceIndex, targetIndex);
            reorder(groupTitles, sourceIndex, targetIndex);
            reorder(groupColors, sourceIndex, targetIndex);
            renderGroups(lastBuckets);
        } else {
            reorder(lastBuckets2, sourceIndex, targetIndex);
            reorder(groupTitles2, sourceIndex, targetIndex);
            reorder(groupColors2, sourceIndex, targetIndex);
            renderGroups2(lastBuckets2);
        }
    }
}

function handleGroupDragEnd(e) {
    draggedGroupIndex = null;
    document.querySelectorAll('.dragging-source, .drop-target-highlight').forEach(el => el.classList.remove('dragging-source', 'drop-target-highlight'));
}

// 🔁 shuffle helper
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

distributeBtn.onclick = () => {
  const count = Number(groupCountInput.value);
  if (!count || count < 1) {
    alert('សូមបញ្ចូលចំនួនក្រុម');
    return;
  }

  const shuffled = shuffle(groupNames);
  const buckets = Array.from({ length: count }, () => []);
  shuffled.forEach((n, i) => buckets[i % count].push(n));

  lastBuckets = buckets;
  groupTitles = [];
  groupColors = [];
  renderGroups(buckets, true);

  saveImageBtn.style.display = 'inline-block';
  savePdfBtn.style.display = 'inline-block';
  fullscreenBtn.style.display = 'inline-block';
};

function renderGroups(buckets, animate = false) {
  const data = buckets || lastBuckets; // ប្រើទិន្នន័យចាស់បើមិនមានថ្មី (សម្រាប់ពេលប្តូរភាសា)
  if (!data) return;

  groupsContainer.classList.remove('shuffle');
  groupsContainer.innerHTML = '';

  if (animate) {
    void groupsContainer.offsetWidth;
    groupsContainer.classList.add('shuffle');
  }

  data.forEach((members, i) => {
    const div = document.createElement('div');
    div.className = 'group';
    div.dataset.index = i;
    div.setAttribute('draggable', 'true');

    // Add event listeners for dragging groups
    div.addEventListener('dragstart', handleGroupDragStart);
    div.addEventListener('dragenter', handleGroupDragEnter);
    div.addEventListener('dragover', handleGroupDragOver);
    div.addEventListener('dragleave', handleGroupDragLeave);
    div.addEventListener('drop', handleGroupDrop);
    div.addEventListener('dragend', handleGroupDragEnd);

    const lang = window.currentLang || 'kh';
    const groupLabel = lang === 'kh' ? `ក្រុមទី${toKhmer(i + 1)}` : `Group ${i + 1}`;
    const copyLabel = lang === 'kh' ? 'ចម្លង' : 'Copy';
    
    const customTitle = groupTitles[i] || groupLabel;
    const color = groupColors[i];
    const style = color ? `style="color: ${color}; border-color: ${color};"` : '';
    div.innerHTML = `
      <div class="group-header" ${style}>
        <h4 contenteditable="false" ondblclick="enableGroupTitleEdit(this)" spellcheck="false" style="outline:none; cursor:pointer;" data-tooltip="ចុចពីរដងដើម្បីកែឈ្មោះក្រុម" onblur="updateGroupTitle(this, ${i}, 'group1')">${customTitle}</h4>
        <div class="header-actions">
          <input type="color" class="color-picker-btn" value="${color || '#555555'}" oninput="updateGroupColor(this, ${i}, 'group1')" data-tooltip="ប្តូរពណ៌">
          <button class="copy-btn" onclick="copyGroup(${i}, this)">📋 ${copyLabel}</button>
        </div>
      </div>
      <ul style="zoom: ${zoomLevel1}" ondrop="drop(event)" ondragover="allowDrop(event)" ondragenter="dragEnter(event)" ondragleave="dragLeave(event)">
        ${members.map((m, j) => `<li draggable="true" ondragstart="drag(event)" data-name="${m}">${toKhmer(j + 1)}. ${m}</li>`).join('')}
      </ul>`;
    groupsContainer.appendChild(div);
  });
}

// ================= DRAG AND DROP LOGIC =================
window.allowDrop = (ev) => ev.preventDefault();

window.drag = (ev) => {
  ev.stopPropagation(); // Prevent group dragstart from firing
  const li = ev.target.closest('li');
  const group = li.closest('.group');
  const container = group.closest('#groupsContainer, #groupsContainer2');
  
  if(li && group && container) {
      ev.dataTransfer.setData("text", li.dataset.name);
      ev.dataTransfer.setData("sourceIndex", group.dataset.index);
      ev.dataTransfer.setData("sourceContainerId", container.id);
  }
};

window.dragEnter = (ev) => {
  const ul = ev.target.closest('ul');
  if(ul) ul.classList.add('drag-over');
};

window.dragLeave = (ev) => {
  const ul = ev.target.closest('ul');
  if(ul) ul.classList.remove('drag-over');
};

window.drop = (ev) => {
  ev.preventDefault();
  const ul = ev.target.closest('ul');
  if(ul) ul.classList.remove('drag-over');
  
  const name = ev.dataTransfer.getData("text");
  const sourceIndex = parseInt(ev.dataTransfer.getData("sourceIndex"));
  const sourceContainerId = ev.dataTransfer.getData("sourceContainerId");
  const targetGroup = ev.target.closest('.group');

  // Determine which bucket set to use based on container
  let currentBuckets = null;
  let container = null;

  if (targetGroup && targetGroup.closest('#groupsContainer')) {
    currentBuckets = lastBuckets;
    container = document.getElementById('groupsContainer');
  } else if (targetGroup && targetGroup.closest('#groupsContainer2')) {
    currentBuckets = lastBuckets2;
    container = document.getElementById('groupsContainer2');
  }
  
  // Ensure we are dropping in the same container
  if (container && sourceContainerId !== container.id) return;
  
  if(targetGroup && currentBuckets && container) {
    const targetIndex = parseInt(targetGroup.dataset.index);
    
    if(sourceIndex !== targetIndex && !isNaN(sourceIndex) && !isNaN(targetIndex)) {
       // Update Data Model
       const idx = currentBuckets[sourceIndex].indexOf(name);
       if(idx > -1) {
         currentBuckets[sourceIndex].splice(idx, 1);
         currentBuckets[targetIndex].push(name);
         
         // Update DOM directly to preserve Group Titles (មិនបាច់ Render ថ្មីទាំងស្រុងទេ ដើម្បីរក្សាឈ្មោះក្រុមដែលបានកែ)
         const sourceGroupUl = container.querySelector(`.group[data-index="${sourceIndex}"] ul`);
         const targetGroupUl = container.querySelector(`.group[data-index="${targetIndex}"] ul`);
         
         if (sourceGroupUl && targetGroupUl) {
             // Find the li to move
             const liToMove = [...sourceGroupUl.children].find(li => li.dataset.name === name);
             if(liToMove) {
                 targetGroupUl.appendChild(liToMove);
                 
                 // Re-number source group (រៀបលេខរៀងក្រុមដើមឡើងវិញ)
                 [...sourceGroupUl.children].forEach((li, i) => {
                     li.innerHTML = `${toKhmer(i + 1)}. ${li.dataset.name}`;
                 });
                 
                 // Re-number target group (រៀបលេខរៀងក្រុមថ្មីឡើងវិញ)
                 [...targetGroupUl.children].forEach((li, i) => {
                     li.innerHTML = `${toKhmer(i + 1)}. ${li.dataset.name}`;
                 });
             } else {
                 // Fallback: Re-render if LI not found
                 if(container.id === 'groupsContainer') renderGroups(currentBuckets);
                 else renderGroups2(currentBuckets);
             }
         } else {
             // Fallback: Re-render if ULs not found (e.g. hidden pages in Magic Book)
             if(container.id === 'groupsContainer') renderGroups(currentBuckets);
             else renderGroups2(currentBuckets);
         }
       }
    }
  }
};

window.copyGroup = (index, btn) => {
  let currentBuckets = null;
  let currentTitles = null;
  const lang = window.currentLang || 'kh';
  let defaultTitle = lang === 'kh' ? `ក្រុមទី ${toKhmer(index + 1)}` : `Group ${index + 1}`;

  if (btn.closest('#groupsContainer')) {
    currentBuckets = lastBuckets;
    currentTitles = groupTitles;
  } else if (btn.closest('#groupsContainer2')) {
    currentBuckets = lastBuckets2;
    currentTitles = groupTitles2;
  }

  if (!currentBuckets || !currentBuckets[index]) return;
  const members = currentBuckets[index];
  const title = (currentTitles && currentTitles[index]) ? currentTitles[index] : defaultTitle;
  const text = `${title}\n` + members.map((m, j) => `${toKhmer(j + 1)}. ${m}`).join('\n');
  
  navigator.clipboard.writeText(text).then(() => {
    const originalText = btn.textContent;
    btn.textContent = '✅';
    setTimeout(() => btn.textContent = originalText, 1500);
  }).catch(err => console.error(err));
};

function toKhmer(num) {
  const k = ['០','១','២','៣','៤','៥','៦','៧','៨','៩'];
  return String(num).split('').map(d => k[d]).join('');
}

// ================= SAVE =================
saveImageBtn.onclick = () => {
  html2canvas(groupsContainer).then(c => {
    const a = document.createElement('a');
    a.href = c.toDataURL();
    a.download = 'groups.png';
    a.click();
  });
};

if(saveImageBtn2) saveImageBtn2.onclick = () => {
  html2canvas(groupsContainer2).then(c => {
    const a = document.createElement('a');
    a.href = c.toDataURL();
    a.download = 'groups2.png';
    a.click();
  });
};

// Helper Function: បង្កើត Header សម្រាប់ PDF (Logo + ឈ្មោះសាលា)
function createPdfHeader() {
  const header = document.createElement('div');
  Object.assign(header.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '3px solid #00c6ff',
    width: '100%'
  });

  // បន្ថែម Logo
  const logoImg = document.querySelector('.logo img');
  if (logoImg) {
    const img = logoImg.cloneNode(true);
    img.style.height = '60px';
    img.style.width = 'auto';
    header.appendChild(img);
  }

  // Container សម្រាប់អក្សរ (ឈ្មោះសាលា + កាលបរិច្ឆេទ)
  const textContainer = document.createElement('div');
  textContainer.style.textAlign = 'left';

  // បន្ថែមឈ្មោះសាលា
  const title = document.createElement('h1');
  title.textContent = 'NGSPL Smart Classroom';
  Object.assign(title.style, {
    fontFamily: "'Orbitron', sans-serif",
    color: '#0072ff',
    fontSize: '28px',
    margin: '0',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  });
  textContainer.appendChild(title);

  // បន្ថែមកាលបរិច្ឆេទ
  const dateP = document.createElement('p');
  const d = new Date();
  const dateStr = `${toKhmer(d.getDate().toString().padStart(2, '0'))}/${toKhmer((d.getMonth()+1).toString().padStart(2, '0'))}/${toKhmer(d.getFullYear())}`;
  const timeStr = `${toKhmer(d.getHours().toString().padStart(2, '0'))}:${toKhmer(d.getMinutes().toString().padStart(2, '0'))}`;
  dateP.textContent = `កាលបរិច្ឆេទ: ${dateStr} | ម៉ោង: ${timeStr}`;
  Object.assign(dateP.style, { fontFamily: "'Khmer OS Battambang', sans-serif", fontSize: '14px', color: '#555', margin: '5px 0 0 0' });
  textContainer.appendChild(dateP);

  header.appendChild(textContainer);
  return header;
}

savePdfBtn.onclick = () => {
  // បង្កើត Wrapper សម្រាប់ថត PDF (មាន Header + Grid)
  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, {
    position: 'absolute', left: '-9999px', top: '0', width: '1200px',
    background: '#fff', padding: '40px', zIndex: '-1'
  });

  // 1. ដាក់ Header
  wrapper.appendChild(createPdfHeader());

  // 2. ដាក់តារាងក្រុម (Clone ពី groupsContainer)
  const gridClone = groupsContainer.cloneNode(true);
  Object.assign(gridClone.style, {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    marginTop: '20px',
    width: '100%'
  });
  wrapper.appendChild(gridClone);

  document.body.appendChild(wrapper);

  html2canvas(wrapper, { scale: 2 }).then(canvas => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pdf.internal.pageSize.getWidth() - 20;
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = canvas.height * imgWidth / canvas.width;
    let heightLeft = imgHeight;
    let position = 10;
    let page = 1;

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= (pageHeight - 20);
    pdf.setFontSize(10);
    pdf.setTextColor(150);
    pdf.text(`- ${page} -`, pdf.internal.pageSize.getWidth() / 2, pageHeight - 10, { align: 'center' });

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 10 - (pageHeight - 20); // Adjust position logic
      pdf.addPage();
      page++;
      pdf.addImage(imgData, 'PNG', 10, 10 - (pageHeight - 20) * (page - 1), imgWidth, imgHeight);
      pdf.text(`- ${page} -`, pdf.internal.pageSize.getWidth() / 2, pageHeight - 10, { align: 'center' });
      heightLeft -= (pageHeight - 20);
    }

    pdf.save('groups.pdf');
    document.body.removeChild(wrapper);
  });
};

if(savePdfBtn2) savePdfBtn2.onclick = () => {
  // Store original zoom and set to 1 for PDF
  const originalZoom = zoomLevel2;
  zoomLevel2 = 1;

  // Create hidden container for capturing
  const container = document.createElement('div');
  Object.assign(container.style, {
    position: 'absolute', left: '-9999px', top: '0', width: '1200px',
    background: '#fff', padding: '40px', zIndex: '-1'
  });
  
  // Hide controls in PDF
  const style = document.createElement('style');
  style.innerHTML = `
    .magic-book .header-actions { display: none !important; }
  `;
  container.appendChild(style);
  
  document.body.appendChild(container);

  const totalViews = Math.ceil(lastBuckets2.length / 2);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');

  const processPage = (index) => {
    if (index >= totalViews) {
      pdf.save('groups2_book.pdf');
      document.body.removeChild(container);
      zoomLevel2 = originalZoom; // Restore zoom
      return;
    }

    // Clear container content (keep style)
    container.innerHTML = '';
    container.appendChild(style);

    // Build Page Content
    const viewContainer = document.createElement('div');
    Object.assign(viewContainer.style, {
      display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%'
    });

    // Header
    viewContainer.appendChild(createPdfHeader());

    // Book
    const groupLeftIndex = index * 2;
    const groupRightIndex = index * 2 + 1;
    const groupLeft = lastBuckets2[groupLeftIndex];
    const groupRight = lastBuckets2[groupRightIndex];

    const bookDiv = document.createElement('div');
    bookDiv.className = 'magic-book';
    Object.assign(bookDiv.style, {
      width: '1000px',
      minHeight: '600px',
      margin: '20px 0',
      transform: 'none',
      border: '12px solid #4e342e'
    });

    bookDiv.innerHTML = `
      <div class="book-spine"></div>
      <div class="book-page left">
          ${groupLeft ? renderMagicGroup(groupLeft, groupLeftIndex) : ''}
      </div>
      <div class="book-page right">
          ${groupRight ? renderMagicGroup(groupRight, groupRightIndex) : ''}
      </div>
    `;

    viewContainer.appendChild(bookDiv);

    // Page Number
    const pageNum = document.createElement('div');
    pageNum.textContent = `- ${index + 1} -`;
    Object.assign(pageNum.style, {
      marginTop: '10px', fontSize: '16px', color: '#888', fontFamily: 'Arial'
    });
    viewContainer.appendChild(pageNum);

    container.appendChild(viewContainer);

    // Capture
    html2canvas(container, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      const printWidth = pdfWidth - (margin * 2);
      const printHeight = canvas.height * printWidth / canvas.width;

      if (index > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, margin, printWidth, printHeight);

      processPage(index + 1);
    });
  };

  processPage(0);
};

fullscreenBtn.onclick = () => {
  if (!document.fullscreenElement) {
    document.getElementById('groupWrapper').requestFullscreen().catch(err => console.log(err));
  } else {
    document.exitFullscreen();
  }
};

if(fullscreenBtn2) fullscreenBtn2.onclick = () => {
  if (!document.fullscreenElement) {
    document.getElementById('groupWrapper2').requestFullscreen().catch(err => console.log(err));
  } else {
    document.exitFullscreen();
  }
};

// បង្ហាញទិន្នន័យលំនាំដើមសម្រាប់ក្រុម
renderGroupTable();
renderGroupTable2();

// ================= TIMER LOGIC =================
const timerDisplay = document.getElementById('timerDisplay');
const timerHourInput = document.getElementById('timerHourInput');
const timerMinuteInput = document.getElementById('timerMinuteInput');
const timerSecondInput = document.getElementById('timerSecondInput');
const startTimerBtn = document.getElementById('startTimer');
const stopTimerBtn = document.getElementById('stopTimer');
const resetTimerBtn = document.getElementById('resetTimer');

let timerInterval;
let totalSeconds = 0;

function updateTimerDisplay() {
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  timerDisplay.textContent = h === '00' ? `${m}:${s}` : `${h}:${m}:${s}`;

  // ប្តូរពណ៌ទៅជាក្រហមនៅពេលសល់ ១០ វិនាទីចុងក្រោយ
  if (totalSeconds > 0 && totalSeconds <= 10) {
    timerDisplay.style.color = '#FF416C';
    timerDisplay.style.textShadow = '0 0 30px #FF416C';
    timerDisplay.classList.add('shake-animation');
  } else {
    timerDisplay.classList.remove('shake-animation');
    const savedColor = localStorage.getItem('timerColor') || '#FFD700';
    timerDisplay.style.color = savedColor;
    timerDisplay.style.textShadow = '2px 2px 5px rgba(0,0,0,0.3)';
  }
}

startTimerBtn.onclick = () => {
  if (timerInterval) return;
  
  if (totalSeconds === 0) {
    const hours = parseInt(timerHourInput.value) || 0;
    const minutes = parseInt(timerMinuteInput.value) || 0;
    const seconds = parseInt(timerSecondInput.value) || 0;
    if (hours === 0 && minutes === 0 && seconds === 0) {
      document.getElementById('timerWarningModal').style.display = 'block';
      return;
    }
    totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
  }
  
  timerDisplay.classList.remove('blink-animation'); // ដក Blink ចេញពេលចាប់ផ្តើម
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    if (totalSeconds > 0) {
      totalSeconds--;
      updateTimerDisplay();
      tickSound.currentTime = 0;
      tickSound.volume = 1.0;
      tickSound.play().catch(() => {});
    } else {
      clearInterval(timerInterval);
      timerInterval = null;
      resultSound.volume = 1.0;
      resultSound.play().catch(() => {}); // Play sound when finished
      document.getElementById('timeoutModal').style.display = 'block';

      // Fireworks Effect (ភ្លើងកាំជ្រួច)
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 2001 };

      function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // បាញ់កាំជ្រួចពីជ្រុងទាំងសងខាង
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
      }, 250);
    }
  }, 1000);
};

stopTimerBtn.onclick = () => {
  clearInterval(timerInterval);
  timerInterval = null;
  resultSound.pause(); // បិទសំឡេងរោទ៍
  resultSound.currentTime = 0;
  updateTimerDisplay(); 
  timerDisplay.classList.remove('shake-animation'); // បញ្ឈប់ការញ័រពេលផ្អាក
  timerDisplay.classList.add('blink-animation'); // ដាក់ Blink ឱ្យដឹងថាផ្អាក
};

resetTimerBtn.onclick = () => {
  clearInterval(timerInterval);
  timerInterval = null;
  resultSound.pause(); // បិទសំឡេងរោទ៍
  resultSound.currentTime = 0;
  totalSeconds = 0;
  timerHourInput.value = '';
  timerMinuteInput.value = '';
  timerSecondInput.value = '';
  
  timerDisplay.classList.remove('blink-animation'); // ដក Blink ចេញពេល Reset
  timerDisplay.classList.remove('shake-animation');
  // កំណត់ពណ៌មកដើមវិញពេល Reset
  const savedColor = localStorage.getItem('timerColor') || '#FFD700';
  timerDisplay.style.color = savedColor;
  timerDisplay.style.textShadow = '2px 2px 5px rgba(0,0,0,0.3)';
  
  updateTimerDisplay();
};

// Preset Buttons Logic
document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.onclick = () => {
    clearInterval(timerInterval);
    timerInterval = null;
    resultSound.pause();
    resultSound.currentTime = 0;
    timerDisplay.classList.remove('blink-animation'); // ដក Blink ចេញពេលជ្រើសរើសម៉ោងថ្មី
    const mins = parseInt(btn.dataset.minutes);
    timerHourInput.value = 0;
    timerMinuteInput.value = mins;
    timerSecondInput.value = 0;
    totalSeconds = mins * 60;
    updateTimerDisplay();
  };
});

// ================= ZOOM LOGIC =================
let zoomLevel1 = 1;
let zoomLevel2 = 1;
let zoomLevelTimer = 1;
const zoomStep = 0.1;

const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const zoomResetBtn = document.getElementById('zoomResetBtn');
const zoomInBtn2 = document.getElementById('zoomInBtn2');
const zoomOutBtn2 = document.getElementById('zoomOutBtn2');
const zoomResetBtn2 = document.getElementById('zoomResetBtn2');
const zoomInBtnTimer = document.getElementById('zoomInBtnTimer');
const zoomOutBtnTimer = document.getElementById('zoomOutBtnTimer');
const zoomResetBtnTimer = document.getElementById('zoomResetBtnTimer');
const timerControls = document.querySelector('.timer-controls');

function setupZoomButton(btn, action) {
  if (!btn) return;
  let interval;
  
  const start = (e) => {
    if (e.cancelable && e.type === 'touchstart') e.preventDefault();
    action();
    interval = setInterval(action, 100);
  };
  
  const stop = () => {
    clearInterval(interval);
  };

  btn.addEventListener('mousedown', start);
  btn.addEventListener('touchstart', start, { passive: false });
  
  btn.addEventListener('mouseup', stop);
  btn.addEventListener('mouseleave', stop);
  btn.addEventListener('touchend', stop);
  btn.addEventListener('touchcancel', stop);
}

function applyZoom(container, level) {
  if (!container) return;
  const uls = container.querySelectorAll('.group ul');
  uls.forEach(ul => ul.style.zoom = level);
}

if (groupsContainer) {
  setupZoomButton(zoomInBtn, () => {
    zoomLevel1 += zoomStep;
    applyZoom(groupsContainer, zoomLevel1);
  });
  setupZoomButton(zoomOutBtn, () => {
    if (zoomLevel1 > 0.5) {
      zoomLevel1 -= zoomStep;
      applyZoom(groupsContainer, zoomLevel1);
    }
  });
  if (zoomResetBtn) {
    zoomResetBtn.onclick = () => {
      zoomLevel1 = 1;
      applyZoom(groupsContainer, zoomLevel1);
    };
  }
}

if (timerDisplay) {
  setupZoomButton(zoomInBtnTimer, () => {
    zoomLevelTimer += zoomStep;
    timerDisplay.style.fontSize = `calc(clamp(9rem, 25vw, 22rem) * ${zoomLevelTimer})`;
    timerDisplay.style.transform = '';
  });
  setupZoomButton(zoomOutBtnTimer, () => {
    if (zoomLevelTimer > 0.5) {
      zoomLevelTimer -= zoomStep;
      timerDisplay.style.fontSize = `calc(clamp(9rem, 25vw, 22rem) * ${zoomLevelTimer})`;
      timerDisplay.style.transform = '';
    }
  });
  if (zoomResetBtnTimer) {
    zoomResetBtnTimer.onclick = () => {
      zoomLevelTimer = 1;
      timerDisplay.style.fontSize = 'clamp(9rem, 25vw, 22rem)';
      timerDisplay.style.transform = '';
    };
  }
}

if (groupsContainer2) {
  setupZoomButton(zoomInBtn2, () => {
    zoomLevel2 += zoomStep;
    applyZoom(groupsContainer2, zoomLevel2);
  });
  setupZoomButton(zoomOutBtn2, () => {
    if (zoomLevel2 > 0.5) {
      zoomLevel2 -= zoomStep;
      applyZoom(groupsContainer2, zoomLevel2);
    }
  });
  if (zoomResetBtn2) {
    zoomResetBtn2.onclick = () => {
      zoomLevel2 = 1;
      applyZoom(groupsContainer2, zoomLevel2);
    };
  }
}
