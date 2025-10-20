

// === MODIFICAR INICIALIZACIÓN PRINCIPAL ===
const originalDOMContentLoaded = () => {
  console.log('🎯 Iniciando aplicación con validación...');
  const dataLoaded = safeLoad();
  if (!dataLoaded || projects.length === 0) {
    console.log('📝 No hay datos, creando proyecto inicial...');
     } else {
    console.log('✅ Datos cargados correctamente');
    renderProjects();
    selectProject(currentProjectIndex);
    checkOverdueTasks();
  }
  setupEventListeners();
  // ... resto de tu inicialización
};


// === CERRAR SESIÓN ===
function logout() {
  localStorage.removeItem('authToken');
  showNotification('✅ Sesión cerrada correctamente');
  setTimeout(() => {
    location.reload(); // Recargar para mostrar el login
  }, 1000);
}


// Reemplazar el evento DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
  // ✅ Verificar autenticación ANTES de cargar la app
  const token = localStorage.getItem('authToken');
  if (!token) {
    showLoginScreen();
    return; // ⬅️ Detener aquí si no hay token
  }

  // 👇 Solo si hay token, continuar con la app
  console.log('🎯 Iniciando aplicación con validación...');
  const dataLoaded = safeLoad();
  if (!dataLoaded || projects.length === 0) {
    console.log('📝 No hay datos, creando proyecto inicial...');
   
  } else {
    console.log('✅ Datos cargados correctamente');
    renderProjects();
    selectProject(currentProjectIndex);
    checkOverdueTasks();
  }
  setupEventListeners();
  // ... resto de tu inicialización
});
/**************************************
 * SISTEMA DE VALIDACIÓN Y RESPALDO *
 **************************************/
console.log('🔧 Iniciando sistema de validación...');

// Variable para controlar el modo
let useBackend = true;
const API_URL = 'https://proyectos-backend-lx0a.onrender.com';

// Función para verificar estado del backend
async function checkBackendStatus() {
    try {
        console.log('🔄 Verificando conexión con backend...');
        const response = await fetch(`${API_URL}/health`, {
            timeout: 3000 // 3 segundos máximo
        });
        
        if (response.ok) {
            console.log('✅ Backend disponible');
            useBackend = true;
            return true;
        }
    } catch (error) {
        console.warn('⚠️ Backend no disponible - Modo localStorage');
        useBackend = false;
    }
    return false;
}

// Función de respaldo para guardar
async function safeSave() {
  console.group('📤 Guardando datos en backend o localStorage');
  
  // Siempre guardar en localStorage
  localStorage.setItem('projects', JSON.stringify(projects));
  console.log('📦 Datos guardados en localStorage');

  // Intentar guardar en backend
  if (window.useBackend && authToken) {
    try {
      const response = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projects: projects,
          currentProjectIndex: currentProjectIndex,
          timestamp: new Date().toISOString()
        })
      });
      if (response.ok) {
        console.log('✅ Datos guardados en MongoDB');
      } else {
        console.warn('⚠️ Error guardando en backend');
      }
    } catch (error) {
      console.warn('⚠️ Error de conexión, datos solo en localStorage');
      window.useBackend = false;
    }
  }

  console.groupEnd();
  return true;
}
// Función de respaldo para cargar
async function safeLoad() {
  console.group('📥 Cargando datos desde backend o localStorage');
  let loadedData = null;

  // ✅ Si el backend está disponible, CARGA SIEMPRE desde ahí
  if (await checkBackendStatus()) {
    try {
      const response = await fetch(`${API_URL}/projects`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        loadedData = await response.json();
        console.log('✅ Datos cargados desde MongoDB');
        window.useBackend = true;
        // ✅ Guardar en localStorage como respaldo, PERO USAR los del backend
        localStorage.setItem('projects', JSON.stringify(loadedData.projects));
        localStorage.setItem('currentProjectIndex', loadedData.currentProjectIndex || 0);
      }
    } catch (error) {
      console.warn('⚠️ Error cargando desde backend');
    }
  }

  // ❌ Solo usar localStorage si el backend NO está disponible
  if (!loadedData || !loadedData.projects) {
    console.log('🔄 Backend no disponible, usando localStorage');
    const savedProjects = localStorage.getItem('projects');
    if (savedProjects) {
      loadedData = {
        projects: JSON.parse(savedProjects),
        currentProjectIndex: parseInt(localStorage.getItem('currentProjectIndex') || '0')
      };
    }
  }

  if (loadedData && loadedData.projects) {
    projects = loadedData.projects;
    currentProjectIndex = loadedData.currentProjectIndex || 0;
  } else {
    if (projects.length === 0) {
      createNewProject();
    }
  }
  console.groupEnd();
  return !!loadedData;
}


/**************************************
 * SISTEMA DE METODOLOGÍAS HÍBRIDAS - PASO 1 *
 **************************************/
class MethodologyManager {
    constructor() {
        this.currentMode = localStorage.getItem('projectMethodology') || 'hybrid';
    }

    setMode(mode) {
        const validModes = ['agile', 'traditional', 'hybrid'];
        if (validModes.includes(mode)) {
            this.currentMode = mode;
            localStorage.setItem('projectMethodology', mode);
            this.applyModeSettings();
            return true;
        }
        return false;
    }

    applyModeSettings() {
    console.log('Modo activo:', this.currentMode);
    const selector = document.getElementById('methodologySelector');
    if (selector) selector.value = this.currentMode;
    
    // Añade esta línea para ver el cambio visual
    document.body.setAttribute('data-mode', this.currentMode);


}

    getCurrentMode() {
        return this.currentMode;
    }
}

// Inicializar solo una instancia
window.methodologyManager = new MethodologyManager(); 


/**************************************
 * VARIABLES GLOBALES Y ELEMENTOS DOM *
 **************************************/
let projects = [];
let currentProjectIndex = 0;


// === AUTENTICACIÓN FRONTEND ===
let authToken = localStorage.getItem('authToken');


// === SISTEMA DE TIEMPO REAL ===
let tiempoRealSocket = null;

function initWebSocket() {
  try {
    if (typeof io === 'undefined') {
      console.warn('⚠️ Socket.io no cargado, reintentando...');
      setTimeout(initWebSocket, 2000);
      return;
    }
    
    console.log('🔄 Iniciando WebSocket...');
    tiempoRealSocket = io('https://proyectos-backend-lx0a.onrender.com', {
      transports: ['websocket', 'polling']
    });
    
    tiempoRealSocket.on('connect', function() {
      console.log('🔗 Conectado al servidor en tiempo real');
      if (window.currentProjectIndex !== null && window.currentProjectIndex !== undefined) {
        tiempoRealSocket.emit('join-project', window.currentProjectIndex);
      }
    });
    
    tiempoRealSocket.on('task-updated', function(data) {
      console.log('🔄 Cambio recibido:', data);
      if (typeof refreshCurrentView === 'function') {
        refreshCurrentView();
      }
    });
    
    tiempoRealSocket.on('disconnect', function() {
      console.log('🔌 Desconectado');
    });
    
  } catch (error) {
    console.error('❌ Error WebSocket:', error);
  }
}

function refreshCurrentView() {
  try {
    if (typeof getActiveView !== 'function') return;
    
    const activeView = getActiveView();
    console.log('🔄 Actualizando vista:', activeView);
    
    switch(activeView) {
      case 'board':
        if (typeof renderKanbanTasks === 'function') renderKanbanTasks();
        break;
      case 'list':
        if (typeof renderListTasks === 'function') renderListTasks();
        break;
      case 'dashboard':
        if (typeof renderDashboard === 'function') renderDashboard();
        break;
      default:
        if (typeof renderKanbanTasks === 'function') renderKanbanTasks();
    }
  } catch (error) {
    console.error('❌ Error actualizando vista:', error);
  }
}
// === FUNCIONES DE AUTENTICACIÓN (ÁMBITO GLOBAL) ===
function showRegisterForm() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
  document.getElementById('registerError').textContent = '';
}

function showLoginForm() {
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('loginError').textContent = '';
}

async function register() {
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  if (!name || !email || !password) {
    document.getElementById('registerError').textContent = 'Completa todos los campos';
    return;
  }
  try {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role: 'viewer'  })
    });
    const data = await res.json();
    if (res.ok) {
      alert('✅ Cuenta creada. Ahora inicia sesión.');
      setTimeout(showLoginForm, 1500);
    } else {
      document.getElementById('registerError').textContent = data.error || 'Error al crear cuenta';
    }
  } catch (err) {
    document.getElementById('registerError').textContent = 'Error de conexión con el servidor';
  }
}

async function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) {
    document.getElementById('loginError').textContent = 'Completa todos los campos';
    return;
  }
  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    console.log('🚀 Respuesta del backend:', res.status, res.statusText);

    // Intenta leer el cuerpo solo si hay contenido
    let data = {};
    if (res.headers.get('content-length') !== '0') {
      data = await res.json();
    }

    console.log('✅ Datos recibidos:', data);

    if (res.ok) {
      authToken = data.token;
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('userRole', data.user.role || 'viewer');
      location.reload();
    } else {
      document.getElementById('loginError').textContent = data.error || 'Error desconocido';
    }
  } catch (err) {
    console.error('❌ Error en login():', err); // 👈 Añade este log
    document.getElementById('loginError').textContent = 'Error de conexión con el servidor';
  }
}
// === MOSTRAR PANTALLA DE LOGIN/REGISTRO ===
function showLoginScreen() {
  document.body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#f5f7fa;font-family:Arial,sans-serif;">
      <div id="authFormContainer" style="background:white;padding:30px;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.1);width:350px;">
        <!-- Formulario de Login -->
        <div id="loginForm">
          <h2 style="text-align:center;margin:0 0 20px;">🔒 Iniciar Sesión</h2>
          <input type="email" id="loginEmail" placeholder="Email" style="width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:4px;">
          <input type="password" id="loginPassword" placeholder="Contraseña" style="width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:4px;">
          <button onclick="login()" style="width:100%;padding:12px;background:#3498db;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">Entrar</button>
          <div id="loginError" style="color:#e74c3c;margin-top:12px;text-align:center;"></div>
          <div style="margin-top:15px;text-align:center;">
            ¿No tienes cuenta? 
            <a href="#" onclick="showRegisterForm(); return false;" style="color:#3498db;text-decoration:underline;">Regístrate aquí</a>
          </div>
        </div>

        <!-- Formulario de Registro (oculto por defecto) -->
        <div id="registerForm" style="display:none;">
          <h2 style="text-align:center;margin:0 0 20px;">📝 Crear Cuenta</h2>
          <input type="text" id="registerName" placeholder="Nombre completo" style="width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:4px;">
          <input type="email" id="registerEmail" placeholder="Email" style="width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:4px;">
          <input type="password" id="registerPassword" placeholder="Contraseña" style="width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:4px;">
          <button onclick="register()" style="width:100%;padding:12px;background:#2ecc71;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">Crear Cuenta</button>
          <div id="registerError" style="color:#e74c3c;margin-top:12px;text-align:center;"></div>
          <div style="margin-top:15px;text-align:center;">
            ¿Ya tienes cuenta? 
            <a href="#" onclick="showLoginForm(); return false;" style="color:#3498db;text-decoration:underline;">Inicia sesión</a>
          </div>
        </div>
      </div>
    </div>
  `;
}





// Elementos del DOM
const projectNameDisplay = document.getElementById('projectName');
const projectNameList = document.getElementById('projectNameList');
const projectNameCalendar = document.getElementById('projectNameCalendar');
const projectNameGantt = document.getElementById('projectNameGantt');
const projectNameReports = document.getElementById('projectNameReports');
const projectListContainer = document.getElementById('projectList');
const statisticsSection = document.querySelector('.statistics');
const notification = document.getElementById('notification');
const taskDetailsModal = document.getElementById('taskDetailsModal');
const createTaskModal = document.getElementById('createTaskModal');
const createTaskForm = document.getElementById('createTaskForm');
const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
const sidebar = document.querySelector('aside');

// Columnas del Kanban
const columns = {
  pending: document.getElementById('pendingList'),
  inProgress: document.getElementById('inProgressList'),
  completed: document.getElementById('completedList'),
  overdue: document.getElementById('overdueList')
};

// Elementos de estadísticas
const totalTasks = document.getElementById('totalTaskCount');
const pendingCount = document.getElementById('pendingCount');
const inProgressCount = document.getElementById('inProgressCount');
const completedCount = document.getElementById('completedCount');
const overdueCount = document.getElementById('overdueCount');
const pieChartCanvas = document.getElementById('pieChart');

// Elementos de tiempo en Reports
const totalEstimatedTime = document.getElementById('totalEstimatedTime');
const totalLoggedTime = document.getElementById('totalLoggedTime');
const remainingTime = document.getElementById('remainingTime');

// ===== SELECTORES DE VISTAS =====
// Versión corregida:
const viewSelectors = {
  board: '#boardView',
  list: '#listView',
  calendar: '#calendarView',
  gantt: '#ganttView',
  reports: '#reportsView',
  profitability: '#profitabilityView',
  dashboard: '#dashboardView',
  timeAllocation: '#timeAllocationView' 
};

const viewButtons = {
  board: document.querySelector('#showBoardView'),
  list: document.querySelector('#showListView'),
  calendar: document.querySelector('#showCalendarView'),
  gantt: document.querySelector('#showGanttView'),
  reports: document.querySelector('#showReportsView'),
  profitability: document.querySelector('#showProfitabilityView'),
  dashboard: document.querySelector('#showDashboardView')
};
// ===== ELEMENTOS DE VISTAS =====
const boardView = document.querySelector(viewSelectors.board);
const listView = document.querySelector(viewSelectors.list);
const calendarView = document.querySelector(viewSelectors.calendar);
const ganttView = document.querySelector(viewSelectors.gantt);
const reportsView = document.querySelector(viewSelectors.reports);
const profitabilityView = document.querySelector(viewSelectors.profitability);



/*********************************
 * ESTILOS DE MODO PARA DASHBOARD *
 *********************************/

function applyDashboardModeStyles(mode) {
  console.log('🎨 Aplicando modo:', mode);
  const dashboardElement = document.getElementById('dashboardView');
  if (!dashboardElement) return;
  
  dashboard.classList.remove('mode-agile', 'mode-traditional', 'mode-hybrid');
  dashboard.classList.add('mode-' + mode);
  
  // Aquí NO ocultamos ni mostramos nada, solo cambiamos estilos
  // Tu dashboard híbrido se mantiene COMPLETO en todos los modos
}

function highlightRelevantSections(mode) {
  const highlightStyles = {
    'agile': `
      .mode-agile .progress-container,
      .mode-agile .time-metric,
      .mode-agile #timeChart,
      .mode-agile #tasksDistributionChart {
        border-left: 4px solid #4caf50 !important;
        background-color: rgba(76, 175, 80, 0.05) !important;
        transition: all 0.3s ease;
      }
    `,
    'traditional': `
      .mode-traditional .progress-container,
      .mode-traditional .time-metric,
      .mode-traditional #timeChart,
      .mode-traditional #tasksDistributionChart {
        border-left: 4px solid #2196f3 !important;
        background-color: rgba(33, 150, 243, 0.05) !important;
        transition: all 0.3s ease;
      }
    `,
    'hybrid': ''
  };

  // Eliminar estilo anterior
  const oldStyle = document.getElementById('dashboard-mode-styles');
  if (oldStyle) oldStyle.remove();

  // Crear nuevo estilo
  const style = document.createElement('style');
  style.id = 'dashboard-mode-styles';
  style.textContent = highlightStyles[mode] || '';
  document.head.appendChild(style);
}
/*************************
 * FUNCIONES AUXILIARES *
 *************************/
function getStatusText(status) {
  switch (status) {
    case 'pending': return 'Pendiente';
    case 'inProgress': return 'En Progreso';
    case 'completed': return 'Completado';
    case 'overdue': return 'Rezagado';
    default: return status || 'Desconocido';
  }
}

function capitalizeFirstLetter(string) {
  return string?.charAt(0).toUpperCase() + string?.slice(1) || '';
}

function formatDate(date) {
  if (!date) return '--/--/----';
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function showNotification(message) {
    const notif = document.createElement('div');
    notif.textContent = message;
    notif.style.cssText = `
        position: fixed; top: 20px; right: 20px; background: #333; color: white;
        padding: 10px 20px; border-radius: 5px; z-index: 9999; font-family: Arial, sans-serif;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(notif);
    setTimeout(() => document.body.removeChild(notif), 3000);
}
function updateLocalStorage() {
    // Esta función ahora solo es un alias para safeSave
    safeSave().then(() => {
        console.log('🔄 Datos persistidos (localStorage + backend si está disponible)');
    });
}
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this, args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/******************************
 * FUNCIONES DE CONTROL DE VISTAS
 ******************************/
function showView(view) {
// === [NUEVO CÓDIGO - COLOCAR JUSTO AQUÍ] ===
  // Validación de modo metodológico
  const currentMode = window.methodologyManager?.getCurrentMode?.() || 'hybrid';
  const allowedViews = {
      'agile': ['board', 'calendar', 'list', 'dashboard'], // ✅ Añadir dashboard
    'traditional': ['gantt', 'list', 'reports', 'dashboard'], // ✅ Añadir dashboard
      'hybrid': ['board', 'gantt', 'calendar', 'list', 'reports', 'dashboard', 'profitability']
  };

  if (currentMode && allowedViews[currentMode] && !allowedViews[currentMode].includes(view)) {
      showNotification(`💡 En modo ${currentMode} se recomienda usar: ${allowedViews[currentMode].join(', ')}`);
      return; // Detener la ejecución
  }
  // === [FIN DEL NUEVO CÓDIGO] ===

  if (!viewSelectors[view]) {
    console.error(`Vista "${view}" no existe`);
    return;
  }

  Object.values(viewSelectors).forEach(selector => {
    const element = document.querySelector(selector);
    if (element) element.classList.add('hidden');
  });



  const activeView = document.querySelector(viewSelectors[view]);
  if (activeView) activeView.classList.remove('hidden');

  Object.entries(viewButtons).forEach(([key, button]) => {
    if (button) {
      button.classList.toggle('active', key === view);
    }
  });

  switch(view) {
    case 'board':
      renderKanbanTasks();
      break;
    case 'list':
      renderListTasks();
      break;
    case 'calendar':
      renderCalendar();
      break;
    case 'gantt':
      renderGanttChart();
      break;
    case 'reports':
      generateReports();
      break;
    case 'profitability':
      renderProfitabilityView();
      break;
    case 'dashboard':
    renderDashboard();
    break;
}
  
  localStorage.setItem('activeView', view);
}

function updateMenuButtons(activeView) {
  // Remover la clase 'active' de todos los botones primero
  document.querySelectorAll('#sidebar ul li').forEach(button => {
    button.classList.remove('active');
  });

  // Agregar la clase 'active' solo al botón correspondiente
  const activeButton = document.getElementById(`show${capitalizeFirstLetter(activeView)}View`);
  if (activeButton) {
    activeButton.classList.add('active');

}}

/******************************
 * FUNCIONES PRINCIPALES
 ******************************/
function getFilteredTasks(view = 'board') {
  const prefixMap = {
    board: '',
    list: 'List',
    calendar: 'Calendar',
    gantt: 'Gantt',
    reports: 'Reports'
  };
  
  const prefix = prefixMap[view] || '';
  const assignee = document.getElementById(`filterAssignee${prefix}`)?.value.trim();
  const priority = document.getElementById(`filterPriority${prefix}`)?.value;
  const status = document.getElementById(`filterStatus${prefix}`)?.value;
  const start = document.getElementById(`filterStartDate${prefix}`)?.value;
  const end = document.getElementById(`filterEndDate${prefix}`)?.value;

  const tasks = projects[currentProjectIndex]?.tasks || [];

  return tasks.filter(task => {
    const taskAssignee = task.assignee?.trim() || '';
    const taskPriority = task.priority || '';
    const taskStatus = task.status || '';
    const taskStartDate = task.startDate || '';
    const taskDeadline = task.deadline || '';

    const matchAssignee = !assignee || taskAssignee === assignee;
    const matchPriority = !priority || taskPriority === priority;
    const matchStatus = !status || taskStatus === status;
    const matchStartDate = !start || !taskStartDate || taskStartDate >= start;
    const matchEndDate = !end || !taskDeadline || taskDeadline <= end;

    return matchAssignee && matchPriority && matchStatus && matchStartDate && matchEndDate;
  });
}

function aplicarFiltros() {
  const activeView = getActiveView();
  const filteredTasks = getFilteredTasks(activeView);

  switch(activeView) {
    case 'board':
      renderKanbanTasks(filteredTasks);
      break;
    case 'list':
      renderListTasks(filteredTasks);
      break;
    case 'calendar':
      renderCalendar();
      break;
    case 'gantt':
      renderGanttChart(filteredTasks);
      break;
    case 'reports':
      generateReports(filteredTasks);
      break;
    case 'profitability':
      renderProfitabilityView();
      break;
  }
}

function getActiveView() {
  if (!boardView.classList.contains('hidden')) return 'board';
  if (!listView.classList.contains('hidden')) return 'list';
  if (!calendarView.classList.contains('hidden')) return 'calendar';
  if (!ganttView.classList.contains('hidden')) return 'gantt';
  if (!reportsView.classList.contains('hidden')) return 'reports';
  if (!profitabilityView.classList.contains('hidden')) return 'profitability';
  return 'board';
}

/******************************
 * FUNCIONES DE RENDERIZADO
 ******************************/
