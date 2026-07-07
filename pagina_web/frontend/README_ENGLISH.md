
# 🌐 Frontend — Robotat Platform

This repository contains the base **frontend** infrastructure for the Robotat platform at Universidad del Valle de Guatemala.
The system was developed using **Vite**, **React**, and **TailwindCSS**, and serves as the visual interface for monitoring and controlling the Robotat laboratory system.

---

## 🧩 Prerequisites

Before running the project, make sure you have the following installed:

* [Node.js](https://nodejs.org/) version 18 or higher
* [npm](https://www.npmjs.com/), included with Node.js
* A code editor, preferably [Visual Studio Code](https://code.visualstudio.com/)

---

## ⚙️ Installation

Clone the repository and enter the frontend directory:

```bash
# Clones the Robotat software infrastructure repository from GitHub.
git clone https://github.com/usuario/Infraestructura_software_Robotat.git

# Enters the cloned project directory.
cd Infraestructura_software_Robotat
```

Install the required dependencies. This will automatically generate the `node_modules/` folder:

```bash
# Installs all frontend dependencies defined in package.json.
npm install
```

Start the development server:

```bash
# Starts the local Vite development server.
npm run dev
```

The application will be available at:
👉 http://localhost:5173

---

## 📁 Main Project Structure

| File                 | Description                                                                                                 | Can it be modified?                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `.gitignore`         | Defines which files and folders should not be uploaded to GitHub, such as `node_modules/` and `.env` files. | ✅ Yes, additional exclusions can be added.             |
| `package.json`       | Contains project metadata, scripts, and dependencies.                                                       | ⚙️ Only edit if libraries are added or removed.        |
| `package-lock.json`  | Records the exact versions of installed dependencies and should not be edited manually.                     | 🚫 No.                                                 |
| `index.html`         | Entry point of the application. It contains the `<div id="root">` where React mounts the interface.         | ✅ Yes, the title or icon can be changed.               |
| `eslint.config.js`   | ESLint configuration used to maintain clean and consistent code.                                            | ⚙️ Optional, only if new rules are needed.             |
| `postcss.config.js`  | Processes TailwindCSS styles and applies browser compatibility transformations.                             | 🚫 No.                                                 |
| `tailwind.config.js` | Configures TailwindCSS settings such as colors, fonts, and file paths.                                      | ✅ Yes, the design can be customized.                   |
| `vite.config.ts`     | Vite configuration file used for settings such as ports, plugins, and aliases.                              | ✅ Yes, the port or build configuration can be changed. |
| `tsconfig.app.json`  | Configures TypeScript compilation for the application.                                                      | 🚫 No.                                                 |
| `tsconfig.node.json` | Configures TypeScript for Node-based tooling, such as Vite.                                                 | 🚫 No.                                                 |
| `tsconfig.json`      | Root TypeScript configuration file that connects the other `tsconfig` files.                                | 🚫 No.                                                 |

---

## 🧠 Important Notes

* The **`node_modules/`** folder is generated automatically when running `npm install`.
* If `node_modules/` is deleted, it can be recreated by running `npm install` again.
* `.env` files are used to store environment variables, such as private URLs, API endpoints, or configuration values.
* Real credentials, internal IP addresses, private camera URLs, and deployment-specific values should not be uploaded to the public repository.

---

## 🧰 Useful Commands

| Command           | Description                                                 |
| ----------------- | ----------------------------------------------------------- |
| `npm install`     | Installs all dependencies defined in `package.json`.        |
| `npm run dev`     | Starts the local development server.                        |
| `npm run build`   | Generates the production files inside the `dist/` folder.   |
| `npm run preview` | Serves the compiled production version locally for testing. |

---
