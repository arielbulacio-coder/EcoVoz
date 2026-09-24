# EcoVoz Urbana

EcoVoz Urbana es un prototipo académico para registrar y consultar observaciones relacionadas con problemáticas del espacio urbano, como pérdidas de agua, residuos, luminarias y daños en espacios verdes.

El proyecto fue desarrollado en el marco de una actividad académica y permite simular el registro de observaciones, la consulta mediante un código de seguimiento y el funcionamiento con y sin conexión.

## Funcionalidades principales

- Registro de nuevas observaciones.
- Selección de una categoría.
- Descripción del problema.
- Registro de ubicación automática mediante GPS o referencia manual.
- Consulta por código de seguimiento.
- Visualización del estado actual y su historial.
- Listado de observaciones registradas.
- Simulación del funcionamiento sin conexión.
- Guardado local y sincronización de observaciones.
- Prevención de duplicados mediante `id_operacion`.

## Tecnologías utilizadas

- React
- Vite
- React Router
- Tailwind CSS
- Lucide React
- JavaScript
- LocalStorage
- GitHub Pages

## Estructura general

```text
EcoVoz/
├── backend/
├── frontend/
├── revision5/
├── .github/
└── Documentacion_Etapa3.md
Ejecución del frontend

Ingresar en la carpeta del frontend:

cd frontend

Instalar las dependencias:

npm install

Iniciar el entorno de desarrollo:

npm run dev
Etapa 5: mejoras incorporadas

A partir de la devolución recibida y de las pruebas de usuario, se incorporaron mejoras de usabilidad, accesibilidad e identidad institucional.

Mejoras de usabilidad y accesibilidad
Se agregó ayuda para registrar una ubicación precisa.
Se incorporaron límites de caracteres y un contador visible para la descripción.
Se mejoró la visualización de la descripción al consultar una observación.
Se agregó el logo de UNAHUR y una identificación visible del carácter académico del prototipo.
El indicador de conectividad ahora muestra texto junto al ícono:
Con conexión
Simulación sin conexión
Se agregaron atributos de accesibilidad para comunicar el estado del indicador a lectores de pantalla.
Se mejoró la explicación del guardado como borrador local cuando no hay conexión.
Idempotencia mediante id_operacion

Cada nueva observación recibe un identificador único llamado id_operacion.

Este identificador permite reconocer los reintentos de una misma operación. Si una solicitud vuelve a enviarse con el mismo id_operacion, el sistema devuelve la observación creada originalmente en lugar de generar un registro duplicado.

Esto resulta especialmente importante cuando se recupera la conexión y el sistema intenta sincronizar una observación guardada localmente.

Comportamiento esperado
El primer envío crea una observación.
Un segundo envío con el mismo id_operacion devuelve la observación existente.
Ambos envíos reciben el mismo código de seguimiento.
Solo queda almacenada una observación.
Prueba de idempotencia

El repositorio incluye el script:

revision5/test_idempotencia.mjs

Para ejecutarlo desde la raíz del proyecto:

node revision5/test_idempotencia.mjs

Resultado esperado:

Primer envío...
Segundo envío con el mismo id_operacion...
Código del primer envío: EV-AAAA-NNNNNN
Código del segundo envío: EV-AAAA-NNNNNN
Cantidad de observaciones almacenadas: 1
PRUEBA EXITOSA: el reintento no generó duplicados.

La prueba verifica que los dos envíos obtengan el mismo código de seguimiento y que se almacene una única observación.

Persistencia del MVP

Este prototipo utiliza localStorage para simular la persistencia de los datos en el navegador. Por ese motivo, la información almacenada corresponde al dispositivo y al navegador desde donde se utiliza la aplicación.

Evidencias de la Etapa 5

Las evidencias incluyen:

Mejoras en el formulario de observaciones.
Contador y límites de caracteres.
Detalle de ubicación.
Indicador textual de conectividad.
Identidad institucional de UNAHUR.
Visualización completa de las observaciones.
Ejecución exitosa de la prueba de idempotencia.

Las capturas correspondientes se incorporarán en la carpeta revision5/evidencias.
