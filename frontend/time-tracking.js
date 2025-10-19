class TimeTracking {
    constructor() {
        this.allData = []; // Almacena TODOS los proyectos
        this.filteredData = []; // Datos filtrados actuales
        this.currentProjectId = null; // Proyecto seleccionado en el menú
        this.init();
    }

    async init() {
        await this.loadAllProjectsData();
        this.setupGlobalListeners();
        this.populateFilters();
        this.applyFilters();
    }

    async loadAllProjectsData() {
        try {
            // 1. Cargar TODOS los proyectos sin filtrar
            const response = await fetch('/api/all-time-entries'); // Endpoint que devuelve todo
            this.allData = await response.json();
            
            console.log('Datos completos cargados:', this.allData);
            
        } catch (error) {
            console.error('Error cargando datos:', error);
            this.loadSampleData();
        }
    }

    setupGlobalListeners() {
        // 1. Listener para filtros
        document.getElementById('applyTimeTrackingFilters').addEventListener('click', () => {
            this.applyFilters();
        });
        
        // 2. Listener para selección de proyecto en menú lateral
        document.querySelectorAll('.project-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.currentProjectId = e.target.dataset.projectId;
                this.applyFilters();
            });
        });
    }

    applyFilters() {
        // 1. Obtener filtros del formulario
        const formFilters = this.getFormFilters();
        
        // 2. Aplicar filtro de proyecto (prioridad al menú lateral)
        const projectFilter = this.currentProjectId || formFilters.project;
        
        // 3. Filtrar datos
        this.filteredData = this.allData.filter(entry => {
            const matchesProject = projectFilter === 'all' || entry.projectId == projectFilter;
            const matchesAssignee = formFilters.assignee === 'all' || entry.assigneeId == formFilters.assignee;
            // ... otros filtros
            
            return matchesProject && matchesAssignee;
        });
        
        // 4. Actualizar UI
        this.updateUI();
    }

    getFormFilters() {
        return {
            project: document.getElementById('timeTrackingProject').value,
            assignee: document.getElementById('timeTrackingAssignee').value,
            // ... otros filtros
        };
    }

    updateUI() {
        this.updateTable(this.filteredData);
        this.updateChart(this.filteredData);
        this.updateProjectHeader();
    }

    updateProjectHeader() {
        if (this.currentProjectId) {
            const project = this.allData.find(p => p.id == this.currentProjectId);
            document.getElementById('current-project-title').textContent = project?.name || 'Proyecto actual';
        } else {
            document.getElementById('current-project-title').textContent = 'Todos los proyectos';
        }
    }

    // ... (otros métodos permanecen igual)
}

// Inicialización
new TimeTracking();