function renderKanbanTasks(tasks = null) {
  const tasksToRender = tasks || getFilteredTasks('board');
  
  Object.values(columns).forEach(col => col.innerHTML = '');

  tasksToRender.forEach(task => {

// Calcular progreso de subtareas
    const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
    const totalSubtasks = task.subtasks?.length || 0;
    const subtaskProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

    const card = document.createElement('div');
    card.className = 'task-card';
    card.draggable = true;
    card.dataset.taskId = task.id;
    card.dataset.status = task.status;
    card.dataset.priority = task.priority;
    card.dataset.assignee = task.assignee || '';
    card.dataset.startDate = task.startDate || '';
    card.dataset.deadline = task.deadline || '';

    card.innerHTML = `
      <div class="task-header">
        <strong>${task.name}</strong>
        <div class="task-movement-buttons">
          <button class="move-up-btn" onclick="event.stopPropagation(); moveTaskUp(${task.id}, '${task.status}')">↑</button>
          <button class="move-down-btn" onclick="event.stopPropagation(); moveTaskDown(${task.id}, '${task.status}')">↓</button>
        </div>
        <div class="task-menu" onclick="event.stopPropagation(); toggleTaskMenu(event, ${task.id})">⋮</div>
        <div class="task-context-menu" id="task-menu-${task.id}">
          <div class="task-context-menu-item delete" onclick="deleteTaskFromMenu(${task.id})">Eliminar Tarea</div>
        </div>
      </div>
      <div class="task-meta">
        <span class="priority-badge ${task.priority}">${capitalizeFirstLetter(task.priority)}</span>
        <span class="status-badge ${task.status}">${getStatusText(task.status)}</span>
      </div>

${totalSubtasks > 0 ? `
  <div class="subtask-progress">
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${subtaskProgress}%"></div>
    </div>
    <div class="progress-text">
  <strong>${subtaskProgress}%</strong> 
  <span>(${completedSubtasks}/${totalSubtasks})</span>
</div>
` : ''}

      <div class="task-footer">
        <p><strong>Fecha Límite:</strong> ${task.deadline || '-'}</p>
      </div>
    `;

    // Configuración del evento click para mostrar detalles
    card.addEventListener('click', () => showTaskDetails(task));
    columns[task.status].appendChild(card);
  });

  initDragAndDrop();
}
/*********************
 * MENÚ CONTEXTUAL DE TAREAS *
 *********************/
function toggleTaskMenu(event, taskId) {
  event.stopPropagation();
  
  // Cerrar todos los otros menús
  document.querySelectorAll('.task-context-menu').forEach(menu => {
    if (menu.id !== `task-menu-${taskId}`) {
      menu.classList.remove('show');
    }
  });
  
  // Alternar el menú actual
  const menu = document.getElementById(`task-menu-${taskId}`);
  if (menu) {
    menu.classList.toggle('show');
  }
}

function deleteTaskFromMenu(taskId) {
  const task = projects[currentProjectIndex].tasks.find(t => t.id === taskId);
  if (!task) return;
  
  if (confirm(`¿Estás seguro de eliminar "${task.name}"? Esta acción no se puede deshacer.`)) {
    // 🔥 PRIMERO NOTIFICAR la eliminación
    if (tiempoRealSocket && tiempoRealSocket.connected) {
      tiempoRealSocket.emit('task-changed', {
        projectId: currentProjectIndex,
        taskId: taskId,
        taskName: task.name,
        userName: 'Usuario actual',
        type: 'task-deleted',
        timestamp: new Date().toISOString()
      });
      console.log('📢 Notificando eliminación de tarea');
    }
    
    // LUEGO eliminar (tu código actual)
    projects[currentProjectIndex].tasks = projects[currentProjectIndex].tasks.filter(t => t.id !== taskId);
    updateLocalStorage();
    actualizarAsignados();
    aplicarFiltros();
    generatePieChart(getStats());
    updateProjectProgress();
    actualizarAsignados();
    showNotification(`Tarea "${task.name}" eliminada`);
  }
}
function renderListTasks(tasks = null) {
  const taskTableBody = document.getElementById('taskTableBody');
  if (!taskTableBody) return;

  taskTableBody.innerHTML = '';

  const tasksToRender = tasks || getFilteredTasks('list');

  if (tasksToRender.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.className = 'empty-row';
    emptyRow.innerHTML = `
      <td colspan="6" class="empty-cell">
        <i class="fas fa-tasks"></i>
        No se encontraron tareas con los filtros aplicados
      </td>
    `;
    taskTableBody.appendChild(emptyRow);
    return;
  }

  tasksToRender.forEach((task, index) => {
    const row = document.createElement('tr');
    row.className = `task-data-row ${index % 2 === 0 ? 'even-row' : 'odd-row'}`;
    
    const estadoText = getStatusText(task.status);
    const priorityText = capitalizeFirstLetter(task.priority);
    
    row.innerHTML = `
      <td class="data-cell task-name-cell">
        <div class="task-name-content">${task.name || '-'}</div>
      </td>
      
      <td class="data-cell date-cell">
        <div class="date-content">${formatDate(task.startDate)}</div>
      </td>
      
      <td class="data-cell date-cell">
        <div class="date-content">${formatDate(task.deadline)}</div>
      </td>
      
      <td class="data-cell status-cell">
        <div class="status-pill status-${task.status}">
          ${estadoText}
        </div>
      </td>
      
      <td class="data-cell assignee-cell">
        <div class="assignee-content">${task.assignee || '-'}</div>
      </td>
      
      <td class="data-cell priority-cell">
        <div class="priority-pill priority-${task.priority}">
          ${priorityText}
        </div>
      </td>
    `;
    
    row.addEventListener('click', () => showTaskDetails(task));
    taskTableBody.appendChild(row);
  });
}
/******************************
 * FUNCIONES DEL DASHBOARD
 ******************************/
function renderDashboard() {
  const project = projects[currentProjectIndex];
  if (!project) return;

  // Actualizar información básica
  document.getElementById('projectNameDashboard').textContent = project.name;

  // Calcular KPIs
  const stats = getStats();
  const timeStats = getTimeStats();
  const completionPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

// === Cálculo y actualización de Presupuesto (uso de tiempo) ===
    const budgetUsage = calculateTimeBudgetUsage();
    const budgetElement = document.getElementById('budgetConsumption');
    if (budgetElement) {
        budgetElement.textContent = `${budgetUsage}%`;
    }

    // Actualizar fechas del proyecto
    updateProjectDatesFromTasks();


// Calcular fechas del proyecto
    const { earliestDate, latestDate } = calculateProjectDatesFromTasks(project);
    updateProjectDatesInDashboard(earliestDate, latestDate);


  // Calcular y mostrar feedback de tiempo
  const timeDifference = (project.totalProjectTime || 0) - timeStats.totalLogged;
  const feedbackElement = document.getElementById('timeFeedback');
if (feedbackElement) {
    if (timeDifference >= 0) {
        feedbackElement.textContent = `✅ Excelente Trabajo - Estás dentro del tiempo Programado (${timeDifference.toFixed(1)}h restantes)`;
    } else {
        feedbackElement.innerHTML = `<span class="warning-symbol">⚠</span> Algo anda mal - Has excedido el tiempo programado por (${Math.abs(timeDifference).toFixed(1)}h)`;
    }
}


  // Actualizar barra de progreso y porcentaje
  const progressFill = document.getElementById('projectProgressFillDash');
  const progressPercentage = document.getElementById('progressPercentage');
  if (progressFill) {
    progressFill.style.width = `${completionPercentage}%`;
    progressFill.style.backgroundColor = '#2ecc71'; // Verde para completado
  }

// Actualizar campo de Avance en el resumen
const avanceElement = document.getElementById('completionPercentage');
if (avanceElement) {
    avanceElement.textContent = `${completionPercentage}%`;
}

  if (progressPercentage) {
    progressPercentage.textContent = `${completionPercentage}% Completado`;
  }

  // Actualizar todos los cuadros de métricas
  document.getElementById('totalTasksMetric').textContent = stats.total;
  document.getElementById('pendingTasksMetric').textContent = stats.pending;
  document.getElementById('inProgressTasksMetric').textContent = stats.inProgress;
  document.getElementById('completedTasksMetric').textContent = stats.completed;
  document.getElementById('overdueTasksMetric').textContent = stats.overdue;

  // Actualizar métricas de tiempo
  document.getElementById('totalProjectTimeDash').textContent = `${project.totalProjectTime || 0}h`;
  document.getElementById('totalEstimatedDash').textContent = `${timeStats.totalEstimated.toFixed(1)}h`;
  document.getElementById('totalLoggedDash').textContent = `${timeStats.totalLogged.toFixed(1)}h`;

// ✅ Actualizar estado basado en tiempo
updateProjectHealthStatus(); // ← Esta línea es clave


  // Calcular el tiempo restante basado en el tiempo total del proyecto
  const projectTimeRemaining = (project.totalProjectTime || 0) - timeStats.totalLogged;
  document.getElementById('remainingTimeDash').textContent = `${projectTimeRemaining.toFixed(1)}h`;

  // Actualizar gráficos
  renderDashboardCharts();

  // Actualizar estado del proyecto
  updateProjectHealthStatus();

  // Actualizar hitos y acciones
  updateMilestones();
  updateRequiredActions();

  // Actualiza estadísticas visuales
  updateStatistics();
  generatePieChart(getStats());


  // Dibuja gráfica de recursos
  updateResourceAllocation();

  // === IMPORTANTE: Asegúrate de que esta línea esté presente ===
  updateProjectTimeline(); // ← Añade esta línea si ya tienes la función definida
  updateProjectDatesFromTasks();
// ✅ Actualizar contador de riesgos
updateRisksCount();

// === [NUEVO: ÉNFASIS DETALLADO] ===
  const currentMode = window.methodologyManager.getCurrentMode();
  applyDashboardModeStyles(currentMode);
  applyDetailedModeStyles(currentMode); // ← Añadir esta línea
}



function updateProjectDatesInDashboard(earliestDate, latestDate) {
    // Formatear las fechas
    const formattedStartDate = formatDate(earliestDate);
    const formattedEndDate = formatDate(latestDate);

    // Actualizar los campos de fecha
    document.getElementById('projectStartDate').textContent = formattedStartDate;
    document.getElementById('projectEndDate').textContent = formattedEndDate;

    // Calcular la diferencia de días
    const startDateObj = new Date(earliestDate);
    const endDateObj = new Date(latestDate);
    const timeDifference = Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24));
    document.getElementById('projectTotalDays').textContent = `${timeDifference} `;
}

// Función auxiliar para formatear fechas
function formatDate(dateString) {
    if (!dateString) return '--/--/--';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '--/--/--';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;

}



