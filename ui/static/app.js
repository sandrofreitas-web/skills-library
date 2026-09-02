// Skills OS Frontend JavaScript Controller
let catalogState = {};
let fleetState = [];
let activePreviewTarget = 'cursor';
let currentPreviews = {};

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initHub();
  initFleet();
  initStudio();
  initConsole();
  refreshAll();
});

// Navigation
function initNavigation() {
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));
      document.querySelectorAll('.view-panel').forEach((p) => p.classList.remove('active'));

      item.classList.add('active');
      const targetTab = item.getAttribute('data-tab');
      const targetPanel = document.getElementById(`view-${targetTab}`);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });
}

// Refresh Data
async function refreshAll() {
  try {
    const [catRes, fleetRes] = await Promise.all([
      fetch('/api/catalog'),
      fetch('/api/fleet'),
    ]);

    catalogState = await catRes.json();
    fleetState = await fleetRes.json();

    renderHub();
    renderFleet();
    renderMetrics();
  } catch (err) {
    console.error('Erro ao buscar dados:', err);
  }
}

// HUB VIEW
function initHub() {
  const searchInput = document.getElementById('hub-search');
  searchInput.addEventListener('input', (e) => {
    renderHub(e.target.value.toLowerCase());
  });

  document.getElementById('btn-validate-ci').addEventListener('click', async () => {
    showConsole('Executando validação de CI e linter de skills...');
    try {
      const res = await fetch('/api/validate', { method: 'POST' });
      const data = await res.json();
      appendConsole(data.output);
    } catch (e) {
      appendConsole('Erro ao executar validação: ' + e);
    }
  });

  document.getElementById('btn-close-modal').addEventListener('click', () => {
    document.getElementById('skill-modal').classList.remove('open');
  });
}

