/* =====================================================================
   Marswalk HUD · datos
   Todo lo que aparece aquí viene de fuentes públicas de NASA (ver README).
   Para añadir una zona nueva basta con agregar una entrada a ZONES.
   ===================================================================== */

/* Idioma: 'es' o 'en', guardado en este navegador. Los textos en inglés de las zonas están en js/en.js */
let LANG = 'es';
try { LANG = localStorage.getItem('mw-lang') === 'en' ? 'en' : 'es'; } catch(e){}
const T = (es, en) => LANG === 'en' ? en : es;

const R_MARS = 3389500;                                   // radio medio de Marte (m)
const TREK   = 'https://trek.nasa.gov/tiles/Mars/EQ/';    // servicio WMTS de NASA Mars Trek
const TILE   = '/1.0.0/default/default028mm/{z}/{y}/{x}.';
const M20IMG = 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/';
const MSLIMG = 'https://mars.jpl.nasa.gov/msl-raw-images/';
const NASA_KEY = 'DEMO_KEY';   // clave de api.nasa.gov; DEMO_KEY admite pocas consultas por hora, pide una gratis para la demo

/* Límites de la caminata. [NASA] = requisito de NASA para el traje xEVA de Artemis III (Luna):
   Scoville 2021, "Artemis III EVA Mission Capability", NTRS 20210026296. NASA no ha publicado
   los de Marte, así que se usan estos. El resto son supuestos de diseño. */
const ASSUME = {
  speedKmh: 2,        // [NASA] ritmo a pie con traje: 2 km/h
  maxHours: 6,        // [NASA] caminata nominal: 6 ± 2 h
  o2Hours: 8,         // [NASA] el traje funciona al menos 8 h
  walkbackKm: 1.38,   // [NASA] distancia máxima en línea recta a la base, para poder volver a pie si algo falla
  batHours: 10,       // supuesto: autonomía de batería
  slopeWarn: 8,       // supuesto: grados, tramo amarillo
  slopeBad: 15,       // supuesto: grados, tramo rojo
  slopeNoGo: 20,      // [NASA] el astronauta debe poder caminar en pendientes de 20°
  radDay: 0.64,       // mSv/día: promedio de RAD (Curiosity) en superficie, Hassler et al. 2014
  solHours: 24.66,
  loadPenalty: 0.01,  // supuesto: cada kg cargado en el traje reduce la velocidad 1 %
  maxLoadKg: 20,      // supuesto: carga por traje por encima de la cual se avisa
  hazBuffer: 15       // m: distancia extra alrededor de un obstáculo para avisar
};

/* Capas globales reutilizadas por todas las zonas */
const GLOBAL_LAYERS = [
  {id:'night', label:'Térmico noche',  src:'Mars Odyssey THEMIS · 100 m', tile:'THEMIS_NightIR_ControlledMosaics_100m_v2_oct2018', ext:'png', max:9, overlay:true, bounds:[[-65,-180],[65,180]]},
  {id:'day',   label:'Térmico día',    src:'Mars Odyssey THEMIS · 100 m', tile:'THEMIS_DayIR_ControlledMosaics_100m_v2_oct2018',   ext:'png', max:9, overlay:true, bounds:[[-65,-180],[65,180]]},
  {id:'mola',  label:'Relieve MOLA',   src:'Mars Global Surveyor MOLA · 463 m', tile:'Mars_MGS_MOLA_ClrShade_merge_global_463m', ext:'jpg', max:7, overlay:true}
];

