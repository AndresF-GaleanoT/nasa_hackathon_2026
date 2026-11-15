/* =====================================================================
   Marswalk HUD · lógica
   1. utilidades y geometría   2. mapa y capas   3. construcción de zonas
   4. cuadrícula global        5. HUD (objetivo, traje, estado, alertas)
   6. paradas y vista en el sitio   7. arranque
   ===================================================================== */

/* ---------- 1. utilidades ---------- */
const $ = id => document.getElementById(id);
const rad = d => d*Math.PI/180, deg = r => r*180/Math.PI;
const hhmm = h => { const m=Math.round(h*60); return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'); };
const toH = s => { const [h,m]=s.split(':').map(Number); return h+m/60; };
const card16 = b => T(['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO'],
                       ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'])[Math.round(b/22.5)%16];
const colSlope = s => s>ASSUME.slopeBad ? '#ff5d5d' : s>=ASSUME.slopeWarn ? '#ffcf5a' : '#6dffa8';

// distancia sobre la esfera de Marte entre dos puntos [lon, lat]
function dist(a,b){
  const dLat=rad(b[1]-a[1]), dLon=rad(b[0]-a[0]);
  const h=Math.sin(dLat/2)**2+Math.cos(rad(a[1]))*Math.cos(rad(b[1]))*Math.sin(dLon/2)**2;
  return 2*R_MARS*Math.asin(Math.sqrt(h));
}
// rumbo inicial de a hacia b, en grados desde el norte
function bearing(a,b){
  const f1=rad(a[1]), f2=rad(b[1]), dl=rad(b[0]-a[0]);
  return (deg(Math.atan2(Math.sin(dl)*Math.cos(f2), Math.cos(f1)*Math.sin(f2)-Math.sin(f1)*Math.cos(f2)*Math.cos(dl)))+360)%360;
}
// distancia (m) del punto p al tramo a-b; plano local, válido para tramos de pocos km
function distSeg(p,a,b){
  const k = rad(1)*R_MARS, c = Math.cos(rad(p[1]));
  const ax=(a[0]-p[0])*k*c, ay=(a[1]-p[1])*k, bx=(b[0]-p[0])*k*c, by=(b[1]-p[1])*k;
  const dx=bx-ax, dy=by-ay, L2=dx*dx+dy*dy, t = L2 ? Math.max(0,Math.min(1,-(ax*dx+ay*dy)/L2)) : 0;
  return Math.hypot(ax+t*dx, ay+t*dy);
}
console.assert(Math.abs(distSeg([0,0.001],[-1,0],[1,0]) - rad(0.001)*R_MARS) < 0.01, 'distSeg');

/* ---------- 2. mapa ---------- */
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
const map = L.map('map',{crs:L.CRS.EPSG4326, minZoom:1, maxZoom:18, attributionControl:false,
  maxBounds:[[-90,-180],[90,180]], maxBoundsViscosity:.8});
const tl = (id,ext,mx,o={}) => L.tileLayer(TREK+id+TILE+ext, Object.assign(
  {maxNativeZoom:mx, maxZoom:18, noWrap:true, errorTileUrl:BLANK, bounds:[[-90,-180],[90,180]]}, o));
const base = tl('Mars_Viking_MDIM21_ClrMosaic_global_232m','jpg',7).addTo(map);
let tilesOk = false;
base.on('tileload', () => { tilesOk = true; $('offline').style.display = 'none'; });
setTimeout(() => { if(!tilesOk) $('offline').style.display = 'block'; }, 6000);

/* ---------- 3. zonas ---------- */
const built = {};
let S = null;            // zona activa (objeto construido)
let playing = null;      // temporizador de la animación

function build(key){
  if(built[key]) return built[key];
  const z = ZONES[key], route = z.route.map(k => z.pts[k]), segs = [];
  let cum = 0;
  for(let i=1;i<route.length;i++){
    const a=route[i-1], b=route[i], d=dist(a,b), dz=b[2]-a[2];
    const slope = deg(Math.atan2(Math.abs(dz), d));
    const f = Math.max(0.35, 1 - slope/25);                       // la pendiente frena la marcha
    segs.push({a,b,d,dz,slope,from:cum,to:cum+d,t:d/(ASSUME.speedKmh/3.6*f),brg:bearing(a,b)});
    cum += d;
  }
  const stops = z.stops.map(s => { const idx=z.route.indexOf(s.key);
    return Object.assign({}, s, {idx, at: idx===0 ? 0 : segs[idx-1].to, p: z.pts[s.key]}); });

  const gRoute = L.layerGroup(), gStops = L.layerGroup();
  L.polyline(route.map(p=>[p[1],p[0]]),{color:'#001018',weight:9,opacity:.6}).addTo(gRoute);
  segs.forEach(s => L.polyline([[s.a[1],s.a[0]],[s.b[1],s.b[0]]],{color:colSlope(s.slope),weight:4})
    .bindTooltip(`${s.d.toFixed(0)} m · ${s.dz>=0?'+':''}${s.dz.toFixed(1)} m · ${s.slope.toFixed(1)}°`,{sticky:true}).addTo(gRoute));
  const me = L.marker([route[0][1],route[0][0]],{icon:L.divIcon({className:'',html:'<div class="me"><i></i></div>',iconSize:[26,26],iconAnchor:[13,13]}),
    zIndexOffset:1000, interactive:false}).addTo(gRoute);
  stops.forEach((s,i) => L.marker([s.p[1],s.p[0]],{icon:L.divIcon({className:'',html:`<div class="stopicon"><b>${s.tag}</b></div>`,iconSize:[26,26],iconAnchor:[13,13]})})
    .bindTooltip(s.name).on('click',()=>showStop(i)).addTo(gStops));

  const defs = z.layers.concat(GLOBAL_LAYERS), tiles = {};
  defs.forEach(l => tiles[l.id] = tl(l.tile, l.ext, l.max, {zIndex: l.overlay ? 5 : (l.z||2), bounds: l.bounds || [[-90,-180],[90,180]]}));

  return built[key] = {key, z, route, segs, stops, defs, tiles, gRoute, gStops, me, gHaz: L.layerGroup(),
    haz: (z.hazards||[]).concat(loadMarks(key)),
    TOTAL: cum, MAXS: Math.max(...segs.map(s=>s.slope)), WALK_S: segs.reduce((a,s)=>a+s.t,0),
    RMAX: Math.max(...route.map(p => dist(route[0], p))),   // punto más lejano de la base, en línea recta
    ASC: segs.reduce((a,s)=>a+Math.max(0,s.dz),0), bounds: L.latLngBounds(route.map(p=>[p[1],p[0]]))};
}

function clearZone(){
  if(!S) return;
  [S.gRoute, S.gStops, S.gHaz, ...Object.values(S.tiles)].forEach(l => map.removeLayer(l));
}

/* obstáculos: los de data.js más los que marca la tripulación (guardados en este navegador) */
const MARS_TO_EARTH = 6371000 / R_MARS;   // L.circle mide en radio terrestre
function loadMarks(key){ try { return JSON.parse(localStorage.getItem('mw-haz-'+key)) || []; } catch(e){ return []; } }
function saveMarks(){ try { localStorage.setItem('mw-haz-'+S.key, JSON.stringify(S.haz.filter(h=>h.user))); } catch(e){} }
function drawHaz(){
  S.gHaz.clearLayers();
  S.haz.forEach(h => {
    const tip = `${h.name} · ${T('radio estimado','estimated radius')} ${h.r} m<br>${h.txt}${h.src?`<br><i>${T('Fuente','Source')}: ${h.src}</i>`:''}${h.user?`<br><i>${T('Clic para borrar','Click to delete')}</i>`:''}`;
    const c = L.circle([h.p[1],h.p[0]], {radius:h.r*MARS_TO_EARTH, color:'#ff5d5d', weight:2, dashArray:'4 4', fillOpacity:.18}).bindTooltip(tip).addTo(S.gHaz);
    // ícono desplazado para que no lo tape el de una parada en el mismo punto
    const m = L.marker([h.p[1],h.p[0]], {icon:L.divIcon({className:'', html:'<div style="color:#ff5d5d;font-size:18px;text-shadow:0 0 4px #000">⚠</div>', iconSize:[18,18], iconAnchor:[-10,22]})}).bindTooltip(tip).addTo(S.gHaz);
    if(h.user) [c,m].forEach(l => l.on('click', e => { L.DomEvent.stop(e); S.haz.splice(S.haz.indexOf(h),1); saveMarks(); drawHaz(); update(); }));
  });
}
let marking = false;
function toggleMark(on){ marking = on; $('btnMark').classList.toggle('on', on); map.getContainer().style.cursor = on ? 'crosshair' : ''; }
map.on('click', e => {
  if(!marking || !S) return;
  S.haz.push({p:[e.latlng.lng, e.latlng.lat], r:10, name:T('Obstáculo marcado','Marked hazard'), txt:T('Marcado por la tripulación.','Marked by the crew.'), user:true});
  saveMarks(); drawHaz(); toggleMark(false); update();
});

/* geología: unidad del mapa global de USGS (Tanaka et al. 2014, SIM 3292) en un punto */
const USGS_Q = 'https://services.arcgis.com/v01gqwM5QqNysAAi/arcgis/rest/services/Tanaka_et_al_2014_Mars_Global_Map_Features/FeatureServer/3/query?f=json&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=Unit,UnitDesc,Interpretation&returnGeometry=false&inSR=4326&geometry=';
const geoCache = {};
function showGeo(el, lon, lat){
  const k = lon.toFixed(3)+','+lat.toFixed(3); el.dataset.q = k;
  el.innerHTML = `<span class="dim">${T('Consultando USGS…','Querying USGS…')}</span>`;
  geoCache[k] = geoCache[k] || fetch(USGS_Q+k).then(r=>r.json())
    .then(j => j.features && j.features[0] ? j.features[0].attributes : null)
    .catch(() => { delete geoCache[k]; return null; });
  geoCache[k].then(a => { if(el.dataset.q !== k) return;   // el usuario ya pidió otro punto
    el.innerHTML = a ? `<b>${a.Unit}</b> · ${a.UnitDesc}<div class="dim sm">${a.Interpretation}</div>` : `<span class="dim">${T('El servicio de USGS no respondió.','The USGS service did not respond.')}</span>`; });
}

/* clima por fecha: la API de NASA publica el registro de cada sol (como el control de fecha de Worldview) */
const WX = {};
function loadWx(feed){
  return WX[feed] = WX[feed] || fetch(`https://mars.nasa.gov/rss/api/?feed=weather&category=${feed}&feedtype=json`).then(r=>r.json())
    .then(j => (j.soles||j.sols||[]).filter(s => s.min_temp!=='--' && s.max_temp!=='--' && s.sunrise && s.sunset).sort((a,b)=>a.sol-b.sol))
    .catch(() => { delete WX[feed]; return []; });
}
async function initWx(){
  const z = S.z, list = await loadWx(z.wxFeed), inp = $('inSol');
  if(!S || S.z !== z || !list.length) return;   // sin conexión: queda el clima guardado en data.js
  inp.max = list.length-1; inp.value = list.length-1;
  inp.oninput = () => { const s = list[+inp.value];
    z.weather = {sol:s.sol, tmin:+s.min_temp, tmax:+s.max_temp, p:+s.pressure, sunrise:s.sunrise.slice(0,5), sunset:s.sunset.slice(0,5),
      src:`${z.wxInst}, sol ${s.sol}, ${s.terrestrial_date}`};
    update(); };
  inp.oninput();
}

/* comparación lado a lado (como el modo de comparar de Worldview): la capa elegida se ve a la derecha de la línea */
const SW = $('swipe');
map.getContainer().appendChild(SW);          // dentro del mapa: se posiciona igual en escritorio y en teléfono
L.DomEvent.disableClickPropagation(SW);       // arrastrar la línea no mueve el mapa
let swipeX = map.getSize().x/2;
function clipCmp(){
  if(!S) return;
  const id = $('inCmp').value;
  Object.values(S.tiles).forEach(l => { const c = l.getContainer(); if(c) c.style.clip = ''; });
  $('swipe').style.display = id ? 'block' : 'none';
  const c = id && S.tiles[id].getContainer(); if(!c) return;
  const nw = map.containerPointToLayerPoint([0,0]), se = map.containerPointToLayerPoint(map.getSize()), x = map.containerPointToLayerPoint([swipeX,0]).x;
  c.style.clip = `rect(${nw.y}px,${se.x}px,${se.y}px,${x}px)`;
  $('swipe').style.left = swipeX+'px';
}
map.on('move zoom resize', () => { swipeX = Math.min(swipeX, map.getSize().x); clipCmp(); });
SW.addEventListener('pointerdown', e => { e.preventDefault(); SW.setPointerCapture(e.pointerId); });
SW.addEventListener('pointermove', e => { if(!SW.hasPointerCapture(e.pointerId)) return;
  const r = map.getContainer().getBoundingClientRect();
  swipeX = Math.max(0, Math.min(r.width, e.clientX - r.left)); clipCmp(); });

function syncLayers(){
  if(!S) return;
  const op = +$('inOp').value, cmp = $('inCmp').value; $('oOp').textContent = Math.round(op*100)+'%';
  document.querySelectorAll('#layList input').forEach(c => {
    const id = c.dataset.l, ly = S.tiles[id], def = S.defs.find(d => d.id===id);
    c.checked || id===cmp ? ly.addTo(map) : map.removeLayer(ly);
    if(def.overlay) ly.setOpacity(id===cmp ? 1 : op);
  });
  $('lyRoute').checked ? S.gRoute.addTo(map) : map.removeLayer(S.gRoute);
  $('lyStops').checked ? S.gStops.addTo(map) : map.removeLayer(S.gStops);
  $('lyHaz').checked ? S.gHaz.addTo(map) : map.removeLayer(S.gHaz);
  clipCmp();
}

function setMode(mode){
  stopPlay(); closePov(); toggleMark(false); $('card').style.display = 'none'; $('swipe').style.display = 'none';
  clearZone();
  const g = mode === 'global';
  document.body.classList.toggle('global', g);
  document.querySelectorAll('.top button').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
  if(g){ S = null; lyGrid.addTo(map); lySites.addTo(map); map.setView([8,95],2); return; }
  [lyGrid, lySites].forEach(l => map.removeLayer(l));
  S = build(mode);
  const z = S.z;
  $('zName').textContent = z.name;
  $('layList').innerHTML = S.defs.map(l => `<label title="${l.src}"><input type="checkbox" data-l="${l.id}" ${l.on?'checked':''}>${l.label}</label>`).join('');
  $('stops').innerHTML = S.stops.map((s,i)=>`<button data-i="${i}" title="${s.name}">${s.tag}</button>`).join('')+`<span class="dim sm" style="align-self:center">${T('ver parada','view stop')}</span>`;
  $('inCmp').innerHTML = `<option value="">${T('No','Off')}</option>` + S.defs.map(l => `<option value="${l.id}">${l.label}</option>`).join('');
  $('inSol').max = 0; $('inSol').oninput = null;
  $('tSci').innerHTML = `<div class="sm" style="color:#c9eef7;font-weight:500;text-shadow:none;margin-bottom:6px">${z.goal}</div>
    <div class="cov">${z.coverage.map(c=>`<b class="${c[0]}">${c[0]==='ok'?'●':'◐'}</b><b>${c[1]}</b><span>${c[2]}</span>`).join('')}</div>
    <h3 style="margin-top:8px">${T('Unidad geológica en la base · USGS','Geologic unit at the base · USGS')}</h3><div id="sciGeo" class="sm"></div>
    <div class="dim sm">${T('Mapa global de Marte, Tanaka et al. 2014 (USGS SIM 3292), escala 1:20 000 000: describe la región, no cada roca.',
      'Global geologic map of Mars, Tanaka et al. 2014 (USGS SIM 3292), 1:20,000,000 scale: it describes the region, not each rock.')}</div>`;
  showGeo($('sciGeo'), S.route[0][0], S.route[0][1]);
  const A = ASSUME, sols = `${Math.min(...S.route.map(p=>p[3]))}–${Math.max(...S.route.map(p=>p[3]))}`;
  const maps = S.defs.map(d=>d.src.split(' · ')[0]).filter((v,i,a)=>a.indexOf(v)===i).join(', ');
  $('tSrc').innerHTML = T(`<ul>
    <li>Misión: ${z.mission}.</li>
    <li>Mapas: NASA Mars Trek (${maps}).</li>
    <li>Ruta y alturas: localizaciones del rover, sols ${sols}.</li>
    <li>Clima: ${z.wxInst}, API de clima de NASA (mars.nasa.gov). El sol se elige en Condiciones.</li>
    <li>Geología regional: USGS Astrogeology, mapa global de Marte (Tanaka et al., 2014).</li>
    <li>Clima espacial: NASA DONKI (CCMC), llegadas de CME a Marte del modelo WSA-ENLIL y eventos de partículas.</li>
    <li>Radiación: ${A.radDay} mSv/día. ${z.radNote}</li>
    <li>Límites de NASA para el traje de Artemis III: ${A.speedKmh} km/h a pie, caminata de ${A.maxHours} h, traje de ${A.o2Hours} h, regreso a pie desde ${A.walkbackKm} km, pendientes de hasta ${A.slopeNoGo}°, siempre en parejas.</li>
    <li>Supuestos: batería ${A.batHours} h, umbrales de pendiente ${A.slopeWarn}° y ${A.slopeBad}°, carga −${A.loadPenalty*100} % de ritmo por kg.</li></ul>`,
   `<ul>
    <li>Mission: ${z.mission}.</li>
    <li>Maps: NASA Mars Trek (${maps}).</li>
    <li>Route and elevations: rover localizations, sols ${sols}.</li>
    <li>Weather: ${z.wxInst}, NASA weather API (mars.nasa.gov). Pick the sol in Conditions.</li>
    <li>Regional geology: USGS Astrogeology, global geologic map of Mars (Tanaka et al., 2014).</li>
    <li>Space weather: NASA DONKI (CCMC), CME arrivals at Mars from the WSA-ENLIL model and particle events.</li>
    <li>Radiation: ${A.radDay} mSv/day. ${z.radNote}</li>
    <li>NASA limits for the Artemis III suit: ${A.speedKmh} km/h on foot, ${A.maxHours} h EVA, ${A.o2Hours} h suit, walk back from ${A.walkbackKm} km, slopes up to ${A.slopeNoGo}°, always in buddy pairs.</li>
    <li>Assumptions: battery ${A.batHours} h, slope thresholds ${A.slopeWarn}° and ${A.slopeBad}°, load −${A.loadPenalty*100} % pace per kg.</li></ul>`);
  $('inPos').value = 0;
  drawHaz(); syncLayers();
  const side = innerWidth > 1100 ? 340 : 290;   // ancho de los paneles laterales (ver hud.css)
  map.fitBounds(S.bounds, innerWidth <= 900 ? {padding:[20,20]} : {paddingTopLeft:[side,100], paddingBottomRight:[side+20,280]});
  update(); initWx();
}

/* ---------- 4. cuadrícula global ---------- */
const lyGrid = L.layerGroup(), lySites = L.layerGroup(), STEP = 15;
let selRect = null;
function blockData(lat0,lon0){
  const layers = [T('Óptico (Viking)','Optical (Viking)'), T('Topografía (MOLA)','Topography (MOLA)')];
  if(Math.abs(lat0+STEP/2) < 65) layers.push(T('Térmico (THEMIS)','Thermal (THEMIS)'));
  const here = SITES.filter(s => s.ll[0]>=lat0 && s.ll[0]<lat0+STEP && s.ll[1]>=lon0 && s.ll[1]<lon0+STEP);
  const extra = [...new Set(here.flatMap(s=>s.extra))];
  return {layers: layers.concat(extra), here, dev: here.filter(s=>s.dev), n: layers.length+extra.length};
}
for(let lat=-90; lat<90; lat+=STEP) for(let lon=-180; lon<180; lon+=STEP){
  const b = blockData(lat,lon);
  const col = b.dev.length ? '#6dffa8' : b.here.length ? '#8feaff' : b.n>=3 ? '#ffcf5a' : '#8a9aa0';
  const r = L.rectangle([[lat,lon],[lat+STEP,lon+STEP]],{color:col,weight:1,opacity:.6,fillColor:col,fillOpacity:b.here.length?.34:.1});
  r.on('click', e => {
    if(selRect) selRect.setStyle({weight:1}); selRect = r; r.setStyle({weight:3});
    const ns = lat>=0 ? `${lat}°–${lat+STEP}° N` : `${-lat-STEP}°–${-lat}° S`, E = v => v>=0 ? `${v}° E` : `${-v}° ${T('O','W')}`;
    $('blockInfo').innerHTML = `<h3>${T('Bloque','Block')}</h3><div class="big" style="font-size:17px">${ns}<br>${E(lon)} ${T('a','to')} ${E(lon+STEP)}</div>
      <div style="margin-top:4px">${T('Datos disponibles','Available data')}: <span class="mono">${b.n} / 6</span></div>
      <ul>${b.layers.map(x=>`<li>${x}</li>`).join('')}</ul>
      ${b.here.length ? `<div class="sm">${b.here.map(s=>s.n).join('<br>')}</div>` : `<div class="dim sm">${T('Sin misiones en superficie: faltan atmósfera, radiación y geología.','No surface missions: atmosphere, radiation and geology are missing.')}</div>`}
      ${b.dev.length ? b.dev.map(s=>`<button data-go="${s.dev}" style="margin-top:8px" class="on">${T('Abrir visor de','Open viewer:')} ${ZONES[s.dev].name}</button>`).join(' ') : `<div class="dim sm" style="margin-top:6px">${T('Mapa local no desarrollado en este prototipo.','Local map not built in this prototype.')}</div>`}
      <div style="margin-top:8px"><b>${T('Geología en el punto tocado · USGS','Geology at the tapped point · USGS')}</b><div id="bGeo" class="sm"></div></div>`;
    showGeo($('bGeo'), e.latlng.lng, e.latlng.lat);
    document.querySelectorAll('#blockInfo [data-go]').forEach(x => x.onclick = () => setMode(x.dataset.go));
  });
  r.addTo(lyGrid);
}
SITES.forEach(s => L.circleMarker(s.ll,{radius:5,color:'#fff',weight:1.5,fillColor:s.dev?'#6dffa8':'#8feaff',fillOpacity:1}).bindTooltip(s.n).addTo(lySites));

/* ---------- 5. HUD ---------- */
function drawProfile(pos){
  const W=600,H=74,pt=8,pb=6, zs=S.route.map(p=>p[2]), z0=Math.min(...zs)-3, z1=Math.max(...zs)+3;
  const x=d=>d/S.TOTAL*W, y=z=>pt+(z1-z)/(z1-z0)*(H-pt-pb);
  let s=`<path d="M0,${H} ${S.segs.map(g=>`L${x(g.from)},${y(g.a[2])}`).join(' ')} L${W},${y(S.route[S.route.length-1][2])} L${W},${H}Z" fill="rgba(143,234,255,.08)"/>`;
  S.segs.forEach(g => s+=`<line x1="${x(g.from)}" y1="${y(g.a[2])}" x2="${x(g.to)}" y2="${y(g.b[2])}" stroke="${colSlope(g.slope)}" stroke-width="2" vector-effect="non-scaling-stroke"/>`);
  S.stops.forEach(st => s+=`<line x1="${x(st.at)}" x2="${x(st.at)}" y1="0" y2="${H}" stroke="rgba(143,234,255,.4)" stroke-dasharray="2 3" vector-effect="non-scaling-stroke"/>`);
  s+=`<line x1="${x(pos)}" x2="${x(pos)}" y1="0" y2="${H}" stroke="#ffb347" stroke-width="2" vector-effect="non-scaling-stroke"/>`;
  $('profile').innerHTML = s;
}
function drawCompass(h){
  const W=300,H=30,ppd=2.4; let s='';
  for(let a=Math.ceil((h-62)/5)*5; a<=h+62; a+=5){
    const xx=W/2+(a-h)*ppd, n=((a%360)+360)%360, major=n%45===0;
    s+=`<line x1="${xx}" x2="${xx}" y1="${major?13:17}" y2="22" stroke="#8feaff" stroke-opacity="${major?1:.5}"/>`;
    if(major) s+=`<text x="${xx}" y="10" fill="#8feaff" font-size="11" font-weight="700" text-anchor="middle">${T(['N','NE','E','SE','S','SO','O','NO'],['N','NE','E','SE','S','SW','W','NW'])[n/45]}</text>`;
    else if(n%15===0) s+=`<text x="${xx}" y="11" fill="#6fa3b3" font-size="8.5" text-anchor="middle">${n}</text>`;
  }
  s+=`<path d="M${W/2-5},30 L${W/2},23 L${W/2+5},30Z" fill="#ffb347"/>`;
  $('compass').setAttribute('viewBox',`0 0 ${W} ${H}`); $('compass').innerHTML = s;
}

function update(){
  if(!S) return;
  const A = ASSUME, wx = S.z.weather, SUNRISE = toH(wx.sunrise), SUNSET = toH(wx.sunset);
  const start=+$('inStart').value, stopMin=+$('inStop').value, tau=+$('inTau').value, radS=$('inRad').value;
  $('oStart').textContent=hhmm(start); $('oStop').textContent=stopMin+"'"; $('oTau').textContent=tau.toFixed(1);
  $('oSol').textContent = wx.sol ? 'sol '+wx.sol : '—';
  $('tExt').textContent = `${Math.round(wx.tmin)} / ${Math.round(wx.tmax)} °C`;
  $('wxNote').textContent = T('Clima: ','Weather: ')+wx.src+T('. El polvo es un control de simulación.','. Dust is a simulation control.');
  // equipo: lo lleva el rover, o se reparte entre los dos astronautas si van en pareja
  const rover = $('inRover').checked, pair = $('inPair').checked;
  const team = rover ? 0 : +$('inLoad').value, kg = pair ? team/2 : team;
  const slow = Math.min(0.5, kg*A.loadPenalty), k = 1/(1-slow);   // k multiplica el tiempo de marcha
  $('oLoad').textContent = team+' kg'; $('inLoad').disabled = rover;

  // posición actual sobre la ruta
  const pos = +$('inPos').value/1000*S.TOTAL;
  const g = S.segs.find(s => pos<=s.to) || S.segs[S.segs.length-1], f = g.d ? Math.min(1,(pos-g.from)/g.d) : 1;
  const here = [g.a[0]+(g.b[0]-g.a[0])*f, g.a[1]+(g.b[1]-g.a[1])*f, g.a[2]+(g.b[2]-g.a[2])*f];
  S.me.setLatLng([here[1],here[0]]);
  const arrow = S.me.getElement() && S.me.getElement().querySelector('i'); if(arrow) arrow.style.transform = `rotate(${g.brg}deg)`;

  // tiempo: tramos recorridos + paradas ya hechas
  let t = S.segs.filter(s => s.to<=pos).reduce((a,s)=>a+s.t,0) + (pos>g.from && pos<g.to ? g.t*f : 0);
  const done = S.stops.filter(s => s.idx>0 && s.at<pos-0.5).length;
  t = t*k/3600 + done*stopMin/60;
  const total = S.WALK_S*k/3600 + (S.stops.length-1)*stopMin/60, back = start+total, margin = SUNSET-back;

  // objetivo siguiente
  let nx = S.stops.find(s => s.at>pos+0.5), dN;
  if(nx) dN = nx.at-pos; else { nx = S.stops[0]; dN = S.TOTAL-pos; }
  const arrived = dN<1;
  $('nxName').textContent = arrived ? T('En la base','At base') : nx.name;
  $('nxRole').textContent = arrived ? T('Caminata completada','EVA complete') : (nx.idx===0 ? T('Regreso a la base','Return to base') : nx.role);
  const toBase = dist(here, S.route[0]);
  $('nxBase').textContent = toBase.toFixed(0)+' m'; $('nxBase').className = toBase > A.walkbackKm*1000 ? 'bad' : '';
  $('nxDist').textContent = dN.toFixed(0)+' m';
  $('nxBrg').textContent = String(Math.round(g.brg)).padStart(3,'0')+'° '+card16(g.brg);
  $('nxSlope').textContent = (g.dz>=0?'+':'−')+g.slope.toFixed(1)+'°';
  $('nxSlope').className = g.slope>A.slopeBad ? 'bad' : g.slope>=A.slopeWarn ? 'warn' : '';
  $('nxElev').textContent = here[2].toFixed(0)+' m';

  // traje
  const o2 = Math.max(0,100-t/A.o2Hours*100), bt = Math.max(0,100-t/A.batHours*100);
  $('o2').style.width=`calc(${o2}% - 2px)`; $('o2t').textContent=o2.toFixed(0)+'%';
  $('batb').style.width=`calc(${bt}% - 2px)`; $('bat').textContent=bt.toFixed(0)+'%';
  $('tEl').textContent=hhmm(t)+' / '+hhmm(total); $('tNow').textContent=hhmm(start+t);
  $('dose').textContent = radS==='sep' ? T('ELEVADA','HIGH') : (A.radDay/A.solHours*t).toFixed(3)+' mSv';
  $('dose').className = radS==='sep' ? 'bad' : '';
  $('rTot').textContent = (S.TOTAL/1000).toFixed(2)+' km · +'+S.ASC.toFixed(0)+' m';
  $('rPos').textContent = pos.toFixed(0)+' / '+S.TOTAL.toFixed(0)+' m';

  // estado de salida
  const dose = A.radDay/A.solHours*total, M = S.MAXS, C = [];
  const TER = T('TERRENO','TERRAIN'), LUZ = T('LUZ','LIGHT'), DUR = T('DURACIÓN','DURATION'), POL = T('POLVO','DUST'), RAD = T('RADIACIÓN','RADIATION');
  C.push(M>A.slopeNoGo ? ['bad',TER,T(`Pendiente máx. ${M.toFixed(1)}°, supera ${A.slopeNoGo}°`,`Max slope ${M.toFixed(1)}°, above ${A.slopeNoGo}°`)]
    : M>A.slopeBad ? ['warn',TER,T(`Tramo de ${M.toFixed(1)}°: bajar el ritmo`,`${M.toFixed(1)}° segment: slow down`)]
    : ['ok',TER,T(`Pendiente máx. ${M.toFixed(1)}°`,`Max slope ${M.toFixed(1)}°`)]);
  C.push(start<SUNRISE+1 ? ['warn',LUZ,T('Salida a menos de 1 h del amanecer','Start less than 1 h after sunrise')]
    : margin<0 ? ['bad',LUZ,T(`Regreso ${hhmm(back)}, tras el atardecer`,`Back at ${hhmm(back)}, after sunset`)]
    : margin<1 ? ['warn',LUZ,T(`Solo ${Math.round(margin*60)} min antes del atardecer`,`Only ${Math.round(margin*60)} min before sunset`)]
    : ['ok',LUZ,T(`Regreso ${hhmm(back)}, margen ${margin.toFixed(1)} h`,`Back at ${hhmm(back)}, ${margin.toFixed(1)} h margin`)]);
  C.push(total>A.maxHours ? ['bad',DUR,T(`${total.toFixed(1)} h supera el límite de ${A.maxHours} h`,`${total.toFixed(1)} h exceeds the ${A.maxHours} h limit`)]
    : total>A.maxHours-1 ? ['warn',DUR,T(`${total.toFixed(1)} h, cerca del límite`,`${total.toFixed(1)} h, close to the limit`)]
    : ['ok',DUR,T(`${total.toFixed(1)} h de ${A.maxHours} h permitidas`,`${total.toFixed(1)} h of ${A.maxHours} h allowed`)]);
  C.push(tau>2 ? ['bad',POL,T(`τ ${tau.toFixed(1)}: tormenta`,`τ ${tau.toFixed(1)}: storm`)]
    : tau>1 ? ['warn',POL,T(`τ ${tau.toFixed(1)}: visibilidad reducida`,`τ ${tau.toFixed(1)}: reduced visibility`)]
    : ['ok',POL,T(`τ ${tau.toFixed(1)}: cielo normal`,`τ ${tau.toFixed(1)}: normal sky`)]);
  C.push(radS==='sep' ? ['bad',RAD,T('Evento solar: quedarse en el hábitat','Solar event: stay in the habitat')]
    : radS==='watch' ? ['warn',RAD,T('Alerta solar: regreso rápido listo','Solar alert: be ready to return fast')]
    : ['ok',RAD,T(`${dose.toFixed(2)} mSv estimados`,`${dose.toFixed(2)} mSv estimated`)]);
  const onRoute = S.haz.filter(h => S.segs.some(s => distSeg(h.p,s.a,s.b) < h.r+A.hazBuffer)).length, HAZ = T('OBSTÁCULOS','HAZARDS');
  C.push(onRoute ? ['warn',HAZ,T(`${onRoute} junto a la ruta: rodear o ir despacio`,`${onRoute} next to the route: go around or slow down`)]
    : ['ok',HAZ,T(`${S.haz.length} marcados, ninguno en la ruta`,`${S.haz.length} marked, none on the route`)]);
  // regreso a pie [NASA]: el punto más lejano debe quedar dentro de la distancia que se puede volver caminando si algo falla
  const far = (S.RMAX/1000).toFixed(2), WB = T('REGRESO','WALKBACK');
  C.push(S.RMAX > A.walkbackKm*1000 ? ['bad',WB,T(`Punto más lejano a ${far} km de la base: supera ${A.walkbackKm} km`,`Farthest point ${far} km from base: above ${A.walkbackKm} km`)]
    : ['ok',WB,T(`Punto más lejano a ${far} km de la base (límite ${A.walkbackKm} km)`,`Farthest point ${far} km from base (limit ${A.walkbackKm} km)`)]);
  const PR = T('PAREJA','BUDDY');
  C.push(pair ? ['ok',PR,T('Dos astronautas: uno asiste si el traje del otro falla','Two astronauts: one assists if the other\'s suit fails')]
    : ['warn',PR,T('En solitario: NASA hace las caminatas en parejas','Solo: NASA performs EVAs in buddy pairs')]);
  const LD = T('CARGA','LOAD'), pace = Math.round(slow*100);
  C.push(rover ? ['ok',LD,T('El rover lleva el equipo','The rover carries the gear')]
    : [kg>A.maxLoadKg ? 'warn' : 'ok',LD,T(`${kg} kg por traje: ritmo −${pace}%`,`${kg} kg per suit: pace −${pace}%`)]);
  $('checks').innerHTML = C.map(c=>`<i class="${c[0]}">${c[1]}</i><span>${c[2]}</span>`).join('');
  const w = C.some(c=>c[0]==='bad') ? 'bad' : C.some(c=>c[0]==='warn') ? 'warn' : 'ok';
  const V = {ok:[T('SALIR','GO'),'#6dffa8'], warn:[T('SALIR CON PRECAUCIÓN','GO WITH CAUTION'),'#ffcf5a'], bad:[T('NO SALIR','NO GO'),'#ff5d5d']}[w];
  $('vTxt').textContent=V[0]; $('vTxt').className='big '+w; $('vTxt').style.fontSize = w==='warn' ? '18px' : '22px';
  $('vDot').style.background=V[1]; $('vDot').style.boxShadow='0 0 12px '+V[1];

  // alerta en el visor: la más grave que aplique en este punto
  const near = S.stops.find(s => s.idx>0 && Math.abs(s.at-pos)<8);
  const hz = S.haz.map(h => ({h, d: dist(here,h.p)-h.r})).filter(o => o.d < A.hazBuffer).sort((a,b)=>a.d-b.d)[0];
  const al = radS==='sep' ? ['bad',T('Evento solar · regrese al hábitat','Solar event · return to the habitat')]
    : o2<25 ? ['bad',T(`Oxígeno ${o2.toFixed(0)}% · regrese a la base`,`Oxygen ${o2.toFixed(0)}% · return to base`)]
    : hz ? ['warn', hz.d>0 ? T(`${hz.h.name} a ${hz.d.toFixed(0)} m`,`${hz.h.name} in ${hz.d.toFixed(0)} m`) : T(`${hz.h.name} · pise con cuidado`,`${hz.h.name} · watch your step`)]
    : g.slope>A.slopeBad ? ['bad',T(`Pendiente ${g.slope.toFixed(1)}° · use bastones`,`Slope ${g.slope.toFixed(1)}° · use poles`)]
    : g.slope>=A.slopeWarn ? ['warn',T(`Pendiente ${g.slope.toFixed(1)}° · reduzca el paso`,`Slope ${g.slope.toFixed(1)}° · shorten your stride`)]
    : near ? ['ok',T(`En sitio: ${near.name}`,`On site: ${near.name}`)]
    : tau>1 ? ['warn',T('Polvo en suspensión · visibilidad reducida','Airborne dust · reduced visibility')]
    : arrived ? ['ok',T('Caminata completada','EVA complete')] : ['',T('Ruta nominal','Nominal route')];
  $('alert').className = 'hud l '+al[0]; $('alert').innerHTML = `<span class="${al[0]||'dim'}">${al[1]}</span>`;

  drawProfile(pos); drawCompass(g.brg);
  return here;
}

/* animación del recorrido */
function stopPlay(){ if(playing){ clearInterval(playing); playing=null; } $('btnPlay').textContent='▶'; }
function togglePlay(){
  if(playing) return stopPlay();
  if(+$('inPos').value>=1000) $('inPos').value=0;
  $('btnPlay').textContent='❚❚';
  playing = setInterval(() => {
    const v = Math.min(1000, +$('inPos').value+2); $('inPos').value = v;
    const here = update(); if(here) map.panTo([here[1],here[0]],{animate:false});
    if(v>=1000) stopPlay();
  }, 60);
}

/* ---------- 6. paradas y vista en el sitio ---------- */
function showStop(i){
  const s = S.stops[i], p = s.p, c = $('card'); c.style.display='block';
  c.innerHTML = `<button class="x" aria-label="Cerrar">×</button><h3 style="padding-right:18px">${s.role}</h3>
    <div class="big" style="font-size:18px">${s.name}</div>
    <div class="mono sm dim">${Math.abs(p[1]).toFixed(5)}°${p[1]>=0?'N':'S'} ${p[0].toFixed(5)}°E · ${p[2].toFixed(0)} m · sol ${p[3]}</div>
    <img src="${s.img}" alt="${T('Vista desde','View from')} ${s.name}" onerror="this.style.display='none';this.nextElementSibling.textContent='${T('No se pudo cargar la foto del sol','Could not load the photo from sol')} ${p[3]}.'">
    <div class="dim sm">${s.cam}. NASA/JPL-Caltech.</div>
    <button id="btnPov" style="margin:6px 0 2px">${T('Vista en el sitio','On-site view')}</button>
    <p>${s.txt}</p>
    <dl>${Object.entries(s.sci).map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join('')}<dt>${T('Unidad USGS','USGS unit')}</dt><dd id="cGeo"></dd></dl>
    <p><b style="color:var(--c)">${T('Tarea','Task')}:</b> ${s.task}</p>`;
  showGeo($('cGeo'), p[0], p[1]);
  c.querySelector('.x').onclick = () => c.style.display='none';
  $('btnPov').onclick = () => openPov(s);
  stopPlay(); $('inPos').value = Math.round(s.at/S.TOTAL*1000); update();
}
function openPov(s){
  $('povImg').src = s.img; $('pov').style.display='block'; $('card').style.display='none';
  $('povCap').style.display='block';
  $('povCap').innerHTML = `${T('Vista en el sitio','On-site view')} · ${s.name} · ${s.cam} · NASA/JPL-Caltech &nbsp; <button id="povX">${T('Volver al mapa','Back to map')}</button>`;
  $('povX').onclick = closePov;
}
function closePov(){ $('pov').style.display='none'; $('povCap').style.display='none'; }

/* clima espacial real: llegadas de CME a Marte (modelo WSA-ENLIL) y eventos de partículas, de NASA DONKI */
async function loadSpaceWx(){
  const day = 864e5, now = Date.now(), iso = t => new Date(t).toISOString().slice(0,10);
  let data;
  try { const c = JSON.parse(localStorage.getItem('mw-donki')); if(c && now-c.t < 36e5) data = c.data; } catch(e){}
  if(!data){
    const get = p => fetch(`https://api.nasa.gov/DONKI/${p}&api_key=${NASA_KEY}`).then(r => r.ok ? r.json() : Promise.reject(r.status));
    try {
      const [enlil, sep] = await Promise.all([
        get(`WSAEnlilSimulations?startDate=${iso(now-10*day)}&endDate=${iso(now)}`),
        get(`SEP?startDate=${iso(now-7*day)}&endDate=${iso(now)}`)]);
      const mars = {};   // una entrada por CME: la simulación más reciente reemplaza a las anteriores
      enlil.forEach(s => (s.impactList||[]).filter(i => i.location==='Mars').forEach(i =>
        mars[(s.cmeInputs[0]||{}).CMEID || s.simulationID] = {t:Date.parse(i.arrivalTime), glancing:i.isGlancingBlow, minor:i.isMinorImpact}));
      data = {mars:Object.values(mars), sep:sep.map(e => Date.parse(e.eventTime))};
      try { localStorage.setItem('mw-donki', JSON.stringify({t:now, data})); } catch(e){}
    } catch(e){ $('swNote').textContent = T('NASA DONKI no respondió: el clima espacial queda como control manual.','NASA DONKI did not respond: space weather stays as a manual control.'); return; }
  }
  const fmt = t => new Date(t).toLocaleString(LANG,{day:'numeric', month:'short', hour:'2-digit', minute:'2-digit', timeZone:'UTC'})+' UTC';
  const kind = m => m.glancing ? T('roce','glancing blow') : m.minor ? T('impacto leve','minor impact') : T('impacto','impact');
  const soon = data.mars.filter(m => m.t > now-day && m.t < now+3*day).sort((a,b) => a.t-b.t)[0];
  const last = data.mars.filter(m => m.t <= now-day).sort((a,b) => b.t-a.t)[0];
  const sep = data.sep.filter(t => t > now-2*day).length;
  // nunca pone "Evento de partículas" sola: DONKI no mide partículas en Marte; eso lo decide la tripulación
  if(!$('inRad').dataset.user) $('inRad').value = soon || sep ? 'watch' : 'quiet';
  $('swNote').innerHTML = '<b>NASA DONKI:</b> '
    + (soon ? T(`una CME llega a Marte el ${fmt(soon.t)} (${kind(soon)}).`,`a CME reaches Mars on ${fmt(soon.t)} (${kind(soon)}).`)
            : T('ninguna CME llega a Marte en los próximos 3 días.','no CME reaches Mars in the next 3 days.'))
    + (!soon && last ? T(` Última llegada: ${fmt(last.t)} (${kind(last)}).`,` Last arrival: ${fmt(last.t)} (${kind(last)}).`) : '')
    + (sep ? T(` ${sep} evento(s) de partículas en 2 días, medidos cerca de la Tierra.`,` ${sep} particle event(s) in 2 days, measured near Earth.`) : '');
  update();
}

/* ---------- 7. arranque ---------- */
// idioma: los textos fijos del HTML traen su versión en inglés en data-en / data-en-title
if(LANG === 'en'){
  document.documentElement.lang = 'en';
  document.querySelectorAll('[data-en]').forEach(el => el.textContent = el.dataset.en);
  document.querySelectorAll('[data-en-title]').forEach(el => el.title = el.dataset.enTitle);
}
$('btnLang').textContent = T('EN','ES');
$('btnLang').onclick = () => {   // cambia el idioma y recarga en la misma zona
  try { localStorage.setItem('mw-lang', T('en','es')); sessionStorage.setItem('mw-mode', S ? S.key : 'global'); } catch(e){}
  location.reload();
};
document.querySelectorAll('.top button[data-mode]').forEach(b => b.onclick = () => setMode(b.dataset.mode));
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
  document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x===b));
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.id===b.dataset.t));
});
$('tLay').addEventListener('input', syncLayers);
$('stops').addEventListener('click', e => { if(e.target.dataset.i) showStop(+e.target.dataset.i); });
$('btnMark').onclick = () => toggleMark(!marking);
['inStart','inStop','inTau','inRad','inLoad','inRover','inPair'].forEach(id => $(id).addEventListener('input', update));
$('inPos').addEventListener('input', () => { stopPlay(); update(); });
$('btnPlay').onclick = togglePlay;

$('inRad').addEventListener('input', () => $('inRad').dataset.user = '1');   // la elección manual manda sobre DONKI

let startMode = 'jezero';
try { const m = sessionStorage.getItem('mw-mode'); if(m === 'global' || ZONES[m]) startMode = m; } catch(e){}
setMode(startMode);
loadSpaceWx();
