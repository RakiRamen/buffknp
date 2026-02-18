const allImages = import.meta.glob('./icons/**/*.png', { eager: true, query: '?url' });

const JOB_DATA = {};
let currentRowId = null;

// 画像データの読み込み
for (const path in allImages) {
    const parts = path.split('/'); 
    const jobName = parts[parts.length - 2]; 
    const fileName = parts[parts.length - 1].replace('.png', '');
    if (!JOB_DATA[jobName]) JOB_DATA[jobName] = [];
    const imageUrl = allImages[path].default || allImages[path];
    JOB_DATA[jobName].push({ name: fileName, file: imageUrl });
}

// 行の追加
window.addRow = function(enemySkill = '', buffs = [], memo = '', status = 'none') {
    const tbody = document.getElementById('tableBody');
    const rowId = 'row-' + Date.now() + Math.random().toString(36).substr(2, 5);
    const tr = document.createElement('tr');
    
    let bgClass = '';
    if (status === 'important') bgClass = 'is-important';
    if (status === 'caution') bgClass = 'is-caution';

    tr.className = `border-b border-slate-200 draggable-row ${bgClass}`;
    tr.id = rowId;
    tr.draggable = true;
    
    // クリックで行を選択
    tr.addEventListener('click', () => {
        selectRow(rowId);
    });

    tr.innerHTML = `
        <td class="text-center drag-handle font-bold text-slate-300 col-drag">⠿</td>
        <td class="p-0 col-timeline"><input type="text" class="compact-input text-enemy outline-none px-2" value="${enemySkill}"></td>
        <td class="p-0 col-buff"><div class="flex flex-wrap gap-1 buff-container min-h-[40px] items-center px-1"></div></td>
        <td class="p-0 col-memo"><input type="text" class="compact-input text-memo outline-none px-2" value="${memo}"></td>
        <td class="p-0 col-mark">
            <div class="flex items-center justify-center gap-1 w-full h-full">
                <button onclick="toggleRowStatus('${rowId}', 'important'); event.stopPropagation();" class="mark-btn text-lg btn-star">${status === 'important' ? '⭐' : '☆'}</button>
                <button onclick="toggleRowStatus('${rowId}', 'caution'); event.stopPropagation();" class="mark-btn text-lg btn-circle">${status === 'caution' ? '🔴' : '⚪'}</button>
            </div>
        </td>
        <td class="text-center col-delete"><button onclick="document.getElementById('${rowId}').remove(); event.stopPropagation();" class="text-slate-300 hover:text-red-500 text-xs px-2">✕</button></td>
    `;
    
    tbody.appendChild(tr);
    const container = tr.querySelector('.buff-container');
    if (buffs && buffs.length > 0) {
        buffs.forEach(fileUrl => addIconElement(container, fileUrl, rowId));
    }
    
    selectRow(rowId);
}

window.toggleRowStatus = function(id, type) {
    const tr = document.getElementById(id);
    if (!tr) return;
    const starBtn = tr.querySelector('.btn-star');
    const circBtn = tr.querySelector('.btn-circle');
    const isImportant = tr.classList.contains('is-important');
    const isCaution = tr.classList.contains('is-caution');

    tr.classList.remove('is-important', 'is-caution');
    starBtn.innerText = '☆';
    circBtn.innerText = '⚪';

    if (type === 'important' && !isImportant) {
        tr.classList.add('is-important');
        starBtn.innerText = '⭐';
    } else if (type === 'caution' && !isCaution) {
        tr.classList.add('is-caution');
        circBtn.innerText = '🔴';
    }
    selectRow(id); // マーク変更時も選択状態にする
}

function setupJobPalette() {
    const section = document.getElementById('jobPaletteSection');
    if (!section) return;
    section.innerHTML = '';
    
    Object.keys(JOB_DATA).sort().forEach(jobKey => {
        const container = document.createElement('div');
        container.className = 'job-container';

        const header = document.createElement('button');
        header.className = 'job-header-btn';
        header.innerHTML = `<span>${jobKey}</span><span style="font-size:10px; opacity:0.4">▼</span>`;
        header.onclick = () => {
            const isActive = container.classList.toggle('active');
            header.classList.toggle('active', isActive);
        };

        const grid = document.createElement('div');
        grid.className = 'job-icon-grid';

        JOB_DATA[jobKey].forEach(icon => {
            const img = document.createElement('img');
            img.src = icon.file;
            img.dataset.rawSrc = icon.file;
            img.className = "icon-btn";
            img.title = icon.name;
            img.onclick = (e) => { 
                e.preventDefault();
                e.stopPropagation(); 
                addIconToCurrentRow(icon.file); 
            };
            grid.appendChild(img);
        });

        container.appendChild(header);
        container.appendChild(grid);
        section.appendChild(container);
    });
}