const ZONES = {
  /* ------------------------------------------------------------------ */
  jezero: {
    name: 'Jezero',
    title: 'Cráter Jezero · frente del delta',
    mission: 'Perseverance (Mars 2020)',
    goal: 'Buscar señales de vida antigua en las rocas sedimentarias del delta, donde un río desembocó en un lago hace más de 3.000 millones de años.',
    // Localizaciones reales del rover: [lon, lat, altura sobre el geoide (m), sol]
    pts: {
      s667:[77.4082,18.45272365,-2545.27,667], s684:[77.4084479,18.45336511,-2545.203,684],
      s693:[77.40844783,18.45417628,-2544.493,693], s436:[77.40846432,18.45598091,-2543.232,436],
      s437:[77.40874595,18.45710164,-2539.995,437], s439:[77.40888074,18.45738915,-2538.755,439],
      s441:[77.40857967,18.45766138,-2535.630,441], s443:[77.40746956,18.45752717,-2535.996,443],
      s448:[77.40633801,18.45744513,-2535.580,448], s455:[77.40627698,18.45789036,-2530.027,455],
      s456:[77.4064976,18.45801694,-2527.392,456], s460:[77.40609259,18.45851434,-2524.211,460],
      s461:[77.40614454,18.4586918,-2523.304,461], s477:[77.40616768,18.45889532,-2520.853,477],
      s502:[77.40592495,18.45864728,-2523.168,502], s535:[77.40732773,18.45835024,-2525.521,535],
      s536:[77.4085763,18.45821603,-2526.466,536], s707:[77.40845696,18.45864154,-2522.817,707],
      s708:[77.4058418,18.46007456,-2509.566,708], s709:[77.40293429,18.46167105,-2496.770,709],
      s702:[77.40869551,18.45821443,-2526.576,702], s700:[77.4087634,18.45810853,-2528.164,700],
      s698:[77.40864336,18.45796415,-2531.415,698], s695:[77.40880429,18.45739106,-2538.486,695],
      s694:[77.40878417,18.45722377,-2539.437,694]
    },
    route: ['s667','s684','s693','s436','s437','s439','s441','s443','s448','s455','s456','s460','s461','s477',
            's502','s535','s536','s707','s708','s709','s708','s707','s702','s700','s698','s695','s694','s436','s693','s684','s667'],
    stops: [
      {key:'s667', tag:'B', name:'Three Forks', role:'Base de salida y regreso',
       txt:'Terreno llano al pie del delta. Perseverance dejó aquí un depósito de 10 tubos de muestra entre diciembre de 2022 y enero de 2023.',
       task:'Revisar equipo y registrar condiciones antes de salir.',
       sci:{Terreno:'Llanura al pie del delta', Hallazgo:'Depósito de respaldo con 10 tubos de muestra', Instrumentos:'Cámaras del brazo y Mastcam-Z'},
       img:M20IMG+'00667/ids/edr/browse/ncam/NRF_0667_0726155814_191ECM_N0320506NCAM08111_15_095J02_800.jpg', cam:'Navcam, sol 667'},
      {key:'s441', tag:'1', name:'Hawksbill Gap', role:'Parada 1 · estratigrafía',
       txt:'Corredor de subida al frente del delta, donde empiezan a verse las capas de sedimento que dejó el río al entrar al lago.',
       task:'Fotografiar las capas expuestas y medir su espesor.',
       sci:{Roca:'Sedimentaria en capas', Interés:'Orden en que el río depositó los sedimentos', Instrumentos:'Mastcam-Z, SuperCam'},
       img:M20IMG+'00441/ids/edr/browse/ncam/NLF_0441_0706099888_487EBY_N0244578SAPP00601_00_0LLJ01_800.jpg', cam:'Navcam, sol 441'},
      {key:'s477', tag:'2', name:'Wildcat Ridge', role:'Parada 2 · muestreo principal',
       txt:'Rocas de grano fino que Perseverance perforó en 2022, junto a Skinner Ridge. Aquí el instrumento SHERLOC detectó compuestos orgánicos.',
       task:'Tomar muestras: es el mejor sitio de la ruta para buscar señales de vida antigua.',
       sci:{Roca:'Lutita (grano fino) con sulfatos', Hallazgo:'Compuestos orgánicos detectados por SHERLOC', Muestras:'Hazeltine y Bearwallow (Wildcat Ridge); Swift Run y Skyland (Skinner Ridge)', Instrumentos:'SHERLOC, PIXL, taladro'},
       img:M20IMG+'00477/ids/edr/browse/zcam/ZL0_0477_0709276091_285ECM_N0260850ZCAM08498_110085J01_800.jpg', cam:'Mastcam-Z, sol 477'},
      {key:'s709', tag:'3', name:'Borde del delta', role:'Parada 3 · panorama y retorno',
       txt:'Punto más alto de la ruta, unos 48 m sobre la base. Perseverance pasó por aquí en el sol 709 al comenzar su campaña en la parte alta del abanico.',
       task:'Tomar panorama del cráter, observar el cambio de roca y regresar.',
       sci:{Terreno:'Parte alta del abanico', Interés:'Paso de sedimento fino a material más grueso', Instrumentos:'Mastcam-Z'},
       img:M20IMG+'00709/ids/edr/browse/zcam/ZL0_0709_0729889008_069EBY_N0332864ZCAM07114_1100LMJ01_800.jpg', cam:'Mastcam-Z, sol 709'}
    ],
    layers: [
      {id:'ctx',    label:'Imagen CTX 6 m',  src:'MRO CTX', tile:'JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0', ext:'png', max:13, z:2, on:true, bounds:[[18.2110274,77.1604655],[18.7211945,77.6991776]]},
      {id:'hirise', label:'HiRISE 25 cm',    src:'MRO HiRISE', tile:'JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd', ext:'png', max:17, z:3, on:true, bounds:[[18.3067994,77.2229331],[18.669315,77.583964]]}
    ],
    weather: {tmin:-79.3, tmax:-24.7, p:778.9, sunrise:'06:18', sunset:'17:13', src:'MEDA (Perseverance), sol 1133, 27 abr 2024: último publicado por la API'},
    wxFeed: 'mars2020', wxInst: 'MEDA (Perseverance)',
    radNote: 'Referencia: RAD de Curiosity en Gale, a 3.700 km. No hay medidor en Jezero.',
    hazards: [],   // no se encontró un obstáculo documentado por NASA en esta ruta
    coverage: [
      ['ok','Óptico','HiRISE 25 cm y CTX 6 m (MRO)'], ['ok','Topografía','Alturas del rover + MOLA'],
      ['ok','Térmico','THEMIS (Mars Odyssey)'], ['ok','Atmósfera','Estación MEDA'],
      ['warn','Radiación','Sin medidor: referencia de Gale'], ['ok','Geología','SHERLOC, PIXL, SuperCam y muestras']
    ]
  },

  /* ------------------------------------------------------------------ */
  gale: {
    name: 'Gale',
    title: 'Cráter Gale · Yellowknife Bay',
    mission: 'Curiosity (MSL)',
    goal: 'Estudiar el lecho de un lago antiguo. En Yellowknife Bay, Curiosity perforó por primera vez una roca en Marte y halló arcillas: un ambiente que pudo ser habitable.',
    pts: {
      g3:[137.441633,-4.589467,-4500.971,3], g22:[137.4418925,-4.58940312,-4502.364,22],
      g24:[137.4421813,-4.58944695,-4502.611,24], g26:[137.442476,-4.58974934,-4503.026,26],
      g29:[137.4428938,-4.59012126,-4503.559,29], g38:[137.4433016,-4.5902435,-4504.605,38],
      g39:[137.4436633,-4.59031849,-4504.758,39], g40:[137.4441777,-4.59003646,-4504.468,40],
      g41:[137.4445809,-4.58984662,-4504.953,41], g42:[137.4450509,-4.59004164,-4507.215,42],
      g43:[137.4453105,-4.59047623,-4507.872,43], g48:[137.4459999,-4.59030037,-4510.37,48],
      g49:[137.4465064,-4.59030545,-4512.089,49], g50:[137.4473045,-4.59017575,-4515.546,50],
      g52:[137.4479003,-4.59006187,-4516.588,52], g55:[137.4482966,-4.5900627,-4517.854,55],
      g57:[137.4483392,-4.59001956,-4517.896,57], g102:[137.4486951,-4.58994723,-4518.25,102],
      g120:[137.4488299,-4.59044252,-4518.274,120], g121:[137.4491076,-4.59028132,-4518.656,121],
      g123:[137.4493493,-4.59005409,-4519.828,123], g124:[137.4492772,-4.58986526,-4519.966,124],
      g125:[137.4493306,-4.58963671,-4520.886,125], g127:[137.4493834,-4.5892303,-4521.311,127],
      g130:[137.449388,-4.58913689,-4520.974,130], g133:[137.4492584,-4.58946286,-4520.969,133]
    },
    route: ['g3','g22','g24','g26','g29','g38','g39','g40','g41','g42','g43','g48','g49','g50','g52','g55','g57',
            'g102','g120','g121','g123','g124','g125','g127','g130','g133',
            'g124','g123','g121','g120','g102','g55','g52','g50','g49','g48','g43','g42','g41','g40','g39','g38','g29','g26','g24','g22','g3'],
    stops: [
      {key:'g3', tag:'B', name:'Bradbury Landing', role:'Base de salida y regreso',
       txt:'Lugar donde aterrizó Curiosity el 6 de agosto de 2012. Llanura de grava con el monte Sharp al sur.',
       task:'Revisar equipo y registrar condiciones antes de salir.',
       sci:{Terreno:'Llanura de grava', Hallazgo:'Cerca de aquí se vieron conglomerados de un antiguo arroyo', Instrumentos:'Mastcam, ChemCam'},
       img:MSLIMG+'proj/msl/redops/ods/surface/sol/00016/opgs/edr/ncam/NLA_398920558EDR_F0030078NCAM00302M_.JPG', cam:'Navcam, sol 16'},
      {key:'g57', tag:'1', name:'Rocknest', role:'Parada 1 · suelo y arena',
       txt:'Acumulación de arena arrastrada por el viento. Aquí Curiosity tomó sus primeras paladas de suelo y las analizó a bordo.',
       task:'Recoger arena y comparar su composición con la del análisis de Curiosity.',
       sci:{Material:'Arena y polvo eólicos', Hallazgo:'Primer análisis de minerales por difracción de rayos X en otro planeta (CheMin)', Instrumentos:'CheMin, SAM, APXS'},
       img:MSLIMG+'proj/msl/redops/ods/surface/sol/00057/opgs/edr/ncam/NLA_402563129EDR_F0050000NCAM00446M_.JPG', cam:'Navcam, sol 57'},
      {key:'g125', tag:'2', name:'Entrada a Yellowknife Bay', role:'Parada 2 · descenso a la depresión',
       txt:'Borde de una depresión poco profunda, unos 20 m por debajo del sitio de aterrizaje. Las rocas pasan a ser de grano fino y aparecen vetas claras.',
       task:'Documentar el cambio de roca y las vetas minerales antes de bajar.',
       sci:{Roca:'Sedimentaria de grano fino', Interés:'Vetas claras de sulfato de calcio: agua que circuló por las grietas', Instrumentos:'ChemCam, Mastcam'},
       img:MSLIMG+'proj/msl/redops/ods/surface/sol/00125/opgs/edr/ncam/NLA_408594921EDR_F0051398NCAM00220M_.JPG', cam:'Navcam, sol 125'},
      {key:'g133', tag:'3', name:'John Klein', role:'Parada 3 · muestreo principal',
       txt:'Primera roca perforada en Marte (sol 182, febrero de 2013). El polvo extraído contenía arcillas formadas en agua poco salada y de acidez neutra.',
       task:'Tomar muestra de la lutita y regresar a la base.',
       sci:{Roca:'Lutita (Sheepbed)', Hallazgo:'Arcillas: lago antiguo con condiciones habitables', Muestras:'John Klein y Cumberland (perforaciones de Curiosity)', Instrumentos:'Taladro, CheMin, SAM'},
       img:MSLIMG+'msss/00133/mcam/0133MR0008140010200869E01_DXXX.jpg', cam:'Mastcam, sol 133'}
    ],
    layers: [
      {id:'ctx',    label:'Imagen CTX',      src:'MRO CTX', tile:'Gale_CTX_BlockAdj_dd', ext:'png', max:12, z:2, on:true, bounds:[[-6.5732988,135.1842593],[-2.8077809,139.2413012]]},
      {id:'hirise', label:'HiRISE 25 cm',    src:'MRO HiRISE', tile:'curiosity_hirise_mosaic', ext:'png', max:16, z:3, on:true, bounds:[[-4.9254743,137.1224669],[-4.2489588,137.7298129]]},
      {id:'dem',    label:'Elevación 1 m',   src:'MRO HiRISE DEM', tile:'Gale_DEM_SMG_1m', ext:'png', max:14, overlay:true, bounds:[[-4.9254743,137.1224711],[-4.2489631,137.7298129]]}
    ],
    weather: {tmin:-71, tmax:-5, p:777, sunrise:'06:46', sunset:'18:51', src:'REMS (Curiosity), sol 4995, 25 ago 2026: cielo despejado, UV moderado'},
    wxFeed: 'msl', wxInst: 'REMS (Curiosity)',
    radNote: 'Medida en este mismo cráter por el instrumento RAD de Curiosity.',
    // Obstáculos documentados por NASA: [lon, lat] = posición del rover junto al obstáculo; el radio es estimado.
    hazards: [
      {p:[137.4483392,-4.59001956], r:15, name:'Arena suelta (Rocknest)', txt:'Acumulación de arena del viento con una costra de 0,5 cm sobre arena más fina.', src:'NASA/JPL, PIA16469 (sol 61–93)'},
      {p:[137.4493306,-4.58963671], r:12, name:'Escalón de Yellowknife Bay', txt:'Escalón de unos 0,5 m al bajar a la depresión. Curiosity buscó un paso seguro antes de bajar.', src:'NASA/JPL, "Curiosity Rover Nearing Yellowknife Bay", dic. 2012'}
    ],
    coverage: [
      ['ok','Óptico','HiRISE 25 cm y CTX (MRO)'], ['ok','Topografía','DEM HiRISE 1 m + alturas del rover'],
      ['ok','Térmico','THEMIS (Mars Odyssey)'], ['ok','Atmósfera','Estación REMS'],
      ['ok','Radiación','RAD, medida en superficie'], ['ok','Geología','CheMin, SAM, ChemCam y perforaciones']
    ]
  },

  /* ------------------------------------------------------------------ */
  sharp: {
    name: 'Monte Sharp',
    title: 'Monte Sharp · formaciones en caja',
    mission: 'Curiosity (MSL), campaña de formaciones en caja 2025',
    goal: 'Entender cómo se formaron las formaciones en caja: crestas de 1–2 m con huecos de arena entre ellas. Una hipótesis es que el agua subterránea cementó fracturas y la erosión quitó la roca más blanda.',
    // Localizaciones reales de Curiosity, sols 4541–4711 (mayo–noviembre 2025); se omiten puntos a menos de 10 m
    pts: {
      m4541:[137.3859258,-4.79781585,-3654.97,4541], m4544:[137.3856636,-4.79796004,-3654.481,4544],
      m4546:[137.3850097,-4.79826524,-3653.485,4546], m4548:[137.3840451,-4.79879294,-3650.774,4548],
      m4552:[137.3835727,-4.79926999,-3648.368,4552], m4560:[137.3835414,-4.79984723,-3647.181,4560],
      m4571:[137.382987,-4.80040688,-3643.934,4571], m4573:[137.382517,-4.80116383,-3644.188,4573],
      m4575:[137.3821132,-4.80190838,-3644.423,4575], m4578:[137.3817054,-4.8019306,-3645.46,4578],
      m4580:[137.3812512,-4.80232637,-3643.912,4580], m4585:[137.381053,-4.80256772,-3644.11,4585],
      m4587:[137.3807901,-4.80273617,-3643.5,4587], m4588:[137.3805951,-4.80242965,-3645.303,4588],
      m4594:[137.3804319,-4.802963,-3642.423,4594], m4596:[137.3800743,-4.80360579,-3640.497,4596],
      m4598:[137.3797556,-4.80401601,-3635.866,4598], m4600:[137.3796858,-4.804189,-3632.878,4600],
      m4602:[137.3796237,-4.80436679,-3630.754,4602], m4609:[137.3793204,-4.80474015,-3624.329,4609],
      m4612:[137.3792959,-4.80494509,-3623.51,4612], m4614:[137.3794477,-4.80520603,-3622.376,4614],
      m4616:[137.3795247,-4.80545276,-3620.597,4616], m4623:[137.3799173,-4.80548391,-3621.591,4623],
      m4625:[137.3797583,-4.80585913,-3617.654,4625], m4628:[137.3794602,-4.80599016,-3613.896,4628],
      m4629:[137.379723,-4.80616679,-3613.975,4629], m4633:[137.3796739,-4.80645796,-3611.188,4633],
      m4634:[137.3791167,-4.80635617,-3609.909,4634], m4636:[137.3793381,-4.80653823,-3607.128,4636],
      m4643:[137.3794121,-4.80679651,-3604.677,4643], m4650:[137.3798418,-4.8068928,-3610.513,4650],
      m4653:[137.3798962,-4.80708025,-3607.997,4653], m4660:[137.3800604,-4.80745212,-3605.483,4660],
      m4662:[137.3801893,-4.80762759,-3606.064,4662], m4664:[137.3802489,-4.8079252,-3605.206,4664],
      m4667:[137.3805074,-4.80802327,-3604.77,4667], m4669:[137.380883,-4.80805222,-3606.525,4669],
      m4671:[137.3812695,-4.80827103,-3608.263,4671], m4673:[137.3815696,-4.80871606,-3606.57,4673],
      m4680:[137.3812465,-4.80827147,-3608.02,4680], m4684:[137.3810178,-4.80801097,-3607.941,4684],
      m4687:[137.3810353,-4.80783916,-3610.432,4687], m4711:[137.3810041,-4.80800755,-3607.722,4711]
    },
    route: null,   // ida por todos los puntos y regreso por el mismo camino (se arma abajo)
    stops: [
      {key:'m4541', tag:'B', name:'Entrada a las cajas', role:'Base de salida y regreso',
       txt:'Curiosity llegó aquí en mayo de 2025 y tomó un panorama de 360° con 291 fotos (15–18 de mayo). Las primeras crestas son bajas, como un bordillo que se desmorona.',
       task:'Revisar equipo y fotografiar el panorama de crestas antes de salir.',
       sci:{Terreno:'Primeras crestas bajas de la red de cajas', Interés:'Vista general del patrón antes de entrar', Instrumentos:'Mastcam'},
       img:MSLIMG+'proj/msl/redops/ods/surface/sol/04541/opgs/edr/fcam/FLB_800623291EDR_F1160414FHAZ00302M_.JPG', cam:'Hazcam frontal, sol 4541'},
      {key:'m4560', tag:'1', name:'Altadena', role:'Parada 1 · muestra de transición',
       txt:'Curiosity perforó aquí en junio de 2025 (sols 4566–4567), en roca de transición antes de las crestas. Sirve de referencia para comparar con las muestras de cresta y de hueco.',
       task:'Tomar muestra de la roca de transición y registrar su color con la profundidad.',
       sci:{Roca:'Lecho rocoso de transición', Hallazgo:'El color de la roca cambia un poco con la profundidad del agujero', Muestras:'Altadena (taladro)', Instrumentos:'Taladro, CheMin, SAM, APXS, ChemCam'},
       img:MSLIMG+'proj/msl/redops/ods/surface/sol/04560/opgs/edr/ncam/NLB_802307607EDR_F1161944NCAM00264M_.JPG', cam:'Navcam, sol 4560'},
      {key:'m4650', tag:'2', name:'Crestas y nódulos', role:'Parada 2 · cresta contra hueco',
       txt:'Borde de un hueco poco profundo donde la roca lisa de la cresta pasa a roca con nódulos del tamaño de un guisante. Los nódulos aparecen en las paredes y en los huecos, no junto a la fractura central.',
       task:'Comparar la roca lisa y la nodular a ambos lados del borde.',
       sci:{Roca:'Lecho liso de cresta y lecho nodular', Interés:'Dónde se forman los nódulos y por qué', Instrumentos:'MAHLI, APXS, ChemCam, Mastcam'},
       img:MSLIMG+'proj/msl/redops/ods/surface/sol/04650/opgs/edr/ncam/NLB_810298354EDR_F1182304NCAM00270M_.JPG', cam:'Navcam, sol 4650'},
      {key:'m4687', tag:'3', name:'Valle de la Luna', role:'Parada 3 · muestra de hueco',
       txt:'Bloque en el hueco Monte Grande, perforado en octubre de 2025. El fondo de los huecos suele estar cubierto de arena o grava, con poca roca a la vista.',
       task:'Tomar muestra del lecho del hueco.',
       sci:{Roca:'Lecho rocoso del hueco', Hallazgo:'Minerales de carbonato (difracción de rayos X)', Muestras:'Valle de la Luna (taladro)', Instrumentos:'Taladro, CheMin, SAM'},
       img:MSLIMG+'proj/msl/redops/ods/surface/sol/04687/opgs/edr/fcam/FLB_813578617EDR_F1191722FHAZ00302M_.JPG', cam:'Hazcam frontal, sol 4687'},
      {key:'m4711', tag:'4', name:'Nevado Sajama', role:'Parada 4 · muestra de cresta',
       txt:'Lo alto de la cresta junto al hueco Monte Grande. Curiosity terminó de perforar aquí el sol 4718 (13 de noviembre de 2025). Desde aquí se regresa a la base.',
       task:'Tomar muestra de la cresta para compararla con Valle de la Luna y regresar.',
       sci:{Roca:'Lecho rocoso de la cresta', Hallazgo:'Minerales de arcilla (difracción de rayos X)', Muestras:'Nevado Sajama (taladro)', Instrumentos:'Taladro, CheMin, SAM'},
       img:MSLIMG+'proj/msl-red-vol2/redops/ods/surface/sol/04718/opgs/edr/fcam/FLB_816332976EDR_F1200082FHAZ00337M_.JPG', cam:'Hazcam frontal, sol 4718'}
    ],
    layers: null,  // las mismas de Gale (se asignan abajo)
    weather: {tmin:-71, tmax:-5, p:777, sunrise:'06:46', sunset:'18:51', src:'REMS (Curiosity), sol 4995, 25 ago 2026: cielo despejado, UV moderado'},
    wxFeed: 'msl', wxInst: 'REMS (Curiosity)',
    radNote: 'Medida en el cráter Gale por el instrumento RAD de Curiosity.',
    hazards: [
      {p:[137.3810353,-4.80783916], r:15, name:'Arena en el hueco', txt:'El fondo de los huecos suele tener arena o grava suelta.', src:'Blog de Curiosity, sols 4689–4694 (oct. 2025)'},
      {p:[137.3810041,-4.80800755], r:10, name:'Pared de cresta de 1–2 m', txt:'Las crestas miden 1–2 m de alto y son poco más anchas que el rover: subir con apoyo.', src:'NASA, "Curiosity Sees Martian Spiderwebs Up Close", feb. 2026'}
    ],
    coverage: [
      ['ok','Óptico','HiRISE 25 cm y CTX (MRO)'], ['ok','Topografía','DEM HiRISE 1 m + alturas del rover'],
      ['ok','Térmico','THEMIS (Mars Odyssey)'], ['ok','Atmósfera','Estación REMS'],
      ['ok','Radiación','RAD, medida en Gale'], ['ok','Geología','Tres perforaciones: transición, hueco y cresta']
    ]
  }
};
{ const r = Object.keys(ZONES.sharp.pts); ZONES.sharp.route = r.concat(r.slice(0,-1).reverse()); }
ZONES.sharp.layers = ZONES.gale.layers;

