export type Language = 'en-US' | 'pt-BR' | 'es-LA';

export interface Translations {
  // Navigation & Sections
  core: string;
  academic: string;
  teaching: string;
  operations: string;
  admin: string;
  dashboard: string;
  calendar: string;
  students: string;
  groups: string;
  collections: string;
  teacherPortal: string;
  finance: string;
  occurrences: string;
  tasks: string;
  meetings: string;
  staff: string;
  preferences: string;
  chat: string;
  staffChat: string;

  // Header & General UI
  timetable: string;
  loggedInAs: string;
  switchTheme: string;
  notifications: string;
  searchPlaceholder: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  add: string;
  close: string;
  back: string;
  clear: string;
  all: string;
  actions: string;
  status: string;
  date: string;
  time: string;
  hours: string;
  overview: string;

  // Auto-Save UI
  draftAutoSaved: string;
  savingChanges: string;
  allChangesSaved: string;
  saveNow: string;
  restoreDraft: string;

  // Dashboard & Schedules
  pedagogicalPlanner: string;
  separateSchedules: string;
  masterGrid: string;
  filterTeachers: string;
  allTeachers: string;
  studyGroupsPool: string;
  dragDropInstructions: string;
  teachingLoad: string;
  weeklyTimetable: string;
  scheduleSync: string;
  addMeeting: string;
  addClass: string;
  freeSlot: string;
  dropHereToSchedule: string;

  // Conflict Warning
  conflictDetectedTitle: string;
  conflictWarningDesc: string;
  conflictWithGroup: string;
  conflictWithMeeting: string;
  proceedAnyway: string;
  chooseDifferentTime: string;

  // Group Time & Selected Clock Item
  selectedGroupTime: string;
  persistentGroupTimeDesc: string;
  clockTimePresets: string;
  customTime: string;
  applyDefaultTime: string;

  // Occurrences
  occurrencesTitle: string;
  occurrencesDesc: string;
  logOccurrence: string;
  editOccurrence: string;
  studentName: string;
  occurrenceType: string;
  academicType: string;
  behaviorType: string;
  attendanceType: string;
  administrativeType: string;
  description: string;
  reportedBy: string;
  resolutionNotes: string;
  open: string;
  resolved: string;

