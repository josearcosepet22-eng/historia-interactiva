import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Google GenAI client according to instructions
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const SYSTEM_INSTRUCTION = `Eres un motor de historias interactivas y Game Master de élite especializado en Ciencia Ficción, Misterio Noir y Fantasía Oscura.
Tu misión es dirigir una experiencia inmersiva de rol tipo "Elige tu propia aventura" ambientada en un multiverso donde las elecciones del usuario remodelan la realidad física, cósmica o temporal.

REGLAS ESTRICTAS DE ESTRUCTURA Y FORMATO (DEBES CUMPLIRLAS EN CADA TURNO SIN EXCEPCIÓN):
Tu respuesta DEBE contener obligatoriamente estas cuatro secciones en Markdown con estos títulos exactos:

### [Nivel / Dimensión]
Indica la ubicación actual en el multiverso y el capítulo.
Ejemplo: Capítulo 1 | Dimensión N32-Alfa: El Observatorio Abandonado

### [Narrativa]
Escribe la historia o continuación (entre 150 y 250 palabras). Estilo altamente descriptivo, cinematográfico, sensorial y atrapante. Mantén la tensión y adapta la trama según la elección del usuario. Introduce eventos multiversales, leyes físicas cambiantes o anomalías cuando sea propicio.

### [Estado Actual]
Un resumen ultra breve del estado del usuario en una sola línea o dos.
Ejemplo: Inventario: Llave de bronce, Diario codificado | Salud: 85% - Estable | Paradoja Multiversal: 12%

### [Tus Opciones]
Presenta SIEMPRE EXACTAMENTE tres alternativas claras y contrastantes marcadas como botones/opciones numeradas con este formato exacto:
- **[1]** [Acción corta y descriptiva] (Enfoque: Acción o confrontación directa)
- **[2]** [Acción corta y descriptiva] (Enfoque: Sigilo, análisis o investigación)
- **[3]** [Acción corta y descriptiva] (Enfoque: Ingenio, uso del entorno o giro multiversal inesperado)

REGLAS DE MECÁNICA Y MULTIVERSO:
- Mantén rigurosa coherencia de inventario, heridas, alianzas y decisiones pasadas.
- Si la decisión del usuario resulta en su muerte o en el colapso irreparable de su línea temporal, concluye de forma épica y trágica, marcando el final y ofreciendo como opción única o principal:
- **[1]** [Reiniciar la línea temporal]
- **[2]** [Retroceder al punto de bifurcación anterior]
- Todo el contenido debe estar en español fluido y evocador.`;

interface TurnHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

