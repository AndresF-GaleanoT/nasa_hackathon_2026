# MarsWalk Map

Visor de casco para planear y ejecutar una caminata en Marte. Proyecto para el reto
**Interplanetary Survival Guide: Martian Map** del NASA Space Apps Challenge 2026.
La app está en la carpeta [`marswalk/`](marswalk/).

**Pruébala en línea:** <https://andresf-galeanot.github.io/nasa_hackathon_2026/marswalk/>
(sin instalar nada; necesita internet para los mapas de NASA).

## Cómo ejecutarlo

Opción 1: doble clic en `marswalk/index.html` y abrirlo en un navegador con internet.

Opción 2, como servidor local:

```
cd marswalk
python -m http.server 8000
```

y abrir `http://localhost:8000`. No hay que instalar nada más.

Los mapas se piden en vivo a NASA Mars Trek, así que hace falta conexión.
Si el terreno no aparece, la app muestra un aviso en pantalla.

## Qué hace

- **Vista Marte:** cuadrícula global de 15° × 15°. Cada bloque indica cuántos de 6 tipos
  de dato existen ahí (óptico, topografía, térmico, atmósfera, radiación, geología in situ).
- **Zonas desarrolladas:** Jezero (ruta de 1,8 km por el frente del delta),
  Gale (ruta de 1,2 km de Bradbury Landing a Yellowknife Bay) y Monte Sharp
  (ruta de 2,2 km por las formaciones en caja que Curiosity estudió en 2025, con sus tres
  perforaciones: Altadena, Valle de la Luna y Nevado Sajama).
- **Capas:** HiRISE 25 cm, CTX, infrarrojo THEMIS de día y de noche, relieve MOLA y,
  en Gale y Monte Sharp, modelo de elevación HiRISE de 1 m.
- **Comparar (idea de Worldview):** elige una capa en "Comparar" y se ve a la derecha
  de una línea que se arrastra; a la izquierda quedan las demás capas.
- **Fecha (idea de Worldview):** el control "Fecha" en Condiciones recorre el registro
  diario de la estación del rover (REMS o MEDA). Cambia temperatura, amanecer y atardecer,
  y con ellos el aviso de luz.
- **Geología USGS:** cada parada, la base de la zona y cada bloque de la vista global
  consultan en vivo la unidad del mapa geológico global de USGS (Tanaka et al., 2014).
- **Ruta por pendiente:** cada tramo en verde, amarillo o rojo, con perfil de altura.
- **HUD:** objetivo siguiente, distancia, rumbo, brújula, oxígeno, batería, tiempo y dosis.
  El botón ▶ recorre la ruta y las alertas cambian según el punto.
- **Estado de salida:** semáforo que combina terreno, luz, duración, polvo, radiación,
  obstáculos y carga.
- **Obstáculos:** círculos rojos junto a la ruta, solo los que NASA documenta (ver tabla de
  abajo); la fuente aparece al pasar el cursor. El HUD avisa al acercarse. La tripulación puede marcar más con "＋ Marcar obstáculo" y tocando
  el mapa; se guardan en el navegador y se borran con un clic.
- **Equipo, pareja y rover:** kilos de equipo del grupo. En pareja (como hace NASA) se
  reparten entre los dos trajes; con rover de carga, el rover los lleva. La carga frena la
  marcha y cambia la duración, el oxígeno y la batería. Si se apaga "Caminata en pareja",
  el estado de salida avisa.
- **Regreso a pie:** el estado de salida comprueba que el punto más lejano de la ruta quede
  a menos de 1,38 km de la base en línea recta (límite de NASA para Artemis III). El panel
  de objetivo muestra la distancia a la base en cada momento.
- **Idioma:** el botón EN / ES de la barra superior cambia toda la página entre español e
  inglés y recuerda la elección. Los textos en inglés de las zonas están en `marswalk/js/en.js`.
- **Pantallas:** computadora y tableta horizontal muestran el visor completo. En tableta
  vertical y teléfono (menos de 900 px) el mapa queda arriba y los paneles debajo, con
  desplazamiento; la ficha de cada parada sale como hoja inferior.
- **Paradas:** foto real del rover en ese punto, hallazgos científicos, tarea y
  "Vista en el sitio", que muestra la foto a pantalla completa dentro del visor.

## Estructura

```
marswalk/
  index.html      estructura de la pantalla
  css/hud.css     estilo del visor
  js/data.js      zonas, rutas, paradas, capas y límites (en español)
  js/en.js        textos en inglés de las zonas
  js/app.js       mapa, cálculos y HUD (los textos usan T('español', 'inglés'))
```

Para añadir una zona, agrega una entrada a `ZONES` en `marswalk/js/data.js` con sus puntos,
ruta, paradas y capas, y un botón `data-mode` en `marswalk/index.html`.

## Datos de NASA usados

