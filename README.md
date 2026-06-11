# Exact x Forestall - Gestión de Partes de Trabajo (PWA)

Esta es una aplicación móvil Progresiva (PWA) diseñada para la gestión de partes de trabajo y hojas de inspección. Permite a los trabajadores rellenar un formulario optimizado para móviles (incluso sin conexión a Internet), guardar el historial localmente y descargar la hoja de inspección en formato **JPG de alta resolución** con el diseño idéntico al documento original.

---

## 🚀 Cómo Ejecutar en Local (Desarrollo)

Para probar la aplicación en tu ordenador y abrirla en el navegador de tu móvil o PC:

1. Abre una consola/terminal en la carpeta del proyecto (`c:\Users\sergi\Documents\REMIRO_APP`).
2. Instala las dependencias si no lo has hecho ya:
   ```bash
   npm install
   ```
3. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. La consola te dará una dirección local (ej. `http://localhost:5173`) y una dirección de red local (ej. `http://192.168.1.XX:5173`). Puedes abrir esta última en el navegador de tu móvil siempre que ambos dispositivos estén conectados al mismo Wi-Fi.

---

## 📦 Cómo Compilar el Proyecto

Para generar los archivos listos para producción (subir a internet):

```bash
npm run build
```
Esto creará una carpeta llamada `dist/` en el proyecto que contiene los archivos HTML, CSS y JS optimizados, listos para ser alojados.

---

## 🌐 Cómo Desplegar en GitHub Pages (Gratis)

Al haber configurado la aplicación con rutas relativas (`base: './'`), puedes desplegarla en GitHub Pages de varias maneras sencillas:

### Método A: Despliegue Manual con la carpeta `dist` (El más fácil)
1. Sube tu proyecto a un repositorio de GitHub (ej. `mi-usuario/partes-trabajo`).
2. En tu ordenador, tras ejecutar `npm run build`, copia el contenido de la carpeta `dist/` a una carpeta llamada `docs/` en la raíz de tu proyecto, o directamente sube la carpeta `dist/` a una rama de tu repositorio llamada `gh-pages`.
3. Ve a la configuración de tu repositorio en GitHub: **Settings > Pages**.
4. En **Build and deployment**, bajo *Source*, selecciona **Deploy from a branch**.
5. Elige la rama (`main` o `gh-pages`) y la carpeta (ej. `/docs` o `/root`) y pulsa **Save**.
6. ¡Listo! En un par de minutos tu app estará online en `https://<tu-usuario>.github.io/<nombre-repo>/`.

### Método B: Automatizado con el paquete `gh-pages`
Si quieres desplegar con un solo comando desde tu terminal:
1. Instala el publicador de GitHub Pages:
   ```bash
   npm install --save-dev gh-pages
   ```
2. Abre tu archivo `package.json` y añade estas dos líneas en la sección `"scripts"`:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```
3. Ahora, cada vez que quieras actualizar la aplicación online, simplemente ejecuta en tu terminal:
   ```bash
   npm run deploy
   ```
   *Nota: Asegúrate de tener tu repositorio configurado en Git (`git remote add origin ...`) antes de ejecutarlo.*

---

## 📱 Cómo Instalar en los Móviles de los Trabajadores

Una vez que la aplicación esté subida a GitHub Pages (o a cualquier otro hosting como Netlify):

### En Android (Google Chrome):
1. Abre el enlace `https://<tu-usuario>.github.io/<nombre-repo>/` en **Chrome**.
2. Aparecerá un aviso emergente abajo: **"Añadir a la pantalla de inicio"** o **"Instalar aplicación"**.
3. Pulsa sobre el aviso y confirma la instalación.
4. Si el aviso no sale, pulsa los **tres puntos de la esquina superior derecha** de Chrome y selecciona **"Instalar aplicación"**.

### En iPhone / iOS (Safari):
1. Abre el enlace en **Safari**.
2. Pulsa el botón **Compartir** (el cuadrado con la flecha hacia arriba abajo en la pantalla).
3. Busca en la lista y selecciona la opción **"Añadir a la pantalla de inicio"**.

### Ventajas de uso:
* **Acceso Directo**: Se crea un icono en la pantalla del móvil con el logo personalizado.
* **Pantalla Completa**: Al abrirse desde el icono, funciona sin barras del navegador, sintiéndose nativa.
* **Offline**: La app almacena los partes localmente en el almacenamiento seguro del teléfono (`localStorage`). El trabajador puede rellenar partes en zonas sin cobertura y guardarlos. Al tener conexión, podrá generar y compartir el JPG.