function updateProjectTimeline() {
  // Verificar que el proyecto y las tareas existan
  if (!projects || !Array.isArray(projects) || currentProjectIndex === undefined || currentProjectIndex === null) {
    console.warn("⚠️ Proyecto no disponible para calcular fechas.");
    return;
  }


function updateProjectStartDate() {
    const project = projects[currentProjectIndex];
    if (!project || !project.tasks || project.tasks.length === 0) {
        document.getElementById('projectStartDate').textContent = '--/--/--';
        return;
    }

    let earliestDate = null;

    project.tasks.forEach(task => {
        if (task.startDate) {
            const taskDate = new Date(task.startDate);
            if (!earliestDate || taskDate < earliestDate) {
                earliestDate = taskDate;
            }
        }
    });

    if (earliestDate) {
        const day = String(earliestDate.getDate()).padStart(2, '0');
        const month = String(earliestDate.getMonth() + 1).padStart(2, '0');
        const year = earliestDate.getFullYear();
        document.getElementById('projectStartDate').textContent = `${day}/${month}/${year}`;
    } else {
        document.getElementById('projectStartDate').textContent = '--/--/--';
    }
}




  const project = projects[currentProjectIndex];
  if (!project || !project.tasks || project.tasks.length === 0) {
    document.getElementById('projectStartDate').textContent = '--/--/--';
    document.getElementById('projectEndDate').textContent = '--/--/--';
    return;
  }

  const tasks = project.tasks;

  // Extraer y filtrar fechas de inicio (startDate) y fin (deadline)
  const startDates = tasks
    .filter(t => t.startDate)
    .map(t => new Date(t.startDate))
    .filter(date => !isNaN(date.getTime()));

  const endDates = tasks
    .filter(t => t.deadline)
    .map(t => new Date(t.deadline))
    .filter(date => !isNaN(date.getTime()));

  // Si no hay fechas válidas
  if (startDates.length === 0) {
    document.getElementById('projectStartDate').textContent = '--/--/--';
  } else {
    const earliestStart = new Date(Math.min(...startDates));
    document.getElementById('projectStartDate').textContent = formatDate(earliestStart);
  }

  if (endDates.length === 0) {
    document.getElementById('projectEndDate').textContent = '--/--/--';
  } else {
    const latestEnd = new Date(Math.max(...endDates));
    document.getElementById('projectEndDate').textContent = formatDate(latestEnd);
  }
}function renderDashboardCharts() {
  const stats = getStats();
  const timeStats = getTimeStats();
  
  // Gráfico de distribución de tareas
  const tasksCtx = document.getElementById('tasksDistributionChart').getContext('2d');
  if (window.tasksChart) window.tasksChart.destroy();
  
  window.tasksChart = new Chart(tasksCtx, {
    type: 'doughnut',
    data: {
      labels: ['Pendientes', 'En Progreso', 'Completadas'],
      datasets: [{
        data: [stats.pending, stats.inProgress, stats.completed],
        backgroundColor: ['#f1c40f', '#008090', '#2ecc71']
      }]
    },
    options: {
      cutout: '70%',
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
  
  // Gráfico de tiempo
  const timeCtx = document.getElementById('timeChart').getContext('2d');
  if (window.timeChart) window.timeChart.destroy();
  
  window.timeChart = new Chart(timeCtx, {
    type: 'bar',
    data: {
      labels: ['Estimado', 'Registrado', 'Restante'],
      datasets: [{
        data: [timeStats.totalEstimated, timeStats.totalLogged, timeStats.remaining],
        backgroundColor: ['#3498db', '#2ecc71', '#f39c12']
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
// Al final de la función, asegúrate de incluir:
    updateResourceAllocation();
}

function updateProjectHealthStatus() {
  // Obtener estadísticas de tiempo
  const timeStats = getTimeStats();
  const totalEstimated = timeStats.totalEstimated;  // Tiempo total estimado
  const totalLogged = timeStats.totalLogged;        // Tiempo ya registrado

  // Calcular la diferencia: Tiempo Total - Tiempo Registrado
  const difference = totalEstimated - totalLogged;

  // Obtener el contenedor y el badge del estado
  const healthStatus = document.getElementById('projectHealthStatus');
  const badge = healthStatus.querySelector('.status-badge');

  // Limpiar clases de estado anteriores
  badge.classList.remove('healthy', 'warning', 'critical');

  // Actualizar texto y color según la diferencia
  if (difference >= 0) {
    // Dentro del tiempo estimado
    badge.classList.add('healthy');
    badge.textContent = 'EN TIEMPO';
  } else {
    // Fuera de tiempo
    badge.classList.add('critical');
    badge.textContent = 'A destiempo';
  }
}
function updateMilestones() {
  // Esta función ahora se maneja automáticamente con el sistema de carga/guardado
  // Los hitos se actualizan cuando se agregan/eliminan
}
function updateRequiredActions() {
  // Implementar lógica para identificar acciones requeridas
}
/******************************
 * FUNCIÓN DE CALENDARIO
 ******************************/
function renderCalendar() {
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) return;

  calendarEl.innerHTML = '';

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    locale: 'es',
    editable: true,
    dateClick: function(info) {
      document.getElementById('createTaskModal').style.display = 'block';
      document.getElementById('taskStartDate').value = info.dateStr;
      document.getElementById('taskDeadline').value = info.dateStr;
    },
    events: getFilteredCalendarTasks(),
    eventClick: function(info) {
      const task = projects[currentProjectIndex].tasks.find(t => t.name === info.event.title);
      if (task) {
        showTaskDetails(task);
      }
    }
  });

  calendar.render();
}

function getFilteredCalendarTasks() {
  const assignee = document.getElementById('filterAssigneeCalendar')?.value.trim();
  const priority = document.getElementById('filterPriorityCalendar')?.value;
  const status = document.getElementById('filterStatusCalendar')?.value;

  const tasks = projects[currentProjectIndex]?.tasks || [];

  return tasks
    .filter(task => {
      const taskAssignee = task.assignee?.trim() || '';
      const taskPriority = task.priority || '';
      const taskStatus = task.status || '';

      const matchAssignee = !assignee || taskAssignee === assignee;
      const matchPriority = !priority || taskPriority === priority;
      const matchStatus = !status || taskStatus === status;

      return matchAssignee && matchPriority && matchStatus;
    })
    .map(task => ({
      title: task.name,
      start: task.startDate || task.deadline || new Date(),
      end: task.deadline || null,
      classNames: [task.status],
      extendedProps: {
        timeTracking: task.timeLogged || 0,
        originalEstimate: task.estimatedTime || 0,
        remainingEstimate: Math.max(0, (task.estimatedTime || 0) - (task.timeLogged || 0)),
        priority: task.priority,
        assignedTo: task.assignee,
        comments: task.comments,
        fileName: task.file ? task.name : ''
      }
    }));
}

/******************************
 * FUNCIÓN DE DIAGRAMA GANTT
 ******************************/
function renderGanttChart(tasks = null) {
 const showTodayMarker = false; // Cambia a true si quieres volver a mostrarlo

  const tasksToRender = tasks || getFilteredTasks('gantt');
  const ganttContainer = document.getElementById('ganttContainer');
  
  if (!ganttContainer) return;
  
  ganttContainer.innerHTML = '';
  
  if (tasksToRender.length === 0) {
    ganttContainer.innerHTML = `
      <div class="no-tasks-message" style="
        padding: 20px;
        text-align: center;
        color: #7f8c8d;
        font-style: italic;
      ">
        <i class="fas fa-tasks" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
        No hay tareas para mostrar en el diagrama Gantt
      </div>
    `;
    return;
  }
  
  // Determinar el rango de fechas
  const dates = [];
  tasksToRender.forEach(task => {
    if (task.startDate) dates.push(new Date(task.startDate));
    if (task.deadline) dates.push(new Date(task.deadline));
  });
  
  if (dates.length === 0) {
    ganttContainer.innerHTML = `
      <div class="no-tasks-message" style="
        padding: 20px;
        text-align: center;
        color: #e74c3c;
        font-style: italic;
      ">
        <i class="fas fa-calendar-times" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
        Las tareas no tienen fechas definidas
      </div>
    `;
    return;
  }
  
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  
  // Ajustar fechas para tener un margen de 2 días
  minDate.setDate(minDate.getDate() - 2);
  maxDate.setDate(maxDate.getDate() + 2);
  
  // Crear la escala de tiempo
  const timeRange = maxDate - minDate;
  const daysInRange = Math.ceil(timeRange / (1000 * 60 * 60 * 24));
  
  // Crear el contenedor principal
  const ganttElement = document.createElement('div');
  ganttElement.className = 'gantt-container';
  
  // Crear el encabezado
  const header = document.createElement('div');
  header.className = 'gantt-header';
  
  const headerTask = document.createElement('div');
  headerTask.className = 'gantt-header-task';
  headerTask.textContent = 'Tarea';
  header.appendChild(headerTask);
  
  const headerTime = document.createElement('div');
  headerTime.className = 'gantt-header-time';
  
  const timeScale = document.createElement('div');
  timeScale.className = 'gantt-time-scale';
  
  // Agregar días al encabezado con formato
  for (let i = 0; i <= daysInRange; i++) {
    const day = new Date(minDate);
    day.setDate(day.getDate() + i);
    
    const dayElement = document.createElement('div');
    dayElement.className = 'gantt-time-unit';
    dayElement.style.flexBasis = `${100 / daysInRange}%`;
    
    // Marcar fines de semana
    if (day.getDay() === 0 || day.getDay() === 6) {
      dayElement.classList.add('weekend');
    }
    
    // Formato de fecha: Día/Mes abreviado
    const dayNum = day.getDate();
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthName = monthNames[day.getMonth()];
    
    dayElement.innerHTML = `
      <span>${dayNum}</span>
      <span style="font-size: 10px;">${monthName}</span>
    `;
    
    dayElement.title = day.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    timeScale.appendChild(dayElement);
  }
  
  // Agregar marcador de día actual
  const today = new Date();
  today.setHours(0, 0, 0, 0);

    
  headerTime.appendChild(timeScale);
  header.appendChild(headerTime);
  ganttElement.appendChild(header);
  
  // Agregar tareas
  tasksToRender.forEach(task => {
    const row = document.createElement('div');
    row.className = 'gantt-row';
    
    const taskInfo = document.createElement('div');
    taskInfo.className = 'gantt-task-info';
    
    const taskName = document.createElement('div');
    taskName.className = 'gantt-task-name';
    taskName.textContent = task.name;
    taskName.title = task.name;
    
    taskInfo.appendChild(taskName);
    row.appendChild(taskInfo);
    
    const taskBars = document.createElement('div');
    taskBars.className = 'gantt-task-bars';
    
    if (task.startDate && task.deadline) {
      const startDate = new Date(task.startDate);
      const endDate = new Date(task.deadline);
      
      const startPos = ((startDate - minDate) / timeRange) * 100;
      const endPos = ((endDate - minDate) / timeRange) * 100;
      const width = Math.max(2, endPos - startPos);
      
      const bar = document.createElement('div');
      bar.className = `gantt-bar ${task.status}`;
      bar.style.left = `${startPos}%`;
      bar.style.width = `${width}%`;
      
      // Tooltip con información detallada
      const tooltip = document.createElement('div');
      tooltip.className = 'gantt-tooltip';
      tooltip.innerHTML = `
        <strong>${task.name}</strong><br>
        <span>${formatDate(task.startDate)} - ${formatDate(task.deadline)}</span><br>
        <span>Estado: ${getStatusText(task.status)}</span><br>
        <span>Asignado: ${task.assignee || 'No asignado'}</span>
      `;
      
      bar.appendChild(tooltip);
      
      // Mostrar/ocultar tooltip
      bar.addEventListener('mouseenter', () => {
        tooltip.style.display = 'block';
        // Posicionar tooltip centrado sobre la barra
        tooltip.style.left = `${width/2}%`;
      });
      
      bar.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
      });
      
      bar.addEventListener('click', () => showTaskDetails(task));
      taskBars.appendChild(bar);
    }
    
    row.appendChild(taskBars);
    ganttElement.appendChild(row);
  });
  
  ganttContainer.appendChild(ganttElement);
}
/*************************
 * GESTIÓN DE PROYECTOS *
 *************************/
function createNewProject() {
  const projectName = prompt('Ingrese el nombre del proyecto:');
  if (!projectName) return;

  const totalTime = prompt('Ingrese el tiempo total estimado del proyecto (horas):');
  const timeValue = totalTime ? parseFloat(totalTime) || 0 : 0;

  const newProject = {
    name: projectName,
    totalProjectTime: timeValue,
    tasks: []
    
  };

  projects.push(newProject);
  currentProjectIndex = projects.length - 1;
  updateLocalStorage();
  renderProjects();
  selectProject(currentProjectIndex);
  actualizarAsignados();
  showNotification(`✅ Proyecto "${newProject.name}" creado`);
}

function renderProjects() {
  if (!projectListContainer) return;
  projectListContainer.innerHTML = '';

  projects.forEach((project, index) => {
    const li = document.createElement('li');
    li.className = 'project-item';
    li.dataset.projectIndex = index;
    
    li.innerHTML = `
      <span>${project.name}</span>
      <div class="project-menu" onclick="event.stopPropagation(); toggleProjectMenu(event, ${index})">⋮</div>
      <div class="project-context-menu" id="project-menu-${index}">
        <div class="project-context-menu-item edit" onclick="editProjectFromMenu(${index})">Editar</div>
        <div class="project-context-menu-item delete" onclick="deleteProjectFromMenu(${index})">Eliminar</div>
      </div>
    `;

    li.addEventListener('click', () => selectProject(index));
    projectListContainer.appendChild(li);
  });
}
function selectProject(index) {
  currentProjectIndex = index;
  const project = projects[index];
  
  if (!project) return;

  // Actualizar los nombres del proyecto en todas las vistas
  if (projectNameDisplay) projectNameDisplay.textContent = project.name;
  if (projectNameList) projectNameList.textContent = project.name;
  if (projectNameCalendar) projectNameCalendar.textContent = project.name;
  if (projectNameGantt) projectNameGantt.textContent = project.name;
  if (projectNameReports) projectNameReports.textContent = project.name;
  if (document.getElementById('projectNameDashboard')) {
    document.getElementById('projectNameDashboard').textContent = project.name;
  }
  
  // Actualizar el tiempo total del proyecto
  const totalTimeElement = document.getElementById('totalProjectTime');
  if (totalTimeElement) {
    totalTimeElement.textContent = `${project.totalProjectTime || 0} horas`;
  }

  actualizarAsignados();
  renderKanbanTasks();
  updateTaskList();
  updateStatistics();
  generatePieChart(getStats());
  updateProjectDatesFromTasks();
  updateProjectProgress();
  updateProjectStatusLabel();
  generateReports();
  
// Forzar la actualización de riesgos
    setTimeout(() => {
        loadRisksFromLocalStorage();
    }, 50); // Pequeño retraso para asegurar que el DOM esté listo


// Forzar la actualización de riesgos y acciones
    setTimeout(() => {
        loadRisksFromLocalStorage();
        loadActionsFromLocalStorage(); // <-- Nueva línea
   loadMilestonesFromLocalStorage(); // <-- Nueva línea
    }, 50);


  // Actualizar el dashboard si está visible
  if (!document.getElementById('dashboardView').classList.contains('hidden')) {
    renderDashboard();
// En renderDashboard()
document.getElementById('remainingTimeDash').textContent = `${timeDifference.toFixed(1)}h`;
  }


 // Cargar riesgos del proyecto seleccionado
  loadRisksFromLocalStorage(); // <-- Añadir esta línea

  // Renderizar la vista activa
  const activeView = getActiveView();
  if (activeView === 'calendar') {
    renderCalendar();
  } else if (activeView === 'gantt') {
    renderGanttChart();
  } else if (activeView === 'profitability') {
    renderProfitabilityView();
  } else if (activeView === 'dashboard') {
    renderDashboard();


} else {
        console.error("Índice de proyecto inválido:", index);


 // === AGREGAR ESTA LÍNEA PARA CARGAR RIESGOS DEL PROYECTO SELECCIONADO ===
        loadRisksFromLocalStorage();
        // ========================================================================

// Añade esto al final de la función:
    loadMilestonesFromLocalStorage(); // Cargar hitos del nuevo proyecto
    updateMilestonesStatus(); // Actualizar estados (vencido/actual/próximo)
  }
}
function editProjectName(index) {
  const newName = prompt('Ingrese el nuevo nombre:', projects[index].name);
  if (newName && newName.trim()) {
    projects[index].name = newName.trim();
    updateLocalStorage();
    renderProjects();
    selectProject(index);
    showNotification(`Nombre del proyecto actualizado a "${newName}"`);
  }
}

function deleteProject(index) {
    if (confirm(`¿Eliminar el proyecto "${projects[index].name}"?`)) {
        // Eliminar datos relacionados
        const projectMilestonesKey = `projectMilestones_${index}`;
        localStorage.removeItem(projectMilestonesKey);
        
        // Eliminar el proyecto
        projects.splice(index, 1);
        updateLocalStorage();
        
        if (projects.length === 0) {
            createNewProject();
        } else {
            renderProjects();
            selectProject(Math.min(currentProjectIndex, projects.length - 1));
        }
        showNotification('Proyecto eliminado');
    }
}
/*********************
 * GESTIÓN DE TAREAS *
 *********************/
function createNewTask(e) {
  e.preventDefault();

  const taskName = document.getElementById('taskName')?.value.trim() || '';
  if (!taskName) {
    showNotification('El nombre de la tarea es requerido');
    return;
  }

  const task = {
    id: Date.now(),
    name: taskName,
    // ... más propiedades ...
  };

  projects[currentProjectIndex].tasks.push(task);
  updateLocalStorage();
  
  actualizarAsignados();
  aplicarFiltros();
  generatePieChart(getStats());
  updateProjectProgress();

  // 🔥 AQUÍ DEBES AGREGAR EL CÓDIGO DE NOTIFICACIÓN:
  if (tiempoRealSocket && tiempoRealSocket.connected) {
    tiempoRealSocket.emit('task-changed', {
      projectId: currentProjectIndex,
      taskId: task.id,
      taskName: task.name,
      userName: 'Usuario actual',
      type: 'task-created',
      timestamp: new Date().toISOString()
    });
    console.log('📢 Notificando creación de tarea a otros usuarios');
  }

  if (createTaskModal) createTaskModal.style.display = 'none';
  e.target.reset();
  showNotification(`Tarea "${task.name}" creada`);
}function editTask(taskStr) {
  const task = JSON.parse(decodeURIComponent(taskStr));
  const newName = prompt('Editar nombre:', task.name);
  if (newName) {
    task.name = newName;
    updateLocalStorage();
    actualizarAsignados();
    aplicarFiltros();
    generatePieChart(getStats());
         updateProjectProgress();
    showNotification(`Tarea "${task.name}" actualizada`);
  }
}

function deleteTask(taskStr) {
  const task = JSON.parse(decodeURIComponent(taskStr));
  if (confirm(`¿Estás seguro de eliminar "${task.name}"? Esta acción no se puede deshacer.`)) {
    projects[currentProjectIndex].tasks = projects[currentProjectIndex].tasks.filter(t => t.id !== task.id);
    updateLocalStorage();
    actualizarAsignados();
    aplicarFiltros();
    generatePieChart(getStats());
          updateProjectProgress();
         actualizarAsignados();
    showNotification(`Tarea "${task.name}" eliminada`);
  }
}


/*********************
 * GESTIÓN DE TAREAS *
 *********************/

function showTaskDetails(task) {
  if (!taskDetailsModal || !task) return;
  
  const taskDetailsContent = document.getElementById('taskDetails');
  if (!taskDetailsContent) return;

  // Calcular progreso de subtareas
  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const subtaskProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

// Calcular estado de tiempo
  const timeDifference = (task.estimatedTime || 0) - (task.timeLogged || 0);
  const timeStatus = timeDifference >= 0 ? 'En tiempo' : 'Fuera de tiempo';
  const timeStatusClass = timeDifference >= 0 ? 'time-good' : 'time-bad';


  taskDetailsContent.innerHTML = `
    <div class="task-details-container">
      <div class="task-details-header">
        <span class="close-detail">&times;</span>
        <h3>${task.name}</h3>
        <div class="task-meta-header">
          <span class="priority-badge ${task.priority}">${capitalizeFirstLetter(task.priority)}</span>
          <span class="status-badge ${task.status}">${getStatusText(task.status)}</span>
        </div>
      </div>
      
      <div class="task-details-grid">
        <!-- Columna Izquierda -->
        <div class="details-column">
          <div class="detail-group">
            <label>Fecha Inicio:</label>
            <input type="date" id="editTaskStartDate" class="editable-input" value="${task.startDate || ''}">
          </div>
          
          <div class="detail-group">
            <label>Fecha Límite:</label>
            <input type="date" id="editTaskDeadline" class="editable-input" value="${task.deadline || ''}">
          </div>
          
          <div class="detail-group">
            <label>Asignado a:</label>
            <input type="text" id="editTaskAssignee" class="editable-input" value="${task.assignee || ''}">
          </div>
        </div>
        
        <!-- Columna Derecha -->
        <div class="detail-group">
  <label>Tiempo Estimado:</label>
  <input type="number" 
         id="editTaskEstimatedHours" 
         class="editable-input" 
         value="${task.estimatedTime || 0}" 
         step="0.5" 
         min="0">

          
          <div class="detail-group">
            <label>Tiempo Registrado:</label>
            <div class="detail-value">${task.timeLogged || 0} horas</div>
          </div>
          
          <div class="detail-group">
            <label>Prioridad:</label>
            <div class="detail-value">${capitalizeFirstLetter(task.priority)}</div>
          </div>
        </div>
        
<div class="detail-group">
          <label>Estado Tiempo:</label>
          <div class="detail-value ${timeStatusClass}">
            ${timeStatus} (${Math.abs(timeDifference).toFixed(1)}h ${timeDifference >= 0 ? 'restantes' : 'excedidas'})
          </div>
        </div>
      </div>


        <!-- Descripción (ancho completo) -->
        <div class="detail-group full-width">
          <label>Descripción:</label>
          <textarea id="editTaskDescription" 
          class="editable-textarea description-text"
          rows="4">${task.description || ''}</textarea>
        </div>
        
        <!-- Subtareas (ancho completo) -->
        <div class="detail-group full-width">
          <div class="subtasks-header">
            <h4>Subtareas (${subtaskProgress}% completado)</h4>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${subtaskProgress}%"></div>
            </div>
          </div>
          <div class="subtasks-list" id="subtasksList-${task.id}">
            ${renderSubtasks(task.subtasks || [], task.id)}
          </div>
          <div class="add-subtask-form">
            <input type="text" id="newSubtaskInput-${task.id}" placeholder="Nueva subtarea">
            <button onclick="addSubtask(${task.id})">Agregar</button>
          </div>
        </div>
      </div>
      
      <!-- Sección de tiempo -->
      <div class="time-tracking-section">
        <h4>Registro de Tiempo</h4>
        <div class="time-entry-form">
          <div class="form-group">
            <label for="timeSpent">Horas trabajadas:</label>
            <input type="number" id="timeSpent" placeholder="Ej: 1.5" step="0.1" min="0">
          </div>
          
          <div class="form-group">
            <label for="timeComment">Comentario:</label>
            <textarea id="timeComment" placeholder="Descripción del trabajo realizado"></textarea>
          </div>
          
          <button type="button" id="registerTimeBtn" class="btn-save">Registrar Tiempo</button>
        </div>
        
        <div class="time-history">
          <h4>Historial de Tiempo</h4>
          <div id="timeHistoryList">
            ${renderTimeHistory(task.timeHistory || [])}
          </div>
        </div>
      </div>
    </div>
  

    
      <div class="task-details-footer">
        <button type="button" id="cancelEditBtn" class="btn-cancel">Cancelar</button>
        <button type="submit" id="saveTaskBtn" class="btn-save">Guardar Cambios</button>
      </div>
    </div>
  `;

  document.getElementById('registerTimeBtn').addEventListener('click', () => {
    const hoursInput = document.getElementById('timeSpent');
    const commentInput = document.getElementById('timeComment');
    const hours = parseFloat(hoursInput.value);
    const comment = commentInput.value.trim() || 'Sin comentario';

    if (!isNaN(hours) && hours > 0) {
      const now = new Date();
      const timeEntry = {
        date: now.toLocaleDateString() + ' ' + now.toLocaleTimeString(),
        hours: hours,
        comment: comment
      };

      task.timeHistory = task.timeHistory || [];
      task.timeLogged = (task.timeLogged || 0) + hours;

      task.timeHistory.unshift(timeEntry);

      const estimatedHoursInput = document.getElementById('editTaskEstimatedHours');
      if (estimatedHoursInput) {
        task.estimatedTime = parseFloat(estimatedHoursInput.value) || 0;
      }

      updateLocalStorage();
      showTaskDetails(task);
      generateReports();
      showNotification('Tiempo registrado exitosamente');
    } else {
      showNotification('Por favor ingrese un valor válido para las horas');
    }
  });

  document.getElementById('saveTaskBtn').addEventListener('click', () => {
    saveTaskChanges(task.id);
  });

  document.getElementById('cancelEditBtn').addEventListener('click', () => {
    taskDetailsModal.style.display = 'none';
  });

  document.querySelector('.close-detail').addEventListener('click', () => {
    taskDetailsModal.style.display = 'none';
  });

  taskDetailsModal.style.display = 'block';
}

// Botón Guardar Cambios
    document.getElementById('saveTaskBtn')?.addEventListener('click', () => {
      saveTaskChanges(task.id);
    });

function renderSubtasks(subtasks, taskId) {
  if (!subtasks || subtasks.length === 0) {
    return '<div class="no-subtasks">No hay subtareas definidas</div>';
  }
  
  return subtasks.map((subtask, index) => `
    <div class="subtask-item" data-subtask-id="${subtask.id}">
      <input type="checkbox" ${subtask.completed ? 'checked' : ''} 
             onchange="toggleSubtaskCompletion(${taskId}, ${subtask.id}, this.checked)">
      <span class="subtask-text ${subtask.completed ? 'completed' : ''}">${subtask.name}</span>
      <button class="subtask-delete" onclick="deleteSubtask(${taskId}, ${subtask.id})">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `).join('');
}

function renderSubtasks(subtasks, taskId) {
  if (!subtasks || subtasks.length === 0) {
    return '<div class="no-subtasks">No hay subtareas definidas</div>';
  }
  
  return subtasks.map((subtask, index) => `
    <div class="subtask-item" data-subtask-id="${subtask.id}">
      <input type="checkbox" ${subtask.completed ? 'checked' : ''} 
             onchange="toggleSubtaskCompletion(${taskId}, ${subtask.id}, this.checked)">
      <span class="subtask-text ${subtask.completed ? 'completed' : ''}">${subtask.name}</span>
      <button class="subtask-delete" onclick="deleteSubtask(${taskId}, ${subtask.id})">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `).join('');
}

function renderTimeHistory(history) {
  if (!history || history.length === 0) {
    return '<div class="empty-history">No hay registros de tiempo</div>';
  }

  let html = '<table class="time-history-table"><thead><tr><th>Fecha</th><th>Horas</th><th>Comentario</th></tr></thead><tbody>';
  let totalHours = 0;

  history.forEach((entry, index) => {
    totalHours += entry.hours;
    html += `
      <tr>
        <td>${entry.date}</td>
        <td>${entry.hours.toFixed(2)}</td>
        <td>${entry.comment}</td>
      </tr>
    `;
  });

  html += `</tbody><tfoot><tr><td colspan="3">Total: ${totalHours.toFixed(2)} horas</td></tr></tfoot></table>`;

  return html;
}

/*********************
 * GESTIÓN DE TAREAS *
 *********************/

function saveTaskChanges(taskId) {
  const project = projects[currentProjectIndex];
  const taskIndex = project.tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex !== -1) {
    // Obtener todos los valores editados
    const editedTask = {
      ...project.tasks[taskIndex],
      name: document.getElementById('editTaskName')?.value || project.tasks[taskIndex].name,
      priority: document.getElementById('editTaskPriority')?.value || project.tasks[taskIndex].priority,
      status: document.getElementById('editTaskStatus')?.value || project.tasks[taskIndex].status,
      startDate: document.getElementById('editTaskStartDate')?.value || project.tasks[taskIndex].startDate,
      deadline: document.getElementById('editTaskDeadline')?.value || project.tasks[taskIndex].deadline,
      assignee: document.getElementById('editTaskAssignee')?.value || project.tasks[taskIndex].assignee,
      description: document.getElementById('editTaskDescription')?.value || project.tasks[taskIndex].description,
      estimatedTime: parseFloat(document.getElementById('editTaskEstimatedHours')?.value) || 0,
      subtasks: project.tasks[taskIndex].subtasks || [] // Mantener subtareas existentes
    };

    // Actualizar la tarea en el array
    project.tasks[taskIndex] = editedTask;
    
    // Guardar y actualizar UI
    updateLocalStorage();
    renderKanbanTasks();
    updateTaskList();
    updateStatistics();
    generatePieChart(getStats());
    updateProjectProgress();
    actualizarAsignados();
    generateReports();
    updateResourceAllocation();
    
    // Actualizar fechas del proyecto
    const { earliestDate, latestDate } = calculateProjectDatesFromTasks(project);
    updateProjectDatesInDashboard(earliestDate, latestDate);
    
    // 🔥 NOTIFICAR a otros usuarios sobre la actualización
    if (tiempoRealSocket && tiempoRealSocket.connected) {
      tiempoRealSocket.emit('task-changed', {
        projectId: currentProjectIndex,
        taskId: taskId,
        taskName: editedTask.name,
        userName: 'Usuario actual',
        type: 'task-updated',
        timestamp: new Date().toISOString()
      });
      console.log('📢 Notificando actualización de tarea');
    }
    
    // Cerrar el modal
    taskDetailsModal.style.display = 'none';
    showNotification('Cambios guardados exitosamente');
  } else {
    showNotification('Error: No se encontró la tarea para actualizar');
  }
}
/*****************
 * VISTAS (UI) *
 *****************/
function renderTasks() {
  renderKanbanTasks();
}

function updateTaskList() {
  renderListTasks();
}

/*************
 * FILTROS *
 *************/
function actualizarAsignados() {
  ['filterAssignee', 'filterAssigneeList', 'filterAssigneeCalendar', 'filterAssigneeGantt', 'filterAssigneeReports'].forEach(selector => {
    const select = document.getElementById(selector);
    if (!select || !projects[currentProjectIndex]) return;
    
    const seleccionActual = select.value;
    select.innerHTML = '<option value="">Todos</option>';
    
       const asignados = new Set();
    
    projects[currentProjectIndex].tasks.forEach(task => {
      if (task.assignee && task.assignee.trim() !== '') {
        asignados.add(task.assignee.trim());
      }
    });

    Array.from(asignados).sort((a, b) => a.localeCompare(b)).forEach(asignado => {
      const option = document.createElement('option');
      option.value = asignado;
      option.textContent = asignado;
      select.appendChild(option);
    });
    
    if (seleccionActual && asignados.has(seleccionActual)) {
      select.value = seleccionActual;
    }
  });
}

/*****************
 * DRAG & DROP *
 *****************/
function initDragAndDrop() {
  document.querySelectorAll('.task-card').forEach(task => {
    task.addEventListener('dragstart', handleDragStart);
    task.addEventListener('dragend', handleDragEnd);
  });

  document.querySelectorAll('.tasks').forEach(column => {
    column.addEventListener('dragover', handleDragOver);
    column.addEventListener('dragleave', handleDragLeave);
    column.addEventListener('drop', handleDrop);
  });
}

function handleDragStart(e) {
  e.dataTransfer.setData('taskId', e.currentTarget.dataset.taskId);
  e.currentTarget.style.opacity = '0.4';
}

function handleDragEnd(e) {
  e.currentTarget.style.opacity = '1';
}

function handleDragOver(e) {
  e.preventDefault();
  e.currentTarget.style.backgroundColor = '#f0f0f0';
}

function handleDragLeave(e) {
  e.currentTarget.style.backgroundColor = '';
}

function handleDrop(e) {
  e.preventDefault();
  const taskId = parseInt(e.dataTransfer.getData('taskId'));
  const targetColumn = e.currentTarget.closest('.column');
  
  const statusMap = {
    pendingTasks: 'pending',
    inProgressTasks: 'inProgress', 
    completedTasks: 'completed',
    overdueTasks: 'overdue'
  };

  const newStatus = statusMap[targetColumn.id];
  const task = projects[currentProjectIndex].tasks.find(t => t.id === taskId);

  if (task && task.status !== newStatus) {
    task.status = newStatus;
    checkTaskOverdue(task);
    updateLocalStorage();
    actualizarAsignados();
    aplicarFiltros();
    updateStatistics();
    updateResourceAllocation();

    // 🔥 AGREGAR NOTIFICACIÓN PARA DRAG & DROP
    if (tiempoRealSocket && tiempoRealSocket.connected) {
      tiempoRealSocket.emit('task-changed', {
        projectId: currentProjectIndex,
        taskId: taskId,
        taskName: task.name,
        userName: 'Usuario actual',
        type: 'task-moved',
        newStatus: newStatus,
        timestamp: new Date().toISOString()
      });
      console.log('📢 Notificando movimiento de tarea');
    }
function checkTaskOverdue(task) {
  if (task.status === 'completed') return false;
  
  if (task.deadline) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const deadlineDate = new Date(task.deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    
    if (deadlineDate < today) {
      task.status = 'overdue';
      return true;
    }
  }
  return false;
}

/*********************
 * ESTADÍSTICAS *
 *********************/
function getStats(tasks = null) {
  const tasksToUse = tasks || projects[currentProjectIndex]?.tasks || [];
  return {
    total: tasksToUse.length,
    pending: tasksToUse.filter(t => t.status === 'pending').length,
    inProgress: tasksToUse.filter(t => t.status === 'inProgress').length,
    completed: tasksToUse.filter(t => t.status === 'completed').length,
    overdue: tasksToUse.filter(t => t.status === 'overdue').length
  };
}


function calculateTimeBudgetUsage() {
    const project = projects[currentProjectIndex];
    if (!project || !project.tasks || project.tasks.length === 0) {
        return 0;
    }

    let totalEstimated = 0;
    let totalLogged = 0;

    project.tasks.forEach(task => {
        totalEstimated += task.estimatedTime || 0;
        totalLogged += task.timeLogged || 0;
    });

    if (totalEstimated === 0) return 0;

    const percentage = (totalLogged / totalEstimated) * 100;
    return Math.round(percentage);
}



function updateRisksCount() {
    const risksContainer = document.getElementById('risksContainer');
    const riskLevelElement = document.getElementById('riskLevel');
    
    if (!risksContainer || !riskLevelElement) return;

    // Contar solo elementos de riesgo reales (excluyendo mensajes vacíos)
    const riskItems = risksContainer.querySelectorAll('.risk-item');
    const realRiskCount = Array.from(riskItems).filter(item => 
        !item.classList.contains('empty-message')
    ).length;

    riskLevelElement.textContent = realRiskCount;
    console.log(`Actualizado contador de riesgos: ${realRiskCount}`);
}


function updateStatistics(tasks = null) {
  const stats = getStats(tasks);
  
  if (totalTasks) totalTasks.textContent = stats.total;
  if (pendingCount) pendingCount.textContent = stats.pending;
  if (inProgressCount) inProgressCount.textContent = stats.inProgress;
  if (completedCount) completedCount.textContent = stats.completed;
  if (overdueCount) overdueCount.textContent = stats.overdue;
}

function generatePieChart(data) {
  if (!pieChartCanvas) return;
  
  const ctx = pieChartCanvas.getContext('2d');
  if (window.myChartInstance) window.myChartInstance.destroy();

  window.myChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Pendientes', 'En Progreso', 'Completados', 'Rezagados'],
      datasets: [{
        data: [data.pending, data.inProgress, data.completed, data.overdue],
        backgroundColor: ['#f1c40f', '#008080', '#00FF00', '#e74c3c']
      }]
    },
    options: {
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

function updateProjectProgress() {
  const project = projects[currentProjectIndex];
  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter(t => t.status === 'completed').length;
  const progressFill = document.getElementById('projectProgressFill');
  const progressLabel = document.getElementById('projectProgressLabel');

  if (!progressFill || !progressLabel) return;

  const percent = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  progressFill.style.width = `${percent}%`;
  progressLabel.textContent = `${percent}% Completado`;
  progressFill.style.backgroundColor = '#2ecc71';
}


function formatDate(date) {
    if (!date || isNaN(date.getTime())) return '--/--/--';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}


function updateProjectDatesFromTasks() {
    const tasks = projects[currentProjectIndex]?.tasks || [];
    const startDates = tasks.map(t => t.startDate).filter(Boolean);
    const endDates = tasks.map(t => t.deadline).filter(Boolean);
    const earliestDate = startDates.length > 0 ? new Date(Math.min(...startDates.map(d => new Date(d)))) : null;
    const latestDate = endDates.length > 0 ? new Date(Math.max(...endDates.map(d => new Date(d)))) : null;

    // Actualizar Dashboard (usa el ID original)
    const startDateEl = document.getElementById('projectStartDate');
    const endDateEl = document.getElementById('projectEndDate');

    if (startDateEl) {
        startDateEl.textContent = earliestDate ? formatDate(earliestDate) : '--/--/--';
    }
    if (endDateEl) {
        endDateEl.textContent = latestDate ? formatDate(latestDate) : '--/--/--';
    }

    // Actualizar vista de Reportes (usa los nuevos IDs)
    const startDateReportsEl = document.getElementById('projectStartDateReports');
    const endDateReportsEl = document.getElementById('projectEndDateReports');

    if (startDateReportsEl) {
        startDateReportsEl.textContent = earliestDate ? formatDate(earliestDate) : '--/--/--';
    }
    if (endDateReportsEl) {
        endDateReportsEl.textContent = latestDate ? formatDate(latestDate) : '--/--/--';
    }
}
function checkOverdueTasks() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  let hasChanges = false;

  projects[currentProjectIndex].tasks.forEach(task => {
    if (task.deadline && task.status !== 'completed') {
      const deadlineDate = new Date(task.deadline);
      deadlineDate.setHours(0, 0, 0, 0);
      if (deadlineDate < now && task.status !== 'overdue') {
        task.status = 'overdue';
        hasChanges = true;
      }
    }
  });

  if (hasChanges) {
    updateLocalStorage();
    actualizarAsignados();
    aplicarFiltros();
    generatePieChart(getStats());
           updateProjectProgress();
           actualizarAsignados();
    showNotification('Tareas actualizadas: algunas han sido marcadas como "Rezagadas"');
  }
}

/***********************
 * FUNCIONES DE REPORTES *
 ***********************/
function generateReports(tasks = null) {
    const tasksToUse = tasks || projects[currentProjectIndex]?.tasks || [];
    const timeStats = getTimeStats(tasksToUse);

    // Actualizar cuadros de tiempo (con validación)
    if (totalEstimatedTime && !isNaN(timeStats.totalEstimated)) {
        totalEstimatedTime.textContent = `${timeStats.totalEstimated.toFixed(2)} horas`;
    }
    if (totalLoggedTime && !isNaN(timeStats.totalLogged)) {
        totalLoggedTime.textContent = `${timeStats.totalLogged.toFixed(2)} horas`;
    }
    if (remainingTime && !isNaN(timeStats.remaining)) {
        remainingTime.textContent = `${timeStats.remaining.toFixed(2)} horas`;
    }
  
  // Actualizar estadísticas
  updateStatistics(tasksToUse);
  
  // Actualizar gráfico
  generatePieChart(stats);
  
  // Actualizar progreso del proyecto
  updateProjectProgress();
  updateProjectDatesFromTasks();

  updateProjectStatusLabel();
}

function getTimeStats(tasks = null) {
    const tasksToUse = tasks || projects[currentProjectIndex]?.tasks || [];
    return {
        totalEstimated: tasksToUse.reduce((sum,  task) => sum + (task.estimatedTime || 0), 0),
        totalLogged: tasksToUse.reduce((sum, task) => sum + (task.timeLogged || 0), 0),
        remaining: tasksToUse.reduce((sum, task) => {
            const remaining = (task.estimatedTime || 0) - (task.timeLogged || 0);
            return sum + (remaining > 0 ? remaining : 0);
        }, 0)
    };
}
/***********************
 * FUNCIONES DE RENTABILIDAD *
 ***********************/
function renderProfitabilityView() {
  const project = projects[currentProjectIndex];
  
  // Cálculos de ejemplo (ajusta según tu lógica de negocio)
  const totalHours = project.tasks.reduce((sum, task) => sum + (task.timeLogged || 0), 0);
  const hourlyCost = 50; // Costo por hora (ejemplo)
  const projectBudget = 10000; // Presupuesto del proyecto (ejemplo)
  
  const totalCost = totalHours * hourlyCost;
  const profitMargin = ((projectBudget - totalCost) / projectBudget) * 100;
  
  // Actualiza la UI
  document.getElementById('totalCost').textContent = `$${totalCost.toFixed(2)}`;
  document.getElementById('totalIncome').textContent = `$${projectBudget.toFixed(2)}`;
  document.getElementById('profitMargin').textContent = `${profitMargin.toFixed(2)}%`;
  
  // Gráfico
  renderProfitabilityChart(totalCost, projectBudget);
}

function renderProfitabilityChart(cost, income) {
  const ctx = document.getElementById('profitabilityChart').getContext('2d');
  
  if (window.profitabilityChart) {
    window.profitabilityChart.destroy();
  }
  
  window.profitabilityChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Costos', 'Ingresos'],
      datasets: [{
        label: 'Análisis Financiero',
        data: [cost, income],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        }
      }
    }
  });
}

/***********************
 * EVENT LISTENERS *
 ***********************/
function setupEventListeners() {
  // Proyectos
  document.getElementById('newProjectBtn')?.addEventListener('click', createNewProject);
  
  // Tareas
  document.getElementById('createTaskForm')?.addEventListener('submit', createNewTask);
  document.getElementById('newTaskBtn')?.addEventListener('click', () => {
    createTaskModal.style.display = 'block';
  });
  
  // Cerrar modales
  document.querySelector('.close')?.addEventListener('click', () => {
    createTaskModal.style.display = 'none';
  });

  // Menú sidebar
  toggleSidebarBtn?.addEventListener('click', () => {
    sidebar.classList.toggle('hidden');
  });

  // Filtros con debounce para mejor performance
  document.getElementById('filterAssignee')?.addEventListener('input', debounce(aplicarFiltros, 300));
  document.getElementById('filterPriority')?.addEventListener('change', aplicarFiltros);
  document.getElementById('filterStatus')?.addEventListener('change', aplicarFiltros);
  document.getElementById('filterStartDate')?.addEventListener('change', aplicarFiltros);
  document.getElementById('filterEndDate')?.addEventListener('change', aplicarFiltros);

  // Filtros de la vista de lista
  document.getElementById('filterAssigneeList')?.addEventListener('input', debounce(aplicarFiltros, 300));
  document.getElementById('filterPriorityList')?.addEventListener('change', aplicarFiltros);
  document.getElementById('filterStatusList')?.addEventListener('change', aplicarFiltros);
  document.getElementById('filterStartDateList')?.addEventListener('change', aplicarFiltros);
  document.getElementById('filterEndDateList')?.addEventListener('change', aplicarFiltros);

  // Filtros del calendario
  document.getElementById('filterAssigneeCalendar')?.addEventListener('input', debounce(aplicarFiltros, 300));
  document.getElementById('filterPriorityCalendar')?.addEventListener('change', aplicarFiltros);
  document.getElementById('filterStatusCalendar')?.addEventListener('change', aplicarFiltros);

  // Filtros de Gantt
  document.getElementById('filterAssigneeGantt')?.addEventListener('input', debounce(aplicarFiltros, 300));
  document.getElementById('filterPriorityGantt')?.addEventListener('change', aplicarFiltros);
  document.getElementById('clearFiltersGanttBtn')?.addEventListener('click', () => {
    document.getElementById('filterAssigneeGantt').value = '';
    document.getElementById('filterPriorityGantt').value = '';
    aplicarFiltros();
  });

  // Filtros de Reports
  document.getElementById('filterAssigneeReports')?.addEventListener('change', aplicarFiltros);
  document.getElementById('filterPriorityReports')?.addEventListener('change', aplicarFiltros);
  document.getElementById('filterStatusReports')?.addEventListener('change', aplicarFiltros);
  document.getElementById('clearFiltersReportsBtn')?.addEventListener('click', () => {
    document.getElementById('filterAssigneeReports').value = '';
    document.getElementById('filterPriorityReports').value = '';
    document.getElementById('filterStatusReports').value = '';
    aplicarFiltros();
  });

  // Limpiar filtros
  document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
    document.getElementById('filterAssignee').value = '';
    document.getElementById('filterPriority').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterStartDate').value = '';
    document.getElementById('filterEndDate').value = '';
    aplicarFiltros();
  });

  // Limpiar filtros del calendario
  document.getElementById('clearFiltersCalendarBtn')?.addEventListener('click', () => {
    document.getElementById('filterAssigneeCalendar').value = '';
    document.getElementById('filterPriorityCalendar').value = '';
    document.getElementById('filterStatusCalendar').value = '';
    aplicarFiltros();
  });

  // Limpiar filtros de lista
  document.getElementById('clearFiltersListBtn')?.addEventListener('click', () => {
    document.getElementById('filterAssigneeList').value = '';
    document.getElementById('filterPriorityList').value = '';
    document.getElementById('filterStatusList').value = '';
    document.getElementById('filterStartDateList').value = '';
    document.getElementById('filterEndDateList').value = '';
    aplicarFiltros();
  });

  // Botones de cambio de vista
  if (viewButtons.board) viewButtons.board.addEventListener('click', () => showView('board'));
  if (viewButtons.list) viewButtons.list.addEventListener('click', () => showView('list'));
  if (viewButtons.calendar) viewButtons.calendar.addEventListener('click', () => showView('calendar'));
  if (viewButtons.gantt) viewButtons.gantt.addEventListener('click', () => showView('gantt'));
  if (viewButtons.reports) viewButtons.reports.addEventListener('click', () => showView('reports'));
  if (viewButtons.profitability) viewButtons.profitability.addEventListener('click', () => showView('profitability'));
  if (viewButtons.dashboard) viewButtons.dashboard.addEventListener('click', () => showView('dashboard'));
  

