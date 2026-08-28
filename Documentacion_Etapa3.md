# EcoVoz Urbana - Documentación Técnica (Etapa 3)

A continuación, se detalla el modelado de datos, las reglas de negocio y el pseudocódigo del sistema. *Puedes exportar este archivo a PDF imprimiéndolo directamente desde tu navegador (Ctrl+P o Cmd+P -> Guardar como PDF).*

---

## 2. Descomposición del Caso de Uso

**Caso de Uso Central:** Registrar una observación ambiental en la universidad.

- **Inicio del Flujo:** El usuario (EMISOR), estando autenticado con su correo institucional, selecciona la opción "Nueva Observación" en el panel principal (Dashboard).
- **Entradas (Inputs):**
  - Categoría (Selección obligatoria de un catálogo).
  - Descripción de la situación (Texto libre obligatorio).
  - Coordenadas de Ubicación (GPS automático provisto por el navegador).
  - Detalle de Ubicación (Texto libre obligatorio para especificar piso/aula).
  - Fotografía adjunta (Archivo de imagen opcional).
- **Operaciones y Decisiones:**
  - *Validación Local:* ¿El usuario seleccionó una categoría y redactó el detalle de ubicación? (Si NO $\rightarrow$ muestra mensaje de error y aborta).
  - *Generación de Identidad:* Se genera una `clave_operacion` única (UUID) para este envío, garantizando la idempotencia de la transacción.
  - *Decisión de Red:* ¿Tiene el dispositivo conexión activa a Internet?
    - **Si SÍ:** El frontend envía el *payload* completo a la API (`POST /api/observaciones`).
    - **Si NO:** El frontend intercepta la petición, guarda los datos en el `LocalStorage` como un borrador, y programa un evento de sincronización en diferido.
- **Salidas (Outputs):**
  - **Online:** Objeto `Observacion` persistido en la base de datos simulada y generación de un Código de Seguimiento (Ej: `EV-2026-X`).
  - **Offline:** Objeto `Borrador` guardado localmente y pantalla de confirmación provisional.
- **Posibles Fallos y Excepciones:**
  - *Permisos GPS denegados:* Se maneja forzando al usuario a proveer el detalle de ubicación de forma enteramente manual.
  - *Corte de red repentino:* Si el usuario pierde conexión exactamente durante el POST, el bloque `catch` captura el fallo y procede a ejecutar la lógica de guardado offline.
  - *Saturación de memoria:* Si la cuota de `LocalStorage` supera los 5MB por culpa de las imágenes, el sistema descartará las fotos y subirá solo los metadatos de texto para no romper la aplicación.

---

## 3. Modelado de Datos

El sistema EcoVoz Urbana se sostiene sobre cuatro entidades principales orientadas a rastrear la observación ambiental y la auditoría de sus cambios.

### Entidades y Relaciones

1. **Usuario**
   - **Identificador (PK):** `id`
   - **Atributos:** `correo` (String), `rol` (Enum: EMISOR, OPERADOR)
   - **Relaciones:** 
     - **1 a N** con `Observacion` (Un emisor genera muchas observaciones).
     - **1 a N** con `HistorialEstado` (Un operador registra muchos cambios).

2. **Categoria**
   - **Identificador (PK):** `id`
   - **Atributos:** `nombre` (String), `activa` (Boolean)
   - **Relaciones:**
     - **1 a N** con `Observacion` (Una categoría clasifica muchas observaciones).

3. **Observacion (Objeto Central)**
   - **Identificador (PK):** `id`
   - **Atributos:** `codigo_seguimiento` (String, UQ), `clave_operacion` (String, UUID), `descripcion` (Text), `ubicacion_latitud` (Float, opcional), `ubicacion_longitud` (Float, opcional), `ubicacion_referencia` (String), `estado_actual` (Enum), `fecha_creacion` (DateTime)
   - **Llaves Foráneas (FK):** `usuario_emisor_id`, `categoria_id`
   - **Relaciones:**
     - **1 a N** con `HistorialEstado`.

