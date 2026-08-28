# EcoVoz Urbana - Documentación Técnica (Etapa 3)

A continuación, se detalla el modelado de datos, las reglas de negocio y el pseudocódigo del sistema. *Puedes exportar este archivo a PDF imprimiéndolo directamente desde tu navegador (Ctrl+P o Cmd+P -> Guardar como PDF).*

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