// Robust parser to extract sections for interactive UI
function parseGameMasterResponse(rawText: string) {
  let dimension = 'Capítulo 1 | Dimensión Desconocida';
  let narrative = '';
  let status = 'Inventario: Vacío | Estado: Intacto';
  let options: Array<{ id: number; text: string; raw: string; approach: 'action' | 'stealth' | 'wit' | 'restart' }> = [];
  let isGameOver = false;

  const dimMatch = rawText.match(/###?\s*\[Nivel\s*\/\s*Dimensi[oó]n\]\s*([\s\S]*?)(?=###?\s*\[Narrativa\]|$)/i);
  if (dimMatch && dimMatch[1]) {
    dimension = dimMatch[1].trim();
  }

  const narMatch = rawText.match(/###?\s*\[Narrativa\]\s*([\s\S]*?)(?=###?\s*\[Estado Actual\]|$)/i);
  if (narMatch && narMatch[1]) {
    narrative = narMatch[1].trim();
  }

  const statusMatch = rawText.match(/###?\s*\[Estado Actual\]\s*([\s\S]*?)(?=###?\s*\[Tus Opciones\]|$)/i);
  if (statusMatch && statusMatch[1]) {
    status = statusMatch[1].trim();
  }

  const optionsMatch = rawText.match(/###?\s*\[Tus Opciones\]\s*([\s\S]*?)$/i);
  if (optionsMatch && optionsMatch[1]) {
    const lines = optionsMatch[1].split('\n');
    for (const line of lines) {
      const optMatch = line.match(/(?:-\s*)?\*\*\[(\d+)\]\*\*\s*(.*)/i) || line.match(/\[(\d+)\]\s*(.*)/);
      if (optMatch) {
        const num = parseInt(optMatch[1], 10);
        let text = optMatch[2].trim();
        // Remove trailing hints like (Enfoque: ...) if present for cleaner buttons
        const cleanText = text.replace(/\s*\(Enfoque:[^)]*\)/i, '').replace(/^-\s*/, '').trim();

        const lower = cleanText.toLowerCase();
        let approach: 'action' | 'stealth' | 'wit' | 'restart' = 'action';
        if (lower.includes('reiniciar') || lower.includes('retroceder')) {
          approach = 'restart';
          isGameOver = true;
        } else if (num === 1) {
          approach = 'action';
        } else if (num === 2) {
          approach = 'stealth';
        } else if (num === 3) {
          approach = 'wit';
        }

        options.push({
          id: num,
          text: cleanText,
          raw: line.trim(),
          approach,
        });
      }
    }
  }

  // Check if narrative talks about death or timeline collapse
  const lowerNar = narrative.toLowerCase();
  if (lowerNar.includes('has muerto') || lowerNar.includes('tu cuerpo se desintegra') || lowerNar.includes('línea temporal colapsada') || lowerNar.includes('fin de la existencia')) {
    isGameOver = true;
  }

  // Fallback if parsing failed partially
  if (!narrative && rawText) {
    narrative = rawText;
  }

  return {
    rawMarkdown: rawText,
    dimension,
    narrative,
    status,
    options,
    isGameOver,
  };
}

// Fallback high-quality prologue if API key isn't provided or network offline
function getCuratedPrologue(genre: string, customGenre?: string) {
  if (genre.includes('Cyberpunk') || genre.includes('Noir') || genre === '1') {
    const raw = `### [Nivel / Dimensión]
Capítulo 1 | Dimensión Delta-9: Los Bajos Fondos de Neo-Kowloon

### [Narrativa]
La lluvia de cromo cae incesante sobre las pasarelas suspendidas del Distrito 7. Los hologramas comerciales parpadean con interferencias estáticas en tonos carmesí y cobalto, reflejándose en tu gabardina empapada de condensación ácida. Hace apenas diez minutos recibiste un archivo neuronal autoejecutable en tu implante ocular izquierdo; su remitente es una firma cuántica clasificada como "Extinta". El archivo contiene las coordenadas de un club clandestino subterráneo conocido como "El Vórtice Cero" y una advertencia grabada con la voz distorsionada de tu antiguo socio, quien supuestamente desapareció de esta realidad hace tres años: "No confíes en tus propios recuerdos; la corporación Aethelgard ha empezado a fracturar la línea de tiempo". Frente a ti se abren las escaleras metálicas hacia la compuerta hidráulica del club, custodiada por dos androides de asalto con ópticas infrarrojas, mientras a tu derecha un callejón estrecho despide un silbido de vapor ionizado y un zumbido de escáneres corporativos acercándose por el cielo.

### [Estado Actual]
Inventario: Deck cibernético portátil, Cuchilla térmica, Chip neuronal sellado | Salud: 100% - Operativo | Paradoja Multiversal: 5%

### [Tus Opciones]
- **[1]** Desenvainar la cuchilla térmica y avanzar de frente hacia los guardias androides con paso firme.
- **[2]** Deslizarte por las sombras del callejón lateral para hackear el ducto de ventilación del club.
- **[3]** Conectar tu deck cibernético a la red pública del distrito y emitir una señal falsa para desviar a los escáneres.`;
    return parseGameMasterResponse(raw);
  }

  if (genre.includes('Fantasía') || genre === '2') {
    const raw = `### [Nivel / Dimensión]
Capítulo 1 | Dimensión Umbracaelum-III: Las Grietas del Reino Roto

### [Narrativa]
El cielo sobre las ruinas de la Ciudadela de Obsidiana no posee estrellas ni sol; en su lugar, una herida cósmica purpúrea sangra motas de luz dorada sobre la tierra yerma. Eres uno de los últimos Guardianes del Umbral, capaces de percibir el eco de mundos superpuestos. En tu mano izquierda, el anillo de resonancia astral arde con un frío lacerante: anuncia que una fisura dimensional acaba de abrirse en la nave central del templo en ruinas. Al acercarte cautelosamente entre columnas de mármol negro talladas con los nombres de dioses olvidados, distingues un altar flotante rodeado por tres espectros encadenados por runas de vacío. En el centro del vórtice descansa el Corazón del Crepúsculo, un artefacto capaz de sellar o desatar la colisión de dos planos de la realidad. De pronto, el piso tiembla y un murmullo telúrico en una lengua que no pertenece a este mundo resuena directamente en tu mente, exigiendo un tributo de sangre o un pacto de lealtad.

### [Estado Actual]
Inventario: Anillo de resonancia astral, Daga de plata estelar, Frasco de lágrimas de éter | Salud: 95% - Vigoroso | Paradoja Multiversal: 8%

### [Tus Opciones]
- **[1]** Alzar la daga de plata e invocar un canto de guerra para desterrar a los espectros por la fuerza.
- **[2]** Rodear el perímetro ocultándote entre las sombras de las columnas para descifrar las runas del altar.
- **[3]** Ofrecer una gota de tu sangre al anillo de resonancia para sintonizar con la voz de la fisura.`;
    return parseGameMasterResponse(raw);
  }

  // Default: Sci-Fi / Espacio-Temporal
  const raw = `### [Nivel / Dimensión]
Capítulo 1 | Dimensión Crono-0: Estación Orbital Event Horizon VII

### [Narrativa]
Las sirenas de advertencia giran silenciosas tras las compuertas de cuarzo reforzado; en el vacío espacial, la destrucción no produce sonido alguno. La estación científica Event Horizon orbita a escasos kilómetros del radio de Schwarzschild de la singularidad Tique-Beta. Los monitores holográficos parpadean en ámbar frenético: la gravedad local oscila entre cero y tres gravedades en intervalos de cinco segundos debido a una ruptura en el estabilizador taquiónico. Acabas de despertar de la cápsula de estasis con una amnesia retrógrada parcial. Al mirar por el ventanal panorámico, presencias algo imposible: flotando fuera de la estación hay tres versiones idénticas del transbordador de escape, una intacta, otra hecha pedazos humeantes y una tercera que parece estar retrocediendo en el tiempo. La inteligencia artificial de la estación, E.C.H.O., proyecta un avatar distorsionado: "Investigador, las líneas temporales se están superponiendo. Si no cerramos la compuerta del reactor en ocho minutos, seremos absorbidos por nuestro propio pasado".

### [Estado Actual]
Inventario: Traje presurizado EVA, Multillave gravitatoria, Unidad de datos de estasis | Salud: 90% - Náuseas por estasis | Paradoja Multiversal: 15%

### [Tus Opciones]
- **[1]** Correr directo por el pasillo central hacia la esclusa del reactor a pesar de las fluctuaciones gravitatorias.
- **[2]** Acceder a la terminal auxiliar de E.C.H.O. para purgar los registros de telemetría y calcular la falla.
- **[3]** Utilizar la multillave gravitatoria para invertir el campo de tu traje y proyectarte hacia el transbordador temporal.`;
  return parseGameMasterResponse(raw);
}

// Endpoint to start the adventure based on chosen genre
app.post('/api/story/start', async (req: Request, res: Response) => {
  const { genre, customGenre, protagonistName } = req.body;

  const prompt = `Inicia la aventura interactiva tipo "Elige tu propia aventura".
El jugador ha elegido el siguiente género: "${genre}".
${customGenre ? `Idea o especificación personalizada del jugador: "${customGenre}".` : ''}
${protagonistName ? `Nombre o título del protagonista: "${protagonistName}".` : ''}

Recuerda cumplir OBLIGATORIAMENTE la estructura:
### [Nivel / Dimensión]
### [Narrativa] (150 a 250 palabras, inmersiva, descriptiva, atrapante)
### [Estado Actual] (Inventario, Salud, Paradoja Multiversal)
### [Tus Opciones] (Exactamente 3 opciones numeradas: **[1]**, **[2]**, **[3]** con enfoques contrastantes de acción directa, sigilo/investigación e ingenio/giro multiversal).`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not configured, using curated prologue.');
      const parsed = getCuratedPrologue(genre, customGenre);
      return res.json({ success: true, data: parsed, isFallback: true });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.85,
        topP: 0.95,
      },
    });

    const text = response.text || '';
    const parsed = parseGameMasterResponse(text);

    return res.json({
      success: true,
      data: parsed,
      isFallback: false,
    });
  } catch (error: any) {
    console.error('Error generating story prologue:', error);
    // Return curated fallback to guarantee gameplay never freezes
    const parsed = getCuratedPrologue(genre, customGenre);
    return res.json({
      success: true,
      data: parsed,
      errorNotice: error?.message || 'Error communicating with AI engine; loaded temporal fallback.',
      isFallback: true,
    });
  }
});