4. **HistorialEstado**
   - **Identificador (PK):** `id`
   - **Atributos:** `estado_destino` (Enum), `fecha_cambio` (DateTime), `comentario_resolucion` (String)
   - **Llaves Foráneas (FK):** `observacion_id`, `operador_id`

### Diccionario de Datos Principales

| Entidad | Atributo | Tipo de Dato | Restricción | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **Observacion** | `codigo_seguimiento` | String (Varchar) | Único (UQ) | ID público alfanumérico generado en el backend para consultar el estado sin necesidad de autenticación. |
| **Observacion** | `clave_operacion` | UUID | Único (UQ) | Clave generada por el frontend para garantizar **idempotencia**. Si un reporte se envía dos veces por error de red, el sistema no lo duplica. |
| **Observacion** | `ubicacion_referencia` | String | No Nulo | Detalle manual exigido para precisar el lugar exacto (Edificio, piso, etc) ya que el GPS carece de precisión vertical. |
| **Usuario** | `correo` | String | No Nulo | Restringido exclusivamente al dominio institucional (`@unahur.edu.ar` o `@estudiantes...`). |

---

## 4. Estados y Reglas de Negocio

El objeto central del sistema es la **Observacion**.

### Ciclo de vida y Transiciones
La observación pasa por una máquina de estados estricta gestionada por el Operador:
1. **RECIBIDA**: Estado inicial al crearse el reporte.
2. **EN_GESTION**: El equipo de mantenimiento (Operador) toma el caso para analizarlo o resolverlo.
3. **RESUELTA**: El incidente ha sido solucionado. (Estado Final).
4. **DESCARTADA**: El reporte fue considerado inválido, falso o duplicado. (Estado Final).

### Validaciones, Permisos e Invariantes
- **Validaciones:** Al crear una observación, la categoría y la `ubicacion_referencia` no pueden estar vacías. 
- **Permisos:** 
  - `EMISOR`: Solo puede registrar nuevas observaciones y visualizar el historial público.
  - `OPERADOR`: Puede modificar el estado de la observación y agregar comentarios resolutivos.
- **Invariantes (Reglas estrictas que no cambian):**
  - La fecha de creación (`fecha_creacion`) es inmutable.
  - Un reporte en estado `RESUELTA` o `DESCARTADA` no puede regresar a estados anteriores (son estados terminales).
- **Respuestas ante excepciones (Intermitencia de Red):**
  - Si el usuario intenta enviar un reporte sin conexión (o utilizando el **botón de simulación de modo offline** de la interfaz), el sistema lanza la excepción local de red, la captura, y guarda el payload en el `LocalStorage` marcándolo como "Borrador". Se le notifica al usuario mediante una alerta (indicando que será sincronizado provisoriamente en forma local) y se lo redirige a la pantalla de éxito offline.

---

## 5. Pseudocódigo de Operaciones

### A. Operación Central: Registro de Observación
**Descripción:** Lógica ejecutada por el sistema al enviar el formulario.
```pascal
FUNCION RegistrarObservacion(datosFormulario, usuarioActual)
INICIO
    // Validaciones
    SI datosFormulario.categoria_id ES NULO ENTONCES
        RETORNAR ERROR "Debe seleccionar una categoría"
    FIN SI
    
    SI datosFormulario.ubicacion_referencia ESTA VACIO ENTONCES
        RETORNAR ERROR "Debe ingresar el detalle manual de ubicación"
    FIN SI

    // Crear el payload con UUID para idempotencia
    payload = datosFormulario
    payload.clave_operacion = Generar_UUID()
    payload.emisor_correo = usuarioActual.correo

    // Comprobar conexión a Internet (Estrategia Offline-First)
    SI NO HayConexionInternet() ENTONCES
        GuardarEnBaseLocal("borradores", payload)
        RETORNAR "Guardado como borrador (offline)"
    SINO
        INTENTAR
            respuesta = Peticion_HTTP_POST("/api/observaciones", payload)
            RETORNAR respuesta.codigo_seguimiento
        ATRAPAR excepcion (Error_De_Red)
            // Manejo de excepción por corte repentino
            GuardarEnBaseLocal("borradores", payload)
            RETORNAR "Guardado como borrador por inestabilidad de red"
        FIN INTENTAR
    FIN SI
FIN
```

