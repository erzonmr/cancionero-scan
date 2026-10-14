# 4. Flujo de uso

## 1. Biblioteca (inicio)

- Lista de canciones ordenada por última modificación.
- Buscador por **título o letra** (ignora tildes y mayúsculas).
- Indicador de sincronización: 🟢 sincronizado · 🟡 conectando · 🔴 sin conexión.
- Desliza hacia abajo para recargar. **Salir** cierra la sesión.

## 2. Escanear

- Botón **＋ Escanear canción** → cámara trasera con un marco guía.
- **Luz ON/OFF** para la linterna (útil en cancioneros con papel brillante).
- **Galería** para importar una foto ya tomada.
- Tras capturar, la imagen se normaliza: se aplica la orientación EXIF y se reduce a máx. 2400 px por lado.

**Consejos para mejor OCR:** buena luz sin reflejos, la página lo más plana posible, la cámara paralela a la hoja, y que las letras ocupen la mayor parte de la foto.

## 3. Ajustar imagen (edición)

Dos modos, con pestañas arriba:

| Modo | Uso |
|------|-----|
| **Recortar** | Arrastra las esquinas (puntos dorados) o el marco completo para dejar solo la canción. **Todo** selecciona la imagen completa. |
| **Ignorar zonas** | Dibuja rectángulos arrastrando el dedo sobre lo que no debe leerse: número de página, el final de la canción anterior, el inicio de la siguiente, tu mano, notas al margen. Toca la **×** roja para borrar una zona. |

Botones inferiores: **↺ / ↻** girar 90° (reinicia recorte y zonas), **Procesar**.

Al procesar: recorte → OCR → reconstrucción de renglones → filtro de acordes. Tarda 1–3 s en un teléfono de gama media.

## 4. Revisar letra

- Título sugerido (primer renglón que no sea "Coro:", "Estrofa"...).
- Letra **sin acordes**, totalmente editable para corregir errores del OCR.
- Muestra cuántos renglones de acordes se quitaron.
- **Ver texto original del OCR**: el texto con acordes, por si el filtro quitó algo de más. **Volver a filtrar desde el original** restaura la letra filtrada.
- **Repetir** vuelve al editor de imagen. **Guardar en la nube** sube letra + foto.

## 5. Canción

- Lectura con tamaño de letra ajustable (**A− / A+**), pensada para usar en el ensayo o en el altar.
- **Editar** (arriba a la derecha): corrige título y letra.
- **Ver foto**: muestra la imagen escaneada original (URL firmada temporal).
- **Compartir**: envía título + letra por WhatsApp, correo, etc.
- **🗑**: elimina la canción y su foto de la nube.
- Si alguien edita la misma canción en otro dispositivo, la pantalla se actualiza sola (ver [doc 6](06-sincronizacion.md)).