// === BOTÓN DE CERRAR SESIÓN (aquí va) ===
  document.getElementById('logoutBtn')?.addEventListener('click', logout);

document.getElementById('showTimeAllocationView')?.addEventListener('click', function () {
    console.log("🖱️ Clic en botón de menú 'Asignación de Horas'.");
    showTimeAllocationView(); // Esta función llama a populateTimeAllocationFilters
});


// En la sección de event listeners para botones de vista
document.getElementById('showDashboard4DView')?.addEventListener('click', () => {
    window.open('dashbd4d.html', '_blank', 'width=1400,height=800');
});

  // Botón de generación de PDF
  document.getElementById('generatePdfBtn')?.addEventListener('click', generateProjectReport);
}

/***********************
 * FUNCIONES DE REPORTES PDF *
 ***********************/
function generateProjectReport() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const project = projects[currentProjectIndex];
  const currentDate = new Date();
  const formattedDate = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;
  const stats = getStats();
  const timeStats = getTimeStats();


  // Obtener fechas del proyecto desde las tareas
  const tasks = project.tasks || [];
  const startDates = tasks.map(t => t.startDate).filter(Boolean);
  const endDates = tasks.map(t => t.deadline).filter(Boolean);
  
  const earliestDate = startDates.length > 0 
    ? new Date(Math.min(...startDates.map(d => new Date(d)))) 
    : null;
  const latestDate = endDates.length > 0 
    ? new Date(Math.max(...endDates.map(d => new Date(d)))) 
    : null;

  // Configuración inicial
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Reporte del Proyecto', 105, 15, { align: 'center' });

  // Información básica
  doc.setFontSize(11);
  doc.text(`Proyecto: ${project.name}`, 20, 27);
  doc.text(`Fecha del reporte: ${formattedDate}`, 20, 35);
  doc.text(`Fecha de inicio: ${earliestDate ? formatDate(earliestDate) : 'No definida'}`, 20, 43);
  doc.text(`Fecha de fin: ${latestDate ? formatDate(latestDate) : 'No definida'}`, 20, 51);

  // Resumen Ejecutivo
  doc.setFont('helvetica', 'bold');
  doc.text('Estadísticas del Proyecto:', 20, 63);
  doc.setFont('helvetica', 'normal');
  
  // Calcular porcentaje de avance
  const completionPercentage = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;

  const summaryText = [
    `Porcentaje de avance: ${completionPercentage}%`
  ];

  let yPosition = 70;
  summaryText.forEach(line => {
    doc.text(line, 22, yPosition);
    yPosition += 7;
  });

  // Título "Distribución de tareas" antes de los cuadros
  yPosition += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Distribución de Tareas', 105, yPosition, { align: 'center' });
  yPosition += 10;

  // Cuadros estadísticos
  const boxWidth = 30;
  const boxHeight = 16;
  const boxMargin = 4;
  const totalWidth = (boxWidth * 5) + (boxMargin * 4);
  const startX = (doc.internal.pageSize.getWidth() - totalWidth) / 2;

  const drawStatBox = (x, y, title, value, bgColor, textColor = '#ffffff') => {
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.rect(x, y, boxWidth, boxHeight, 'F');
    doc.setTextColor(textColor);
    doc.setFontSize(9);
    doc.text(title, x + boxWidth/2, y + 6, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(value.toString(), x + boxWidth/2, y + 13, { align: 'center' });
  };

  // Dibujar cuadros estadísticos
  drawStatBox(startX, yPosition, 'Total', stats.total, [52, 152, 219]);
  drawStatBox(startX + boxWidth + boxMargin, yPosition, 'Pendientes', stats.pending, [241, 196, 15], '#000000');
  drawStatBox(startX + (boxWidth + boxMargin)*2, yPosition, 'En Progreso', stats.inProgress, [0, 128, 128]);
  drawStatBox(startX + (boxWidth + boxMargin)*3, yPosition, 'Completadas', stats.completed, [0, 255, 0], '#000000');
  drawStatBox(startX + (boxWidth + boxMargin)*4, yPosition, 'Rezagadas', stats.overdue, [231, 76, 60]);

  // Gráfico de pastel
  yPosition += boxHeight + 20;
  const canvas = document.getElementById('pieChart');
  if (canvas) {
    const chartImage = canvas.toDataURL('image/png');
    const chartWidth = 110;
    const chartHeight = (canvas.height * chartWidth) / canvas.width;
    const chartX = (doc.internal.pageSize.getWidth() - chartWidth) / 2;
    doc.addImage(chartImage, 'PNG', chartX, yPosition, chartWidth, chartHeight);
    yPosition += chartHeight + 10;
  }

  // Cuadros de tiempo
  const timeBoxWidth = 42;
  const timeBoxHeight = 20;
  const timeTotalWidth = (timeBoxWidth * 3) + (boxMargin * 2);
  const timeStartX = (doc.internal.pageSize.getWidth() - timeTotalWidth) / 2;

  yPosition += 10;

  const drawTimeBox = (x, y, title, value) => {
    doc.setFillColor(44, 62, 80);
    doc.rect(x, y, timeBoxWidth, timeBoxHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(title, x + timeBoxWidth/2, y + 8, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(value, x + timeBoxWidth/2, y + 16, { align: 'center' });
  };

  drawTimeBox(timeStartX, yPosition, 'Tiempo Estimado', `${timeStats.totalEstimated.toFixed(2)} h`);
  drawTimeBox(timeStartX + timeBoxWidth + boxMargin, yPosition, 'Tiempo Registrado', `${timeStats.totalLogged.toFixed(2)} h`);
  drawTimeBox(timeStartX + (timeBoxWidth + boxMargin)*2, yPosition, 'Tiempo Restante', `${timeStats.remaining.toFixed(2)} h`);

  // Guardar PDF
  const fileName = `Reporte_${project.name.replace(/ /g, '_')}_${formattedDate.replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
  showNotification('✅ Reporte PDF generado con éxito');
}

/***********************
 * INICIALIZACIÓN *
 ***********************/
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 Iniciando aplicación con validación...');
    
    // Cargar datos de forma segura
    const dataLoaded = await safeLoad();
    
    if (!dataLoaded || projects.length === 0) {
        console.log('📝 No hay datos, creando proyecto inicial...');
        createNewProject();
    } else {
        console.log('✅ Datos cargados correctamente');
        renderProjects();
        selectProject(currentProjectIndex);
        checkOverdueTasks();
    }

    // Inicializar el resto de la aplicación
    setupEventListeners();

// INICIAR WEBSOCKETS AL FINAL, después de que todo esté cargado
  setTimeout(() => {
    if (authToken) {
      console.log('🚀 Iniciando WebSockets...');
      initWebSocket();
    }
  }, 2000); // Esperar 2 segundos a que todo cargue
});


    
    // INICIALIZACIÓN DEL PASO 1
    const selector = document.getElementById('methodologySelector');
    if (selector) {
        selector.value = window.methodologyManager.getCurrentMode();
        selector.addEventListener('change', function() {
            if (window.methodologyManager.setMode(this.value)) {
                showNotification(`Modo cambiado a: ${this.value}`);
            }
        });
    }
    
    console.log('✅ Sistema de metodologías inicializado');
    updateDashboardTitle(window.methodologyManager.getCurrentMode());
    addModeTooltips(window.methodologyManager.getCurrentMode());
    
    // Iniciar sistema de persistencia
    initPersistenceSystem();
    
    // Verificar que todo funcione
setTimeout(() => {
    validateApplication();
    
    // Mostrar resumen final
    console.log('🌈 ¡APLICACIÓN COMPLETAMENTE OPERATIVA!');
    console.log('📍 Puedes usar estos comandos en consola:');
    console.log('   - forceSync() - Forzar sincronización manual');
    console.log('   - checkConnectionStatus() - Ver estado de conexión');
    console.log('   - debugApplication() - Diagnóstico completo');
    console.log('   - debugDashboard() - Diagnóstico del dashboard');
    
}, 1000);

// Función de validación completa
function validateApplication() {
    console.group('🔍 VALIDACIÓN DE LA APLICACIÓN');
    
    // 1. Verificar que projects existe y es array
    console.log('📋 Projects:', projects && Array.isArray(projects) ? `✅ ${projects.length} proyectos` : '❌ Error en projects');
    
    // 2. Verificar vistas principales
    const views = ['boardView', 'listView', 'dashboardView', 'timeAllocationView'];
    views.forEach(view => {
        const element = document.getElementById(view);
        console.log(`👀 ${view}:`, element ? '✅ Encontrado' : '❌ No encontrado');
    });
    
    // 3. Verificar funcionalidades críticas
    console.log('🖱️ Drag & Drop:', typeof initDragAndDrop === 'function' ? '✅ Listo' : '❌ No disponible');
    console.log('📊 Dashboard:', typeof renderDashboard === 'function' ? '✅ Listo' : '❌ No disponible');
    console.log('⏰ Time Allocation:', typeof loadTimeAllocationData === 'function' ? '✅ Listo' : '❌ No disponible');
    
    console.groupEnd();
    
    // Test rápido de funcionalidades
    testCriticalFunctions();
}

function testCriticalFunctions() {
    console.group('🧪 TEST DE FUNCIONALIDADES CRÍTICAS');
    
    // Test 1: Drag & Drop
    try {
        if (typeof initDragAndDrop === 'function') {
            initDragAndDrop();
            console.log('🎯 Drag & Drop: ✅ Inicializado');
        }
    } catch (e) {
        console.log('🎯 Drag & Drop: ❌ Error', e.message);
    }
    
    // Test 2: Dashboard
    try {
        if (typeof renderDashboard === 'function') {
            renderDashboard();
            console.log('📊 Dashboard: ✅ Renderizado');
        }
    } catch (e) {
        console.log('📊 Dashboard: ❌ Error', e.message);
    }
    
    console.groupEnd();
}

// === AGREGAR INICIALIZACIÓN DE WEBSOCKETS AL FINAL ===
setTimeout(() => {
    if (authToken && typeof initWebSocket === 'function') {
        console.log('🚀 Iniciando WebSockets...');
        initWebSocket();
    }
}, 1500);

/***********************
 * FUNCIONES DE MOVIMIENTO DE TAREAS *
 ***********************/
function moveTaskUp(taskId, status) {
  const project = projects[currentProjectIndex];
  const tasksInStatus = project.tasks.filter(t => t.status === status);
  const currentIndex = tasksInStatus.findIndex(t => t.id === taskId);
  
  if (currentIndex > 0) {
    const allTasks = project.tasks;
    const task1 = tasksInStatus[currentIndex];
    const task2 = tasksInStatus[currentIndex - 1];
    
    const index1 = allTasks.findIndex(t => t.id === task1.id);
    const index2 = allTasks.findIndex(t => t.id === task2.id);
    
    [allTasks[index1], allTasks[index2]] = [allTasks[index2], allTasks[index1]];
    
    updateLocalStorage();
    renderKanbanTasks();
  }
}

function moveTaskDown(taskId, status) {
  const project = projects[currentProjectIndex];
  const tasksInStatus = project.tasks.filter(t => t.status === status);
  const currentIndex = tasksInStatus.findIndex(t => t.id === taskId);
  
  if (currentIndex < tasksInStatus.length - 1) {
    const allTasks = project.tasks;
    const task1 = tasksInStatus[currentIndex];
    const task2 = tasksInStatus[currentIndex + 1];
    
    const index1 = allTasks.findIndex(t => t.id === task1.id);
    const index2 = allTasks.findIndex(t => t.id === task2.id);
    
    [allTasks[index1], allTasks[index2]] = [allTasks[index2], allTasks[index1]];
    
    updateLocalStorage();
    renderKanbanTasks();
  }
}

// Funciones para manejar subtareas
function addSubtask(taskId) {
  const input = document.getElementById(`newSubtaskInput-${taskId}`);
  const subtaskName = input.value.trim();
  
  if (!subtaskName) {
    showNotification('El nombre de la subtarea no puede estar vacío');
    return;
  }
  
  const task = projects[currentProjectIndex].tasks.find(t => t.id === taskId);
  if (!task) return;
  
  if (!task.subtasks) task.subtasks = [];
  
  task.subtasks.push({
    id: Date.now(),
    name: subtaskName,
    completed: false
  });
  
  updateLocalStorage();
  showTaskDetails(task); // Refrescar la vista
  input.value = ''; // Limpiar el input
  showNotification('Subtarea agregada');
}

function toggleSubtaskCompletion(taskId, subtaskId, isCompleted) {
  const task = projects[currentProjectIndex].tasks.find(t => t.id === taskId);
  if (!task || !task.subtasks) return;
  
  const subtask = task.subtasks.find(st => st.id === subtaskId);
  if (subtask) {
    subtask.completed = isCompleted;
    updateLocalStorage();
    showTaskDetails(task); // Refrescar la vista para actualizar el porcentaje
  }
}

function deleteSubtask(taskId, subtaskId) {
  const task = projects[currentProjectIndex].tasks.find(t => t.id === taskId);
  if (!task || !task.subtasks) return;
  
  task.subtasks = task.subtasks.filter(st => st.id !== subtaskId);
  updateLocalStorage();
  showTaskDetails(task); // Refrescar la vista
  showNotification('Subtarea eliminada');
}


/***********************
 * INICIALIZACIÓN FINAL *
 ***********************/
// Verificar si hay vista activa en el localStorage
const activeView = localStorage.getItem('activeView') || 'board';
showView(activeView);

// Guardar la vista activa cuando cambia
Object.values(viewButtons).forEach(button => {
  if (button) {
    button.addEventListener('click', () => {
      localStorage.setItem('activeView', button.id.replace('show', '').toLowerCase());
    });
  }
});

// Verificar tareas rezagadas cada minuto
setInterval(checkOverdueTasks, 60000);

/***********************
 * CALCULO DEL ESTADO DEL PROYECTO*
 ***********************/
function updateProjectStatusLabel() {
    const project = projects[currentProjectIndex];
    if (!project || !project.tasks || project.tasks.length === 0) {
        document.getElementById('projectStatusLabel').textContent = 'Sin tareas';
        return;
    }

    let isOnTime = true;

    // Iterar sobre todas las tareas del proyecto
    for (const task of project.tasks) {
        const estimatedTime = task.estimatedTime || 0;
        const loggedTime = task.timeLogged || 0;

        // Verificar si la tarea está fuera de tiempo (basado en tiempo registrado)
        if (loggedTime > estimatedTime) {
            isOnTime = false;
            break;
        }
    }

    const label = document.getElementById('projectStatusLabel');
    label.classList.remove('onTime', 'offTime');

    if (isOnTime) {
        label.classList.add('onTime');
        label.textContent = 'En tiempo';
    } else {
        label.classList.add('offTime');
        label.textContent = 'Fuera de tiempo';
    }
}

// === AGREGAR NUEVO RIESGO ===
document.getElementById('addRiskBtn')?.addEventListener('click', () => {
    const title = prompt("Ingrese el título del riesgo:");
    if (!title || title.trim() === "") return;

    const severityInput = prompt("Gravedad (alta/media/baja):").toLowerCase();
    let severityClass = "low";
    if (severityInput.includes("alta")) severityClass = "high";
    else if (severityInput.includes("media")) severityClass = "medium";

    const statusInput = prompt("Estado (no resuelto/en revisión/monitoreando/resuelto):").toLowerCase();
    let statusValue = "no-resuelto"; // Valor por defecto
    let statusText = "No resuelto"; // Texto para mostrar
    
    // Manejo correcto de estados
    if (statusInput.includes("no resuelto") || statusInput.includes("no-resuelto")) {
        statusValue = "no-resuelto";
        statusText = "No resuelto";
    } else if (statusInput.includes("revisión") || statusInput.includes("revision")) {
        statusValue = "en-revision";
        statusText = "En revisión";
    } else if (statusInput.includes("monitoreando")) {
        statusValue = "monitoreando";
        statusText = "Monitoreando";
    } else if (statusInput.includes("resuelto")) {
        statusValue = "resuelto";
        statusText = "Resuelto";
    }

    const riskId = Date.now();
    
    const newRisk = document.createElement("div");
    newRisk.className = `risk-item ${severityClass} status-${statusValue}`;
    newRisk.dataset.riskId = riskId;
    
    // Opciones para el select
    const statusOptions = [
        {value: "no-resuelto", label: "No resuelto"},
        {value: "en-revision", label: "En revisión"},
        {value: "monitoreando", label: "Monitoreando"},
        {value: "resuelto", label: "Resuelto"}
    ];
    
    let optionsHTML = '';
    statusOptions.forEach(option => {
        const selected = option.value === statusValue ? 'selected' : '';
        optionsHTML += `<option value="${option.value}" ${selected}>${option.label}</option>`;
    });
    
    newRisk.innerHTML = `
        <span class="risk-title">${title}</span>
        <select class="risk-status-select" onchange="updateRiskStatus(this)">
            ${optionsHTML}
        </select>
        <button class="risk-delete-btn" onclick="deleteRisk(${riskId})">Eliminar</button>
    `;

    // Aplicar estilo de borde para "No resuelto"
    if (statusValue === "no-resuelto") {
        if (severityClass === "high") {
            newRisk.style.borderLeft = "3px solid #e74c3c";
        } else if (severityClass === "medium") {
            newRisk.style.borderLeft = "3px solid #f39c12";
        } else {
            newRisk.style.borderLeft = "3px solid #2ecc71";
        }
    }
    
    document.getElementById("risksContainer").appendChild(newRisk);
    saveRisksToLocalStorage();
    updateRisksCount();
});



// Función para eliminar riesgos
function deleteRisk(riskId) {
    if (confirm("¿Estás seguro de que deseas eliminar este riesgo?")) {
        // Encontrar el elemento del riesgo por su ID
        const riskElement = document.querySelector(`.risk-item[data-risk-id="${riskId}"]`);
        
        if (riskElement) {
            // Eliminar el elemento del DOM
            riskElement.remove();
            
            // Mostrar notificación
            showNotification("Riesgo eliminado correctamente");
            
            // Actualizar el almacenamiento local
            saveRisksToLocalStorage();
             updateRisksCount(); // ← Agregar aquí
        }
    }
}

// Función para guardar riesgos en localStorage (opcional)
// === FUNCIONES MEJORADAS PARA GESTIÓN DE RIESGOS POR PROYECTO ===

// Función para guardar riesgos en localStorage asociados al proyecto actual
function saveRisksToLocalStorage() {
    const project = projects[currentProjectIndex];
    if (!project) return;

    const risksContainer = document.getElementById("risksContainer");
    if (!risksContainer) return;

    const risks = [];
    const riskElements = risksContainer.querySelectorAll('.risk-item');
    
    riskElements.forEach(riskElement => {
        risks.push({
            id: parseInt(riskElement.dataset.riskId) || Date.now() + Math.floor(Math.random() * 1000),
            title: riskElement.querySelector('.risk-title')?.textContent || 'Riesgo sin título',
            description: riskElement.querySelector('.risk-description')?.textContent || '',
            severity: riskElement.classList.contains('high') ? 'high' :
                      riskElement.classList.contains('medium') ? 'medium' : 'low',
            status: riskElement.querySelector('.risk-status-select')?.value || 'no-resuelto',
            date: riskElement.dataset.riskDate || new Date().toISOString().split('T')[0]
        });
    });

    // Usar una clave única por proyecto (índice + nombre)
    const projectRisksKey = `projectRisks_${currentProjectIndex}_${project.name.replace(/\s+/g, '_')}`;
    localStorage.setItem(projectRisksKey, JSON.stringify(risks));
    
    console.log(`Riesgos guardados para el proyecto ${currentProjectIndex}:`, risks);
}
// Función para cargar riesgos desde localStorage asociados al proyecto actual
function loadRisksFromLocalStorage() {
    console.log("Cargando riesgos para el proyecto:", currentProjectIndex);
    
    // Limpiar contenedor primero
    const risksContainer = document.getElementById("risksContainer");
    if (!risksContainer) {
        console.error("Contenedor de riesgos no encontrado");
        return;
    }
    
    // Limpiar completamente el contenedor
    risksContainer.innerHTML = '';
    
    // Verificar si hay proyecto seleccionado
    if (currentProjectIndex === null || !projects[currentProjectIndex]) {
        risksContainer.innerHTML = '<div class="empty-message">Seleccione un proyecto para ver sus riesgos</div>';
        updateRisksCount();
        return;
    }

    const project = projects[currentProjectIndex];
    const projectRisksKey = `projectRisks_${currentProjectIndex}_${project.name.replace(/\s+/g, '_')}`;
    const savedRisks = JSON.parse(localStorage.getItem(projectRisksKey)) || [];

    console.log(`Riesgos encontrados para ${project.name}:`, savedRisks);

    if (savedRisks.length === 0) {
        risksContainer.innerHTML = '<div class="empty-message">No hay riesgos registrados para este proyecto</div>';
        updateRisksCount();
        return;
    }

    // Crear elementos para cada riesgo
    savedRisks.forEach(risk => {
        const riskElement = createRiskElement(risk);
        risksContainer.appendChild(riskElement);
    });

    updateRisksCount();
}

function createRiskElement(risk) {
    const riskElement = document.createElement('div');
    riskElement.className = `risk-item ${risk.severity} status-${risk.status}`;
    riskElement.dataset.riskId = risk.id;
    riskElement.dataset.riskDate = risk.date || new Date().toISOString().split('T')[0];

    const statusOptions = [
        { value: 'no-resuelto', label: 'No resuelto' },
        { value: 'en-revision', label: 'En revisión' },
        { value: 'monitoreando', label: 'Monitoreando' },
        { value: 'resuelto', label: 'Resuelto' }
    ];
    
    let optionsHTML = '';
    statusOptions.forEach(option => {
        const selected = risk.status === option.value ? 'selected' : '';
        optionsHTML += `<option value="${option.value}" ${selected}>${option.label}</option>`;
    });

    riskElement.innerHTML = `
        <div class="risk-header">
            <span class="risk-title">${risk.title || 'Riesgo sin título'}</span>
            <span class="risk-date">${formatDate(risk.date)}</span>
        </div>
        <div class="risk-description">${risk.description || 'Sin descripción'}</div>
        <div class="risk-footer">
            <select class="risk-status-select" onchange="updateRiskStatus(this)">
                ${optionsHTML}
            </select>
            <button class="risk-delete-btn" onclick="deleteRisk(${risk.id})">
                <i class="fas fa-trash"></i> Eliminar
            </button>
        </div>
    `;

    return riskElement;
}
// Función auxiliar para formatear fechas (si no existe)
function formatDate(dateString) {
  if (!dateString) return 'No definida';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).replace(/,/, '');
}

// Función para actualizar el estado de los riesgos
function updateRiskStatus(selectElement) {
    const riskItem = selectElement.closest('.risk-item');
    // Aquí puedes agregar lógica adicional si necesitas
    saveRisksToLocalStorage();
}
// === GESTIÓN DE ACCIONES REQUERIDAS ===

// Evento para el botón Agregar
document.getElementById('addActionBtn')?.addEventListener('click', function() {
  const actionText = prompt("Ingrese la acción requerida:");
  if (actionText && actionText.trim() !== "") {
    addActionToList(actionText.trim());
    saveActionsToLocalStorage();
    showNotification("Acción agregada correctamente");
  }
});

// Función para agregar acciones a la lista
// Función para agregar acciones a la lista (con parámetro opcional para guardar)
function addActionToList(text, saveToStorage = true) {
    const actionsList = document.getElementById('requiredActions');
    if (!actionsList) return;

    const li = document.createElement('li');
    li.className = 'action-item';
    
    li.innerHTML = `
        <span class="action-text">${text}</span>
        <button class="action-remove" onclick="removeAction(this)">
            <i class="fas fa-trash-alt"></i>
        </button>
    `;

    // Hacer editable al hacer doble clic
    const actionText = li.querySelector('.action-text');
    actionText.addEventListener('dblclick', function() {
        this.contentEditable = true;
        this.focus();
    });

    actionText.addEventListener('blur', function() {
        this.contentEditable = false;
        saveActionsToLocalStorage();
    });

    actionsList.appendChild(li);
    
    // Solo guardar si se especifica (evitar duplicados al cargar)
    if (saveToStorage) {
        saveActionsToLocalStorage();
    }
}

// Función para eliminar acciones
function removeAction(button) {
    if (confirm("¿Eliminar esta acción?")) {
        button.closest('li').remove();
        saveActionsToLocalStorage();
        showNotification("Acción eliminada");
    }
}
// Guardar acciones en localStorage
// Guardar acciones en localStorage por proyecto
function saveActionsToLocalStorage() {
    if (currentProjectIndex === null || !projects[currentProjectIndex]) return;
    
    const actions = [];
    document.querySelectorAll('#requiredActions .action-text').forEach(action => {
        actions.push(action.textContent);
    });
    
    // Usar una clave única por proyecto
    const projectActionsKey = `projectActions_${currentProjectIndex}`;
    localStorage.setItem(projectActionsKey, JSON.stringify(actions));
    console.log(`Acciones guardadas para proyecto ${currentProjectIndex}`);
}

// Cargar acciones desde localStorage por proyecto
function loadActionsFromLocalStorage() {
    const actionsList = document.getElementById('requiredActions');
    if (!actionsList) return;
    
    actionsList.innerHTML = '';
    
    if (currentProjectIndex === null || !projects[currentProjectIndex]) {
        actionsList.innerHTML = '<li class="empty-message">Seleccione un proyecto</li>';
        return;
    }

    const projectActionsKey = `projectActions_${currentProjectIndex}`;
    const savedActions = JSON.parse(localStorage.getItem(projectActionsKey)) || [];
    
    if (savedActions.length === 0) {
        actionsList.innerHTML = '<li class="empty-message">No hay acciones requeridas</li>';
        return;
    }

    savedActions.forEach(action => {
        addActionToList(action, false); // El segundo parámetro evita guardar duplicados
    });
    
    console.log(`Acciones cargadas para proyecto ${currentProjectIndex}`);
}
// === GESTIÓN DE PRÓXIMOS HITOS ===

// Configurar el botón de agregar hito
document.getElementById('addMilestoneBtn')?.addEventListener('click', function() {
    const name = prompt("Nombre del hito:");
    if (!name || name.trim() === "") return;

    const dateStr = prompt("Fecha del hito (YYYY-MM-DD):");
    if (!dateStr) return;

    if (!isValidDate(dateStr)) {
        showNotification("Formato de fecha inválido. Use YYYY-MM-DD");
        return;
    }

    addMilestoneToList(name, dateStr);
    showNotification("Hito agregado correctamente");
});

// Función para validar fecha
function isValidDate(dateString) {
    const regEx = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateString.match(regEx)) return false;
    const d = new Date(dateString);
    return !isNaN(d.getTime());
}

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    loadMilestonesFromLocalStorage();
});
// Función para agregar hito a la lista
function addMilestoneToList(name, dateStr) {
  const milestonesList = document.getElementById('milestonesList');
  if (!milestonesList) return;

  const formattedDate = formatDateForDisplay(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const milestoneDate = new Date(dateStr);
  milestoneDate.setHours(0, 0, 0, 0);

  const milestoneItem = document.createElement('div');
  let statusClass = 'upcoming';
  
  if (milestoneDate < today) {
    statusClass = 'overdue';
  } else if (milestoneDate.toDateString() === today.toDateString()) {
    statusClass = 'current';
  }

  milestoneItem.className = `milestone-item ${statusClass}`;
  milestoneItem.dataset.date = dateStr;
  
  milestoneItem.innerHTML = `
    <span class="milestone-date">${formattedDate}</span>
    <span class="milestone-name">${name}</span>
    <button class="milestone-remove" onclick="removeMilestone(this)">
      <i class="fas fa-trash-alt"></i>
    </button>
  `;

  milestonesList.appendChild(milestoneItem);
}

// Función para formatear fecha para visualización
function formatDateForDisplay(dateStr) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateStr).toLocaleDateString('es-ES', options);
}

// Función para eliminar hito
function removeMilestone(button) {
  if (confirm("¿Eliminar este hito?")) {
    button.closest('.milestone-item').remove();
    saveMilestonesToLocalStorage();
    showNotification("Hito eliminado");
  }
}

// Guardar hitos en localStorage
function saveMilestonesToLocalStorage() {
  if (currentProjectIndex === null || !projects[currentProjectIndex]) return;


  const milestones = [];
    document.querySelectorAll('#milestonesList .milestone-item').forEach(item => {
        milestones.push({
            name: item.querySelector('.milestone-name').textContent,
            date: item.dataset.date,
            status: item.classList.contains('current') ? 'current' : 
                   item.classList.contains('overdue') ? 'overdue' : 'upcoming'
        });
    });
    
    const projectMilestonesKey = `projectMilestones_${currentProjectIndex}`;
    localStorage.setItem(projectMilestonesKey, JSON.stringify(milestones));
    console.log(`Hitos guardados para proyecto ${currentProjectIndex}`);
}


// Cargar hitos desde localStorage
function loadMilestonesFromLocalStorage() {
  const savedMilestones = JSON.parse(localStorage.getItem('projectMilestones')) || [];
  const milestonesList = document.getElementById('milestonesList');
  
  if (milestonesList) {
    milestonesList.innerHTML = '';
    savedMilestones.forEach(milestone => {
      addMilestoneToList(milestone.name, milestone.date);
    });
  }
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  loadMilestonesFromLocalStorage();
  
  // Asegurar que el botón tenga el event listener
  const addBtn = document.getElementById('addMilestoneBtn');
  if (addBtn) {
    addBtn.addEventListener('click', addNewMilestone);
  }
});// === ACCIONES RÁPIDAS ===

// 1. Nueva Tarea
document.getElementById('quickNewTaskBtn')?.addEventListener('click', function() {
  document.getElementById('createTaskModal').style.display = 'block';
  showNotification("Preparando formulario para nueva tarea");
});

// 2. Generar Reporte
document.getElementById('quickGenerateReportBtn')?.addEventListener('click', function() {
  generateProjectReport();
  showNotification("Generando reporte del proyecto");
});

// 3. Cambiar Vista (Explicación detallada abajo)
document.getElementById('quickSwitchViewBtn')?.addEventListener('click', function() {
    const currentView = getActiveView();
    let nextView;
    switch(currentView) {
        case 'board': nextView = 'list'; break;
        case 'list': nextView = 'calendar'; break;
        case 'calendar': nextView = 'gantt'; break;
        case 'gantt': nextView = 'reports'; break;
        case 'reports': nextView = 'profitability'; break;
        case 'profitability': nextView = 'dashboard'; break;
        // Agrega la nueva vista aquí
        case 'dashboard': nextView = 'timeAllocation'; break;
        case 'timeAllocation': nextView = 'board'; break; // Cierra el ciclo
        default: nextView = 'board';
    }
    showView(nextView);
    showNotification(`Cambiando a vista: ${getViewName(nextView)}`);
});
// Función auxiliar para obtener nombre legible de la vista
function getViewName(view) {
    const names = {
        'board': 'Tablero Kanban',
        'list': 'Lista de Tareas',
        'calendar': 'Calendario',
        'gantt': 'Diagrama Gantt',
        'reports': 'Reportes',
        'profitability': 'Rentabilidad',
        'dashboard': 'Dashboard',
        'timeAllocation': 'Asignación de Horas' // Agrega esta línea
    };
    return names[view] || view;
}// Mostrar/ocultar menú contextual de proyectos
function toggleProjectMenu(event, projectIndex) {
  event.stopPropagation();
  
  // Cerrar todos los otros menús
  document.querySelectorAll('.project-context-menu').forEach(menu => {
    if (menu.id !== `project-menu-${projectIndex}`) {
      menu.classList.remove('show');
    }
  });
  
  // Alternar el menú actual
  const menu = document.getElementById(`project-menu-${projectIndex}`);
  if (menu) {
    menu.classList.toggle('show');
    // Posicionar el menú
    const rect = event.target.getBoundingClientRect();
    menu.style.left = `${rect.left}px`;
    menu.style.top = `${rect.bottom}px`;
  }
}

// Editar proyecto desde el menú contextual
function editProjectFromMenu(projectIndex) {
  const project = projects[projectIndex];
  const newName = prompt('Editar nombre del proyecto:', project.name);
  
  if (newName && newName.trim()) {
    project.name = newName.trim();
    updateLocalStorage();
    renderProjects();
    selectProject(projectIndex);
    showNotification(`Proyecto renombrado a "${newName}"`);
  }
  
  // Cerrar todos los menús
  document.querySelectorAll('.project-context-menu').forEach(menu => {
    menu.classList.remove('show');
  });
}

// Eliminar proyecto desde el menú contextual
function deleteProjectFromMenu(projectIndex) {
  const project = projects[projectIndex];
  if (confirm(`¿Estás seguro de eliminar el proyecto "${project.name}"?`)) {
    deleteProject(projectIndex);
  }
  
  // Cerrar todos los menús
  document.querySelectorAll('.project-context-menu').forEach(menu => {
    menu.classList.remove('show');
  });
}

// === ACTUALIZAR BARRA DE AVANCE PEQUEÑA ===
function updateStatusProgress() {
  const totalTasks = tasks.filter(t => t.projectId === currentProjectId).length;
  const completedTasks = tasks.filter(t => t.projectId === currentProjectId && t.status === 'completed').length;
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const fillElement = document.getElementById('statusProgressFill');
  const labelElement = document.getElementById('statusProgressLabel');

  if (fillElement && labelElement) {
    fillElement.style.width = `${progress}%`;
    labelElement.textContent = `${progress}% Completado`;
  }
}
// === FUNCIONES DE REPORTES - GENERAR VISTA ===
function generateReports(tasks = null) { // Acepta tareas filtradas como argumento
  console.log("generateReports llamado con tasks:", tasks ? `(${tasks.length} tareas)` : "null (usando todas)");
  const tasksToUse = tasks || getFilteredTasks('reports'); // Usa las tareas pasadas o filtra para 'reports'
  const stats = getStats(tasksToUse);
  const timeStats = getTimeStats(tasksToUse); // <-- Pasa las tareas filtradas aquí

  // --- INICIO: Tu nuevo código integrado ---
  // Asegúrate de que `project` esté definido aquí si lo necesitas
  const project = projects[currentProjectIndex];
  // --- INICIO: ACTUALIZACIÓN DE CUADROS DE TIEMPO Y LEYENDA ---

    // *** 1. Tiempo Estimado ***
    const totalEstimatedTimeElem = document.getElementById('totalEstimatedTimeStatus');
    if (totalEstimatedTimeElem && !isNaN(timeStats.totalEstimated)) {
        totalEstimatedTimeElem.textContent = `${timeStats.totalEstimated.toFixed(2)} horas`;
        console.log(`Tiempo Estimado actualizado: ${timeStats.totalEstimated.toFixed(2)} horas`);
    } else {
        console.warn("Elemento totalEstimatedTimeStatus no encontrado o valor inválido.");
    }

    // *** 2. Tiempo Registrado ***
    const totalLoggedTimeElem = document.getElementById('totalLoggedTimeStatus');
    if (totalLoggedTimeElem && !isNaN(timeStats.totalLogged)) {
        totalLoggedTimeElem.textContent = `${timeStats.totalLogged.toFixed(2)} horas`;
        console.log(`Tiempo Registrado actualizado: ${timeStats.totalLogged.toFixed(2)} horas`);
    } else {
        console.warn("Elemento totalLoggedTimeStatus no encontrado o valor inválido.");
    }

    // *** 3. Tiempo Restante ***
    const remainingTimeElem = document.getElementById('remainingTimeStatus');
    if (remainingTimeElem && !isNaN(timeStats.remaining)) {
        remainingTimeElem.textContent = `${timeStats.remaining.toFixed(2)} horas`;
        console.log(`Tiempo Restante actualizado: ${timeStats.remaining.toFixed(2)} horas`);
    } else {
        console.warn("Elemento remainingTimeStatus no encontrado o valor inválido.");
    }

    // *** 4. Tiempo Total del Proyecto (opcional, si se usa) ***
    const totalTimeElem = document.getElementById('totalProjectTimeStatus');
    if (totalTimeElem && project) {
        totalTimeElem.textContent = `${project.totalProjectTime || 0} horas`;
        console.log(`Tiempo Total del Proyecto actualizado: ${project.totalProjectTime || 0} horas`);
    } else if(totalTimeElem) {
         totalTimeElem.textContent = `0 horas`;
         console.log(`Tiempo Total del Proyecto actualizado a 0 horas (sin proyecto o sin tiempo definido).`);
    } else {
        console.warn("Elemento totalProjectTimeStatus no encontrado.");
    }
  // Actualizar barra de avance (la que creamos sin conflictos)
  const fillElement = document.getElementById('statusProgressFill');
  const labelElement = document.getElementById('statusProgressLabel');

  if (fillElement && labelElement) {
    fillElement.style.width = `${progress}%`;
    labelElement.textContent = `${progress}% Completado`;
  }

  // Actualizar contadores (si tienes estos elementos)
  const totalTasksEl = document.getElementById('totalTasks');
  const completedTasksEl = document.getElementById('completedTasks');
  updateReportsProjectProgress(); 
}

function updateResourceAllocation() {
    const project = projects[currentProjectIndex];
    if (!project || !project.tasks) return;

    const resourceList = document.getElementById('resourceList');
    const resourceChartCanvas = document.getElementById('resourceChart');
    
    if (!resourceList || !resourceChartCanvas) return;

    // Calcular asignación de recursos
    const resourceData = calculateResourceAllocation(project.tasks);
    
    // Actualizar lista de recursos
    renderResourceList(resourceList, resourceData);
    
    // Actualizar gráfica de recursos
    renderResourceChart(resourceChartCanvas, resourceData);
}

function calculateResourceAllocation(tasks) {
    const resources = {};
    
    tasks.forEach(task => {
        const assignee = task.assignee || 'Sin asignar';
        const estimatedTime = task.estimatedTime || 0;
        const loggedTime = task.timeLogged || 0;
        
        if (!resources[assignee]) {
            resources[assignee] = {
                name: assignee,
                estimated: 0,
                logged: 0,
                tasks: 0
            };
        }
        
        resources[assignee].estimated += estimatedTime;
        resources[assignee].logged += loggedTime;
        resources[assignee].tasks += 1;
    });
    
    return Object.values(resources);
}

function renderResourceList(container, resourceData) {
    if (!container) return;
    
    if (resourceData.length === 0) {
        container.innerHTML = '<div class="empty-message">No hay recursos asignados</div>';
        return;
    }
    
    container.innerHTML = '';
    
    resourceData.forEach(resource => {
        const resourceItem = document.createElement('div');
        resourceItem.className = 'resource-item';
        
        const efficiency = resource.estimated > 0 ? 
            Math.round((resource.logged / resource.estimated) * 100) : 0;
        
        let efficiencyClass = 'efficiency-normal';
        if (efficiency > 100) efficiencyClass = 'efficiency-high';
        else if (efficiency < 80) efficiencyClass = 'efficiency-low';
        
        resourceItem.innerHTML = `
            <div class="resource-info">
                <h4>${resource.name}</h4>
                <div class="resource-stats">
                    <span class="stat"><i class="fas fa-tasks"></i> ${resource.tasks} tareas</span>
                    <span class="stat"><i class="fas fa-clock"></i> ${resource.estimated.toFixed(1)}h estimadas</span>
                    <span class="stat"><i class="fas fa-user-clock"></i> ${resource.logged.toFixed(1)}h registradas</span>
                </div>
            </div>
            <div class="resource-efficiency">
                <div class="efficiency-bar">
                    <div class="efficiency-fill ${efficiencyClass}" style="width: ${Math.min(efficiency, 100)}%"></div>
                </div>
                <div class="efficiency-value ${efficiencyClass}">${efficiency}%</div>
            </div>
        `;
        
        container.appendChild(resourceItem);
    });
}

function renderResourceChart(canvas, resourceData) {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Destruir gráfica existente si hay una
    if (window.resourceChart) {
        window.resourceChart.destroy();
    }
    
    if (resourceData.length === 0) {
        // Limpiar canvas si no hay datos
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }
    
    // Preparar datos para la gráfica
    const labels = resourceData.map(resource => resource.name);
    const estimatedData = resourceData.map(resource => resource.estimated);
    const loggedData = resourceData.map(resource => resource.logged);
    
    // Crear gráfica de barras agrupadas
    window.resourceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Horas Estimadas',
                    data: estimatedData,
                    backgroundColor: 'rgba(52, 152, 219, 0.7)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Horas Registradas',
                    data: loggedData,
                    backgroundColor: 'rgba(46, 204, 113, 0.7)',
                    borderColor: 'rgba(46, 204, 113, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Horas'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Recursos'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: false
                }
            }
        }
    });
}

// === FUNCIÓN DE ASIGNACIÓN DE RECURSOS (Versión Mínima) ===
function updateResourceAllocation() {
    console.log("Función updateResourceAllocation llamada"); // Para verificar en consola
    
    // 1. Seleccionar el contenedor
    const container = document.getElementById('resourceAllocationContent');
    
    // 2. Verificar si el contenedor existe
    if (!container) {
        console.error("No se encontró el elemento con ID 'resourceAllocationContent'");
        return;
    }
    
    // 3. Mostrar un mensaje de prueba
    container.innerHTML = `
        <div style="padding: 20px; text-align: center; background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px;">
            <h3 style="color: #495057;">Sección de Recursos</h3>
            <p style="color: #6c757d;">Esta sección mostrará la asignación de recursos.</p>
            <p style="color: #6c757d; font-size: 0.9em;"><em>Implementación en progreso...</em></p>
        </div>
    `;
    
    console.log("Contenido de prueba insertado en resourceAllocationContent");
}

// === FUNCIÓN COMPLETA DE ASIGNACIÓN DE RECURSOS ===
function updateResourceAllocation() {
    console.log("Ejecutando updateResourceAllocation");
    
    const project = projects[currentProjectIndex];
    if (!project) {
        console.log("No hay proyecto seleccionado");
        return;
    }
    
    // Seleccionar contenedores
    const resourceList = document.getElementById('resourceList');
    const resourceChartCanvas = document.getElementById('resourceChart');
    
    if (!resourceList || !resourceChartCanvas) {
        console.log("No se encontraron los elementos del DOM para recursos");
        return;
    }
    
    // Calcular asignación de recursos
    const resourceData = calculateResourceAllocation(project.tasks || []);
    
    // Actualizar lista de recursos
    renderResourceList(resourceList, resourceData);
    
    // Actualizar gráfica de recursos
    renderResourceChart(resourceChartCanvas, resourceData);
}

function calculateResourceAllocation(tasks) {
    const resources = {};
    
    tasks.forEach(task => {
        // Usar 'assignee' o 'Asignado a:' según tu estructura
        const assignee = task.assignee || task['Asignado a:'] || 'Sin asignar';
        const estimatedTime = parseFloat(task.estimatedTime) || 0;
        const timeLogged = parseFloat(task.timeLogged) || 0;
        
        if (!resources[assignee]) {
            resources[assignee] = {
                name: assignee,
                estimated: 0,
                logged: 0,
                tasks: 0
            };
        }
        
        resources[assignee].estimated += estimatedTime;
        resources[assignee].logged += timeLogged;
        resources[assignee].tasks += 1;
    });
    
    return Object.values(resources);
}

function renderResourceList(container, resourceData) {
    if (!container) return;
    
    if (resourceData.length === 0) {
        container.innerHTML = '<div class="empty-message">No hay recursos asignados</div>';
        return;
    }
    
    let html = '';
    resourceData.forEach(resource => {
        const efficiency = resource.estimated > 0 ? 
            Math.round((resource.logged / resource.estimated) * 100) : 0;
        
        let efficiencyClass = 'efficiency-normal';
        if (efficiency > 110) efficiencyClass = 'efficiency-high';
        else if (efficiency < 80) efficiencyClass = 'efficiency-low';
        
        html += `
            <div class="resource-item">
                <div class="resource-info">
                    <h4>${resource.name}</h4>
                    <div class="resource-stats">
                        <span class="stat"><i class="fas fa-tasks"></i> ${resource.tasks} tareas</span>
                        <span class="stat"><i class="fas fa-clock"></i> ${resource.estimated.toFixed(1)}h estimadas</span>
                        <span class="stat"><i class="fas fa-user-clock"></i> ${resource.logged.toFixed(1)}h registradas</span>
                    </div>
                </div>
                <div class="resource-efficiency">
                    <div class="efficiency-bar">
                        <div class="efficiency-fill ${efficiencyClass}" style="width: ${Math.min(efficiency, 100)}%"></div>
                    </div>
                    <div class="efficiency-value ${efficiencyClass}">${efficiency}%</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderResourceChart(canvas, resourceData) {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Destruir gráfica existente si hay una
    if (window.resourceChart) {
        window.resourceChart.destroy();
    }
    
    if (resourceData.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }
    
    // Preparar datos para la gráfica
    const labels = resourceData.map(resource => resource.name);
    const estimatedData = resourceData.map(resource => resource.estimated);
    const loggedData = resourceData.map(resource => resource.logged);
    
    // Crear gráfica de barras agrupadas
    window.resourceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Horas Estimadas',
                    data: estimatedData,
                    backgroundColor: 'rgba(52, 152, 219, 0.7)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Horas Registradas',
                    data: loggedData,
                    backgroundColor: 'rgba(46, 204, 113, 0.7)',
                    borderColor: 'rgba(46, 204, 113, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Horas'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Recursos'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });
}

// === BARRA DE PROGRESO INDEPENDIENTE PARA DASHBOARD ===
function updateDashboardProjectProgress() {
    const project = projects[currentProjectIndex];
    if (!project) return;
    
    const stats = getStats();
    const completionPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    
    // Actualizar la barra de progreso independiente del Dashboard
    const progressFill = document.getElementById('dashboardProjectProgressFill');
    const progressText = document.getElementById('dashboardProjectProgressText');
    
    if (progressFill) {
        progressFill.style.width = `${completionPercentage}%`;
    }
    
    if (progressText) {
        progressText.textContent = `${completionPercentage}% Completado`;
    }
}
// === BARRA DE PROGRESO INDEPENDIENTE PARA VISTA STATUS/REPORTS ===
function updateReportsProjectProgress() {
    console.log("Actualizando barra de progreso de Status/Reports"); // Para depuración

    const project = projects[currentProjectIndex];
    if (!project) {
        console.log("No hay proyecto seleccionado para la barra de Status/Reports");
        // Resetear la barra si no hay proyecto
        const fillElement = document.getElementById('reportsProjectProgressFill');
        const textElement = document.getElementById('reportsProjectProgressText');
        if (fillElement) fillElement.style.width = '0%';
        if (textElement) textElement.textContent = '0% Completado';
        return;
    }

    // Calcular el progreso
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(t => t.status === 'completed').length; // Asegúrate de usar la propiedad correcta
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    console.log(`Progreso calculado: ${completionPercentage}% (${completedTasks}/${totalTasks})`); // Para depuración

    // Actualizar la barra y el texto
    const progressFill = document.getElementById('reportsProjectProgressFill');
    const progressText = document.getElementById('reportsProjectProgressText');

    if (progressFill) {
        progressFill.style.width = `${completionPercentage}%`;
        console.log(`Ancho de la barra actualizado a ${completionPercentage}%`); // Para depuración
    } else {
        console.warn("Elemento 'reportsProjectProgressFill' no encontrado en el DOM.");
    }

    if (progressText) {
        progressText.textContent = `${completionPercentage}% Completado`;
        console.log(`Texto de progreso actualizado a ${completionPercentage}% Completado`); // Para depuración
    } else {
        console.warn("Elemento 'reportsProjectProgressText' no encontrado en el DOM.");
    }
}



// --- MÓDULO DE SEGUIMIENTO DE HORAS - INICIO ---

let timeTrackingChartInstance = null; // Variable global para la instancia de Chart.js

/**
 * Calcula los datos de seguimiento de horas a partir de las tareas del proyecto actual.
 * Esta función debe llamarse DESDE el script principal donde 'projects' y 'currentProjectIndex' están disponibles.
 * @param {Array} projectTasks - Las tareas del proyecto actual (projects[currentProjectIndex].tasks)
 * @param {String} projectName - El nombre del proyecto actual (projects[currentProjectIndex].name)
 * @returns {Array} Array de objetos con { assignee, projectName, hours, lastRegister }
 */




function calculateTimeTrackingData(projectTasks, projectName) {
    console.group("📊 Calculando datos de seguimiento de horas");
    console.log("📦 Tareas del proyecto:", projectTasks);
    
    const trackingData = {};
    
    projectTasks.forEach(task => {
        // Obtener el asignado (con compatibilidad para diferentes nombres de propiedad)
        const assignee = task.assignee || task['Asignado a:'] || 'Sin asignar';
        
        // Obtener horas registradas (con compatibilidad para diferentes formatos)
        const hours = parseFloat(task.timeLogged) || 0;
        
        // Obtener última fecha de registro (usamos deadline si no hay startDate)
        const lastRegister = task.startDate || task.deadline || new Date().toISOString();
        
        if (!trackingData[assignee]) {
            trackingData[assignee] = {
                assignee: assignee,
                projectName: projectName,
                hours: 0,
                lastRegister: lastRegister
            };
        }
        
        trackingData[assignee].hours += hours;
        
        // Mantener la fecha más reciente
        if (new Date(lastRegister) > new Date(trackingData[assignee].lastRegister)) {
            trackingData[assignee].lastRegister = lastRegister;
        }
    });
    
    const result = Object.values(trackingData);
    console.log("✅ Datos calculados:", result);
    console.groupEnd();
    return result;
}




/**
 * Renderiza el módulo de Seguimiento de Horas en el Dashboard.
 * Debe llamarse cuando el proyecto y sus datos estén cargados.
 */
function renderTimeTrackingModule() {
    console.log("🖼️ Renderizando módulo de Seguimiento de Horas...");

    // Verificar que tenemos un proyecto seleccionado
    if (typeof projects === 'undefined' || typeof currentProjectIndex === 'undefined' || !projects[currentProjectIndex]) {
        console.warn("⚠️ No se puede renderizar el módulo: proyecto no disponible.");
        updateTimeTrackingTable([]);
        updateTimeTrackingChart([]);
        populateTimeTrackingFilters([]);
        return;
    }

    const project = projects[currentProjectIndex];
    const projectName = project.name || `Proyecto ${currentProjectIndex + 1}`;

    console.log(`📦 Proyecto actual: ${projectName}`);

    // Calcular datos de seguimiento
    const timeTrackingData = calculateTimeTrackingData(project.tasks, projectName);

    // Poblar filtros
    populateTimeTrackingFilters(timeTrackingData);

    // Aplicar filtros iniciales (mostrar todo)
    const initialFilteredData = filterTimeTrackingData(timeTrackingData, {
        year: 'all',
        month: 'all',
        project: 'all',
        assignee: 'all'
    });

    // Actualizar vista
    updateTimeTrackingTable(initialFilteredData);
    updateTimeTrackingChart(initialFilteredData);

    console.log("✅ Módulo de Seguimiento de Horas renderizado.");
}
/**
 * Puebla los selectores de filtros con datos únicos.
 * @param {Array} data - Los datos de seguimiento de horas.
 */
function populateTimeTrackingFilters(data) {
    console.group("🔄 Poblando filtros de seguimiento de horas...");
    console.log("Datos recibidos para poblar filtros:", data);

    const projectSelect = document.getElementById('timeTrackingProject');
    const assigneeSelect = document.getElementById('timeTrackingAssignee');

    if (!projectSelect) {
        console.error("❌ Elemento 'timeTrackingProject' no encontrado en el DOM.");
    }
    if (!assigneeSelect) {
        console.error("❌ Elemento 'timeTrackingAssignee' no encontrado en el DOM.");
    }
    // Limpiar y resetear selectores si existen
    if (projectSelect) {
        console.log("Limpiando selector de proyectos...");
        projectSelect.innerHTML = '<option value="all">Todos</option>';
    }
    if (assigneeSelect) {
        console.log("Limpiando selector de asignados...");
        assigneeSelect.innerHTML = '<option value="all">Todos</option>';
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn("⚠️ No hay datos para poblar los filtros o los datos no son válidos.");
        console.groupEnd();
        return;
    }


    const projectsSet = new Set();
    const assigneesSet = new Set();


  console.log("Extrayendo proyectos y asignados únicos de los datos...");
    data.forEach((item, index) => {
        console.log(`Procesando item ${index}:`, item);
        if (item.projectName && typeof item.projectName === 'string') {
            projectsSet.add(item.projectName);
            console.log(`  ✅ Proyecto encontrado: ${item.projectName}`);
        } else {
            console.warn(`  ⚠️ Item ${index} no tiene projectName válido:`, item.projectName);
        }
        
        if (item.assignee && typeof item.assignee === 'string' && item.assignee.trim() !== '') {
            assigneesSet.add(item.assignee.trim());
            console.log(`  ✅ Asignado encontrado: ${item.assignee.trim()}`);
        } else {
            console.warn(`  ⚠️ Item ${index} no tiene assignee válido:`, item.assignee);
        }
    });

    console.log("🏷️ Proyectos encontrados para filtros:", Array.from(projectsSet));
    console.log("👤 Asignados encontrados para filtros:", Array.from(assigneesSet));

    // Poblar selectores si existen
    if (projectSelect && projectsSet.size > 0) {
        console.log("Poblando selector de proyectos...");
        projectsSet.forEach(project => {
            if (project) {
                const option = new Option(project, project);
                projectSelect.appendChild(option);
                console.log(`  ✅ Opción de proyecto agregada: ${project}`);
            }
        });
    }

 else if (projectSelect) {
        console.log("ℹ️ No hay proyectos válidos para agregar al selector.");
    }

    if (assigneeSelect && assigneesSet.size > 0) {
        console.log("Poblando selector de asignados...");
        assigneesSet.forEach(assignee => {
            if (assignee) {
                const option = new Option(assignee, assignee);
                assigneeSelect.appendChild(option);
                console.log(`  ✅ Opción de asignado agregada: ${assignee}`);
            }
        });
    } else if (assigneeSelect) {
        console.log("ℹ️ No hay asignados válidos para agregar al selector.");
    }

    console.log("✅ Filtros de seguimiento de horas poblados.");
    console.groupEnd();
}
function getCurrentTimeTrackingFilters() {
    return {
        year: document.getElementById('timeTrackingYear')?.value || 'all',
        month: document.getElementById('timeTrackingMonth')?.value || 'all',
        project: document.getElementById('timeTrackingProject')?.value || 'all',
        assignee: document.getElementById('timeTrackingAssignee')?.value || 'all'
    };
}

/**
 * Filtra los datos de seguimiento según los criterios.
 * @param {Array} data - Los datos a filtrar.
 * @param {Object} filters - Los filtros a aplicar.
 * @returns {Array} Los datos filtrados.
 */
function filterTimeTrackingData(data, filters) {
    console.log("🛠️ Filtrando datos de seguimiento...", { data, filters });

    if (!data || !Array.isArray(data)) return [];

    const { year, month, project, assignee } = filters;

    return data.filter(item => {
        // Filtro por año
        if (year !== 'all' && item.lastRegister) {
            if (!item.lastRegister.startsWith(String(year))) {
                return false;
            }
        }

        // Filtro por mes
        if (month !== 'all' && item.lastRegister) {
            try {
                const itemMonth = new Date(item.lastRegister).getMonth() + 1; // 1-12
                if (parseInt(month, 10) !== itemMonth) {
                    return false;
                }
            } catch (e) {
                console.warn("Error al parsear mes de", item.lastRegister);
            }
        }

        // Filtro por proyecto
        if (project !== 'all' && item.projectName !== project) {
            return false;
        }

        // Filtro por asignado
        if (assignee !== 'all' && item.assignee !== assignee) {
            return false;
        }

        return true;
    });
}

/**
 * Actualiza la tabla del módulo de seguimiento de horas.
 * @param {Array} data - Los datos a mostrar.
 */
function updateTimeTrackingTable(data) {
    console.log("📋 Actualizando tabla de seguimiento con", data.length, "elementos.");
    const tbody = document.getElementById('timeTrackingTableBody');
    if (!tbody) {
        console.error("❌ Elemento 'timeTrackingTableBody' no encontrado.");
        return;
    }

    tbody.innerHTML = data.length > 0 ? data.map(item => `
      <tr>
        <td>${item.assignee || 'N/A'}</td>
        <td>${item.projectName || 'N/A'}</td>
        <td>${(typeof item.hours === 'number') ? item.hours.toFixed(2) : '0.00'}</td>
        <td>${(item.hours && typeof item.hours === 'number') ? (item.hours / 20).toFixed(2) : '0.00'}</td>
        <td>${formatDateForTracking(item.lastRegister)}</td>
      </tr>
    `).join('') : '<tr><td colspan="5">No hay datos</td></tr>';
}

/**
 * Formatea una fecha para mostrar en la tabla.
 * @param {String} dateString - La fecha en formato ISO.
 * @returns {String} La fecha formateada.
 */
function formatDateForTracking(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha Inválida';
    return date.toLocaleDateString('es-ES');
}

/**
 * Actualiza la gráfica del módulo de seguimiento de horas.
 * @param {Array} data - Los datos a mostrar.
 */
function updateTimeTrackingChart(data) {
    console.log("📊 Actualizando gráfica de seguimiento con", data.length, "elementos.");
    const ctx = document.getElementById('timeTrackingChart')?.getContext('2d');
    if (!ctx) {
        console.error("❌ Contexto 2D del canvas 'timeTrackingChart' no encontrado.");
        return;
    }

    // Destruir instancia anterior si existe
    if (timeTrackingChartInstance) {
        timeTrackingChartInstance.destroy();
        timeTrackingChartInstance = null;
    }

    if (data.length === 0) {
        // Limpiar el canvas si no hay datos
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        return;
    }

    const labels = data.map(item => item.assignee || 'N/A');
    const hoursData = data.map(item => (typeof item.hours === 'number') ? item.hours : 0);

    timeTrackingChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Horas trabajadas',
                data: hoursData,
                backgroundColor: 'rgba(54, 162, 235, 0.7)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Horas'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Asignado'
                    }
                }
            }
        }
    });
    console.log("📊 Gráfica de seguimiento actualizada.");
}