function renderHub(query = '') {
  const container = document.getElementById('hub-cards-container');
  container.innerHTML = '';

  Object.entries(catalogState).forEach(([name, skill]) => {
    const desc = skill.description || '';
    const tags = skill.tags || [];
    const status = skill.status || 'stable';
    const version = skill.version || '1.0.0';
    const compat = skill.compatible_with || ['claude', 'gemini', 'cursor', 'windsurf', 'copilot'];

    // Filtro de busca
    if (query) {
      const matchName = name.toLowerCase().includes(query);
      const matchDesc = desc.toLowerCase().includes(query);
      const matchTag = tags.some((t) => t.toLowerCase().includes(query));
      if (!matchName && !matchDesc && !matchTag) return;
    }

    const card = document.createElement('div');
    card.className = 'skill-card';
    card.innerHTML = `
      <div>
        <div class="skill-header">
          <div class="skill-title-group">
            <h3>${name}</h3>
          </div>
          <div style="display: flex; gap: 6px; align-items: center;">
            <span class="badge-version">v${version}</span>
            <span class="badge-status ${status}">${status}</span>
          </div>
        </div>
        <p class="skill-desc">${desc}</p>
        <div class="skill-tags">
          ${tags.map((t) => `<span class="tag-pill">#${t}</span>`).join('')}
        </div>
      </div>
      <div class="skill-footer">
        <div class="compat-icons">
          <span class="ide-badge ${compat.includes('claude') ? 'active' : ''}">Claude</span>
          <span class="ide-badge ${compat.includes('cursor') ? 'active' : ''}">Cursor</span>
          <span class="ide-badge ${compat.includes('gemini') ? 'active' : ''}">Gemini</span>
          <span class="ide-badge ${compat.includes('copilot') ? 'active' : ''}">Copilot</span>
        </div>
        <button class="btn-inspect" onclick="openSkillModal('${name}')">Inspecionar ↗</button>
      </div>
    `;
    container.appendChild(card);
  });
}

window.openSkillModal = function (name) {
  const skill = catalogState[name];
  if (!skill) return;

  document.getElementById('modal-skill-title').innerText = `📦 ${name} (v${skill.version || '1.0.0'})`;
  const body = document.getElementById('modal-skill-body');
  body.innerHTML = `
    <div style="margin-bottom: 16px;">
      <h4 style="font-size: 13px; color: var(--text-dim); text-transform: uppercase;">Descrição</h4>
      <p style="margin-top: 4px; font-size: 14px; line-height: 1.5;">${skill.description || 'Sem descrição'}</p>
    </div>
    <div style="margin-bottom: 16px;">
      <h4 style="font-size: 13px; color: var(--text-dim); text-transform: uppercase;">Caminho Canônico</h4>
      <code style="font-family: var(--font-mono); font-size: 12px; color: var(--accent-cyan);">${skill.path || ''}</code>
    </div>
    <div style="margin-bottom: 16px;">
      <h4 style="font-size: 13px; color: var(--text-dim); text-transform: uppercase;">Tags & Compatibilidade</h4>
      <div style="display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap;">
        ${(skill.tags || []).map((t) => `<span class="tag-pill">#${t}</span>`).join('')}
      </div>
    </div>
    <div>
      <h4 style="font-size: 13px; color: var(--text-dim); text-transform: uppercase; margin-bottom: 8px;">Código Fonte (SKILL.md)</h4>
      <pre style="background: rgba(0,0,0,0.4); padding: 14px; border-radius: 8px; font-family: var(--font-mono); font-size: 12px; line-height: 1.5; color: #E2E8F0; max-height: 300px; overflow-y: auto;">${escapeHtml(skill.raw || skill.body || 'Carregando...')}</pre>
    </div>
  `;
  document.getElementById('skill-modal').classList.add('open');
};

let allFleetCollapsed = false;
let fleetCollapsedState = {};

// FLEET VIEW
function initFleet() {
  document.getElementById('btn-sync-all').addEventListener('click', async () => {
    showConsole('🚀 Iniciando sincronização de toda a frota de projetos...');
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      Object.entries(data.outputs || {}).forEach(([proj, out]) => {
        appendConsole(`\n[PROJETO: ${proj}]\n${out}`);
      });
      refreshAll();
    } catch (e) {
      appendConsole('Erro ao sincronizar frota: ' + e);
    }
  });

  const toggleAllBtn = document.getElementById('btn-toggle-all-fleet');
  if (toggleAllBtn) {
    toggleAllBtn.addEventListener('click', () => {
      allFleetCollapsed = !allFleetCollapsed;
      fleetState.forEach((p, idx) => {
        fleetCollapsedState[idx] = allFleetCollapsed;
      });
      renderFleet();
    });
  }
}

function renderFleet() {
  const container = document.getElementById('fleet-cards-container');
  container.innerHTML = '';

  fleetState.forEach((project, pIdx) => {
    const isCollapsed = fleetCollapsedState[pIdx] ?? allFleetCollapsed;
    const card = document.createElement('div');
    card.className = `fleet-card ${isCollapsed ? 'collapsed' : ''}`;
    card.id = `fleet-card-${pIdx}`;

    const globalSkillNames = Object.keys(catalogState);
    const lockedSkills = project.locked_skills || {};
    const localSkills = project.local_skills || [];

    card.innerHTML = `
      <div class="fleet-header">
        <div style="display: flex; align-items: center; gap: 12px;">
          <button class="btn-collapse-toggle" title="Compactar/Expandir" onclick="toggleProjectCollapse(${pIdx})">
            ${isCollapsed ? '▶' : '▼'}
          </button>
          <div class="fleet-title-group">
            <h3>
              <span>🏢</span> ${project.name}
              ${project.has_lock ? '<span class="badge-status stable">Lockfile Ativo</span>' : '<span class="badge-status draft">Sem Lockfile</span>'}
              <span class="badge-version" style="margin-left: 6px;">${Object.keys(lockedSkills).length} globais • ${localSkills.length} locais</span>
            </h3>
            <div class="project-path">${project.path}</div>
          </div>
        </div>
        <button class="btn-project-sync" onclick="syncProject('${project.path.replace(/\\/g, '\\\\')}')">
          ⚡ 1-Click Sync
        </button>
      </div>

      <div class="fleet-skills-section">
        <!-- Global Skills Checkboxes -->
        <div class="fleet-skills-block">
          <h5>📦 Skills Globais Ativas (${Object.keys(lockedSkills).length}/${globalSkillNames.length})</h5>
          <div class="skill-toggle-list">
            ${globalSkillNames.map((gName) => {
              const isChecked = Boolean(lockedSkills[gName]);
              return `
                <div class="skill-toggle-item">
                  <label>
                    <input type="checkbox" ${isChecked ? 'checked' : ''} 
                      onchange="toggleProjectSkill('${project.path.replace(/\\/g, '\\\\')}', '${gName}', this.checked)">
                    <span style="font-weight: 500;">${gName}</span>
                  </label>
                  <span class="badge-version">v${(lockedSkills[gName] && lockedSkills[gName].version) || catalogState[gName].version || '1.0'}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Local Skills List -->
        <div class="fleet-skills-block">
          <h5>🧩 Skills Locais Exclusivas (${localSkills.length})</h5>
          <div class="skill-toggle-list">
            ${localSkills.length === 0 ? '<div style="color: var(--text-dim); font-size: 12px; padding: 10px;">Nenhuma skill local criada ainda.</div>' : ''}
            ${localSkills.map((loc, lIdx) => `
              <div class="skill-toggle-item" style="border-left: 3px solid var(--accent-emerald); display: flex; align-items: center; justify-content: space-between;">
                <div style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  <div style="font-weight: 600; color: #34D399;">${loc.name}</div>
                  <div style="font-size: 11px; color: var(--text-dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${(loc.frontmatter && loc.frontmatter.description) || 'Skill local do projeto'}</div>
                </div>
                <button class="btn-inspect-mini" onclick="openLocalSkillModal(${pIdx}, ${lIdx})">Inspecionar ↗</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- IDE Generated Folders Status -->
      <div class="fleet-ide-status" style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--text-dim); padding-top: 8px;">
        <div style="display: flex; gap: 12px; align-items: center;">
          <span>Compilados:</span>
          <span style="color: ${project.generated_status.cursor ? 'var(--accent-emerald)' : 'var(--text-dim)'};">.cursor (${project.generated_status.cursor ? '✓' : '✗'})</span>
          <span style="color: ${project.generated_status.claude ? 'var(--accent-emerald)' : 'var(--text-dim)'};">.claude (${project.generated_status.claude ? '✓' : '✗'})</span>
          <span style="color: ${project.generated_status.gemini ? 'var(--accent-emerald)' : 'var(--text-dim)'};">.gemini (${project.generated_status.gemini ? '✓' : '✗'})</span>
          <span style="color: ${project.generated_status.copilot ? 'var(--accent-emerald)' : 'var(--text-dim)'};">.github (${project.generated_status.copilot ? '✓' : '✗'})</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

window.toggleProjectCollapse = function (pIdx) {
  fleetCollapsedState[pIdx] = !(fleetCollapsedState[pIdx] ?? allFleetCollapsed);
  renderFleet();
};

window.openLocalSkillModal = function (pIdx, lIdx) {
  const project = fleetState[pIdx];
  if (!project) return;
  const loc = project.local_skills[lIdx];
  if (!loc) return;

  const fm = loc.frontmatter || {};
  document.getElementById('modal-skill-title').innerText = `🧩 ${loc.name} [Local: ${project.name}]`;
  const body = document.getElementById('modal-skill-body');
  
  const globs = fm.globs ? (Array.isArray(fm.globs) ? fm.globs.join(', ') : fm.globs) : 'Nenhum';
  const tags = fm.tags || [];

  body.innerHTML = `
    <div style="margin-bottom: 16px;">
      <h4 style="font-size: 13px; color: var(--text-dim); text-transform: uppercase;">Descrição</h4>
      <p style="margin-top: 4px; font-size: 14px; line-height: 1.5;">${fm.description || 'Sem descrição'}</p>
    </div>
    <div style="margin-bottom: 16px;">
      <h4 style="font-size: 13px; color: var(--text-dim); text-transform: uppercase;">Caminho Local no Projeto</h4>
      <code style="font-family: var(--font-mono); font-size: 12px; color: var(--accent-cyan);">${loc.path || ''}</code>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
      <div>
        <h4 style="font-size: 13px; color: var(--text-dim); text-transform: uppercase;">Gatilhos por Arquivo (Globs)</h4>
        <code style="font-family: var(--font-mono); font-size: 12px; color: #A5B4FC;">${globs}</code>
      </div>
      <div>
        <h4 style="font-size: 13px; color: var(--text-dim); text-transform: uppercase;">Tags</h4>
        <div style="display: flex; gap: 6px; margin-top: 4px; flex-wrap: wrap;">
          ${tags.length > 0 ? tags.map((t) => `<span class="tag-pill">#${t}</span>`).join('') : '<span style="color: var(--text-dim); font-size: 12px;">Nenhuma tag</span>'}
        </div>
      </div>
    </div>
    <div>
      <h4 style="font-size: 13px; color: var(--text-dim); text-transform: uppercase; margin-bottom: 8px;">Código Fonte (SKILL.md)</h4>
      <pre style="background: rgba(0,0,0,0.4); padding: 14px; border-radius: 8px; font-family: var(--font-mono); font-size: 12px; line-height: 1.5; color: #E2E8F0; max-height: 300px; overflow-y: auto;">${escapeHtml(loc.raw || loc.body || 'Sem conteúdo')}</pre>
    </div>
  `;
  document.getElementById('skill-modal').classList.add('open');
};

window.syncProject = async function (projectPath) {
  showConsole(`Sincronizando projeto: ${projectPath}...`);
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_path: projectPath }),
    });
    const data = await res.json();
    appendConsole(data.output || 'Concluído.');
    refreshAll();
  } catch (e) {
    appendConsole('Erro: ' + e);
  }
};

window.toggleProjectSkill = async function (projectPath, skillName, enable) {
  showConsole(`${enable ? 'Adicionando' : 'Removendo'} skill '${skillName}' em ${projectPath}...`);
  try {
    const res = await fetch('/api/lock/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_path: projectPath, skill_name: skillName, enable }),
    });
    const data = await res.json();
    appendConsole(data.sync_output || 'Atualizado.');
    refreshAll();
  } catch (e) {
    appendConsole('Erro: ' + e);
  }
};

// STUDIO VIEW
function initStudio() {
  const defaultSkillTemplate = `---
name: minha-nova-skill
description: >
  Explique com palavras-chave claras o que a skill faz e quando a LLM
  deve aciona-la automaticamente (ex: gatilhos, tipos de arquivos, comandos).
tags: [dev, backend, api]
globs: ["src/**/*.py", "api/**/*.ts"]
always_apply: false
compatible_with: [claude, gemini, cursor, windsurf, copilot]
status: draft
version: "1.0.0"
---

# Nome da Skill

Resumo direto em 1 frase do proposito da skill.

## Quando usar
- "frase ou comando tipico do usuario"
- Contexto ou cenario especifico onde esta regra se aplica

## Como fazer
1. Passo a passo objetivo ou diretriz tecnica.
2. Exemplos de codigo ou saida esperada:
\`\`\`python
# Exemplo concreto
def exemplo():
    pass
\`\`\`

## O que NUNCA fazer
- Proibicoes criticas e antipatterns.
`;

  const editor = document.getElementById('studio-editor');
  editor.value = defaultSkillTemplate;

  let debounceTimeout = null;
  editor.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(updateLivePreview, 250);
  });

  document.querySelectorAll('.preview-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.preview-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      activePreviewTarget = tab.getAttribute('data-target');
      renderActivePreview();
    });
  });

  document.getElementById('btn-studio-template').addEventListener('click', () => {
    editor.value = defaultSkillTemplate;
    updateLivePreview();
  });

  updateLivePreview();
}