function selectRow(id) {
    currentRowId = id;
    document.querySelectorAll('#tableBody tr').forEach(r => r.classList.remove('selected-row'));
    const selected = document.getElementById(id);
    if (selected) {
        selected.classList.add('selected-row');
    }
}

function addIconToCurrentRow(fileUrl) {
    if (!currentRowId) {
        window.addRow();
    }
    const container = document.querySelector(`#${currentRowId} .buff-container`);
    if (container) {
        addIconElement(container, fileUrl, currentRowId);
    }
}

function addIconElement(container, fileUrl, rowId) {
    const img = document.createElement('img');
    img.src = fileUrl;
    img.dataset.rawSrc = fileUrl;
    img.className = "buff-icon";
    img.onclick = (e) => { 
        e.stopPropagation(); 
        // 削除する際、その行を改めて選択状態にする
        selectRow(rowId);
        img.remove(); 
    };
    container.appendChild(img);
}

window.saveData = function() {
    const bossName = document.getElementById('bossName').value.trim();
    if (!bossName) return alert("コンテンツ名を入力してください");
    const data = Array.from(document.querySelectorAll('#tableBody tr')).map(tr => ({
        enemySkill: tr.querySelector('.text-enemy').value,
        memo: tr.querySelector('.text-memo').value,
        status: tr.classList.contains('is-important') ? 'important' : (tr.classList.contains('is-caution') ? 'caution' : 'none'),
        buffs: Array.from(tr.querySelectorAll('.buff-container img')).map(img => img.dataset.rawSrc)
    }));
    localStorage.setItem(`ff14_kanpe_${bossName}`, JSON.stringify(data));
    updateSaveList();
    alert(`「${bossName}」を保存しました`);
}

window.loadData = function() {
    const bossName = document.getElementById('saveList').value;
    if (!bossName) return;
    const saved = localStorage.getItem(`ff14_kanpe_${bossName}`);
    if (saved) {
        document.getElementById('tableBody').innerHTML = '';
        JSON.parse(saved).forEach(row => window.addRow(row.enemySkill, row.buffs, row.memo, row.status));
        document.getElementById('bossName').value = bossName;
    }
}

function updateSaveList() {
    const select = document.getElementById('saveList');
    if(!select) return;
    select.innerHTML = '<option value="">-- 保存済データ --</option>';
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ff14_kanpe_')) keys.push(key.replace('ff14_kanpe_', ''));
    }
    keys.sort().forEach(name => select.add(new Option(name, name)));
}

function initDragAndDrop() {
    const tbody = document.getElementById('tableBody');
    tbody.addEventListener('dragover', (e) => {
        e.preventDefault();
        const draggingRow = document.querySelector('.dragging');
        const target = e.target.closest('tr');
        if (target && target !== draggingRow) {
            const rect = target.getBoundingClientRect();
            const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
            tbody.insertBefore(draggingRow, next ? target.nextSibling : target);
        }
    });
    tbody.addEventListener('dragstart', (e) => { e.target.closest('tr').classList.add('dragging'); });
    tbody.addEventListener('dragend', (e) => { e.target.closest('tr').classList.remove('dragging'); });
}

window.deleteData = function() {
    const bossName = document.getElementById('saveList').value;
    if (bossName && confirm('保存されているデータを削除しますか？')) {
        localStorage.removeItem(`ff14_kanpe_${bossName}`);
        updateSaveList();
        window.clearCurrentTable(true);
    }
}

window.clearCurrentTable = function(isNew) {
    document.getElementById('tableBody').innerHTML = '';
    if (isNew) { 
        document.getElementById('bossName').value = ''; 
        window.addRow(); 
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupJobPalette();
    updateSaveList();
    window.clearCurrentTable(true);
    initDragAndDrop();
});