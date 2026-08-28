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