// --- CONFIGURACIÓN DE EVENT LISTENERS PARA EL MÓDULO ---
// Este bloque se puede colocar junto con otros event listeners de tu aplicación,
// por ejemplo, dentro de una función de inicialización o al final del DOMContentLoaded.

document.addEventListener('DOMContentLoaded', function () {
    // Configurar event listener para el botón de aplicar filtros de seguimiento de horas
    const applyButton = document.getElementById('applyTimeTrackingFilters');
    if (applyButton) {
        applyButton.addEventListener('click', function () {
            console.log("🖱️ Botón 'Aplicar' de seguimiento de horas clickeado.");

            // Verificar que las variables globales estén disponibles
            if (typeof projects === 'undefined' || typeof currentProjectIndex === 'undefined' || !projects[currentProjectIndex]) {
                console.warn("⚠️ No se puede aplicar filtro: proyecto no disponible.");
                updateTimeTrackingTable([]);
                updateTimeTrackingChart([]);
                return;
            }

            const project = projects[currentProjectIndex];
            const projectName = project.name || `Proyecto ${currentProjectIndex + 1}`;

            // 1. Recalcular datos (por si han cambiado)
            const timeTrackingData = calculateTimeTrackingData(project.tasks, projectName);
console.log("📊 Datos de seguimiento calculados:", timeTrackingData);
// Poblar filtros
populateTimeTrackingFilters(timeTrackingData);
// ...

            // 2. Obtener filtros actuales
            const filters = getCurrentTimeTrackingFilters();
            console.log("🔍 Filtros aplicados:", filters);

            // 3. Filtrar datos
            const filteredData = filterTimeTrackingData(timeTrackingData, filters);

            // 4. Actualizar vista
            updateTimeTrackingTable(filteredData);
            updateTimeTrackingChart(filteredData);

            console.log("✅ Filtros de seguimiento de horas aplicados.");
        });
    } else {
        console.warn("⚠️ Botón 'applyTimeTrackingFilters' no encontrado en el DOM al cargar.");
    }

    // Poblar dinámicamente el selector de meses si existe
    const monthSelect = document.getElementById('timeTrackingMonth');
    if (monthSelect) {
        // Limpiar opciones existentes excepto "Todos"
        monthSelect.innerHTML = '<option value="all">Todos</option>';

        // Agregar meses del 1 al 12
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        for (let i = 1; i <= 12; i++) {
            const option = document.createElement('option');
            option.value = i.toString(); // Usar string para facilitar comparación
            option.textContent = `${i.toString().padStart(2, '0')} - ${monthNames[i - 1]}`;
            monthSelect.appendChild(option);
        }
        console.log("📅 Selector de meses poblado.");
    }
});