  // Preferences & System
  systemPreferences: string;
  systemPreferencesDesc: string;
  profilePicture: string;
  uploadCustomPhoto: string;
  languageAndRegion: string;
  displayTheme: string;
  darkMode: string;
  lightMode: string;
  systemBackup: string;
  exportBackup: string;
  restoreBackup: string;
  saveConfiguration: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  'en-US': {
    core: 'Core',
    academic: 'Academic',
    teaching: 'Teaching',
    operations: 'Operations',
    admin: 'Admin',
    dashboard: 'Dashboard',
    calendar: 'Calendar',
    students: 'Students',
    groups: 'Groups',
    collections: 'Collections',
    teacherPortal: 'Teacher Portal',
    finance: 'Financials',
    occurrences: 'Occurrences',
    tasks: 'Tasks',
    meetings: 'Meetings',
    staff: 'Staff Manager',
    preferences: 'Preferences',
    chat: 'Staff Chat',
    staffChat: 'Staff Chat',

    timetable: 'Timetable',
    loggedInAs: 'Logged in as',
    switchTheme: 'Switch Theme',
    notifications: 'Notifications',
    searchPlaceholder: 'Search...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    close: 'Close',
    back: 'Back',
    clear: 'Clear',
    all: 'All',
    actions: 'Actions',
    status: 'Status',
    date: 'Date',
    time: 'Time',
    hours: 'Hours',
    overview: 'Overview',

    draftAutoSaved: 'Draft auto-saved every 30s',
    savingChanges: 'Saving draft...',
    allChangesSaved: 'Draft saved securely',
    saveNow: 'Save Now',
    restoreDraft: 'Restore Draft',

    pedagogicalPlanner: 'Teacher Schedules & Pedagogical Timetable',
    separateSchedules: 'Separate Teacher Schedules',
    masterGrid: '7-Day Master Grid',
    filterTeachers: 'Filter Teachers:',
    allTeachers: 'All Teachers',
    studyGroupsPool: 'Study Groups Pool',
    dragDropInstructions: 'Drag groups into any teacher slot or timetable grid cell.',
    teachingLoad: 'Weekly Load',
    weeklyTimetable: 'Weekly Teaching Timetable',
    scheduleSync: 'Schedule 1-on-1 Sync',
    addMeeting: 'Add Meeting',
    addClass: 'Add Class',
    freeSlot: 'Free / Open',
    dropHereToSchedule: 'Drop here to schedule',

    conflictDetectedTitle: 'Schedule Conflict Warning',
    conflictWarningDesc: 'A scheduling conflict was detected for this time slot.',
    conflictWithGroup: 'Teacher already has a group scheduled at this time.',
    conflictWithMeeting: 'Teacher or attendee already has a meeting scheduled at this time.',
    proceedAnyway: 'Proceed Anyway (Override)',
    chooseDifferentTime: 'Choose Different Time',

    selectedGroupTime: 'Default Group Time (Persistent)',
    persistentGroupTimeDesc: 'This selected clock item stays consistent for newly assigned and created groups until updated.',
    clockTimePresets: 'Clock Time Presets',
    customTime: 'Custom Time',
    applyDefaultTime: 'Set as Default Time',

    occurrencesTitle: 'Global Occurrences Tracker',
    occurrencesDesc: 'Track and edit behavioral, academic, and attendance occurrences for all students.',
    logOccurrence: 'Log New Occurrence',
    editOccurrence: 'Edit Occurrence',
    studentName: 'Student Name',
    occurrenceType: 'Occurrence Type',
    academicType: 'Academic (Exam / Study)',
    behaviorType: 'Behavior / Feedback',
    attendanceType: 'Attendance / Absence',
    administrativeType: 'Administrative',
    description: 'Description / Summary',
    reportedBy: 'Reported By',
    resolutionNotes: 'Resolution Notes / Action Taken',
    open: 'Open',
    resolved: 'Resolved',

    systemPreferences: 'System Preferences & Configuration',
    systemPreferencesDesc: 'Configure system administrator settings, profile picture, language, themes, and database backups.',
    profilePicture: 'Employee Profile Picture',
    uploadCustomPhoto: 'Upload Custom Photo',
    languageAndRegion: 'System Language & Regional Locale',
    displayTheme: 'Display Theme (Dark / Light Mode)',
    darkMode: 'Dark Mode (Violet Darkroom)',
    lightMode: 'Light Mode (Crisp Daylight)',
    systemBackup: 'Administrator File Backup & Snapshot',
    exportBackup: 'Export Full System Backup (JSON)',
    restoreBackup: 'Restore Backup File',
    saveConfiguration: 'Save Configuration',
  },
  'pt-BR': {
    core: 'Principal',
    academic: 'Acadêmico',
    teaching: 'Docência',
    operations: 'Operações',
    admin: 'Administração',
    dashboard: 'Painel & Horários',
    calendar: 'Calendário',
    students: 'Alunos',
    groups: 'Turmas (Grupos)',
    collections: 'Livros & Coleções',
    teacherPortal: 'Portal do Professor',
    finance: 'Financeiro',
    occurrences: 'Ocorrências',
    tasks: 'Tarefas',
    meetings: 'Reuniões',
    staff: 'Equipe & Permissões',
    preferences: 'Preferências',
    chat: 'Chat da Equipe',
    staffChat: 'Chat da Equipe',

    timetable: 'Grade Horária',
    loggedInAs: 'Conectado como',
    switchTheme: 'Alternar Tema',
    notifications: 'Notificações',
    searchPlaceholder: 'Pesquisar...',
    save: 'Salvar',
    cancel: 'Cancelar',
    delete: 'Excluir',
    edit: 'Editar',
    add: 'Adicionar',
    close: 'Fechar',
    back: 'Voltar',
    clear: 'Limpar',
    all: 'Todos',
    actions: 'Ações',
    status: 'Status',
    date: 'Data',
    time: 'Horário',
    hours: 'Horas',
    overview: 'Visão Geral',

    draftAutoSaved: 'Rascunho auto-salvo a cada 30s',
    savingChanges: 'Salvando rascunho...',
    allChangesSaved: 'Rascunho salvo com sucesso',
    saveNow: 'Salvar Agora',
    restoreDraft: 'Restaurar Rascunho',

    pedagogicalPlanner: 'Horários dos Professores & Planejamento Pedagógico',
    separateSchedules: 'Horários Separados por Professor',
    masterGrid: 'Grade Mestra Semanal (7 Dias)',
    filterTeachers: 'Filtrar Professores:',
    allTeachers: 'Todos os Professores',
    studyGroupsPool: 'Banco de Turmas Disponíveis',
    dragDropInstructions: 'Arraste as turmas para a grade ou para o cartão do professor.',
    teachingLoad: 'Carga Semanal',
    weeklyTimetable: 'Grade Semanal de Aulas',
    scheduleSync: 'Agendar Alinhamento 1-a-1',
    addMeeting: 'Nova Reunião',
    addClass: 'Adicionar Aula',
    freeSlot: 'Livre / Disponível',
    dropHereToSchedule: 'Solte aqui para agendar',

    conflictDetectedTitle: 'Aviso de Conflito de Horário',
    conflictWarningDesc: 'Foi detectado um choque de horário para este período.',
    conflictWithGroup: 'O professor já possui uma turma agendada neste mesmo dia e horário.',
    conflictWithMeeting: 'O professor ou participante já possui uma reunião agendada neste horário.',
    proceedAnyway: 'Prosseguir Mesmo Assim (Substituir)',
    chooseDifferentTime: 'Escolher Outro Horário',

    selectedGroupTime: 'Horário Padrão de Turma (Persistente)',
    persistentGroupTimeDesc: 'Este horário de relógio permanece consistente para novas turmas criadas ou atribuídas até ser alterado.',
    clockTimePresets: 'Horários Pré-definidos do Relógio',
    customTime: 'Horário Personalizado',
    applyDefaultTime: 'Definir como Horário Padrão',

    occurrencesTitle: 'Registro Global de Ocorrências',
    occurrencesDesc: 'Acompanhe e edite ocorrências comportamentais, acadêmicas e de frequência dos alunos.',
    logOccurrence: 'Registrar Nova Ocorrência',
    editOccurrence: 'Editar Ocorrência',
    studentName: 'Nome do Aluno',
    occurrenceType: 'Tipo de Ocorrência',
    academicType: 'Acadêmica (Exames / Estudos)',
    behaviorType: 'Comportamento / Feedback',
    attendanceType: 'Frequência / Faltas',
    administrativeType: 'Administrativa',
    description: 'Descrição / Resumo',
    reportedBy: 'Registrado Por',
    resolutionNotes: 'Anotações de Resolução / Plano de Ação',
    open: 'Em Aberto',
    resolved: 'Resolvida',

    systemPreferences: 'Preferências do Sistema & Configuração',
    systemPreferencesDesc: 'Configure perfil de administrador, foto, idioma do sistema, tema e backup de dados.',
    profilePicture: 'Foto de Perfil do Colaborador',
    uploadCustomPhoto: 'Enviar Foto Personalizada',
    languageAndRegion: 'Idioma do Sistema & Região',
    displayTheme: 'Tema de Exibição (Modo Claro / Escuro)',
    darkMode: 'Modo Escuro (Violeta Noturno)',
    lightMode: 'Modo Claro (Alto Contraste)',
    systemBackup: 'Backup de Dados do Administrador',
    exportBackup: 'Exportar Backup Completo (JSON)',
    restoreBackup: 'Restaurar Arquivo de Backup',
    saveConfiguration: 'Salvar Configurações',
  },
  'es-LA': {
    core: 'Principal',
    academic: 'Académico',
    teaching: 'Docencia',
    operations: 'Operaciones',
    admin: 'Administración',
    dashboard: 'Panel & Horarios',
    calendar: 'Calendario',
    students: 'Estudiantes',
    groups: 'Grupos',
    collections: 'Libros y Colecciones',
    teacherPortal: 'Portal del Profesor',
    finance: 'Finanzas',
    occurrences: 'Incidencias',
    tasks: 'Tareas',
    meetings: 'Reuniones',
    staff: 'Personal & Roles',
    preferences: 'Preferencias',
    chat: 'Chat del Personal',
    staffChat: 'Chat del Personal',

    timetable: 'Horario',
    loggedInAs: 'Conectado como',
    switchTheme: 'Cambiar Tema',
    notifications: 'Notificaciones',
    searchPlaceholder: 'Buscar...',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    add: 'Añadir',
    close: 'Cerrar',
    back: 'Volver',
    clear: 'Limpiar',
    all: 'Todos',
    actions: 'Acciones',
    status: 'Estado',
    date: 'Fecha',
    time: 'Hora',
    hours: 'Horas',
    overview: 'Resumen',

    draftAutoSaved: 'Borrador auto-guardado cada 30s',
    savingChanges: 'Guardando borrador...',
    allChangesSaved: 'Borrador guardado con éxito',
    saveNow: 'Guardar Ahora',
    restoreDraft: 'Restaurar Borrador',

    pedagogicalPlanner: 'Horarios de Profesores & Planificación Pedagógica',
    separateSchedules: 'Horarios Separados por Profesor',
    masterGrid: 'Cuadrícula Maestra Semanal (7 Días)',
    filterTeachers: 'Filtrar Profesores:',
    allTeachers: 'Todos los Profesores',
    studyGroupsPool: 'Banco de Grupos Disponibles',
    dragDropInstructions: 'Arrastre los grupos a las tarjetas de profesores o cuadrícula horaria.',
    teachingLoad: 'Carga Semanal',
    weeklyTimetable: 'Horario Semanal de Clases',
    scheduleSync: 'Agendar Sincronización 1-a-1',
    addMeeting: 'Nueva Reunión',
    addClass: 'Añadir Clase',
    freeSlot: 'Libre / Disponible',
    dropHereToSchedule: 'Suelte aquí para programar',

    conflictDetectedTitle: 'Aviso de Conflicto de Horario',
    conflictWarningDesc: 'Se detectó un conflicto de horario para este intervalo.',
    conflictWithGroup: 'El profesor ya tiene un grupo programado a esta misma hora.',
    conflictWithMeeting: 'El profesor o asistente ya tiene una reunión a esta hora.',
    proceedAnyway: 'Continuar de Todos Modos (Reemplazar)',
    chooseDifferentTime: 'Elegir Otro Horario',

    selectedGroupTime: 'Hora de Grupo Predeterminada (Persistente)',
    persistentGroupTimeDesc: 'Esta hora seleccionada en el reloj permanece consistente para nuevos grupos asignados o creados.',
    clockTimePresets: 'Horas Preestablecidas de Reloj',
    customTime: 'Hora Personalizada',
    applyDefaultTime: 'Establecer como Hora Predeterminada',

    occurrencesTitle: 'Registro Global de Incidencias',
    occurrencesDesc: 'Rastree y edite incidencias académicas, conductuales y de asistencia de los estudiantes.',
    logOccurrence: 'Registrar Nueva Incidencia',
    editOccurrence: 'Editar Incidencia',
    studentName: 'Nombre del Estudiante',
    occurrenceType: 'Tipo de Incidencia',
    academicType: 'Académica (Exámenes / Estudio)',
    behaviorType: 'Conducta / Comentarios',
    attendanceType: 'Asistencia / Faltas',
    administrativeType: 'Administrativa',
    description: 'Descripción / Resumen',
    reportedBy: 'Reportado Por',
    resolutionNotes: 'Notas de Resolución / Plan de Acción',
    open: 'Abierta',
    resolved: 'Resuelta',

    systemPreferences: 'Preferencias del Sistema & Configuración',
    systemPreferencesDesc: 'Configure el perfil de administrador, foto, idioma del sistema, temas y copias de seguridad.',
    profilePicture: 'Foto de Perfil del Empleado',
    uploadCustomPhoto: 'Subir Foto Personalizada',
    languageAndRegion: 'Idioma del Sistema & Región',
    displayTheme: 'Tema de Visualización (Modo Claro / Oscuro)',
    darkMode: 'Modo Oscuro (Violeta)',
    lightMode: 'Modo Claro (Alto Contraste)',
    systemBackup: 'Copia de Seguridad del Administrador',
    exportBackup: 'Exportar Copia Completa (JSON)',
    restoreBackup: 'Restaurar Copia de Seguridad',
    saveConfiguration: 'Guardar Configuración',
  }
};