async function updateLivePreview() {
  const rawText = document.getElementById('studio-editor').value;
  try {
    const res = await fetch('/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: rawText }),
    });
    const data = await res.json();
    if (data.previews) {
      currentPreviews = data.previews;
      renderActivePreview();
    }
  } catch (e) {
    console.error('Erro de preview:', e);
  }
}

function renderActivePreview() {
  const codeEl = document.getElementById('studio-preview-code');
  if (!currentPreviews[activePreviewTarget]) {
    codeEl.innerText = '// Digite seu SKILL.md no editor ao lado para ver o preview compilado...';
    return;
  }

  const p = currentPreviews[activePreviewTarget];
  if (typeof p === 'object' && p.file) {
    codeEl.innerText = `// [Import no GEMINI.md]:\n${p.import}\n\n// [Arquivo .gemini/skills/<nome>.md]:\n${p.file}`;
  } else {
    codeEl.innerText = p;
  }
}

// METRICS VIEW
function renderMetrics() {
  const container = document.getElementById('metrics-insights-container');
  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
      <div class="stat-card" style="border-left: 4px solid var(--accent-emerald);">
        <div>
          <h4 style="font-size: 15px; margin-bottom: 4px;">🎯 Padrão de Dependências Python</h4>
          <p style="font-size: 12px; color: var(--text-muted); line-height: 1.4;">
            A skill <code>managing-python-dependencies</code> (uv) está ativa em 100% dos projetos elegíveis.
          </p>
        </div>
      </div>
      <div class="stat-card" style="border-left: 4px solid var(--accent-cyan);">
        <div>
          <h4 style="font-size: 15px; margin-bottom: 4px;">🚀 Oportunidade de Promoção</h4>
          <p style="font-size: 12px; color: var(--text-muted); line-height: 1.4;">
            O <code>Project_Siaebr</code> possui uma rotina de deploy Docker Compose. Caso use em outros projetos, considere promover para o catálogo global!
          </p>
        </div>
      </div>
      <div class="stat-card" style="border-left: 4px solid var(--accent-purple);">
        <div>
          <h4 style="font-size: 15px; margin-bottom: 4px;">⚡ Meta-Skill Creator Integrada</h4>
          <p style="font-size: 12px; color: var(--text-muted); line-height: 1.4;">
            A meta-skill <code>skill-creator</code> está catalogada para orientar a criação de novas instruções com progressive disclosure.
          </p>
        </div>
      </div>
    </div>
  `;
}

// CONSOLE DRAWER
function initConsole() {
  document.getElementById('btn-close-console').addEventListener('click', () => {
    document.getElementById('output-console').classList.remove('open');
  });
}

function showConsole(initialText = '') {
  const consoleEl = document.getElementById('output-console');
  const textEl = document.getElementById('console-output-text');
  textEl.innerText = initialText;
  consoleEl.classList.add('open');
}

function appendConsole(text) {
  const textEl = document.getElementById('console-output-text');
  textEl.innerText += '\n' + text;
  textEl.scrollTop = textEl.scrollHeight;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