| Dato | Misión / instrumento | Fuente |
|---|---|---|
| Mapas base y capas | Viking, MGS MOLA, Mars Odyssey THEMIS, MRO CTX y HiRISE | https://trek.nasa.gov/mars/ (servicio WMTS) |
| Ruta y alturas de Jezero | Perseverance, sols 436–709 | https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json |
| Ruta y alturas de Gale | Curiosity, sols 3–133 | https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json |
| Ruta y alturas de Monte Sharp | Curiosity, sols 4541–4711 | mismo archivo de MSL |
| Contexto de Monte Sharp | Ruta propuesta de Curiosity y blog de la misión | https://science.nasa.gov/resource/curiositys-proposed-path-up-mount-sharp/ y https://science.nasa.gov/blog/ |
| Clima de Jezero | MEDA, sols 1127–1133 (en vivo) | https://mars.nasa.gov/rss/api/?feed=weather&category=mars2020&feedtype=json |
| Clima de Gale y Monte Sharp | REMS, todo el registro (en vivo) | https://mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json |
| Fotos de las paradas | Navcam, Hazcam, Mastcam, Mastcam-Z | https://mars.nasa.gov/mars2020/multimedia/raw-images/ y API de fotos de MSL |
| Clima espacial | NASA DONKI (CCMC): WSA-ENLIL y SEP | https://api.nasa.gov/ (DONKI). La clave va en `NASA_KEY`, `marswalk/js/data.js` |
| Unidad geológica | USGS, mapa global de Marte (SIM 3292) | https://astrogeology-usgs.hub.arcgis.com/pages/interactive-maps-mars (servicio ArcGIS) |
| Ideas de interfaz | Comparar capas y control de fecha | https://worldview.earthdata.nasa.gov/ |
| Radiación | RAD (Curiosity), 0,64 mSv/día | Hassler et al., Science, 2014 |

Créditos de imagen: NASA/JPL-Caltech, USGS, ASU, MSSS.

### Fuentes de los obstáculos

| Zona | Obstáculo | Fuente |
|---|---|---|
| Gale | Arena suelta en Rocknest (costra de 0,5 cm sobre arena fina) | https://www.jpl.nasa.gov/images/pia16469-scoop-marks-in-the-sand-at-rocknest/ |
| Gale | Escalón de ~0,5 m al entrar a Yellowknife Bay | https://www.jpl.nasa.gov/news/curiosity-rover-nearing-yellowknife-bay/ |
| Monte Sharp | Arena o grava en el fondo de los huecos | https://science.nasa.gov/blog/curiosity-blog-sols-4689-4694-drill-in-the-boxwork-unit-is-go/ |
| Monte Sharp | Crestas de 1–2 m, poco más anchas que el rover | https://www.nasa.gov/missions/mars-science-laboratory/curiosity-rover/NASAs-curiosity-rover-sees-martian-spiderwebs-up-close/ |

Jezero no tiene obstáculos de fábrica: no se encontró uno documentado por NASA en esta ruta.

## Qué es real y qué es supuesto

- **Real:** mapas, rutas, alturas, fotos, clima y hallazgos de cada parada.
- **Referencia:** la radiación de Jezero usa la medida de Gale; no hay medidor en Jezero.
- **Real, en vivo:** clima espacial de NASA DONKI. Si una CME llega a Marte en los próximos
  3 días (modelo WSA-ENLIL) o hubo un evento de partículas en 2 días, pone "Alerta solar".
  Nunca pone "Evento de partículas" sola: DONKI no mide partículas en Marte, así que esa
  opción la elige la tripulación. Cualquier elección manual manda sobre DONKI.
- **Simulado:** polvo, oxígeno y batería son controles o modelos simples.
- **Límites de NASA** (en `ASSUME`, `marswalk/js/data.js`): son los del traje xEVA de Artemis III,
  para la Luna; NASA no ha publicado los de Marte. Fuente: Scoville, Z. (2021), *Artemis III
  EVA Mission Capability for de Gerlache-Shackleton Ridge*, NASA, NTRS 20210026296,
  https://ntrs.nasa.gov/citations/20210026296
  - 2 km/h a pie con traje.
  - Caminata nominal de 6 h (± 2 h) y traje de al menos 8 h.
  - Regreso a pie: hasta 1,38 km en línea recta de la base.
  - El astronauta debe poder caminar en pendientes de 20°.
- **Caminatas en pareja:** "EVAs are performed in buddy pairs", para responder a
  emergencias. Fuente: NASA, *EVA Ops 101 for Artemis 3 External Teams* (2024), NTRS
  20240005248. En Apolo 15–17, el BSLSS dejaba a un astronauta compartir el enfriamiento de
  su traje con el otro, y les daba unos 75 min para volver al módulo:
  https://www.nasa.gov/history/alsj/WOTM/WOTM-BSLSS.html
- **Supuestos:** batería 10 h, umbrales de pendiente 8° y 15°, cada kg de carga por traje
  reduce la velocidad 1 % (aviso a partir de 20 kg), aviso a 15 m de un obstáculo.

## Limitaciones

- La ruta sigue el camino que ya recorrió el rover; no la calcula un algoritmo.
  Los obstáculos se avisan, pero la ruta no se desvía sola para rodearlos. No se agregan
  desvíos porque no hay un servicio público de alturas de Marte que dé la pendiente de un
  punto nuevo; el modelo de 1 m de HiRISE solo se publica como imagen.
- Los obstáculos de fábrica están en la posición del rover junto al obstáculo, no en su
  borde real, y su radio es estimado. Hay que confirmar su extensión en HiRISE antes de salir.
- La pendiente se mide entre puntos separados 5–200 m; tramos cortos más empinados
  pueden no verse.
- No hay capa orbital de minerales (CRISM): no se encontró un servicio de teselas
  para estas zonas. La geología viene de los instrumentos de los rovers.
- El clima de Jezero es el último que publica la API (abril de 2024): solo 4 sols válidos.
- El mapa geológico de USGS es global (escala 1:20 000 000): describe la región, no la
  roca de cada parada. No hay mapas detallados de USGS para estas tres zonas.
- Sin internet, el clima queda en el valor guardado en `marswalk/js/data.js` y la geología muestra
  un aviso.
- `DEMO_KEY` de api.nasa.gov admite pocas consultas por hora. La respuesta de DONKI se
  guarda una hora en el navegador; para la presentación conviene una clave propia (gratis).
- La consulta de llamaradas de DONKI (FLR) devolvía error 404 en noviembre de 2026, por eso
  no se usa.