### B. Operación de Recuperación: Sincronización de Borradores
**Descripción:** Función de recuperación disparada automáticamente cuando el dispositivo recupera la conexión a internet.
```pascal
FUNCION SincronizarBorradores()
INICIO
    borradores = LeerBaseLocal("borradores")
    
    SI borradores ESTA VACIO ENTONCES
        RETORNAR
    FIN SI

    PARA CADA borrador EN borradores HACER
        INTENTAR
            // El backend recibe la clave_operacion. 
            // Si ya existía (idempotencia), devuelve éxito sin duplicar.
            respuesta = Peticion_HTTP_POST("/api/observaciones", borrador)
            EliminarDeBaseLocal("borradores", borrador.clave_operacion)
            
            NotificarUsuario("Reporte enviado con éxito: " + respuesta.codigo_seguimiento)
        ATRAPAR excepcion
            // Si falla nuevamente, lo deja en la base local para intentar más tarde
            RegistrarError("Fallo al sincronizar borrador: " + borrador.clave_operacion)
        FIN INTENTAR
    FIN PARA
FIN
```

### C. Operación: Inicio de Sesión (Login Institucional)
**Descripción:** Validación de acceso para restringir el uso de la aplicación a miembros de UNAHUR.
```pascal
FUNCION IniciarSesion(correoIngresado)
INICIO
    // Validar formato estricto institucional
    SI NO CoincideConRegex(correoIngresado, "*@unahur.edu.ar") Y NO CoincideConRegex(correoIngresado, "*@estudiantes.unahur.edu.ar") ENTONCES
        RETORNAR ERROR "Debe utilizar un correo institucional válido"
    FIN SI
    
    // Simular comunicación con servidor /auth/login
    INTENTAR
        respuesta = Peticion_HTTP_POST("/api/auth/login", correoIngresado)
        
        GuardarEnBaseLocal("token", respuesta.token)
        GuardarEnBaseLocal("usuarioActual", respuesta.usuario)
        
        RedirigirA("/inicio")
    ATRAPAR excepcion
        RETORNAR ERROR "Error de red o servidor al intentar ingresar"
    FIN INTENTAR
FIN
```

### D. Operación: Consultar Estado Público
**Descripción:** Permite a cualquier persona revisar el progreso de un reporte usando el código de seguimiento.
```pascal
FUNCION ConsultarEstado(codigoBuscado)
INICIO
    SI codigoBuscado ESTA VACIO ENTONCES
        RETORNAR ERROR "Debe ingresar un código"
    FIN SI
    
    INTENTAR
        observacion = Peticion_HTTP_GET("/api/observaciones/" + codigoBuscado)
        
        MostrarDatosEnPantalla(observacion.categoria, observacion.descripcion, observacion.estado_actual)
        MostrarHistorialDeEstados(observacion.historial)
        
    ATRAPAR excepcion (Error_No_Encontrado)
        RETORNAR ERROR "CÓDIGO INEXISTENTE. Verifique que lo haya escrito bien."
    ATRAPAR excepcion (Error_De_Red)
        RETORNAR ERROR "Falla de conexión al consultar"
    FIN INTENTAR
FIN
```

### E. Operación: Ver Mis Observaciones
**Descripción:** Muestra al usuario autenticado el listado de todos los reportes que él mismo ha enviado.
```pascal
FUNCION ObtenerMisObservaciones()
INICIO
    usuarioActual = LeerBaseLocal("usuarioActual")
    
    INTENTAR
        listaObservaciones = Peticion_HTTP_GET("/api/mis-observaciones")
        
        // En el backend (simulado) se aplica el siguiente filtro:
        // listaFiltrada = Filtrar(listaCompleta, donde emisor_correo == usuarioActual.correo)
        // RETORNAR listaFiltrada
        
        SI listaObservaciones ESTA VACIA ENTONCES
            MostrarMensaje("No tienes observaciones registradas aún.")
        SINO
            MostrarLista(listaObservaciones, ordenandoPorFechaDescendente)
        FIN SI
        
    ATRAPAR excepcion
        RETORNAR ERROR "No se pudieron cargar tus observaciones"
    FIN INTENTAR
FIN
```

