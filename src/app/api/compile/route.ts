import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prompt, apiKey, previousProject } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required for Real API Mode.' },
        { status: 400 }
      );
    }

    const systemInstruction = `
You are VibePCB, an AI-powered Electronic Design Automation (EDA) and board layout routing assistant.
The user will describe their hardware requirements. You must act as a hardware designer and output a complete, valid JSON PCB project that matches the specification.

Return ONLY a raw JSON object conforming to the following TypeScript interfaces. Do not include markdown code block formatting (like \`\`\`json). Just the raw JSON.

interface ComponentPin {
  num: string;
  name: string;
}

interface SchematicComponent {
  id: string; // e.g., "U1", "R1", "C1"
  name: string; // e.g., "ESP32-S3", "Resistor"
  value: string; // e.g., "ESP32-S3-WROOM-1", "10k"
  footprint: string; // e.g., "RF_Module:ESP32-S3", "Resistor_SMD:R_0603"
  x: number; // schematic x coordinate (100 to 500)
  y: number; // schematic y coordinate (100 to 500)
  width: number;
  height: number;
  pins: ComponentPin[];
}

interface PCBComponent {
  id: string; // matches id in SchematicComponent
  name: string;
  value: string;
  footprint: string;
  x: number; // board x coordinate (0 to 50 mm)
  y: number; // board y coordinate (0 to 50 mm)
  rotation: number; // rotation in degrees (0, 90, 180, 270)
  width: number; // physical package width in mm
  height: number; // physical package height in mm
  pads: {
    num: string;
    x: number; // offset from component center in mm (e.g. -1.5)
    y: number; // offset from component center in mm (e.g. 1.0)
    shape: 'rect' | 'circle' | 'oblong';
    w: number; // width in mm
    h: number; // height in mm
  }[];
}

interface ConnectionNet {
  name: string; // e.g., "GND", "3V3", "SDA"
  color: string; // HEX color (e.g., "#00ffff")
  connections: { componentId: string; pinNum: string }[];
}

interface PCBTrace {
  net: string; // matches net name
  layer: 'F.Cu' | 'B.Cu';
  width: number; // trace width in mm (e.g., 0.25)
  points: [number, number][]; // 2D points on board coordinate space (0 to 50 mm)
}

interface AgentStep {
  type: 'info' | 'search' | 'check' | 'route' | 'success';
  message: string;
  delay: number; // delay in ms for typing animation
}

interface ProjectScenario {
  id: string;
  title: string;
  prompt: string;
  description: string;
  boardWidth: number; // board size in mm (max 50)
  boardHeight: number; // board size in mm (max 50)
  components: SchematicComponent[];
  pcbComponents: PCBComponent[];
  nets: ConnectionNet[];
  traces: PCBTrace[];
  logs: AgentStep[];
}

Keep layout coordinate scales relative to boardWidth and boardHeight.
Assign coordinate values realistically so components do not overlap on the PCB, and passive components (decoupling capacitors, pull-ups) are placed close to their targets.
Traces must connect the pads of components belonging to the same Net.
Ensure to include realistic agent logs describing the step-by-step synthesis steps.
`;

    const userMessageContent = previousProject
      ? `Current board design JSON:
${JSON.stringify(previousProject, null, 2)}

User request for design refinement:
"${prompt}"

Please apply this refinement to the board design. Output the updated JSON PCB project conforming to the ProjectScenario interface. Ensure you preserve unchanged components, designators, and traces, only adjusting what is requested or electrically necessary, and update the 'logs' array with steps explaining the modification.`
      : `User request: ${prompt}\n\nGenerate the complete JSON PCB project matching this specification.`;

    // Only use confirmed working model IDs for the v1beta API
    const models = [
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.5-pro',
    ];

    let lastError = null;

    for (const model of models) {
      try {
        console.log(`Attempting compilation with model: ${model}`);
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: userMessageContent }
                  ]
                }
              ],
              systemInstruction: {
                parts: [{ text: systemInstruction }]
              },
              generationConfig: {
                responseMimeType: 'application/json'
              }
            }),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Model ${model} returned status ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const finishReason = data.candidates?.[0]?.finishReason;

        if (!text) {
          throw new Error(`Model ${model} returned empty response content.`);
        }

        if (finishReason === 'MAX_TOKENS') {
          throw new Error(`Model ${model} hit MAX_TOKENS limit — response was truncated. Trying next model.`);
        }

        let cleanJson = text.trim();
        if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
        }

        let pcbProject;
        try {
          pcbProject = JSON.parse(cleanJson);
        } catch (parseErr) {
          throw new Error(`Model ${model} returned malformed JSON: ${parseErr}`);
        }

        // Add info log on which model compiled it for transparency
        if (pcbProject.logs) {
          pcbProject.logs.unshift({
            type: 'info',
            message: `AI hardware layout successfully compiled by ${model}.`,
            delay: 300
          });
        }

        return NextResponse.json(pcbProject);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.warn(`Model ${model} compilation failed:`, errorMessage);
        lastError = err instanceof Error ? err : new Error(errorMessage);
        // Continue to the next model in the fallback array
      }
    }

    // If we exhaust all models
    return NextResponse.json(
      { error: `All compiler models exhausted. Last error: ${lastError?.message || 'Unknown error'}` },
      { status: 503 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('API compile error:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