/* Sitios con misión de superficie de NASA, para la cuadrícula global: [lat, lon] */
const SITES = [
  {n:'Gale · Curiosity (2012–hoy)', ll:[-4.59,137.44], extra:['Atmósfera (REMS)','Radiación (RAD)','Geología in situ'], dev:'gale'},
  {n:'Monte Sharp · Curiosity, formaciones en caja (2025)', ll:[-4.80,137.38], extra:['Atmósfera (REMS)','Radiación (RAD)','Geología in situ'], dev:'sharp'},
  {n:'Jezero · Perseverance (2021–hoy)', ll:[18.44,77.45], extra:['Atmósfera (MEDA)','Geología in situ'], dev:'jezero'},
  {n:'Elysium · InSight (2018–2022)', ll:[4.50,135.62], extra:['Atmósfera','Geofísica (sismómetro)']},
  {n:'Meridiani · Opportunity (2004–2018)', ll:[-1.95,-5.53], extra:['Geología in situ']},
  {n:'Gusev · Spirit (2004–2010)', ll:[-14.57,175.47], extra:['Geología in situ']},
  {n:'Chryse · Viking 1 (1976–1982)', ll:[22.27,-47.95], extra:['Atmósfera (histórica)']},
  {n:'Utopia · Viking 2 (1976–1980)', ll:[47.64,134.29], extra:['Atmósfera (histórica)']},
  {n:'Ares Vallis · Pathfinder (1997)', ll:[19.13,-33.22], extra:['Atmósfera (histórica)','Geología in situ']},
  {n:'Vastitas Borealis · Phoenix (2008)', ll:[68.22,-125.75], extra:['Atmósfera (histórica)','Geología in situ']}
];