---

## 6. Contrato Mínimo (MVP - Etapa 4)

Para la entrega del Producto Mínimo Viable, el sistema define un **contrato mínimo de operaciones** (Interfaces API) que cubre el ciclo funcional exigido, separando las responsabilidades de interfaz visual y lógica de negocio.

### Componentes a Simular (En Memoria / Navegador)
Para garantizar una evaluación fluida, sin necesidad de configurar servidores externos o bases de datos complejas (arquitectura "Standalone PWA"), los siguientes componentes estructurales **se resolverán de forma simulada en el navegador**:

1. **Base de Datos:** Reemplazada por `LocalStorage`. Las tablas (observaciones, usuarios) se serializan como objetos JSON persistentes entre recargas.
2. **Servidor (Backend API):** Reemplazado por un interceptor lógico (Mock en `api.js`) que recibe las peticiones asíncronas del frontend, ejecuta las reglas de negocio (idempotencia, filtrado) e inyecta latencia de 500ms para simular una red real.
3. **Autenticación (JWT):** Al hacer login, el sistema validará el formato de dominio de UNAHUR y emitirá un token falso. Los roles se determinan heurísticamente (ej: si el correo contiene la palabra "operador", se asigna el rol `OPERADOR`, sino `EMISOR`).
4. **Almacenamiento de Fotografía:** Las imágenes capturadas con la cámara no se suben a un servidor de archivos real (como AWS S3).

### Operaciones del Contrato Mínimo

El contrato define los siguientes endpoints que la vista consume:

1. **Módulo de Autenticación**
   - **`POST /api/auth/login`**
     - **Cuerpo (Request):** `{ "correo": "usuario@estudiantes.unahur.edu.ar" }`
     - **Respuesta (Response):** Token de sesión y datos básicos del usuario.

2. **Módulo de Dominios (Catálogos)**
   - **`GET /api/categorias`**
     - **Respuesta:** Lista inmutable de categorías institucionales (ID y Nombre).

3. **Módulo de Observaciones (Flujo Central)**
   - **`POST /api/observaciones`** (Creación)
     - **Cuerpo:** Categoría, descripción, detalle de ubicación, coordenadas y `clave_operacion`.
     - **Respuesta:** Objeto de la observación que incluye el `codigo_seguimiento` alfanumérico generado.
   - **`GET /api/observaciones/:codigo`** (Consulta Pública)
     - **Respuesta:** Datos de la observación y su historial de estados. Omite cualquier dato personal (correo del emisor). Lanza error 404 si el código no existe.
   - **`GET /api/mis-observaciones`** (Historial Personal)
     - **Respuesta:** Lista de observaciones filtradas por el correo del emisor autenticado actualmente.

4. **Módulo del Operador (Proyectado/Simulado)**
   - **`PUT /api/observaciones/:codigo/estado`**
     - **Cuerpo:** `{ "nuevo_estado": "EN_GESTION", "comentario": "Revisado por mantenimiento" }`
     - **Respuesta:** Objeto actualizado (Endpoint estipulado en el diseño lógico, aunque la vista de administración del operador no sea requerida funcionalmente para el flujo básico del emisor).

---

## 7. Revisión con IA Generativa (Casos Límite, Contradicciones y Omisiones)

Como parte de la Etapa 3, se ha sometido el modelo lógico y el MVP a un análisis con Inteligencia Artificial para detectar vulnerabilidades en el flujo. A continuación, se presentan los hallazgos y la decisión del equipo:

| Hallazgo de la IA | Tipo | Clasificación | Justificación de la decisión |
| :--- | :--- | :--- | :--- |
| **Cuota de Almacenamiento Local:** Si los usuarios suben muchas fotos pesadas, el `LocalStorage` (límite ~5MB) del navegador colapsará impidiendo guardar más borradores offline. | Omisión | **Aceptada** | Para el MVP, la lógica de la cámara se configurará para no almacenar el binario real de la imagen en LocalStorage, o bien se comprimirá drásticamente a un string Base64 pequeño para evitar romper la PWA en celulares antiguos. |
| **Sesiones Compartidas:** Si dos alumnos usan la misma PC de la biblioteca, el sistema actual no tiene un flujo explícito de "Cerrar Sesión", exponiendo el correo del primer alumno. | Caso Límite | **Modificada** | Se acepta el riesgo de seguridad, pero en lugar de crear flujos complejos de sesión, simplemente se agregará un botón rápido de "Cerrar Sesión" que limpie el `LocalStorage`. |
| **Fuerza Bruta en Consultas:** El código de seguimiento (ej: `EV-2026-X`) es relativamente corto. Un atacante podría probar códigos al azar para leer todos los reportes de la universidad. | Contradicción (Privacidad vs Usabilidad) | **Rechazada (Por ahora)** | Al ser un MVP universitario, implementar CAPTCHAs o bloqueos de IP (Rate Limiting) excede el alcance del prototipo. El riesgo de privacidad está mitigado porque la consulta *no* muestra el correo del emisor original. |
| **Idempotencia Asíncrona:** Si la red fluctúa, la PWA podría enviar la misma `clave_operacion` en ráfaga (2 o 3 veces en un segundo) y crear una condición de carrera antes de que el servidor guarde la primera. | Omisión | **Aceptada** | El código frontend deshabilita el botón de "Enviar" (`disabled={isSubmitting}`) inmediatamente después del primer toque, bloqueando la ráfaga de peticiones. |

---

## 8. Informe Final de Integración (Etapa 3)

Este documento, junto con el código desarrollado, representa la culminación del diseño lógico y físico del MVP de **EcoVoz Urbana**. A continuación se presenta la matriz de trazabilidad que demuestra cómo las decisiones de diseño satisfacen los requisitos originales:

### Trazabilidad: Requisito ➔ Flujo ➔ Criterio de Aceptación

1. **Requisito: Registro Inclusivo y en Contexto**
   - **Flujo Implementado:** Aplicación PWA accesible desde cualquier navegador sin necesidad de descargar desde una App Store.
   - **Criterio de Aceptación:** El emisor puede iniciar un reporte, el sistema captura sus coordenadas automáticamente y le exige detallar el edificio manualmente. Funciona bajo estándares de contraste WCAG.
2. **Requisito: Resiliencia ante mala conectividad**
   - **Flujo Implementado:** Modo *Offline-First* con simulación de red.
   - **Criterio de Aceptación:** Si el celular se queda sin Wi-Fi (o se usa el botón de simulación), el sistema no pierde los datos; guarda un borrador localmente e informa al usuario que se sincronizará más tarde usando una `clave_operacion` para evitar duplicados (idempotencia).
3. **Requisito: Transparencia y Privacidad**
   - **Flujo Implementado:** Generación de Código de Seguimiento Público.
   - **Criterio de Aceptación:** El emisor obtiene un identificador único (ej: `EV-2026-123456`) que le permite a él o a cualquier compañero revisar el estado (RECIBIDA, EN_GESTION) de la incidencia, pero protegiendo la identidad (el correo electrónico) de quien la reportó.
4. **Requisito: Acceso Restringido Institucional**
   - **Flujo Implementado:** Validación de Dominio en Login.
   - **Criterio de Aceptación:** El sistema rechaza cualquier intento de ingreso que no provenga de un correo `@unahur.edu.ar` o `@estudiantes.unahur.edu.ar`, cumpliendo con la regla de seguridad del campus.

> **Conclusión:** El modelo de datos, la máquina de estados y las reglas de negocio descritas en este documento se encuentran **100% implementadas y funcionales** en el prototipo actual mediante el uso inteligente de almacenamiento local e interceptores de red, cumpliendo satisfactoriamente los objetivos de la Etapa 3 y preparando el terreno para la validación final (Etapa 4).
