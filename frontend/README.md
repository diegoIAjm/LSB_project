# Frontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.2.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

```
frontend
├─ .editorconfig
├─ .prettierrc
├─ angular.json
├─ package-lock.json
├─ package.json
├─ public
│  └─ favicon.ico
├─ README.md
├─ src
│  ├─ app
│  │  ├─ admin
│  │  │  ├─ admin-module.ts
│  │  │  ├─ dashboard
│  │  │  │  ├─ dashboard.css
│  │  │  │  ├─ dashboard.html
│  │  │  │  ├─ dashboard.spec.ts
│  │  │  │  └─ dashboard.ts
│  │  │  ├─ header
│  │  │  │  ├─ header.css
│  │  │  │  ├─ header.html
│  │  │  │  ├─ header.spec.ts
│  │  │  │  └─ header.ts
│  │  │  ├─ layout
│  │  │  │  ├─ layout.css
│  │  │  │  ├─ layout.html
│  │  │  │  ├─ layout.spec.ts
│  │  │  │  └─ layout.ts
│  │  │  └─ sidebar
│  │  │     ├─ sidebar.css
│  │  │     ├─ sidebar.html
│  │  │     ├─ sidebar.spec.ts
│  │  │     └─ sidebar.ts
│  │  ├─ app.config.ts
│  │  ├─ app.css
│  │  ├─ app.html
│  │  ├─ app.routes.ts
│  │  ├─ app.spec.ts
│  │  ├─ app.ts
│  │  ├─ auth
│  │  │  └─ auth-module.ts
│  │  └─ shared
│  │     └─ shared-module.ts
│  ├─ index.html
│  ├─ main.ts
│  └─ styles.css
├─ tsconfig.app.json
├─ tsconfig.json
└─ tsconfig.spec.json

```
```
frontend
├─ .angular
├─ .editorconfig
├─ .prettierrc
├─ angular.json
├─ package-lock.json
├─ package.json
├─ public
│  └─ favicon.ico
├─ README.md
├─ src
│  ├─ app
│  │  ├─ admin
│  │  │  ├─ admin-module.ts
│  │  │  ├─ dashboard
│  │  │  │  ├─ dashboard.css
│  │  │  │  ├─ dashboard.html
│  │  │  │  ├─ dashboard.spec.ts
│  │  │  │  └─ dashboard.ts
│  │  │  ├─ header
│  │  │  │  ├─ header.css
│  │  │  │  ├─ header.html
│  │  │  │  ├─ header.spec.ts
│  │  │  │  └─ header.ts
│  │  │  ├─ layout
│  │  │  │  ├─ layout.css
│  │  │  │  ├─ layout.html
│  │  │  │  ├─ layout.spec.ts
│  │  │  │  └─ layout.ts
│  │  │  ├─ sidebar
│  │  │  │  ├─ sidebar.css
│  │  │  │  ├─ sidebar.html
│  │  │  │  ├─ sidebar.spec.ts
│  │  │  │  └─ sidebar.ts
│  │  │  └─ usuarios
│  │  │     ├─ usuarios.css
│  │  │     ├─ usuarios.html
│  │  │     ├─ usuarios.spec.ts
│  │  │     └─ usuarios.ts
│  │  ├─ app.config.ts
│  │  ├─ app.css
│  │  ├─ app.html
│  │  ├─ app.routes.ts
│  │  ├─ app.spec.ts
│  │  ├─ app.ts
│  │  ├─ auth
│  │  │  └─ auth-module.ts
│  │  ├─ services
│  │  │  ├─ usuarios.spec.ts
│  │  │  └─ usuarios.ts
│  │  └─ shared
│  │     └─ shared-module.ts
│  ├─ index.html
│  ├─ main.ts
│  └─ styles.css
├─ tsconfig.app.json
├─ tsconfig.json
└─ tsconfig.spec.json

```
```
frontend
├─ .angular
├─ .editorconfig
├─ .prettierrc
├─ angular.json
├─ package-lock.json
├─ package.json
├─ public
│  └─ favicon.ico
├─ README.md
├─ src
│  ├─ app
│  │  ├─ admin
│  │  │  ├─ admin-module.ts
│  │  │  ├─ dashboard
│  │  │  │  ├─ dashboard.css
│  │  │  │  ├─ dashboard.html
│  │  │  │  ├─ dashboard.spec.ts
│  │  │  │  └─ dashboard.ts
│  │  │  ├─ header
│  │  │  │  ├─ header.css
│  │  │  │  ├─ header.html
│  │  │  │  ├─ header.spec.ts
│  │  │  │  └─ header.ts
│  │  │  ├─ layout
│  │  │  │  ├─ layout.css
│  │  │  │  ├─ layout.html
│  │  │  │  ├─ layout.spec.ts
│  │  │  │  └─ layout.ts
│  │  │  ├─ sidebar
│  │  │  │  ├─ sidebar.css
│  │  │  │  ├─ sidebar.html
│  │  │  │  ├─ sidebar.spec.ts
│  │  │  │  └─ sidebar.ts
│  │  │  └─ usuarios
│  │  │     ├─ usuarios.css
│  │  │     ├─ usuarios.html
│  │  │     ├─ usuarios.spec.ts
│  │  │     └─ usuarios.ts
│  │  ├─ app.config.ts
│  │  ├─ app.css
│  │  ├─ app.html
│  │  ├─ app.module.ts
│  │  ├─ app.routes.ts
│  │  ├─ app.spec.ts
│  │  ├─ app.ts
│  │  ├─ auth
│  │  │  └─ auth-module.ts
│  │  ├─ services
│  │  │  ├─ usuarios.spec.ts
│  │  │  └─ usuarios.ts
│  │  └─ shared
│  │     └─ shared-module.ts
│  ├─ index.html
│  ├─ main.ts
│  └─ styles.css
├─ tsconfig.app.json
├─ tsconfig.json
└─ tsconfig.spec.json

```
```
frontend
├─ .angular
├─ .editorconfig
├─ .prettierrc
├─ angular.json
├─ package-lock.json
├─ package.json
├─ public
│  └─ favicon.ico
├─ README.md
├─ src
│  ├─ app
│  │  ├─ admin
│  │  │  ├─ admin-module.ts
│  │  │  ├─ dashboard
│  │  │  │  ├─ dashboard.css
│  │  │  │  ├─ dashboard.html
│  │  │  │  ├─ dashboard.spec.ts
│  │  │  │  └─ dashboard.ts
│  │  │  ├─ header
│  │  │  │  ├─ header.css
│  │  │  │  ├─ header.html
│  │  │  │  ├─ header.spec.ts
│  │  │  │  └─ header.ts
│  │  │  ├─ layout
│  │  │  │  ├─ layout.css
│  │  │  │  ├─ layout.html
│  │  │  │  ├─ layout.spec.ts
│  │  │  │  └─ layout.ts
│  │  │  ├─ sidebar
│  │  │  │  ├─ sidebar.css
│  │  │  │  ├─ sidebar.html
│  │  │  │  ├─ sidebar.spec.ts
│  │  │  │  └─ sidebar.ts
│  │  │  └─ usuarios
│  │  │     ├─ usuarios.css
│  │  │     ├─ usuarios.html
│  │  │     ├─ usuarios.spec.ts
│  │  │     └─ usuarios.ts
│  │  ├─ app.config.ts
│  │  ├─ app.css
│  │  ├─ app.html
│  │  ├─ app.routes.ts
│  │  ├─ app.spec.ts
│  │  ├─ app.ts
│  │  ├─ auth
│  │  │  └─ auth-module.ts
│  │  ├─ modules
│  │  │  └─ usuarios
│  │  │     └─ usuarios-crear
│  │  │        ├─ usuarios-crear.css
│  │  │        ├─ usuarios-crear.html
│  │  │        └─ usuarios-crear.ts
│  │  ├─ services
│  │  │  ├─ usuarios.spec.ts
│  │  │  └─ usuarios.ts
│  │  └─ shared
│  │     └─ shared-module.ts
│  ├─ index.html
│  ├─ main.ts
│  └─ styles.css
├─ tsconfig.app.json
├─ tsconfig.json
└─ tsconfig.spec.json

```
```
frontend
├─ .angular
├─ .editorconfig
├─ .prettierrc
├─ angular.json
├─ package-lock.json
├─ package.json
├─ public
│  └─ favicon.ico
├─ README.md
├─ src
│  ├─ app
│  │  ├─ admin
│  │  │  ├─ admin-module.ts
│  │  │  ├─ dashboard
│  │  │  │  ├─ dashboard.css
│  │  │  │  ├─ dashboard.html
│  │  │  │  ├─ dashboard.spec.ts
│  │  │  │  └─ dashboard.ts
│  │  │  ├─ header
│  │  │  │  ├─ header.css
│  │  │  │  ├─ header.html
│  │  │  │  ├─ header.spec.ts
│  │  │  │  └─ header.ts
│  │  │  ├─ layout
│  │  │  │  ├─ layout.css
│  │  │  │  ├─ layout.html
│  │  │  │  ├─ layout.spec.ts
│  │  │  │  └─ layout.ts
│  │  │  ├─ sidebar
│  │  │  │  ├─ sidebar.css
│  │  │  │  ├─ sidebar.html
│  │  │  │  ├─ sidebar.spec.ts
│  │  │  │  └─ sidebar.ts
│  │  │  └─ usuarios
│  │  │     ├─ usuarios.css
│  │  │     ├─ usuarios.html
│  │  │     ├─ usuarios.spec.ts
│  │  │     └─ usuarios.ts
│  │  ├─ app.config.ts
│  │  ├─ app.css
│  │  ├─ app.html
│  │  ├─ app.routes.ts
│  │  ├─ app.spec.ts
│  │  ├─ app.ts
│  │  ├─ auth
│  │  │  └─ auth-module.ts
│  │  ├─ modules
│  │  │  └─ usuarios
│  │  │     └─ usuarios-crear
│  │  │        ├─ usuarios-crear.css
│  │  │        ├─ usuarios-crear.html
│  │  │        └─ usuarios-crear.ts
│  │  ├─ services
│  │  │  ├─ usuarios.spec.ts
│  │  │  └─ usuarios.ts
│  │  └─ shared
│  │     └─ shared-module.ts
│  ├─ index.html
│  ├─ main.ts
│  └─ styles.css
├─ tsconfig.app.json
├─ tsconfig.json
└─ tsconfig.spec.json

```
```
frontend
├─ .angular
├─ .editorconfig
├─ .prettierrc
├─ angular.json
├─ package-lock.json
├─ package.json
├─ public
│  └─ favicon.ico
├─ README.md
├─ src
│  ├─ app
│  │  ├─ admin
│  │  │  ├─ admin-module.ts
│  │  │  ├─ dashboard
│  │  │  │  ├─ dashboard.css
│  │  │  │  ├─ dashboard.html
│  │  │  │  ├─ dashboard.spec.ts
│  │  │  │  └─ dashboard.ts
│  │  │  ├─ header
│  │  │  │  ├─ header.css
│  │  │  │  ├─ header.html
│  │  │  │  ├─ header.spec.ts
│  │  │  │  └─ header.ts
│  │  │  ├─ layout
│  │  │  │  ├─ layout.css
│  │  │  │  ├─ layout.html
│  │  │  │  ├─ layout.spec.ts
│  │  │  │  └─ layout.ts
│  │  │  ├─ sidebar
│  │  │  │  ├─ sidebar.css
│  │  │  │  ├─ sidebar.html
│  │  │  │  ├─ sidebar.spec.ts
│  │  │  │  └─ sidebar.ts
│  │  │  └─ usuarios
│  │  │     ├─ usuarios.css
│  │  │     ├─ usuarios.html
│  │  │     ├─ usuarios.spec.ts
│  │  │     └─ usuarios.ts
│  │  ├─ app.config.ts
│  │  ├─ app.css
│  │  ├─ app.html
│  │  ├─ app.routes.ts
│  │  ├─ app.spec.ts
│  │  ├─ app.ts
│  │  ├─ auth
│  │  │  └─ auth-module.ts
│  │  ├─ modules
│  │  │  └─ usuarios
│  │  │     ├─ editar-usuario
│  │  │     │  ├─ editar-usuario.css
│  │  │     │  ├─ editar-usuario.html
│  │  │     │  └─ editar-usuario.ts
│  │  │     └─ usuarios-crear
│  │  │        ├─ usuarios-crear.css
│  │  │        ├─ usuarios-crear.html
│  │  │        └─ usuarios-crear.ts
│  │  ├─ services
│  │  │  ├─ usuarios.spec.ts
│  │  │  └─ usuarios.ts
│  │  └─ shared
│  │     └─ shared-module.ts
│  ├─ index.html
│  ├─ main.ts
│  └─ styles.css
├─ tsconfig.app.json
├─ tsconfig.json
└─ tsconfig.spec.json

```
```
frontend
├─ .angular
├─ .editorconfig
├─ .prettierrc
├─ angular.json
├─ package-lock.json
├─ package.json
├─ public
│  └─ favicon.ico
├─ README.md
├─ src
│  ├─ app
│  │  ├─ admin
│  │  │  ├─ admin-module.ts
│  │  │  ├─ dashboard
│  │  │  │  ├─ dashboard.css
│  │  │  │  ├─ dashboard.html
│  │  │  │  ├─ dashboard.spec.ts
│  │  │  │  └─ dashboard.ts
│  │  │  ├─ header
│  │  │  │  ├─ header.css
│  │  │  │  ├─ header.html
│  │  │  │  ├─ header.spec.ts
│  │  │  │  └─ header.ts
│  │  │  ├─ layout
│  │  │  │  ├─ layout.css
│  │  │  │  ├─ layout.html
│  │  │  │  ├─ layout.spec.ts
│  │  │  │  └─ layout.ts
│  │  │  ├─ sidebar
│  │  │  │  ├─ sidebar.css
│  │  │  │  ├─ sidebar.html
│  │  │  │  ├─ sidebar.spec.ts
│  │  │  │  └─ sidebar.ts
│  │  │  └─ usuarios
│  │  │     ├─ usuarios.css
│  │  │     ├─ usuarios.html
│  │  │     ├─ usuarios.spec.ts
│  │  │     └─ usuarios.ts
│  │  ├─ app.config.ts
│  │  ├─ app.css
│  │  ├─ app.html
│  │  ├─ app.routes.ts
│  │  ├─ app.spec.ts
│  │  ├─ app.ts
│  │  ├─ auth
│  │  │  └─ auth-module.ts
│  │  ├─ modules
│  │  │  └─ usuarios
│  │  │     ├─ editar-usuario
│  │  │     │  ├─ editar-usuario.css
│  │  │     │  ├─ editar-usuario.html
│  │  │     │  └─ editar-usuario.ts
│  │  │     └─ usuarios-crear
│  │  │        ├─ usuarios-crear.css
│  │  │        ├─ usuarios-crear.html
│  │  │        └─ usuarios-crear.ts
│  │  ├─ services
│  │  │  ├─ usuarios.spec.ts
│  │  │  └─ usuarios.ts
│  │  ├─ shared
│  │  │  └─ shared-module.ts
│  │  └─ student
│  │     ├─ dashboard
│  │     │  ├─ dashboard.css
│  │     │  ├─ dashboard.html
│  │     │  └─ dashboard.ts
│  │     └─ student-layout
│  │        ├─ student-layout.css
│  │        ├─ student-layout.html
│  │        └─ student-layout.ts
│  ├─ index.html
│  ├─ main.ts
│  └─ styles.css
├─ tsconfig.app.json
├─ tsconfig.json
└─ tsconfig.spec.json

```
```
frontend
├─ .angular
├─ .editorconfig
├─ .prettierrc
├─ angular.json
├─ package-lock.json
├─ package.json
├─ public
│  └─ favicon.ico
├─ README.md
├─ src
│  ├─ app
│  │  ├─ admin
│  │  │  ├─ admin-module.ts
│  │  │  ├─ dashboard
│  │  │  │  ├─ dashboard.css
│  │  │  │  ├─ dashboard.html
│  │  │  │  ├─ dashboard.spec.ts
│  │  │  │  └─ dashboard.ts
│  │  │  ├─ header
│  │  │  │  ├─ header.css
│  │  │  │  ├─ header.html
│  │  │  │  ├─ header.spec.ts
│  │  │  │  └─ header.ts
│  │  │  ├─ layout
│  │  │  │  ├─ layout.css
│  │  │  │  ├─ layout.html
│  │  │  │  ├─ layout.spec.ts
│  │  │  │  └─ layout.ts
│  │  │  ├─ sidebar
│  │  │  │  ├─ sidebar.css
│  │  │  │  ├─ sidebar.html
│  │  │  │  ├─ sidebar.spec.ts
│  │  │  │  └─ sidebar.ts
│  │  │  └─ usuarios
│  │  │     ├─ importar-docentes
│  │  │     │  ├─ importar-docentes.css
│  │  │     │  ├─ importar-docentes.html
│  │  │     │  └─ importar-docentes.ts
│  │  │     ├─ importar-estudiantes
│  │  │     │  ├─ importar-estudiantes.css
│  │  │     │  ├─ importar-estudiantes.html
│  │  │     │  └─ importar-estudiantes.ts
│  │  │     ├─ usuarios.css
│  │  │     ├─ usuarios.html
│  │  │     ├─ usuarios.spec.ts
│  │  │     └─ usuarios.ts
│  │  ├─ app.config.ts
│  │  ├─ app.css
│  │  ├─ app.html
│  │  ├─ app.routes.ts
│  │  ├─ app.spec.ts
│  │  ├─ app.ts
│  │  ├─ auth
│  │  │  └─ auth-module.ts
│  │  ├─ modules
│  │  │  └─ usuarios
│  │  │     ├─ editar-usuario
│  │  │     │  ├─ editar-usuario.css
│  │  │     │  ├─ editar-usuario.html
│  │  │     │  └─ editar-usuario.ts
│  │  │     └─ usuarios-crear
│  │  │        ├─ usuarios-crear.css
│  │  │        ├─ usuarios-crear.html
│  │  │        └─ usuarios-crear.ts
│  │  ├─ services
│  │  │  ├─ usuarios.spec.ts
│  │  │  └─ usuarios.ts
│  │  ├─ shared
│  │  │  └─ shared-module.ts
│  │  └─ student
│  │     ├─ dashboard
│  │     │  ├─ dashboard.css
│  │     │  ├─ dashboard.html
│  │     │  └─ dashboard.ts
│  │     └─ student-layout
│  │        ├─ student-layout.css
│  │        ├─ student-layout.html
│  │        └─ student-layout.ts
│  ├─ index.html
│  ├─ main.ts
│  └─ styles.css
├─ tsconfig.app.json
├─ tsconfig.json
└─ tsconfig.spec.json

```
```
frontend
├─ .angular
├─ .editorconfig
├─ .prettierrc
├─ angular.json
├─ package-lock.json
├─ package.json
├─ public
│  └─ favicon.ico
├─ README.md
├─ src
│  ├─ app
│  │  ├─ admin
│  │  │  ├─ admin-module.ts
│  │  │  ├─ cursos
│  │  │  │  ├─ crear-curso
│  │  │  │  │  ├─ crear-curso.css
│  │  │  │  │  ├─ crear-curso.html
│  │  │  │  │  └─ crear-curso.ts
│  │  │  │  ├─ cursos.css
│  │  │  │  ├─ cursos.html
│  │  │  │  ├─ cursos.spec.ts
│  │  │  │  ├─ cursos.ts
│  │  │  │  └─ editar-curso
│  │  │  │     ├─ editar-curso.css
│  │  │  │     ├─ editar-curso.html
│  │  │  │     └─ editar-curso.ts
│  │  │  ├─ dashboard
│  │  │  │  ├─ dashboard.css
│  │  │  │  ├─ dashboard.html
│  │  │  │  ├─ dashboard.spec.ts
│  │  │  │  └─ dashboard.ts
│  │  │  ├─ header
│  │  │  │  ├─ header.css
│  │  │  │  ├─ header.html
│  │  │  │  ├─ header.spec.ts
│  │  │  │  └─ header.ts
│  │  │  ├─ inscripciones
│  │  │  │  ├─ inscripciones.css
│  │  │  │  ├─ inscripciones.html
│  │  │  │  └─ inscripciones.ts
│  │  │  ├─ layout
│  │  │  │  ├─ layout.css
│  │  │  │  ├─ layout.html
│  │  │  │  ├─ layout.spec.ts
│  │  │  │  └─ layout.ts
│  │  │  ├─ sidebar
│  │  │  │  ├─ sidebar.css
│  │  │  │  ├─ sidebar.html
│  │  │  │  ├─ sidebar.spec.ts
│  │  │  │  └─ sidebar.ts
│  │  │  └─ usuarios
│  │  │     ├─ importar-docentes
│  │  │     │  ├─ importar-docentes.css
│  │  │     │  ├─ importar-docentes.html
│  │  │     │  └─ importar-docentes.ts
│  │  │     ├─ importar-estudiantes
│  │  │     │  ├─ importar-estudiantes.css
│  │  │     │  ├─ importar-estudiantes.html
│  │  │     │  └─ importar-estudiantes.ts
│  │  │     ├─ usuarios.css
│  │  │     ├─ usuarios.html
│  │  │     ├─ usuarios.spec.ts
│  │  │     └─ usuarios.ts
│  │  ├─ app.config.ts
│  │  ├─ app.css
│  │  ├─ app.html
│  │  ├─ app.routes.ts
│  │  ├─ app.spec.ts
│  │  ├─ app.ts
│  │  ├─ auth
│  │  │  └─ auth-module.ts
│  │  ├─ modules
│  │  │  └─ usuarios
│  │  │     ├─ editar-usuario
│  │  │     │  ├─ editar-usuario.css
│  │  │     │  ├─ editar-usuario.html
│  │  │     │  └─ editar-usuario.ts
│  │  │     └─ usuarios-crear
│  │  │        ├─ usuarios-crear.css
│  │  │        ├─ usuarios-crear.html
│  │  │        └─ usuarios-crear.ts
│  │  ├─ services
│  │  │  ├─ cursos.service.ts
│  │  │  ├─ usuarios.spec.ts
│  │  │  └─ usuarios.ts
│  │  ├─ shared
│  │  │  └─ shared-module.ts
│  │  └─ student
│  │     ├─ dashboard
│  │     │  ├─ dashboard.css
│  │     │  ├─ dashboard.html
│  │     │  └─ dashboard.ts
│  │     └─ student-layout
│  │        ├─ student-layout.css
│  │        ├─ student-layout.html
│  │        └─ student-layout.ts
│  ├─ index.html
│  ├─ main.ts
│  └─ styles.css
├─ tsconfig.app.json
├─ tsconfig.json
└─ tsconfig.spec.json

```
```
frontend
├─ .angular
├─ .editorconfig
├─ .prettierrc
├─ angular.json
├─ package-lock.json
├─ package.json
├─ public
│  └─ favicon.ico
├─ README.md
├─ src
│  ├─ app
│  │  ├─ admin
│  │  │  ├─ admin-module.ts
│  │  │  ├─ cursos
│  │  │  │  ├─ crear-curso
│  │  │  │  │  ├─ crear-curso.css
│  │  │  │  │  ├─ crear-curso.html
│  │  │  │  │  └─ crear-curso.ts
│  │  │  │  ├─ cursos.css
│  │  │  │  ├─ cursos.html
│  │  │  │  ├─ cursos.spec.ts
│  │  │  │  ├─ cursos.ts
│  │  │  │  └─ editar-curso
│  │  │  │     ├─ editar-curso.css
│  │  │  │     ├─ editar-curso.html
│  │  │  │     └─ editar-curso.ts
│  │  │  ├─ dashboard
│  │  │  │  ├─ dashboard.css
│  │  │  │  ├─ dashboard.html
│  │  │  │  ├─ dashboard.spec.ts
│  │  │  │  └─ dashboard.ts
│  │  │  ├─ header
│  │  │  │  ├─ header.css
│  │  │  │  ├─ header.html
│  │  │  │  ├─ header.spec.ts
│  │  │  │  └─ header.ts
│  │  │  ├─ inscripciones
│  │  │  │  ├─ inscribir
│  │  │  │  │  ├─ inscribir.css
│  │  │  │  │  ├─ inscribir.html
│  │  │  │  │  └─ inscribir.ts
│  │  │  │  ├─ inscripciones.css
│  │  │  │  ├─ inscripciones.html
│  │  │  │  └─ inscripciones.ts
│  │  │  ├─ layout
│  │  │  │  ├─ layout.css
│  │  │  │  ├─ layout.html
│  │  │  │  ├─ layout.spec.ts
│  │  │  │  └─ layout.ts
│  │  │  ├─ sidebar
│  │  │  │  ├─ sidebar.css
│  │  │  │  ├─ sidebar.html
│  │  │  │  ├─ sidebar.spec.ts
│  │  │  │  └─ sidebar.ts
│  │  │  └─ usuarios
│  │  │     ├─ importar-docentes
│  │  │     │  ├─ importar-docentes.css
│  │  │     │  ├─ importar-docentes.html
│  │  │     │  └─ importar-docentes.ts
│  │  │     ├─ importar-estudiantes
│  │  │     │  ├─ importar-estudiantes.css
│  │  │     │  ├─ importar-estudiantes.html
│  │  │     │  └─ importar-estudiantes.ts
│  │  │     ├─ usuarios.css
│  │  │     ├─ usuarios.html
│  │  │     ├─ usuarios.spec.ts
│  │  │     └─ usuarios.ts
│  │  ├─ app.config.ts
│  │  ├─ app.css
│  │  ├─ app.html
│  │  ├─ app.routes.ts
│  │  ├─ app.spec.ts
│  │  ├─ app.ts
│  │  ├─ auth
│  │  │  └─ auth-module.ts
│  │  ├─ modules
│  │  │  └─ usuarios
│  │  │     ├─ editar-usuario
│  │  │     │  ├─ editar-usuario.css
│  │  │     │  ├─ editar-usuario.html
│  │  │     │  └─ editar-usuario.ts
│  │  │     └─ usuarios-crear
│  │  │        ├─ usuarios-crear.css
│  │  │        ├─ usuarios-crear.html
│  │  │        └─ usuarios-crear.ts
│  │  ├─ services
│  │  │  ├─ cursos.service.ts
│  │  │  ├─ usuarios.spec.ts
│  │  │  └─ usuarios.ts
│  │  ├─ shared
│  │  │  └─ shared-module.ts
│  │  └─ student
│  │     ├─ dashboard
│  │     │  ├─ dashboard.css
│  │     │  ├─ dashboard.html
│  │     │  └─ dashboard.ts
│  │     └─ student-layout
│  │        ├─ student-layout.css
│  │        ├─ student-layout.html
│  │        └─ student-layout.ts
│  ├─ index.html
│  ├─ main.ts
│  └─ styles.css
├─ tsconfig.app.json
├─ tsconfig.json
└─ tsconfig.spec.json

```
```
frontend
├─ .angular
├─ .editorconfig
├─ .prettierrc
├─ angular.json
├─ package-lock.json
├─ package.json
├─ public
│  ├─ assets
│  │  └─ models
│  │     ├─ ModeloLSB.blend
│  │     ├─ ModeloLSB.blend1
│  │     └─ ModeloLSB.glb
│  └─ favicon.ico
├─ README.md
├─ src
│  ├─ app
│  │  ├─ admin
│  │  │  ├─ admin-module.ts
│  │  │  ├─ cursos
│  │  │  │  ├─ crear-curso
│  │  │  │  │  ├─ crear-curso.css
│  │  │  │  │  ├─ crear-curso.html
│  │  │  │  │  └─ crear-curso.ts
│  │  │  │  ├─ cursos.css
│  │  │  │  ├─ cursos.html
│  │  │  │  ├─ cursos.spec.ts
│  │  │  │  ├─ cursos.ts
│  │  │  │  └─ editar-curso
│  │  │  │     ├─ editar-curso.css
│  │  │  │     ├─ editar-curso.html
│  │  │  │     └─ editar-curso.ts
│  │  │  ├─ dashboard
│  │  │  │  ├─ dashboard.css
│  │  │  │  ├─ dashboard.html
│  │  │  │  ├─ dashboard.spec.ts
│  │  │  │  └─ dashboard.ts
│  │  │  ├─ header
│  │  │  │  ├─ header.css
│  │  │  │  ├─ header.html
│  │  │  │  ├─ header.spec.ts
│  │  │  │  └─ header.ts
│  │  │  ├─ inscripciones
│  │  │  │  ├─ inscribir
│  │  │  │  │  ├─ inscribir.css
│  │  │  │  │  ├─ inscribir.html
│  │  │  │  │  └─ inscribir.ts
│  │  │  │  ├─ inscripciones.css
│  │  │  │  ├─ inscripciones.html
│  │  │  │  └─ inscripciones.ts
│  │  │  ├─ layout
│  │  │  │  ├─ layout.css
│  │  │  │  ├─ layout.html
│  │  │  │  ├─ layout.spec.ts
│  │  │  │  └─ layout.ts
│  │  │  ├─ sidebar
│  │  │  │  ├─ sidebar.css
│  │  │  │  ├─ sidebar.html
│  │  │  │  ├─ sidebar.spec.ts
│  │  │  │  └─ sidebar.ts
│  │  │  └─ usuarios
│  │  │     ├─ importar-docentes
│  │  │     │  ├─ importar-docentes.css
│  │  │     │  ├─ importar-docentes.html
│  │  │     │  └─ importar-docentes.ts
│  │  │     ├─ importar-estudiantes
│  │  │     │  ├─ importar-estudiantes.css
│  │  │     │  ├─ importar-estudiantes.html
│  │  │     │  └─ importar-estudiantes.ts
│  │  │     ├─ usuarios.css
│  │  │     ├─ usuarios.html
│  │  │     ├─ usuarios.spec.ts
│  │  │     └─ usuarios.ts
│  │  ├─ app.config.ts
│  │  ├─ app.css
│  │  ├─ app.html
│  │  ├─ app.routes.ts
│  │  ├─ app.spec.ts
│  │  ├─ app.ts
│  │  ├─ auth
│  │  │  └─ auth-module.ts
│  │  ├─ modules
│  │  │  └─ usuarios
│  │  │     ├─ editar-usuario
│  │  │     │  ├─ editar-usuario.css
│  │  │     │  ├─ editar-usuario.html
│  │  │     │  └─ editar-usuario.ts
│  │  │     └─ usuarios-crear
│  │  │        ├─ usuarios-crear.css
│  │  │        ├─ usuarios-crear.html
│  │  │        └─ usuarios-crear.ts
│  │  ├─ services
│  │  │  ├─ cursos.service.ts
│  │  │  ├─ usuarios.spec.ts
│  │  │  └─ usuarios.ts
│  │  ├─ shared
│  │  │  └─ shared-module.ts
│  │  └─ student
│  │     ├─ dashboard
│  │     │  ├─ dashboard.css
│  │     │  ├─ dashboard.html
│  │     │  └─ dashboard.ts
│  │     ├─ diccionario
│  │     │  ├─ diccionario.css
│  │     │  ├─ diccionario.html
│  │     │  └─ diccionario.ts
│  │     └─ student-layout
│  │        ├─ student-layout.css
│  │        ├─ student-layout.html
│  │        └─ student-layout.ts
│  ├─ index.html
│  ├─ main.ts
│  └─ styles.css
├─ tsconfig.app.json
├─ tsconfig.json
└─ tsconfig.spec.json

```
```
frontend
├─ .angular
├─ .editorconfig
├─ .prettierrc
├─ angular.json
├─ package-lock.json
├─ package.json
├─ public
│  ├─ assets
│  │  └─ models
│  │     ├─ ModeloLSB.blend
│  │     ├─ ModeloLSB.blend1
│  │     └─ ModeloLSB.glb
│  └─ favicon.ico
├─ README.md
├─ src
│  ├─ app
│  │  ├─ admin
│  │  │  ├─ admin-module.ts
│  │  │  ├─ cursos
│  │  │  │  ├─ crear-curso
│  │  │  │  │  ├─ crear-curso.css
│  │  │  │  │  ├─ crear-curso.html
│  │  │  │  │  └─ crear-curso.ts
│  │  │  │  ├─ cursos.css
│  │  │  │  ├─ cursos.html
│  │  │  │  ├─ cursos.spec.ts
│  │  │  │  ├─ cursos.ts
│  │  │  │  └─ editar-curso
│  │  │  │     ├─ editar-curso.css
│  │  │  │     ├─ editar-curso.html
│  │  │  │     └─ editar-curso.ts
│  │  │  ├─ dashboard
│  │  │  │  ├─ dashboard.css
│  │  │  │  ├─ dashboard.html
│  │  │  │  ├─ dashboard.spec.ts
│  │  │  │  └─ dashboard.ts
│  │  │  ├─ header
│  │  │  │  ├─ header.css
│  │  │  │  ├─ header.html
│  │  │  │  ├─ header.spec.ts
│  │  │  │  └─ header.ts
│  │  │  ├─ inscripciones
│  │  │  │  ├─ inscribir
│  │  │  │  │  ├─ inscribir.css
│  │  │  │  │  ├─ inscribir.html
│  │  │  │  │  └─ inscribir.ts
│  │  │  │  ├─ inscripciones.css
│  │  │  │  ├─ inscripciones.html
│  │  │  │  └─ inscripciones.ts
│  │  │  ├─ layout
│  │  │  │  ├─ layout.css
│  │  │  │  ├─ layout.html
│  │  │  │  ├─ layout.spec.ts
│  │  │  │  └─ layout.ts
│  │  │  ├─ sidebar
│  │  │  │  ├─ sidebar.css
│  │  │  │  ├─ sidebar.html
│  │  │  │  ├─ sidebar.spec.ts
│  │  │  │  └─ sidebar.ts
│  │  │  └─ usuarios
│  │  │     ├─ importar-docentes
│  │  │     │  ├─ importar-docentes.css
│  │  │     │  ├─ importar-docentes.html
│  │  │     │  └─ importar-docentes.ts
│  │  │     ├─ importar-estudiantes
│  │  │     │  ├─ importar-estudiantes.css
│  │  │     │  ├─ importar-estudiantes.html
│  │  │     │  └─ importar-estudiantes.ts
│  │  │     ├─ usuarios.css
│  │  │     ├─ usuarios.html
│  │  │     ├─ usuarios.spec.ts
│  │  │     └─ usuarios.ts
│  │  ├─ app.config.ts
│  │  ├─ app.css
│  │  ├─ app.html
│  │  ├─ app.routes.ts
│  │  ├─ app.spec.ts
│  │  ├─ app.ts
│  │  ├─ auth
│  │  │  ├─ auth-module.ts
│  │  │  └─ login
│  │  │     ├─ login.css
│  │  │     ├─ login.html
│  │  │     └─ login.ts
│  │  ├─ guards
│  │  │  ├─ auth-guard.spec.ts
│  │  │  └─ auth-guard.ts
│  │  ├─ modules
│  │  │  └─ usuarios
│  │  │     ├─ editar-usuario
│  │  │     │  ├─ editar-usuario.css
│  │  │     │  ├─ editar-usuario.html
│  │  │     │  └─ editar-usuario.ts
│  │  │     └─ usuarios-crear
│  │  │        ├─ usuarios-crear.css
│  │  │        ├─ usuarios-crear.html
│  │  │        └─ usuarios-crear.ts
│  │  ├─ services
│  │  │  ├─ auth.spec.ts
│  │  │  ├─ auth.ts
│  │  │  ├─ cursos.service.ts
│  │  │  ├─ usuarios.spec.ts
│  │  │  └─ usuarios.ts
│  │  ├─ shared
│  │  │  └─ shared-module.ts
│  │  ├─ student
│  │  │  ├─ dashboard
│  │  │  │  ├─ dashboard.css
│  │  │  │  ├─ dashboard.html
│  │  │  │  └─ dashboard.ts
│  │  │  ├─ diccionario
│  │  │  │  ├─ diccionario.css
│  │  │  │  ├─ diccionario.html
│  │  │  │  └─ diccionario.ts
│  │  │  └─ student-layout
│  │  │     ├─ student-layout.css
│  │  │     ├─ student-layout.html
│  │  │     └─ student-layout.ts
│  │  └─ teacher
│  │     ├─ dashboard
│  │     │  ├─ dashboard.css
│  │     │  ├─ dashboard.html
│  │     │  └─ dashboard.ts
│  │     └─ teacher-layout
│  │        ├─ teacher-layout.css
│  │        ├─ teacher-layout.html
│  │        └─ teacher-layout.ts
│  ├─ index.html
│  ├─ main.ts
│  └─ styles.css
├─ tsconfig.app.json
├─ tsconfig.json
└─ tsconfig.spec.json

```
```
frontend
├─ .angular
├─ .editorconfig
├─ .prettierrc
├─ angular.json
├─ package-lock.json
├─ package.json
├─ public
│  ├─ assets
│  │  ├─ keypoints
│  │  │  └─ Hola_1776886075492.json
│  │  └─ models
│  │     ├─ ModeloLSB.blend
│  │     ├─ ModeloLSB.blend1
│  │     └─ ModeloLSB.glb
│  └─ favicon.ico
├─ README.md
├─ src
│  ├─ app
│  │  ├─ admin
│  │  │  ├─ admin-module.ts
│  │  │  ├─ cursos
│  │  │  │  ├─ crear-curso
│  │  │  │  │  ├─ crear-curso.css
│  │  │  │  │  ├─ crear-curso.html
│  │  │  │  │  └─ crear-curso.ts
│  │  │  │  ├─ cursos.css
│  │  │  │  ├─ cursos.html
│  │  │  │  ├─ cursos.spec.ts
│  │  │  │  ├─ cursos.ts
│  │  │  │  ├─ editar-curso
│  │  │  │  │  ├─ editar-curso.css
│  │  │  │  │  ├─ editar-curso.html
│  │  │  │  │  └─ editar-curso.ts
│  │  │  │  └─ horarios
│  │  │  │     ├─ horarios.css
│  │  │  │     ├─ horarios.html
│  │  │  │     └─ horarios.ts
│  │  │  ├─ dashboard
│  │  │  │  ├─ dashboard.css
│  │  │  │  ├─ dashboard.html
│  │  │  │  ├─ dashboard.spec.ts
│  │  │  │  └─ dashboard.ts
│  │  │  ├─ header
│  │  │  │  ├─ header.css
│  │  │  │  ├─ header.html
│  │  │  │  ├─ header.spec.ts
│  │  │  │  └─ header.ts
│  │  │  ├─ inscripciones
│  │  │  │  ├─ inscribir
│  │  │  │  │  ├─ inscribir.css
│  │  │  │  │  ├─ inscribir.html
│  │  │  │  │  └─ inscribir.ts
│  │  │  │  ├─ inscripciones.css
│  │  │  │  ├─ inscripciones.html
│  │  │  │  └─ inscripciones.ts
│  │  │  ├─ layout
│  │  │  │  ├─ layout.css
│  │  │  │  ├─ layout.html
│  │  │  │  ├─ layout.spec.ts
│  │  │  │  └─ layout.ts
│  │  │  ├─ sidebar
│  │  │  │  ├─ sidebar.css
│  │  │  │  ├─ sidebar.html
│  │  │  │  ├─ sidebar.spec.ts
│  │  │  │  └─ sidebar.ts
│  │  │  └─ usuarios
│  │  │     ├─ importar-docentes
│  │  │     │  ├─ importar-docentes.css
│  │  │     │  ├─ importar-docentes.html
│  │  │     │  └─ importar-docentes.ts
│  │  │     ├─ importar-estudiantes
│  │  │     │  ├─ importar-estudiantes.css
│  │  │     │  ├─ importar-estudiantes.html
│  │  │     │  └─ importar-estudiantes.ts
│  │  │     ├─ usuarios.css
│  │  │     ├─ usuarios.html
│  │  │     ├─ usuarios.spec.ts
│  │  │     └─ usuarios.ts
│  │  ├─ app.config.ts
│  │  ├─ app.css
│  │  ├─ app.html
│  │  ├─ app.routes.ts
│  │  ├─ app.spec.ts
│  │  ├─ app.ts
│  │  ├─ auth
│  │  │  ├─ auth-module.ts
│  │  │  └─ login
│  │  │     ├─ login.css
│  │  │     ├─ login.html
│  │  │     └─ login.ts
│  │  ├─ guards
│  │  │  ├─ auth-guard.spec.ts
│  │  │  └─ auth-guard.ts
│  │  ├─ modules
│  │  │  └─ usuarios
│  │  │     ├─ editar-usuario
│  │  │     │  ├─ editar-usuario.css
│  │  │     │  ├─ editar-usuario.html
│  │  │     │  └─ editar-usuario.ts
│  │  │     └─ usuarios-crear
│  │  │        ├─ usuarios-crear.css
│  │  │        ├─ usuarios-crear.html
│  │  │        └─ usuarios-crear.ts
│  │  ├─ services
│  │  │  ├─ auth.spec.ts
│  │  │  ├─ auth.ts
│  │  │  ├─ camera.service.ts
│  │  │  ├─ cursos.service.ts
│  │  │  ├─ duolingo.ts
│  │  │  ├─ materiales.service.ts
│  │  │  ├─ usuarios.spec.ts
│  │  │  └─ usuarios.ts
│  │  ├─ shared
│  │  │  └─ shared-module.ts
│  │  ├─ student
│  │  │  ├─ dashboard
│  │  │  │  ├─ dashboard.css
│  │  │  │  ├─ dashboard.html
│  │  │  │  └─ dashboard.ts
│  │  │  ├─ diccionario
│  │  │  │  ├─ diccionario.css
│  │  │  │  ├─ diccionario.html
│  │  │  │  └─ diccionario.ts
│  │  │  ├─ duolingo
│  │  │  │  ├─ duolingo-layout
│  │  │  │  │  ├─ duolingo-layout.css
│  │  │  │  │  ├─ duolingo-layout.html
│  │  │  │  │  └─ duolingo-layout.ts
│  │  │  │  ├─ ejercicio
│  │  │  │  │  ├─ ejercicio.css
│  │  │  │  │  ├─ ejercicio.html
│  │  │  │  │  └─ ejercicio.ts
│  │  │  │  ├─ lecciones
│  │  │  │  │  ├─ lecciones.css
│  │  │  │  │  ├─ lecciones.html
│  │  │  │  │  └─ lecciones.ts
│  │  │  │  ├─ niveles
│  │  │  │  │  ├─ niveles.css
│  │  │  │  │  ├─ niveles.html
│  │  │  │  │  └─ niveles.ts
│  │  │  │  └─ unidades
│  │  │  │     ├─ unidades.css
│  │  │  │     ├─ unidades.html
│  │  │  │     └─ unidades.ts
│  │  │  └─ student-layout
│  │  │     ├─ student-layout.css
│  │  │     ├─ student-layout.html
│  │  │     └─ student-layout.ts
│  │  └─ teacher
│  │     ├─ curso-estudiantes
│  │     │  ├─ curso-estudiantes.css
│  │     │  ├─ curso-estudiantes.html
│  │     │  └─ curso-estudiantes.ts
│  │     ├─ dashboard
│  │     │  ├─ dashboard.css
│  │     │  ├─ dashboard.html
│  │     │  └─ dashboard.ts
│  │     ├─ materiales
│  │     │  ├─ materiales.css
│  │     │  ├─ materiales.html
│  │     │  └─ materiales.ts
│  │     ├─ mis-cursos
│  │     │  ├─ mis-cursos.css
│  │     │  ├─ mis-cursos.html
│  │     │  └─ mis-cursos.ts
│  │     └─ teacher-layout
│  │        ├─ teacher-layout.css
│  │        ├─ teacher-layout.html
│  │        └─ teacher-layout.ts
│  ├─ index.html
│  ├─ main.ts
│  └─ styles.css
├─ tsconfig.app.json
├─ tsconfig.json
└─ tsconfig.spec.json

```