// --- INTEGRACIÓN CON EL DASHBOARD ---
// Asegúrate de que esta llamada esté dentro de tu función `renderDashboard`
// Busca la función `renderDashboard` en tu código y agrega esta línea al final:


// === FUNCIÓN DE PRUEBA PARA POBLAR FILTROS MANUALMENTE ===
// Esta función se puede llamar manualmente desde la consola del navegador
function debugPopulateFilters() {
    console.log("=== DEBUG: Iniciando poblado manual de filtros ===");

    // 1. Intentar encontrar los elementos
    const projectSelect = document.getElementById('timeTrackingProject');
    const assigneeSelect = document.getElementById('timeTrackingAssignee');

    console.log("Elemento timeTrackingProject:", projectSelect);
    console.log("Elemento timeTrackingAssignee:", assigneeSelect);

    if (!projectSelect) {
        console.error("❌ NO SE ENCONTRÓ EL SELECTOR DE PROYECTO");
        return;
    }
    if (!assigneeSelect) {
        console.error("❌ NO SE ENCONTRÓ EL SELECTOR DE ASIGNADO");
        return;
    }

    // 2. Limpiar selectores
    projectSelect.innerHTML = '<option value="all">[DEBUG] Todos los Proyectos</option>';
    assigneeSelect.innerHTML = '<option value="all">[DEBUG] Todos los Asignados</option>';

    // 3. Agregar opciones de prueba
    console.log("Agregando opciones de prueba...");
    const testOption1 = new Option("[DEBUG] Proyecto Alpha", "proyecto_alpha");
    const testOption2 = new Option("[DEBUG] Proyecto Beta", "proyecto_beta");
    projectSelect.appendChild(testOption1);
    projectSelect.appendChild(testOption2);

    const testAssignee1 = new Option("[DEBUG] Juan Pérez", "juan");
    const testAssignee2 = new Option("[DEBUG] María García", "maria");
    assigneeSelect.appendChild(testAssignee1);
    assigneeSelect.appendChild(testAssignee2);

    console.log("✅ Opciones de prueba agregadas. ¡Deberías verlas en los filtros ahora!");
    console.log("Si ves las opciones de prueba, el problema está en la función que pobla los datos reales.");
}

