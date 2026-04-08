import { Routes } from '@angular/router';
import { Layout } from './admin/layout/layout';
import { UsuariosComponent } from './admin/usuarios/usuarios';

export const routes: Routes = [
  {
    path: 'admin',
    component: Layout,
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
        loadComponent: () =>
            import('./modules/usuarios/usuarios-crear/usuarios-crear')
            .then(m => m.UsuariosCrearComponent)
        },
    {
        path: 'usuarios/editar/:id',
        loadComponent: () => import('./modules/usuarios/editar-usuario/editar-usuario').then(m => m.UsuariosEditarComponent)
    },

    {
  path: 'usuarios/importar/estudiantes',
  loadComponent: () => import('./admin/usuarios/importar-estudiantes/importar-estudiantes')
    .then(m => m.ImportarEstudiantesComponent)
},
{
  path: 'usuarios/importar/docentes',
  loadComponent: () => import('./admin/usuarios/importar-docentes/importar-docentes')
    .then(m => m.ImportarDocentesComponent)
}, 

{
  path: 'cursos', 
  loadComponent: ()=> import ('./admin/cursos/cursos').then(m => m.CursosComponent)
},

{
  path: 'cursos/crear',
  loadComponent: () => import ('./admin/cursos/crear-curso/crear-curso').then(m => m.CrearCursoComponent)
},

{
  path: 'cursos/editar/:id',
  loadComponent: () => import('./admin/cursos/editar-curso/editar-curso').then(m => m.EditarCursoComponent)
},

{
  path: 'inscripciones',
    loadComponent: () => import('./admin/inscripciones/inscripciones').then(m => m.InscripcionesComponent)
},


{
  path: 'inscripciones/inscribir',
  loadComponent: () => import('./admin/inscripciones/inscribir/inscribir').then(m => m.InscribirComponent)
}



    
    ]
  },

    {
    path: 'student',
        loadComponent: () => import('./student/student-layout/student-layout').then(m => m.StudentLayout),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./student/dashboard/dashboard').then(m => m.StudentDashboard)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/student',
    pathMatch: 'full'
  }



];