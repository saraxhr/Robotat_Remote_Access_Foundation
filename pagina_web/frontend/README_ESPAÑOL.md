
# 🌐 Frontend — Plataforma Robotat

Este repositorio contiene la infraestructura base del **frontend** para la plataforma Robotat de la Universidad del Valle de Guatemala.  
El sistema fue desarrollado con **Vite**, **React** y **TailwindCSS** y constituye la interfaz visual del sistema de monitoreo y control del laboratorio Robotat.

---

## 🧩 Requisitos previos

Antes de ejecutar el proyecto, asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) (versión 18 o superior)
- [npm](https://www.npmjs.com/) (incluido con Node.js)
- Un editor de código, preferiblemente [Visual Studio Code](https://code.visualstudio.com/)

---

## ⚙️ Instalación

Clona el repositorio y entra al directorio del frontend:

```bash
git clone https://github.com/usuario/Infraestructura_software_Robotat.git
cd Infraestructura_software_Robotat
```

Instala las dependencias necesarias (esto generará automáticamente la carpeta `node_modules/`):

```bash
npm install
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

La aplicación estará disponible en:
👉 [http://localhost:5173](http://localhost:5173)

---

## 📁 Estructura principal del proyecto

| Archivo | Descripción | ¿Se puede modificar? |
|----------|--------------|----------------------|
| `.gitignore` | Define qué archivos y carpetas no deben subirse a GitHub (por ejemplo `node_modules/`, `.env/`(carpeta ambiente virtual). | ✅ Sí, puedes agregar más exclusiones. |
| `package.json` | Contiene metadatos del proyecto y dependencias. | ⚙️ Solo editar si agregas o quitas librerías. |
| `package-lock.json` | Registra versiones exactas de dependencias (no se edita manualmente). | 🚫 No. |
| `index.html` | Punto de entrada de la aplicación. Contiene el `<div id="root">` donde React monta la interfaz. | ✅ Sí, puedes cambiar el título o el ícono. |
| `eslint.config.js` | Configuración de ESLint para mantener un código limpio y ordenado. | ⚙️ Opcional, solo si quieres nuevas reglas. |
| `postcss.config.js` | Procesa los estilos de TailwindCSS y aplica compatibilidad entre navegadores. | 🚫 No. |
| `tailwind.config.js` | Configura TailwindCSS (colores, fuentes, paths). | ✅ Sí, puedes personalizar el diseño. |
| `vite.config.ts` | Configuración de Vite (puerto, plugins, alias). | ✅ Sí, puedes cambiar el puerto . |
| `tsconfig.app.json` | Configura la compilación de TypeScript para la app. | 🚫 No. |
| `tsconfig.node.json` | Configura TypeScript para scripts del entorno Node (como Vite). | 🚫 No. |
| `tsconfig.json` | Archivo raíz que conecta ambos `tsconfig`. | 🚫 No. |

---

## 🧠 Notas importantes

- La carpeta **`node_modules/`** se genera automáticamente con `npm install`. 
- Si se elimina `node_modules/`, se puede recrear ejecutando `npm install` nuevamente.  
- La carpeta `.env` (ambiente virtual) se utiliza para variables de entorno (como claves o URLs privadas).

---

## 🧰 Comandos útiles

| Comando | Descripción |
|----------|--------------|
| `npm install` | Instala todas las dependencias definidas en `package.json`. |
| `npm run dev` | Inicia el servidor de desarrollo local. |
| `npm run build` | Genera los archivos de producción en la carpeta `dist/`. |
| `npm run preview` | Sirve la versión compilada localmente para pruebas. |

---

