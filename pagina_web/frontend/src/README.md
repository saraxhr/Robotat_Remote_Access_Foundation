
# 📁 Carpeta `src` — Código fuente del frontend

Esta carpeta contiene todos los archivos y componentes del frontend de la Plataforma Robotat.  
Aquí se define la estructura lógica, visual y de enrutamiento de la aplicación.

---

## 📄 Archivos principales

| Archivo | Descripción |
|----------|--------------|
| `main.tsx` | Punto de entrada del frontend. Monta el componente raíz `<App />` dentro del elemento `#root` definido en `index.html`. |
| `App.tsx` | Define todas las rutas de la aplicación, las protecciones por rol (admin, student, researcher) y la estructura base de navegación. |
| `index.css` | Archivo de estilos globales. Importa las directivas de TailwindCSS (`@tailwind base`, `@tailwind components`, `@tailwind utilities`). |
| `vite-env.d.ts` | Archivo de declaración de tipos que permite a TypeScript reconocer variables de entorno y configuraciones específicas de Vite. |

---

## 🧩 Estructura interna (resumen)

```
src/
│
├── components/        # Componentes reutilizables (navbar, sidebar, modales, etc.)
├── contexts/          # Contextos globales (autenticación, tema, etc.)
├── pages/             # Páginas principales de la aplicación (por rol o función)
│   ├── admin/
│   ├── student/
│   └── researcher/
└── main.tsx           # Punto de entrada del frontend
```

---

## ⚙️ Ejecución local

Para ejecutar el proyecto desde esta carpeta:

```bash
npm install
npm run dev
```

La aplicación se abrirá en [http://localhost:5173](http://localhost:5173).

---

## 🧠 Notas

- Los archivos `main.tsx` y `App.tsx` no deben eliminarse, ya que son la base de React.  
- `index.css` puede ampliarse con clases personalizadas o variables de diseño.  
- `vite-env.d.ts` no debe modificarse manualmente.
