/* =====================================================================
   Marswalk HUD · textos en inglés de las zonas (js/data.js tiene los de español).
   Solo se aplican cuando el idioma elegido es inglés. Las paradas se emparejan por su
   clave (s667, g57...) y los obstáculos y la cobertura por su posición.
   ===================================================================== */
if (LANG === 'en') {
  const BASE = 'Start and return base', CHECK = 'Check gear and log conditions before leaving.';
  const EN = {
    jezero: {
      title: 'Jezero crater · delta front',
      goal: 'Look for signs of ancient life in the sedimentary rocks of the delta, where a river flowed into a lake more than 3 billion years ago.',
      radNote: 'Reference: Curiosity\'s RAD in Gale, 3,700 km away. There is no radiation sensor in Jezero.',
      weatherSrc: 'MEDA (Perseverance), sol 1133, 27 Apr 2024: latest published by the API',
      stops: {
        s667: {role: BASE, task: CHECK,
          txt: 'Flat ground at the foot of the delta. Perseverance left a depot of 10 sample tubes here between December 2022 and January 2023.',
          sci: {Terrain: 'Plain at the foot of the delta', Finding: 'Backup depot with 10 sample tubes', Instruments: 'Arm cameras and Mastcam-Z'}},
        s441: {role: 'Stop 1 · stratigraphy',
          txt: 'Climbing corridor up the delta front, where the sediment layers the river left as it entered the lake begin to show.',
          task: 'Photograph the exposed layers and measure their thickness.',
          sci: {Rock: 'Layered sedimentary', Interest: 'Order in which the river laid down the sediments', Instruments: 'Mastcam-Z, SuperCam'}},
        s477: {role: 'Stop 2 · main sampling',
          txt: 'Fine-grained rocks that Perseverance drilled in 2022, next to Skinner Ridge. Here the SHERLOC instrument detected organic compounds.',
          task: 'Take samples: this is the best site on the route to look for signs of ancient life.',
          sci: {Rock: 'Mudstone (fine-grained) with sulfates', Finding: 'Organic compounds detected by SHERLOC', Samples: 'Hazeltine and Bearwallow (Wildcat Ridge); Swift Run and Skyland (Skinner Ridge)', Instruments: 'SHERLOC, PIXL, drill'}},
        s709: {name: 'Delta rim', role: 'Stop 3 · panorama and return',
          txt: 'Highest point of the route, about 48 m above the base. Perseverance passed here on sol 709 as it began its campaign on the upper fan.',
          task: 'Take a panorama of the crater, note the change in rock and head back.',
          sci: {Terrain: 'Upper fan', Interest: 'Shift from fine sediment to coarser material', Instruments: 'Mastcam-Z'}}
      },
      coverage: [['ok','Optical','HiRISE 25 cm and CTX 6 m (MRO)'], ['ok','Topography','Rover elevations + MOLA'],
        ['ok','Thermal','THEMIS (Mars Odyssey)'], ['ok','Atmosphere','MEDA station'],
        ['warn','Radiation','No sensor: Gale reference'], ['ok','Geology','SHERLOC, PIXL, SuperCam and samples']]
    },
    gale: {
      title: 'Gale crater · Yellowknife Bay',
      goal: 'Study an ancient lakebed. At Yellowknife Bay, Curiosity drilled a rock on Mars for the first time and found clays: an environment that could have been habitable.',
      radNote: 'Measured in this same crater by Curiosity\'s RAD instrument.',
      weatherSrc: 'REMS (Curiosity), sol 4995, 25 Aug 2026: clear sky, moderate UV',
      stops: {
        g3: {role: BASE, task: CHECK,
          txt: 'Where Curiosity landed on 6 August 2012. A gravel plain with Mount Sharp to the south.',
          sci: {Terrain: 'Gravel plain', Finding: 'Conglomerates from an ancient stream were seen near here', Instruments: 'Mastcam, ChemCam'}},
        g57: {role: 'Stop 1 · soil and sand',
          txt: 'A wind-blown sand deposit. Here Curiosity scooped its first soil and analyzed it on board.',
          task: 'Collect sand and compare its composition with Curiosity\'s analysis.',
          sci: {Material: 'Wind-blown sand and dust', Finding: 'First X-ray diffraction mineral analysis on another planet (CheMin)', Instruments: 'CheMin, SAM, APXS'}},
        g125: {name: 'Yellowknife Bay entry', role: 'Stop 2 · descent into the depression',
          txt: 'Edge of a shallow depression about 20 m below the landing site. The rocks turn fine-grained and light-toned veins appear.',
          task: 'Document the change in rock and the mineral veins before going down.',
          sci: {Rock: 'Fine-grained sedimentary', Interest: 'Light calcium sulfate veins: water that flowed through cracks', Instruments: 'ChemCam, Mastcam'}},
        g133: {role: 'Stop 3 · main sampling',
          txt: 'First rock drilled on Mars (sol 182, February 2013). The powder held clays formed in water that was not very salty and had a neutral pH.',
          task: 'Sample the mudstone and return to base.',
          sci: {Rock: 'Mudstone (Sheepbed)', Finding: 'Clays: ancient lake with habitable conditions', Samples: 'John Klein and Cumberland (Curiosity drill holes)', Instruments: 'Drill, CheMin, SAM'}}
      },
      hazards: [
        {name: 'Loose sand (Rocknest)', txt: 'Wind-blown sand with a 0.5 cm crust over finer sand.', src: 'NASA/JPL, PIA16469 (sols 61–93)'},
        {name: 'Yellowknife Bay step', txt: 'A step of about 0.5 m down into the depression. Curiosity looked for a safe way down first.', src: 'NASA/JPL, "Curiosity Rover Nearing Yellowknife Bay", Dec 2012'}
      ],
      coverage: [['ok','Optical','HiRISE 25 cm and CTX (MRO)'], ['ok','Topography','HiRISE 1 m DEM + rover elevations'],
        ['ok','Thermal','THEMIS (Mars Odyssey)'], ['ok','Atmosphere','REMS station'],
        ['ok','Radiation','RAD, measured on the surface'], ['ok','Geology','CheMin, SAM, ChemCam and drill holes']]
    },
    sharp: {
      name: 'Mount Sharp',
      title: 'Mount Sharp · boxwork',
      mission: 'Curiosity (MSL), 2025 boxwork campaign',
      goal: 'Understand how the boxwork formed: ridges 1–2 m tall with sandy hollows between them. One hypothesis is that groundwater cemented fractures and erosion removed the softer rock.',
      radNote: 'Measured in Gale crater by Curiosity\'s RAD instrument.',
      weatherSrc: 'REMS (Curiosity), sol 4995, 25 Aug 2026: clear sky, moderate UV',
      stops: {
        m4541: {name: 'Boxwork entrance', role: BASE, cam: 'Front Hazcam, sol 4541',
          txt: 'Curiosity arrived here in May 2025 and took a 360° panorama from 291 images (15–18 May). The first ridges are low, like a crumbling curb.',
          task: 'Check gear and photograph the ridge panorama before leaving.',
          sci: {Terrain: 'First low ridges of the boxwork network', Interest: 'Overview of the pattern before going in', Instruments: 'Mastcam'}},
        m4560: {role: 'Stop 1 · transition sample',
          txt: 'Curiosity drilled here in June 2025 (sols 4566–4567), in transition rock before the ridges. It is the reference to compare with the ridge and hollow samples.',
          task: 'Sample the transition rock and log its color with depth.',
          sci: {Rock: 'Transition bedrock', Finding: 'The rock color shifts slightly with hole depth', Samples: 'Altadena (drill)', Instruments: 'Drill, CheMin, SAM, APXS, ChemCam'}},
        m4650: {name: 'Ridges and nodules', role: 'Stop 2 · ridge versus hollow',
          txt: 'Edge of a shallow hollow where smooth ridge rock turns into rock with pea-sized nodules. The nodules show up on the walls and in the hollows, not next to the central fracture.',
          task: 'Compare the smooth and the nodular rock on both sides of the edge.',
          sci: {Rock: 'Smooth ridge bedrock and nodular bedrock', Interest: 'Where the nodules form and why', Instruments: 'MAHLI, APXS, ChemCam, Mastcam'}},
        m4687: {role: 'Stop 3 · hollow sample', cam: 'Front Hazcam, sol 4687',
          txt: 'Block in the Monte Grande hollow, drilled in October 2025. Hollow floors are often covered with sand or gravel, with little rock exposed.',
          task: 'Sample the bedrock of the hollow.',
          sci: {Rock: 'Hollow bedrock', Finding: 'Carbonate minerals (X-ray diffraction)', Samples: 'Valle de la Luna (drill)', Instruments: 'Drill, CheMin, SAM'}},
        m4711: {role: 'Stop 4 · ridge sample', cam: 'Front Hazcam, sol 4718',
          txt: 'Top of the ridge next to the Monte Grande hollow. Curiosity finished drilling here on sol 4718 (13 November 2025). From here you head back to base.',
          task: 'Sample the ridge to compare it with Valle de la Luna, then return.',
          sci: {Rock: 'Ridge bedrock', Finding: 'Clay minerals (X-ray diffraction)', Samples: 'Nevado Sajama (drill)', Instruments: 'Drill, CheMin, SAM'}}
      },
      hazards: [
        {name: 'Sand in the hollow', txt: 'Hollow floors often have loose sand or gravel.', src: 'Curiosity blog, sols 4689–4694 (Oct 2025)'},
        {name: '1–2 m ridge wall', txt: 'Ridges are 1–2 m tall and barely wider than the rover: climb with support.', src: 'NASA, "Curiosity Sees Martian Spiderwebs Up Close", Feb 2026'}
      ],
      coverage: [['ok','Optical','HiRISE 25 cm and CTX (MRO)'], ['ok','Topography','HiRISE 1 m DEM + rover elevations'],
        ['ok','Thermal','THEMIS (Mars Odyssey)'], ['ok','Atmosphere','REMS station'],
        ['ok','Radiation','RAD, measured in Gale'], ['ok','Geology','Three drill holes: transition, hollow and ridge']]
    }
  };

  for (const [k, e] of Object.entries(EN)) {
    const z = ZONES[k];
    ['name', 'title', 'mission', 'goal', 'radNote', 'coverage'].forEach(f => { if (e[f]) z[f] = e[f]; });
    if (e.weatherSrc) z.weather.src = e.weatherSrc;
    z.stops.forEach(s => Object.assign(s, e.stops[s.key]));
    (e.hazards || []).forEach((h, i) => Object.assign(z.hazards[i], h));
  }

  // capas: el nombre depende solo del tipo (la de CTX conserva su resolución)
  const LAYER = {night: 'Night thermal', day: 'Day thermal', mola: 'MOLA relief', dem: 'Elevation 1 m'};
  new Set([...GLOBAL_LAYERS, ...ZONES.jezero.layers, ...ZONES.gale.layers]).forEach(l => {
    if (LAYER[l.id]) l.label = LAYER[l.id];
    l.label = l.label.replace('Imagen CTX', 'CTX image');
  });

  // sitios de la vista global
  const WORDS = [['(2012–hoy)', '(2012–present)'], ['(2021–hoy)', '(2021–present)'], ['Monte Sharp', 'Mount Sharp'],
    ['formaciones en caja', 'boxwork'], ['Atmósfera', 'Atmosphere'], ['Radiación', 'Radiation'], ['Geología in situ', 'In-situ geology'],
    ['Geofísica (sismómetro)', 'Geophysics (seismometer)'], ['(histórica)', '(historical)']];
  const tr = s => WORDS.reduce((a, [es, en]) => a.replace(es, en), s);
  SITES.forEach(s => { s.n = tr(s.n); s.extra = s.extra.map(tr); });
}
