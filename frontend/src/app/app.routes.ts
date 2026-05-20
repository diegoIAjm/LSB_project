import { Routes } from '@angular/router';
import { Layout } from './admin/layout/layout';
import { UsuariosComponent } from './admin/usuarios/usuarios';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  // ========== LOGIN ==========
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then(m => m.LoginComponent)
  },

  // ========== RUTAS DEL ADMINISTRADOR ==========
  {
    path: 'admin',
    component: Layout,
    canActivate: [authGuard],  // 🔹 AÑADIR GUARD
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./admin/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./admin/usuarios/usuarios').then(m => m.UsuariosComponent)
      },
      {
        path: 'usuarios/crear',
        loadComponent: () => import('./modules/usuarios/usuarios-crear/usuarios-crear').then(m => m.UsuariosCrearComponent)
      },
      {
        path: 'usuarios/editar/:id',
        loadComponent: () => import('./modules/usuarios/editar-usuario/editar-usuario').then(m => m.UsuariosEditarComponent)
      },
      {
        path: 'usuarios/importar/estudiantes',
        loadComponent: () => import('./admin/usuarios/importar-estudiantes/importar-estudiantes').then(m => m.ImportarEstudiantesComponent)
      },
      {
        path: 'usuarios/importar/docentes',
        loadComponent: () => import('./admin/usuarios/importar-docentes/importar-docentes').then(m => m.ImportarDocentesComponent)
      },
      {
        path: 'cursos',
        loadComponent: () => import('./admin/cursos/cursos').then(m => m.CursosComponent)
      },
      {
        path: 'cursos/crear',
        loadComponent: () => import('./admin/cursos/crear-curso/crear-curso').then(m => m.CrearCursoComponent)
      },
      {
        path: 'cursos/editar/:id',
        loadComponent: () => import('./admin/cursos/editar-curso/editar-curso').then(m => m.EditarCursoComponent)
      },

      {
        path: 'cursos/horarios/:id',
        loadComponent: () => import('./admin/cursos/horarios/horarios').then(m => m.HorariosComponent)
      },

      {
        path: 'inscripciones',
        loadComponent: () => import('./admin/inscripciones/inscripciones').then(m => m.InscripcionesComponent)
      },
      {
        path: 'inscripciones/inscribir',
        loadComponent: () => import('./admin/inscripciones/inscribir/inscribir').then(m => m.InscribirComponent)
      },
      {
      path: 'entrenar-ia',
      loadComponent: () => import('./admin/entrenar-ia/entrenar-ia').then(m => m.EntrenarIaComponent)
      }
    ]
  },

  // ========== RUTAS DEL ESTUDIANTE ==========
{
  path: 'student',
  loadComponent: () => import('./student/student-layout/student-layout').then(m => m.StudentLayout),
  canActivate: [authGuard],
  children: [
    {
      path: 'dashboard',
      loadComponent: () => import('./student/dashboard/dashboard').then(m => m.StudentDashboard)
    },
    {
      path: 'progreso',
      loadComponent: () => import('./student/progreso/progreso').then(m => m.ProgresoComponent)
    },
    {
      path: 'diccionario',
      loadComponent: () => import('./student/diccionario/diccionario').then(m => m.DiccionarioComponent)
    },
    {
      path: 'duolingo',
      loadComponent: () => import('./student/duolingo/duolingo-layout/duolingo-layout').then(m => m.DuolingoLayoutComponent),
      children: [
        {
          path: 'niveles',
          loadComponent: () => import('./student/duolingo/niveles/niveles').then(m => m.DuolingoNivelesComponent)
        },
        {
          path: 'unidades/:nivelId',
          loadComponent: () => import('./student/duolingo/unidades/unidades').then(m => m.DuolingoUnidadesComponent)
        },
        {
          path: 'lecciones/:unidadId',
          loadComponent: () => import('./student/duolingo/lecciones/lecciones').then(m => m.DuolingoLeccionesComponent)
        },
        {
          path: 'ejercicio/:leccionId',
          loadComponent: () => import('./student/duolingo/ejercicio/ejercicio').then(m => m.DuolingoEjercicioComponent)
        },
        {
          path: '',
          redirectTo: 'niveles',
          pathMatch: 'full'
        }
      ]
    },
    {
      path: 'mis-practicas',  // 🔹 AHORA SÍ, DENTRO DEL ARRAY CHILDREN
      loadComponent: () => import('./student/mis-practicas/mis-practicas').then(m => m.MisPracticasComponent)
    },
    {
      path: 'grabar-practica/:id',
      loadComponent: () => import('./student/grabar-practica/grabar-practica').then(m => m.GrabarPracticaComponent)
    },
    {
      path: '',
      redirectTo: 'dashboard',
      pathMatch: 'full'
    }
  ]
},

  // ========== RUTAS DEL DOCENTE ==========
  {
    path: 'teacher',
    loadComponent: () => import('./teacher/teacher-layout/teacher-layout').then(m => m.TeacherLayout),
    canActivate: [authGuard],  // 🔹 AÑADIR GUARD
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./teacher/dashboard/dashboard').then(m => m.TeacherDashboard)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      {
        path: 'mis-cursos',
        loadComponent: () => import('./teacher/mis-cursos/mis-cursos').then(m => m.MisCursosComponent)
      },

      {
        path: 'curso/:id/estudiantes',
        loadComponent: () => import('./teacher/curso-estudiantes/curso-estudiantes').then(m => m.CursoEstudiantesComponent)
      },
      {
        path: 'materiales/:id',
        loadComponent: () => import('./teacher/materiales/materiales').then(m => m.MaterialesComponent)
      },

      {
      path: 'asignar-practica',
      loadComponent: () => import('./teacher/asignar-practica/asignar-practica').then(m => m.AsignarPracticaComponent)
    },
    {
      path: 'crear-evaluacion/:cursoId',
      loadComponent: () => import('./teacher/crear-evaluacion/crear-evaluacion').then(m => m.CrearEvaluacionComponent)
    }
    ]
  },

  // ========== RUTA POR DEFECTO (REDIRIGE AL LOGIN) ==========
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },

  // ========== RUTA COMODÍN (REDIRIGE AL LOGIN) ==========
  {
    path: '**',
    redirectTo: '/login'
  }
];