// === FUNCIÓN PARA POBLAR CON DATOS REALES (versión simplificada y verbosa) ===
function populateTimeTrackingFiltersREAL() {
    console.group("=== POBLANDO FILTROS CON DATOS REALES ===");

    // 1. Verificar elementos del DOM
    const projectSelect = document.getElementById('timeTrackingProject');
    const assigneeSelect = document.getElementById('timeTrackingAssignee');

    if (!projectSelect || !assigneeSelect) {
        console.error("❌ NO SE ENCONTRARON LOS ELEMENTOS DEL DOM");
        console.groupEnd();
        return;
    }

    // 2. Limpiar selectores
    projectSelect.innerHTML = '<option value="all">Todos</option>';
    assigneeSelect.innerHTML = '<option value="all">Todos</option>';

    // 3. Verificar datos globales
    console.log("window.projects:", window.projects);
    console.log("window.currentProjectIndex:", window.currentProjectIndex);

    if (!window.projects || !Array.isArray(window.projects)) {
        console.error("❌ window.projects NO ES UN ARRAY VÁLIDO");
        console.groupEnd();
        return;
    }

    // 4. Extraer datos únicos
    const uniqueProjects = new Set();
    const uniqueAssignees = new Set();

    window.projects.forEach((project, index) => {
        console.log(`Procesando proyecto ${index}:`, project?.name);
        if (project && project.name) {
            uniqueProjects.add(project.name);
        }
        if (project && project.tasks && Array.isArray(project.tasks)) {
            project.tasks.forEach((task, taskIndex) => {
                console.log(`  Tarea ${taskIndex}:`, task?.assignee);
                if (task && task.assignee) {
                    uniqueAssignees.add(task.assignee);
                }
            });
        }
    });

    console.log("Proyectos únicos encontrados:", Array.from(uniqueProjects));
    console.log("Asignados únicos encontrados:", Array.from(uniqueAssignees));

    // 5. Poblar selectores
    uniqueProjects.forEach(projectName => {
        const option = new Option(projectName, projectName);
        projectSelect.appendChild(option);
        console.log(`✅ Proyecto agregado: ${projectName}`);
    });

    uniqueAssignees.forEach(assignee => {
        const option = new Option(assignee, assignee);
        assigneeSelect.appendChild(option);
        console.log(`✅ Asignado agregado: ${assignee}`);
    });

    console.log("✅ FILTROS POBLADOS CON DATOS REALES");
    console.groupEnd();
}

// === FUNCIÓN AUXILIAR PROPUESTA ===
function initializeTimeTrackingOnDashboard() {
    console.log("=== Solicitando inicialización de seguimiento de horas ===");

    // Intentar inmediatamente
    if (document.getElementById('timeTrackingProject') && document.getElementById('timeTrackingAssignee')) {
        console.log("Elementos del DOM encontrados, inicializando...");
        initTimeTrackingFilters(); // O la función que realmente pobla tus filtros
        return;
    }

    // Si no están, esperar un poco más
    console.log("Elementos del DOM no encontrados, reintentando en 200ms...");
    setTimeout(() => {
        if (document.getElementById('timeTrackingProject') && document.getElementById('timeTrackingAssignee')) {
            console.log("Elementos del DOM encontrados en segundo intento, inicializando...");
            initTimeTrackingFilters(); // O la función que realmente pobla tus filtros
        } else {
            console.error("❌ Elementos del DOM aún no encontrados después de esperar. ¿Está el contenido del dashboard cargado?");
        }
    }, 200);
}
// === FIN FUNCIÓN AUXILIAR ===

// Asegúrate de que esto esté al final, o que se llame después de que se defina initializeTimeTrackingOnDashboard
// document.addEventListener('DOMContentLoaded', ... ) o window.onload = ...


