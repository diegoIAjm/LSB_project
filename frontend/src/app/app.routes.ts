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
    
    ]
  }
];