// Endpoint for continuing the adventure turn by turn
app.post('/api/story/turn', async (req: Request, res: Response) => {
  const { history, choiceText, choiceApproach, customAction, currentStats, currentDimension } = req.body;

  const lastAction = customAction ? `Acción libre personalizada del usuario: "${customAction}"` : `El usuario eligió: "${choiceText}" (Enfoque: ${choiceApproach || 'acción'})`;

  // Build compact contextual memory from past turns
  const historyText = Array.isArray(history)
    ? history
        .slice(-6)
        .map((h: TurnHistoryItem) => `${h.role === 'user' ? 'Elección del Jugador' : 'Narrativa GM'}:\n${h.content}`)
        .join('\n\n---\n\n')
    : '';

  const prompt = `Continúa la historia multiversal interactiva.
DIMENSIÓN PREVIA: ${currentDimension || 'Desconocida'}
ESTADO PREVIO: ${currentStats || 'Normal'}

HISTORIAL RECIENTE:
${historyText}

NUEVA ACCIÓN DEL JUGADOR:
${lastAction}

INSTRUCCIONES CLAVE:
1. Resuelve las consecuencias inmediatas y multiversales de la acción del jugador.
2. Modifica el estado, agrega o consume objetos en el Inventario, y ajusta la Paradoja Multiversal o Salud según el riesgo asumido.
3. Si el jugador realizó una maniobra dimensional, puedes cambiar de dimensión o alterar las leyes del entorno.
4. Genera SIEMPRE las 4 secciones estrictas:
### [Nivel / Dimensión]
### [Narrativa] (150 a 250 palabras, rica en atmósfera y tensión)
### [Estado Actual] (Inventario actualizado, Salud, Paradoja Multiversal)
### [Tus Opciones] (Exactamente 3 opciones con formato **[1]**, **[2]**, **[3]** con enfoques contrastantes de combate/fuerza, sigilo/observación e ingenio/distorsión dimensional. Si el personaje muere, ofrece el reinicio de la línea temporal).`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      // Simulate intelligent branch if no key is supplied
      const simulatedText = `### [Nivel / Dimensión]
Capítulo 2 | Dimensión ${currentDimension?.includes('Delta') ? 'Delta-9.2' : currentDimension?.includes('Umbra') ? 'Umbracaelum-Profunda' : 'Crono-Shift'}: La Bifurcación Inminente

### [Narrativa]
Tu decisión resuena a través del entramado cuántico de la realidad. Al ejecutar la acción ("${customAction || choiceText}"), el aire a tu alrededor se comprime con un zumbido agudo y el espacio se desdobla por una fracción de segundo. Aquello que parecía un obstáculo estático cobra vida: una salva de pulsos electromagnéticos barre el suelo mientras la estructura tiembla violentamente. Lograste avanzar gracias a tu agilidad, pero el tejido dimensional ha quedado sensibilizado por tu intervención; sombras translúcidas de otros posibles futuros caminan a escasos metros de ti, repitiendo movimientos que aún no has decidido realizar. En el centro de la sala recién descubierta, un núcleo de energía titila sobre un pedestal de aleación desconocida, conectado a conductos luminosos que se ramifican hacia tres compuertas selladas. Una alarma rítmica comienza la cuenta regresiva para una purga atmosférica.

### [Estado Actual]
${currentStats || 'Inventario: Modificado por la acción | Salud: 85% | Paradoja: 22%'}

### [Tus Opciones]
- **[1]** Forzar la compuerta blindada con una sobrecarga de energía antes de que se complete el ciclo.
- **[2]** Ocultarte tras las consolas caídas y analizar los patrones lumínicos del núcleo para descifrar la ruta segura.
- **[3]** Interferir el pedestal cuántico para canalizar la paradoja temporal y congelar momentáneamente la cuenta regresiva.`;

      const parsed = parseGameMasterResponse(simulatedText);
      return res.json({ success: true, data: parsed, isFallback: true });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.85,
        topP: 0.95,
      },
    });

    const text = response.text || '';
    const parsed = parseGameMasterResponse(text);

    return res.json({
      success: true,
      data: parsed,
      isFallback: false,
    });
  } catch (error: any) {
    console.error('Error generating story turn:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Error en el motor multiversal de Gemini.',
    });
  }
});

// Setup Vite middleware in dev or static serving in prod
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Chronoverse Engine] Game Master listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