function formatDate(dateString) {
  if (!dateString) return '--/--/--';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '--/--/--';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function showTimeAllocationView() {
    console.log("Mostrando vista de Asignación de Horas");
    // Ocultar otras vistas
    document.querySelectorAll('.view-content').forEach(view => view.classList.add('hidden'));
    // Mostrar esta vista
    document.getElementById('timeAllocationView').classList.remove('hidden');
    
    // Inicializar contenido
    initializeTimeAllocationView();
}

// Función auxiliar para inicializar la vista (poblar filtros, etc.)
function initializeTimeAllocationView() {
    console.log("Inicializando vista de Asignación de Horas...");
    populateTimeAllocationFilters();
    // Cargar datos iniciales (sin filtros)
    loadTimeAllocationData();
}

// === VISTA: Asignación de Horas ===

// Función auxiliar para obtener el nombre del mes
function getMonthName(monthNumber) {
    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const index = parseInt(monthNumber, 10) - 1;
    return months[index] || "Desconocido";
}

function populateTimeAllocationFilters() {
    console.log("🔄 Poblando filtros de Asignación de Horas...");
    
    // 1. Obtener elementos del DOM
    const yearSelect = document.getElementById('filterTimeAllocationYear');
    const monthSelect = document.getElementById('filterTimeAllocationMonth');
    const projectSelect = document.getElementById('filterTimeAllocationProject');
    const assigneeSelect = document.getElementById('filterTimeAllocationAssignee');

    // 2. Limpiar selectores
    if (yearSelect) yearSelect.innerHTML = '<option value="all">Todos</option>';
    if (monthSelect) monthSelect.innerHTML = '<option value="all">Todos</option>';
    if (projectSelect) projectSelect.innerHTML = '<option value="all">Todos</option>';
    if (assigneeSelect) assigneeSelect.innerHTML = '<option value="all">Todos</option>';

    // 3. Verificar datos globales
    if (!projects || !Array.isArray(projects) || projects.length === 0) {
        console.warn("⚠️ No hay datos de proyectos para poblar los filtros.");
        return;
    }

    // 4. Recopilar valores únicos
    const yearsSet = new Set();
    const monthsSet = new Set();
    const projectsSet = new Set();
    const assigneesSet = new Set();

    projects.forEach(project => {
        projectsSet.add(project.name);
        if (project.tasks && Array.isArray(project.tasks)) {
            project.tasks.forEach(task => {
                // Extraer años y meses de las fechas de registro (timeLoggedEntries)
                if (task.timeLoggedEntries && Array.isArray(task.timeLoggedEntries)) {
                    task.timeLoggedEntries.forEach(entry => {
                        if (entry.date) {
                            const date = new Date(entry.date);
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0'); // Mes en formato MM
                            if (!isNaN(year)) yearsSet.add(year);
                            monthsSet.add(month);
                        }
                    });
                } else {
                    // Fallback si no hay timeLoggedEntries estructurados
                    const startDate = task.startDate ? new Date(task.startDate) : null;
                    const deadline = task.deadline ? new Date(task.deadline) : null;
                    if (startDate) {
                        const year = startDate.getFullYear();
                        const month = String(startDate.getMonth() + 1).padStart(2, '0');
                        if (!isNaN(year)) yearsSet.add(year);
                        monthsSet.add(month);
                    }
                    if (deadline) {
                        const year = deadline.getFullYear();
                        const month = String(deadline.getMonth() + 1).padStart(2, '0');
                        if (!isNaN(year)) yearsSet.add(year);
                        monthsSet.add(month);
                    }
                }

                if (task.assignee && task.assignee.trim() !== '') {
                    assigneesSet.add(task.assignee.trim());
                }
            });
        }
    });

    console.log("📊 Valores encontrados:", { years: Array.from(yearsSet), months: Array.from(monthsSet), projects: Array.from(projectsSet), assignees: Array.from(assigneesSet) });

    // 5. Poblar selectores
    // Poblar años
    if (yearSelect && yearsSet.size > 0) {
        Array.from(yearsSet).sort((a, b) => b - a).forEach(year => {
            const option = new Option(year, year);
            yearSelect.appendChild(option);
            console.log(`✅ Año agregado: ${year}`);
        });
    } else if (yearSelect) {
        console.log("ℹ️ No hay años para agregar.");
    }

    // Poblar meses
    if (monthSelect && monthsSet.size > 0) {
        // Ordenar meses numéricamente antes de convertir a nombres
        const sortedMonths = Array.from(monthsSet).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
        sortedMonths.forEach(month => {
            const option = new Option(getMonthName(month), month);
            monthSelect.appendChild(option);
            console.log(`✅ Mes agregado: ${getMonthName(month)} (${month})`);
        });
    } else if (monthSelect) {
        console.log("ℹ️ No hay meses para agregar.");
    }

    // Poblar proyectos
    if (projectSelect && projectsSet.size > 0) {
        Array.from(projectsSet).sort().forEach(projectName => {
            const option = new Option(projectName, projectName);
            projectSelect.appendChild(option);
            console.log(`✅ Proyecto agregado: ${projectName}`);
        });
    } else if (projectSelect) {
        console.log("ℹ️ No hay proyectos para agregar.");
    }

    // Poblar asignados
    if (assigneeSelect && assigneesSet.size > 0) {
        Array.from(assigneesSet).sort().forEach(assignee => {
            const option = new Option(assignee, assignee);
            assigneeSelect.appendChild(option);
            console.log(`✅ Asignado agregado: ${assignee}`);
        });
    } else if (assigneeSelect) {
        console.log("ℹ️ No hay asignados para agregar.");
    }

    console.log("✅ Filtros de Asignación de Horas poblados.");
}

// Función para obtener filtros actuales
function getCurrentTimeAllocationFilters() {
    return {
        year: document.getElementById('filterTimeAllocationYear')?.value || 'all',
        month: document.getElementById('filterTimeAllocationMonth')?.value || 'all',
        project: document.getElementById('filterTimeAllocationProject')?.value || 'all',
        assignee: document.getElementById('filterTimeAllocationAssignee')?.value || 'all'
    };
}

// Función para mostrar la vista (debe ser llamada cuando se muestra la vista)
function showTimeAllocationView() {
    console.log(" Mostrando vista de Asignación de Horas");
    // Ocultar otras vistas
    document.querySelectorAll('.view-content').forEach(view => view.classList.add('hidden'));
    // Mostrar esta vista
    const viewElement = document.getElementById('timeAllocationView');
    if (viewElement) {
        viewElement.classList.remove('hidden');
        console.log("✅ Vista de Asignación de Horas mostrada.");
        
        // Inicializar contenido
        initializeTimeAllocationView();
    } else {
        console.error("❌ Elemento 'timeAllocationView' no encontrado en el DOM.");
    }
}

// Función auxiliar para inicializar la vista
function initializeTimeAllocationView() {
    console.log("🔄 Inicializando vista de Asignación de Horas...");
    populateTimeAllocationFilters();
    // Cargar datos iniciales (sin filtros)
    loadTimeAllocationData();
}

// Función para cargar y mostrar los datos
function loadTimeAllocationData() {
    console.log("📊 Cargando datos para el reporte de Asignación de Horas...");
    const filters = getCurrentTimeAllocationFilters();
    console.log("🔍 Filtros aplicados:", filters);

    // 1. Recopilar y procesar datos de todas las tareas de todos los proyectos
    let allTimeEntries = [];
    if (!projects || !Array.isArray(projects)) {
        console.warn("⚠️ Datos de proyectos no disponibles.");
        renderTimeAllocationTable([]);
        renderTimeAllocationChart([]);
        return;
    }

    projects.forEach(project => {
        const projectName = project.name;
        if (project.tasks && Array.isArray(project.tasks)) {
            project.tasks.forEach(task => {
                const assignee = task.assignee || 'Sin asignar';
                
                if (task.timeLoggedEntries && Array.isArray(task.timeLoggedEntries)) {
                    task.timeLoggedEntries.forEach(entry => {
                        if (entry.hours > 0) {
                            allTimeEntries.push({
                                projectName: projectName,
                                assignee: assignee,
                                date: entry.date ? new Date(entry.date) : new Date(),
                                hours: parseFloat(entry.hours) || 0
                            });
                        }
                    });
                } else if (task.timeLogged > 0) {
                    const fallbackDateStr = task.startDate || task.deadline || new Date().toISOString();
                    const fallbackDate = new Date(fallbackDateStr);
                    allTimeEntries.push({
                        projectName: projectName,
                        assignee: assignee,
                        date: fallbackDate,
                        hours: parseFloat(task.timeLogged) || 0
                    });
                }
            });
        }
    });

    console.log("📥 Entradas de tiempo recopiladas:", allTimeEntries);

    // 2. Filtrar datos
    const filteredData = allTimeEntries.filter(entry => {
        if (filters.year !== 'all' && entry.date.getFullYear() != filters.year) {
            return false;
        }
        if (filters.month !== 'all' && String(entry.date.getMonth() + 1).padStart(2, '0') !== filters.month) {
            return false;
        }
        if (filters.project !== 'all' && entry.projectName !== filters.project) {
            return false;
        }
        if (filters.assignee !== 'all' && entry.assignee !== filters.assignee) {
            return false;
        }
        return true;
    });

    console.log("📊 Datos filtrados:", filteredData);

    // 3. Agrupar y sumar por Asignado, Proyecto y Mes
    const groupedData = {};
    filteredData.forEach(entry => {
        const monthKey = `${entry.date.getFullYear()}-${String(entry.date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
        const key = `${entry.assignee}|${entry.projectName}|${monthKey}`;

        if (!groupedData[key]) {
            groupedData[key] = {
                assignee: entry.assignee,
                projectName: entry.projectName,
                month: monthKey, // YYYY-MM
                monthName: entry.date.toLocaleString('es-ES', { month: 'long', year: 'numeric' }), // Ej: "enero 2024"
                totalHours: 0
            };
        }
        groupedData[key].totalHours += entry.hours;
    });

    const finalData = Object.values(groupedData);
    console.log("🧮 Datos agrupados y sumados:", finalData);

    // 4. Renderizar tabla y gráfico
    renderTimeAllocationTable(finalData);
    renderTimeAllocationChart(finalData);
}

function renderTimeAllocationTable(data) {
    const tbody = document.getElementById('timeAllocationTableBody');
    if (!tbody) {
        console.error("❌ Elemento 'timeAllocationTableBody' no encontrado.");
        return;
    }

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No hay datos para mostrar con los filtros seleccionados.</td></tr>';
        console.log("📭 Tabla vacía (sin datos).");
        return;
    }

    tbody.innerHTML = data.map(item => `
        <tr>
            <td>${item.assignee}</td>
            <td>${item.projectName}</td>
            <td>${item.monthName}</td>
            <td>${item.totalHours.toFixed(2)}</td>
        </tr>
    `).join('');
    console.log("✅ Tabla de Asignación de Horas actualizada.");
}

function renderTimeAllocationChart(data) {
    const canvas = document.getElementById('timeAllocationChart');
    const ctx = canvas ? canvas.getContext('2d') : null;
    if (!ctx) {
        console.error("❌ Canvas 'timeAllocationChart' no encontrado.");
        return;
    }

    // Destruir instancia anterior si existe
    if (window.timeAllocationChartInstance) {
        window.timeAllocationChartInstance.destroy();
        console.log("🗑️ Instancia anterior de gráfico destruida.");
    }

    if (data.length === 0) {
        // Reemplazar canvas con mensaje
        const container = canvas.closest('.time-allocation-chart-container');
        if (container) {
            container.innerHTML = '<p style="text-align:center; color: #6c757d;">No hay datos para mostrar en el gráfico.</p>';
        }
        console.log("📭 Gráfico vacío (sin datos).");
        return;
    }

    // Preparar datos para Chart.js (ejemplo: Horas totales por asignado)
    const assigneeHours = {};
    data.forEach(item => {
        if (!assigneeHours[item.assignee]) {
            assigneeHours[item.assignee] = 0;
        }
        assigneeHours[item.assignee] += item.totalHours;
    });

    const labels = Object.keys(assigneeHours);
    const chartData = Object.values(assigneeHours);

    window.timeAllocationChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Horas Totales Registradas',
                data: chartData,
                backgroundColor: 'rgba(52, 152, 219, 0.7)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Horas'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Asignado'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Horas Totales por Asignado (Filtradas)'
                }
            }
        }
    });
    console.log("📊 Gráfica de Asignación de Horas actualizada.");
}

document.getElementById('applyTimeAllocationFiltersBtn')?.addEventListener('click', function () {
    loadTimeAllocationData();
});


function calculateProjectDatesFromTasks(project) {
    let earliestDate = null;
    let latestDate = null;

    project.tasks.forEach(task => {
        if (task.startDate && (!earliestDate || task.startDate < earliestDate)) {
            earliestDate = task.startDate;
        }
        if (task.deadline && (!latestDate || task.deadline > latestDate)) {
            latestDate = task.deadline;
        }
    });

    return { earliestDate, latestDate };
}


function updateMilestonesStatus() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    document.querySelectorAll('#milestonesList .milestone-item').forEach(item => {
        const dateStr = item.dataset.date;
        if (!dateStr) return;

        const milestoneDate = new Date(dateStr);
        milestoneDate.setHours(0, 0, 0, 0);

        // Limpiar clases anteriores
        item.classList.remove('upcoming', 'current', 'overdue');

        // Determinar nuevo estado
        if (milestoneDate < today) {
            item.classList.add('overdue');
        } else if (milestoneDate.toDateString() === today.toDateString()) {
            item.classList.add('current');
        } else {
            item.classList.add('upcoming');
        }
    });
}

// Ejecutar diariamente o al iniciar la aplicación
setInterval(updateMilestonesStatus, 86400000); // Actualiza cada 24 horas
updateMilestonesStatus(); // Ejecutar inmediatamente al cargar


// Al final de tu archivo JS o en el DOMContentLoaded:
document.addEventListener('DOMContentLoaded', function() {
    // Configurar botón de agregar hito
    document.getElementById('addMilestoneBtn')?.addEventListener('click', function() {
        const name = prompt("Nombre del hito:");
        if (!name || name.trim() === "") return;

        const dateStr = prompt("Fecha del hito (YYYY-MM-DD):");
        if (!dateStr) return;

        if (!isValidDate(dateStr)) {
            showNotification("Formato de fecha inválido. Use YYYY-MM-DD");
            return;
        }

        addMilestoneToList(name, dateStr);
        showNotification("Hito agregado correctamente");
    });

    // Actualizar estados cada 24 horas
    setInterval(updateMilestonesStatus, 86400000);
    updateMilestonesStatus(); // Ejecutar inmediatamente
});

// Función de validación de fecha (añadir si no existe)
function isValidDate(dateString) {
    const regEx = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateString.match(regEx)) return false;
    const d = new Date(dateString);
    return !isNaN(d.getTime());
}

// ================== RESPALDO LOCAL A ARCHIVO JSON ==================

// Botón: Descargar respaldo
document.getElementById('backupToLocal')?.addEventListener('click', function () {
    try {
        // Obtener los proyectos actuales
        const projects = JSON.parse(localStorage.getItem('projects')) || [];

        // Si no hay proyectos, avisar
        if (projects.length === 0) {
            showNotification('No hay proyectos para respaldar');
            return;
        }

        // Crear un objeto con fecha de respaldo
        const backupData = {
            version: "1.0",
            backupDate: new Date().toISOString(),
            projects: projects
        };

        // Convertir a texto
        const dataStr = JSON.stringify(backupData, null, 2);

        // Crear un blob (archivo)
        const blob = new Blob([dataStr], { type: 'application/json' });

        // Crear una URL temporal
        const url = URL.createObjectURL(blob);

        // Crear un enlace y hacer clic para descargar
        const a = document.createElement('a');
        a.href = url;
        a.download = `proyectos-respaldo-${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        // Liberar la URL
        URL.revokeObjectURL(url);

        // Mostrar mensaje
        document.getElementById('backupStatus').textContent = '✅ Respaldo descargado';
        setTimeout(() => document.getElementById('backupStatus').textContent = '', 3000);
        showNotification('Respaldo guardado en tu dispositivo');

    } catch (err) {
        console.error('Error al crear respaldo:', err);
        document.getElementById('backupStatus').textContent = '❌ Error al respaldar';
        showNotification('Error al crear el respaldo');
    }
});

// Botón: Cargar desde archivo
document.getElementById('restoreFromLocal')?.addEventListener('click', function () {
    // Crear un input de tipo archivo
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (event) {
            try {
                // Leer el contenido del archivo
                const data = JSON.parse(event.target.result);

                // Validar que tenga la estructura correcta
                if (!data.projects || !Array.isArray(data.projects)) {
                    throw new Error('Formato de archivo inválido');
                }

                // Guardar en localStorage
                localStorage.setItem('projects', JSON.stringify(data.projects));

                // Actualizar la variable global
                window.projects = data.projects;

                // Mostrar mensaje
                document.getElementById('backupStatus').textContent = '✅ Datos cargados';
                setTimeout(() => document.getElementById('backupStatus').textContent = '', 3000);
                showNotification(`✅ ${data.projects.length} proyectos cargados`);

                // Recargar la vista actual
                location.reload();

            } catch (err) {
                console.error('Error al cargar archivo:', err);
                document.getElementById('backupStatus').textContent = '❌ Archivo inválido';
                showNotification('❌ Error: Archivo no válido');
            }
        };
        reader.readAsText(file);
    };

    // Simular clic en el input
    input.click();
});


// === GESTIÓN DE PRÓXIMOS HITOS ===

document.getElementById('addMilestoneBtn')?.addEventListener('click', addNewMilestone);

// Función para agregar nuevo hito
function addNewMilestone() {
  const name = prompt("Nombre del hito:");
  if (!name || name.trim() === "") return;

  const dateStr = prompt("Fecha del hito (YYYY-MM-DD):");
  if (!dateStr) return;

  // Validar formato de fecha
  if (!isValidDate(dateStr)) {
    showNotification("Formato de fecha inválido. Use YYYY-MM-DD");
    return;
  }

  addMilestoneToList(name, dateStr);
  saveMilestonesToLocalStorage();
}

// Función para validar fecha
function isValidDate(dateString) {
  const regEx = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateString.match(regEx)) return false;
  const d = new Date(dateString);
  return !isNaN(d.getTime());
}

// Función para agregar hito a la lista
function addMilestoneToList(name, dateStr) {
  const milestonesList = document.getElementById('milestonesList');
  if (!milestonesList) return;

  const formattedDate = formatDateForDisplay(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const milestoneDate = new Date(dateStr);
  milestoneDate.setHours(0, 0, 0, 0);

  const milestoneItem = document.createElement('div');
  let statusClass = 'upcoming';
  
  if (milestoneDate < today) {
    statusClass = 'overdue';
  } else if (milestoneDate.toDateString() === today.toDateString()) {
    statusClass = 'current';
  }

  milestoneItem.className = `milestone-item ${statusClass}`;
  milestoneItem.dataset.date = dateStr;
  
  milestoneItem.innerHTML = `
    <span class="milestone-date">${formattedDate}</span>
    <span class="milestone-name">${name}</span>
    <button class="milestone-remove" onclick="removeMilestone(this)">
      <i class="fas fa-trash-alt"></i>
    </button>
  `;

  milestonesList.appendChild(milestoneItem);
}

// Función para formatear fecha para visualización
function formatDateForDisplay(dateStr) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateStr).toLocaleDateString('es-ES', options);
}

// Función para eliminar hito
function removeMilestone(button) {
  if (confirm("¿Eliminar este hito?")) {
    button.closest('.milestone-item').remove();
    saveMilestonesToLocalStorage();
    showNotification("Hito eliminado");
  }
}

// Guardar hitos en localStorage
function saveMilestonesToLocalStorage() {
  const milestones = [];
  document.querySelectorAll('#milestonesList .milestone-item').forEach(item => {
    milestones.push({
      name: item.querySelector('.milestone-name').textContent,
      date: item.dataset.date
    });
  });
  
  localStorage.setItem('projectMilestones', JSON.stringify(milestones));
}

// Cargar hitos desde localStorage
function loadMilestonesFromLocalStorage() {
  const savedMilestones = JSON.parse(localStorage.getItem('projectMilestones')) || [];
  const milestonesList = document.getElementById('milestonesList');
  
  if (milestonesList) {
    milestonesList.innerHTML = '';
    savedMilestones.forEach(milestone => {
      addMilestoneToList(milestone.name, milestone.date);
    });
  }
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  loadMilestonesFromLocalStorage();
  
  // Asegurar que el botón tenga el event listener
  const addBtn = document.getElementById('addMilestoneBtn');
  if (addBtn) {
    addBtn.addEventListener('click', addNewMilestone);
  }
});


function applyDashboardModeStyles(mode) {
  const dashboard = document.getElementById('dashboardView');
  if (!dashboard) return;

  dashboard.classList.remove('mode-agile', 'mode-traditional', 'mode-hybrid');
  dashboard.classList.add('mode-' + mode);

// === AÑADE ESTA LÍNEA ===
  highlightRelevantSections(mode);
  // =========================

  
  // Actualizar indicador visual
  const modeIndicator = document.getElementById('modeIndicator');
  const modeText = document.getElementById('currentModeText');
  
  if (modeIndicator && modeText) {
    const modeNames = {
      'agile': 'Ágil',
      'traditional': 'Tradicional',
      'hybrid': 'Híbrido'
    };
    
    modeIndicator.style.display = 'block';
    modeIndicator.className = `mode-indicator ${mode}`;
    modeText.textContent = modeNames[mode];
  }
}


document.addEventListener('DOMContentLoaded', function () {
  // Inicializa el manager
  window.methodologyManager = new MethodologyManager();


// === AQUÍ VA EL EVENTO DEL SELECTOR ===
  const selector = document.getElementById('methodologySelector');
  if (selector) {
    selector.addEventListener('change', function () {
      const mode = this.value;
      window.methodologyManager.setMode(mode);
      applyDashboardModeStyles(mode); // Aplica estilos visuales
  addModeTooltips(mode); // 👈 Añadido
   updateModeIndicator(mode); // 👈 Añade esta línea
  updateModeHelpText(mode);
     updateDashboardTitle(mode);
    });
  }

  // Aplica el modo guardado
  window.methodologyManager.setMode(window.methodologyManager.currentMode);

  // Asegúrate de que el dashboard esté visible
  setTimeout(() => {
    highlightRelevantSections(window.methodologyManager.currentMode);
  }, 100);
});


// === ACTUALIZAR INDICADOR DE MODO ===
function updateModeIndicator(mode) {
  const indicator = document.getElementById('modeIndicator');
  const icon = indicator.querySelector('i');
  const modeText = document.getElementById('currentModeText');
  
  if (!indicator || !icon || !modeText) return;

  // Resetear clases
  indicator.classList.remove('mode-indicator-agile', 'mode-indicator-traditional', 'mode-indicator-hybrid');

  // Configurar icono y texto por modo
  const config = {
    agile: {
      icon: 'fa-bolt',
      text: 'Ágil',
      class: 'mode-indicator-agile'
    },
    traditional: {
      icon: 'fa-tasks',
      text: 'Tradicional',
      class: 'mode-indicator-traditional'
    },
    hybrid: {
      icon: 'fa-sync-alt',
      text: 'Híbrido',
      class: 'mode-indicator-hybrid'
    }
  };

  const c = config[mode];
  icon.className = 'fas ' + c.icon;
  modeText.textContent = c.text;
  indicator.classList.add(c.class);
}



// === ACTUALIZAR MENSAJE DE AYUDA POR MODO ===
function updateModeHelpText(mode) {
  const helpText = document.getElementById('modeHelpMessage');
  if (!helpText) return;

  const messages = {
    agile: "En modo Ágil, el enfoque está en lo completado: tareas finalizadas y tiempo registrado.",
    traditional: "En modo Tradicional, el enfoque está en el control: tareas rezagadas y tiempo restante.",
    hybrid: "En modo Híbrido, se muestra una visión completa: avance, riesgos y control de tiempo."
  };

  helpText.textContent = messages[mode];

  // Cambiar color del borde según el modo
  const panel = document.querySelector('.mode-help-text');
  if (mode === 'agile') {
    panel.style.borderLeftColor = '#4caf50'; // Verde
  } else if (mode === 'traditional') {
    panel.style.borderLeftColor = '#2196f3'; // Azul
  } else {
    panel.style.borderLeftColor = '#9c27b0'; // Morado
  }
}


// === ACTUALIZAR TÍTULO DINÁMICO POR MODO ===
function updateDashboardTitle(mode) {
  const title = document.getElementById('dashboardTitle');
  if (!title) return;

  const titles = {
    agile: {
      main: '🚀 Avance del Proyecto',
      sub: 'Enfocado en entregas y productividad'
    },
    traditional: {
      main: '📅 Control del Proyecto',
      sub: 'Enfocado en cronograma y riesgos'
    },
    hybrid: {
      main: '🔁 Vista Completa del Proyecto',
      sub: 'Combina avance y control'
    }
  };

  const t = titles[mode];
  title.innerHTML = `<strong>${t.main}</strong><br><small>${t.sub}</small>`;
}


// === CREAR Y MOSTRAR TOOLTIPS DINÁMICOS ===
function addModeTooltips(mode) {
  // Definir mensajes por modo
  const tooltips = {
    agile: {
      '#completedTasksMetric': 'En modo Ágil, el progreso se mide por lo completado: tareas finalizadas.',
      '#totalLoggedDash': 'El tiempo registrado muestra productividad real del equipo.',
      '#tasksDistributionChart': 'Muestra balance entre tareas pendientes, en progreso y completadas.'
    },
    traditional: {
      '#overdueTasksMetric': 'Las tareas rezagadas indican riesgos de cronograma.',
      '#remainingTimeDash': 'El tiempo restante es clave para cumplir el plan original.',
      '#tasksDistributionChart': 'Muestra avance frente al plan establecido.'
    },
    hybrid: {
     '#completedTasksMetric': 'Parte del enfoque en productividad (Ágil)',
      '#overdueTasksMetric': 'Parte del enfoque en control de riesgos (Tradicional).',
      '#tasksDistributionChart': 'Visión general del estado del proyecto.'
    }
  };

  // Limpiar tooltips anteriores
  document.querySelectorAll('.tooltip').forEach(t => t.remove());

  // Agregar tooltips según el modo
  Object.keys(tooltips[mode]).forEach(selector => {
    const element = document.querySelector(selector);
    if (!element) return;

    // Crear tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = tooltips[mode][selector].trim();

    // Mostrar al pasar el mouse
    element.addEventListener('mouseenter', (e) => {
      document.body.appendChild(tooltip);
      const rect = element.getBoundingClientRect();
      tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
      tooltip.style.left = `${rect.left + rect.width / 2}px`;
      tooltip.style.transform = 'translateX(-50%)';
      tooltip.style.opacity = '1';
    });

    // Ocultar al salir
    element.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
      setTimeout(() => tooltip.remove(), 300);
    });
  });
}


/**************************************
 * SISTEMA COMPLETO DE PERSISTENCIA *
 **************************************/

// Función para sincronizar con backend cada 30 segundos
function startAutoSync() {
    setInterval(async () => {
        if (useBackend) {
            try {
                await safeSave();
                console.log('🔄 Auto-sincronización completada');
            } catch (error) {
                console.warn('⚠️ Error en auto-sincronización:', error.message);
            }
        }
    }, 30000); // 30 segundos
}

// Función para forzar sincronización manual
async function forceSync() {
    console.group('🔄 SINCRONIZACIÓN MANUAL');
    const success = await safeSave();
    if (success) {
        showNotification('✅ Datos sincronizados correctamente');
    } else {
        showNotification('⚠️ Sincronización fallida, usando modo local');
    }
    console.groupEnd();
}

// Función para verificar estado de conexión
function checkConnectionStatus() {
    console.group('📡 ESTADO DE CONEXIÓN');
    console.log('🔗 Backend:', useBackend ? '✅ Conectado' : '❌ Desconectado');
    console.log('💾 localStorage:', '✅ Siempre disponible');
    console.log('📦 Proyectos en memoria:', projects.length);
    console.log('🔄 Última sincronización:', new Date().toLocaleTimeString());
    console.groupEnd();
    
    return useBackend;
}

// Agregar botón de sincronización manual si no existe
function addSyncButton() {
    // Verificar si ya existe el botón
    if (document.getElementById('syncButton')) return;
    
    // Crear botón de sincronización
    const syncButton = document.createElement('button');
    syncButton.id = 'syncButton';
    syncButton.innerHTML = '🔄 Sincronizar';
    syncButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        padding: 10px 15px;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
    `;
    syncButton.onclick = forceSync;
    
    document.body.appendChild(syncButton);
    console.log('✅ Botón de sincronización agregado');
}

// Iniciar todo el sistema de persistencia
function initPersistenceSystem() {
    console.group('🚀 INICIANDO SISTEMA DE PERSISTENCIA');
    
    // 1. Agregar botón de sincronización
    addSyncButton();
    
    // 2. Iniciar auto-sincronización
    startAutoSync();
    
     // 3. Verificar estado inicial
    checkConnectionStatus();
    
    console.log('✅ Sistema de persistencia completamente operativo');
    console.groupEnd();
}

// === LISTENER GLOBAL PARA EL BOTÓN DE MENÚ (funciona siempre) ===
document.addEventListener('DOMContentLoaded', () => {
  const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
  const sidebar = document.querySelector('aside');

  if (toggleSidebarBtn && sidebar) {
    toggleSidebarBtn.addEventListener('click', () => {
      sidebar.classList.toggle('hidden');
   // ... tu código anterior ...
});
});
// EOF