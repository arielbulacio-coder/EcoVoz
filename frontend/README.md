# EcoVoz Urbana

EcoVoz Urbana es un prototipo de aplicación web progresiva orientado al registro y seguimiento de observaciones ambientales dentro de la Universidad Nacional de Hurlingham (UNAHUR).

El MVP permite que una persona autenticada con correo institucional registre una observación, indique su categoría, descripción y ubicación, y obtenga un código de seguimiento. También contempla el almacenamiento local y la recuperación del reporte ante una interrupción de la conectividad.

## Aplicación publicada

https://arielbulacio-coder.github.io/EcoVoz/

## Usuario de prueba

- Correo: estudiante@unahur.edu.ar
- Contraseña: no requerida

Los datos utilizados en las pruebas y demostraciones son ficticios.

## Funcionalidades del MVP

- Acceso mediante un correo institucional de UNAHUR.
- Registro de una nueva observación ambiental.
- Selección de una categoría.
- Descripción de la situación observada.
- Captura de coordenadas mediante la geolocalización del navegador.
- Ingreso manual del edificio, piso o sector.
- Generación de un código dinámico de seguimiento.
- Consulta del estado de una observación.
- Visualización de las observaciones registradas.
- Prevención de registros duplicados mediante una clave de operación.
- Almacenamiento local de borradores ante una interrupción.
- Sincronización del borrador al volver a abrir la aplicación con conexión.

## Pruebas principales

### Recorrido válido

La persona inicia sesión, completa los campos obligatorios y envía el reporte. La aplicación registra la observación, genera un código de seguimiento y asigna el estado inicial RECIBIDA.

### Entrada inválida

Si falta un campo obligatorio, la aplicación muestra un mensaje y no registra la observación hasta que se corrija el dato.

### Interrupción y recuperación

Desde el formulario puede activarse la simulación de falta de conexión mediante el ícono de red. En ese caso, la observación se guarda como borrador local. Para simular la recuperación, se vuelve a abrir la aplicación con conexión y el reporte se sincroniza automáticamente, conservando la misma clave de operación para evitar duplicados.

## Implementación

- React
- Vite
- Tailwind CSS
- React Router
- LocalStorage
- LocalForage
- Vite Plugin PWA
- GitHub Pages
- GitHub Actions

La versión publicada funciona como un prototipo local. No se encuentra conectada con servicios institucionales ni con un backend productivo.

## Ejecución local

```bash
cd frontend
npm install
npm run dev
