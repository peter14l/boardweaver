export interface ComponentPin {
  num: string;
  name: string;
}

export interface SchematicComponent {
  id: string;
  name: string;
  value: string;
  footprint: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pins: ComponentPin[];
}

export interface PCBComponent {
  id: string;
  name: string;
  value: string;
  footprint: string;
  x: number;
  y: number;
  rotation: number; // in degrees
  width: number;
  height: number;
  pads: {
    num: string;
    x: number; // offset from component center
    y: number;
    shape: 'rect' | 'circle' | 'oblong';
    w: number;
    h: number;
  }[];
}

export interface ConnectionNet {
  name: string;
  color: string;
  connections: { componentId: string; pinNum: string }[];
}

export interface PCBTrace {
  net: string;
  layer: 'F.Cu' | 'B.Cu';
  width: number; // mm
  points: [number, number][]; // coordinates
}

export interface AgentStep {
  type: 'info' | 'search' | 'check' | 'route' | 'success';
  message: string;
  delay: number; // simulated execution duration
}

export interface ProjectScenario {
  id: string;
  title: string;
  prompt: string;
  description: string;
  boardWidth: number; // mm
  boardHeight: number; // mm
  components: SchematicComponent[];
  pcbComponents: PCBComponent[];
  nets: ConnectionNet[];
  traces: PCBTrace[];
  logs: AgentStep[];
}

export const SCENARIOS: ProjectScenario[] = [
  {
    id: 'esp32-sensor',
    title: 'ESP32-S3 IoT Sensor Node',
    prompt: 'Create a rechargeable IoT sensor node with an ESP32-S3, USB-C, an I2C SHT31 temperature sensor, and a status LED. Keep the board size under 50x50mm.',
    description: 'A compact IoT node featuring Wi-Fi, battery charging, and I2C environmental sensing.',
    boardWidth: 50,
    boardHeight: 50,
    components: [
      {
        id: 'U1',
        name: 'ESP32-S3-WROOM-1',
        value: 'ESP32-S3-WROOM-1-N8R8',
        footprint: 'RF_Module:ESP32-S3-WROOM-1',
        x: 200,
        y: 200,
        width: 100,
        height: 120,
        pins: [
          { num: '1', name: 'GND' },
          { num: '2', name: '3V3' },
          { num: '3', name: 'EN' },
          { num: '4', name: 'IO4' },
          { num: '5', name: 'IO5' },
          { num: '6', name: 'IO6' },
          { num: '7', name: 'IO7' },
          { num: '8', name: 'IO8' },
          { num: '9', name: 'IO9' },
          { num: '10', name: 'IO10' },
          { num: '11', name: 'SDA/IO11' },
          { num: '12', name: 'SCL/IO12' },
          { num: '13', name: 'IO13' },
          { num: '14', name: 'GND' },
          { num: '39', name: 'USB_D-' },
          { num: '40', name: 'USB_D+' },
          { num: '41', name: 'GND' },
        ],
      },
      {
        id: 'U2',
        name: 'AP2112K-3.3',
        value: 'LDO 3.3V 600mA',
        footprint: 'Package_TO_SOT_SMD:SOT-23-5',
        x: 400,
        y: 120,
        width: 60,
        height: 60,
        pins: [
          { num: '1', name: 'VIN' },
          { num: '2', name: 'GND' },
          { num: '3', name: 'EN' },
          { num: '4', name: 'BYP' },
          { num: '5', name: 'VOUT' },
        ],
      },
      {
        id: 'J1',
        name: 'USB_C_Receptacle',
        value: 'USB-C 16-Pin',
        footprint: 'Connector_USB:USB_C_Receptacle_HRO_TYPE-C-31-M-12',
        x: 50,
        y: 150,
        width: 60,
        height: 80,
        pins: [
          { num: 'A1/B12', name: 'GND' },
          { num: 'A4/B9', name: 'VBUS' },
          { num: 'A5', name: 'CC1' },
          { num: 'A6', name: 'DP' },
          { num: 'A7', name: 'DN' },
          { num: 'A8', name: 'SBU1' },
          { num: 'B1/A12', name: 'GND' },
          { num: 'B4/A9', name: 'VBUS' },
          { num: 'B5', name: 'CC2' },
          { num: 'B8', name: 'SBU2' },
        ],
      },
      {
        id: 'U3',
        name: 'SHT31-D',
        value: 'Temp/Humidity Sensor',
        footprint: 'Package_DFN_QFN:DFN-8-1EP_2x2mm_P0.5mm',
        x: 400,
        y: 280,
        width: 70,
        height: 60,
        pins: [
          { num: '1', name: 'SDA' },
          { num: '2', name: 'ADDR' },
          { num: '3', name: 'ALERT' },
          { num: '4', name: 'SCL' },
          { num: '5', name: 'VDD' },
          { num: '6', name: 'RESET' },
          { num: '7', name: 'R_BIAS' },
          { num: '8', name: 'VSS/GND' },
        ],
      },
      {
        id: 'D1',
        name: 'LED_STATUS',
        value: 'Green Status LED',
        footprint: 'LED_SMD:LED_0603_1608Metric',
        x: 200,
        y: 350,
        width: 40,
        height: 40,
        pins: [
          { num: '1', name: 'A' },
          { num: '2', name: 'K' },
        ],
      },
    ],
    pcbComponents: [
      {
        id: 'U1',
        name: 'ESP32-S3',
        value: 'ESP32-S3-WROOM-1',
        footprint: 'ESP32-S3-WROOM-1',
        x: 25,
        y: 30,
        rotation: 0,
        width: 18,
        height: 25,
        pads: [
          { num: '1', x: -8.5, y: -10, shape: 'rect', w: 1.8, h: 0.9 },
          { num: '2', x: -8.5, y: -8.5, shape: 'rect', w: 1.8, h: 0.9 },
          { num: '3', x: -8.5, y: -7, shape: 'rect', w: 1.8, h: 0.9 },
          { num: '11', x: -8.5, y: 5, shape: 'rect', w: 1.8, h: 0.9 },
          { num: '12', x: -8.5, y: 6.5, shape: 'rect', w: 1.8, h: 0.9 },
          { num: '14', x: -8.5, y: 9.5, shape: 'rect', w: 1.8, h: 0.9 },
          { num: '39', x: 8.5, y: 6.5, shape: 'rect', w: 1.8, h: 0.9 },
          { num: '40', x: 8.5, y: 8, shape: 'rect', w: 1.8, h: 0.9 },
          { num: '41', x: 8.5, y: 9.5, shape: 'rect', w: 1.8, h: 0.9 },
        ],
      },
      {
        id: 'J1',
        name: 'USB-C',
        value: 'USB_C_16PIN',
        footprint: 'USB_C_Receptacle',
        x: 25,
        y: 3,
        rotation: 0,
        width: 9,
        height: 6,
        pads: [
          { num: 'A1/B12', x: -3.2, y: -1.5, shape: 'rect', w: 0.6, h: 1.2 },
          { num: 'A4/B9', x: -2.0, y: -1.5, shape: 'rect', w: 0.6, h: 1.2 },
          { num: 'A6', x: -0.4, y: -1.5, shape: 'rect', w: 0.4, h: 1.2 },
          { num: 'A7', x: 0.4, y: -1.5, shape: 'rect', w: 0.4, h: 1.2 },
          { num: 'B4/A9', x: 2.0, y: -1.5, shape: 'rect', w: 0.6, h: 1.2 },
          { num: 'B1/A12', x: 3.2, y: -1.5, shape: 'rect', w: 0.6, h: 1.2 },
        ],
      },
      {
        id: 'U2',
        name: 'LDO',
        value: 'AP2112K-3.3',
        footprint: 'SOT-23-5',
        x: 10,
        y: 15,
        rotation: 90,
        width: 3,
        height: 3,
        pads: [
          { num: '1', x: -0.95, y: -1.3, shape: 'rect', w: 0.55, h: 0.8 },
          { num: '2', x: 0, y: -1.3, shape: 'rect', w: 0.55, h: 0.8 },
          { num: '3', x: 0.95, y: -1.3, shape: 'rect', w: 0.55, h: 0.8 },
          { num: '4', x: 0.95, y: 1.3, shape: 'rect', w: 0.55, h: 0.8 },
          { num: '5', x: -0.95, y: 1.3, shape: 'rect', w: 0.55, h: 0.8 },
        ],
      },
      {
        id: 'U3',
        name: 'SHT31',
        value: 'SHT31-D',
        footprint: 'DFN-8',
        x: 40,
        y: 15,
        rotation: 0,
        width: 2.5,
        height: 2.5,
        pads: [
          { num: '1', x: -1.0, y: -0.75, shape: 'rect', w: 0.6, h: 0.35 },
          { num: '4', x: -1.0, y: 0.75, shape: 'rect', w: 0.6, h: 0.35 },
          { num: '5', x: 1.0, y: 0.75, shape: 'rect', w: 0.6, h: 0.35 },
          { num: '8', x: 1.0, y: -0.75, shape: 'rect', w: 0.6, h: 0.35 },
        ],
      },
      {
        id: 'D1',
        name: 'LED',
        value: 'LED_0603',
        footprint: 'LED_0603',
        x: 10,
        y: 40,
        rotation: 180,
        width: 1.6,
        height: 0.8,
        pads: [
          { num: '1', x: -0.75, y: 0, shape: 'rect', w: 0.8, h: 0.8 },
          { num: '2', x: 0.75, y: 0, shape: 'rect', w: 0.8, h: 0.8 },
        ],
      },
    ],
    nets: [
      {
        name: 'GND',
        color: '#00ffff',
        connections: [
          { componentId: 'J1', pinNum: 'A1/B12' },
          { componentId: 'J1', pinNum: 'B1/A12' },
          { componentId: 'U2', pinNum: '2' },
          { componentId: 'U1', pinNum: '1' },
          { componentId: 'U1', pinNum: '14' },
          { componentId: 'U1', pinNum: '41' },
          { componentId: 'U3', pinNum: '8' },
          { componentId: 'D1', pinNum: '2' },
        ],
      },
      {
        name: 'VBUS',
        color: '#ff0055',
        connections: [
          { componentId: 'J1', pinNum: 'A4/B9' },
          { componentId: 'J1', pinNum: 'B4/A9' },
          { componentId: 'U2', pinNum: '1' },
          { componentId: 'U2', pinNum: '3' },
        ],
      },
      {
        name: '3V3',
        color: '#ff9900',
        connections: [
          { componentId: 'U2', pinNum: '5' },
          { componentId: 'U1', pinNum: '2' },
          { componentId: 'U3', pinNum: '5' },
        ],
      },
      {
        name: 'I2C_SDA',
        color: '#00ff66',
        connections: [
          { componentId: 'U1', pinNum: '11' },
          { componentId: 'U3', pinNum: '1' },
        ],
      },
      {
        name: 'I2C_SCL',
        color: '#cc00ff',
        connections: [
          { componentId: 'U1', pinNum: '12' },
          { componentId: 'U3', pinNum: '4' },
        ],
      },
      {
        name: 'USB_D+',
        color: '#ff00ff',
        connections: [
          { componentId: 'J1', pinNum: 'A6' },
          { componentId: 'U1', pinNum: '40' },
        ],
      },
      {
        name: 'USB_D-',
        color: '#0088ff',
        connections: [
          { componentId: 'J1', pinNum: 'A7' },
          { componentId: 'U1', pinNum: '39' },
        ],
      },
      {
        name: 'LED_SIG',
        color: '#ffff00',
        connections: [
          { componentId: 'U1', pinNum: '4' },
          { componentId: 'D1', pinNum: '1' },
        ],
      },
    ],
    traces: [
      {
        net: 'VBUS',
        layer: 'F.Cu',
        width: 0.4,
        points: [
          [23.0, 1.5], // J1.A4/B9 pad center approx
          [23.0, 8.0],
          [11.3, 8.0],
          [11.3, 14.05], // U2.VIN (Pad 1 after rot)
        ],
      },
      {
        net: '3V3',
        layer: 'F.Cu',
        width: 0.3,
        points: [
          [8.7, 14.05], // U2.VOUT (Pad 5)
          [6.0, 14.05],
          [6.0, 21.5], // Path down to U1 VCC pin
          [16.5, 21.5], // U1.2
        ],
      },
      {
        net: 'USB_D+',
        layer: 'F.Cu',
        width: 0.15,
        points: [
          [24.6, 1.5], // J1.A6
          [24.6, 6.0],
          [31.0, 6.0],
          [31.0, 22.0],
          [33.5, 22.0], // U1.40
        ],
      },
      {
        net: 'USB_D-',
        layer: 'F.Cu',
        width: 0.15,
        points: [
          [25.4, 1.5], // J1.A7
          [25.4, 7.0],
          [32.0, 7.0],
          [32.0, 23.5],
          [33.5, 23.5], // U1.39
        ],
      },
      {
        net: 'I2C_SDA',
        layer: 'F.Cu',
        width: 0.2,
        points: [
          [16.5, 35.0], // U1.11 SDA
          [18.0, 35.0],
          [18.0, 26.0],
          [37.0, 26.0],
          [39.0, 14.25], // U3.1
        ],
      },
      {
        net: 'I2C_SCL',
        layer: 'F.Cu',
        width: 0.2,
        points: [
          [16.5, 36.5], // U1.12 SCL
          [19.5, 36.5],
          [19.5, 27.5],
          [38.0, 27.5],
          [39.0, 15.75], // U3.4
        ],
      },
      {
        net: 'LED_SIG',
        layer: 'B.Cu',
        width: 0.2,
        points: [
          [16.5, 24.5], // U1.4
          [14.0, 24.5],
          [14.0, 39.25],
          [10.75, 40.0], // D1.1
        ],
      },
    ],
    logs: [
      { type: 'info', message: 'Hardware Vibe Specification Received: ESP32-S3 IoT Node with USB-C and I2C Sensing.', delay: 800 },
      { type: 'search', message: 'Searching component databases (LCSC & DigiKey) for ESP32-S3, AP2112, SHT31, and USB-C receptacles...', delay: 1500 },
      { type: 'info', message: 'Selected parts:\n- MCU: ESP32-S3-WROOM-1-N8R8 (Qty: 1, In Stock: 4,200)\n- LDO: AP2112K-3.3TRG1 (Qty: 1, In Stock: 15k+)\n- Sensor: SHT30-DIS-B2.5KS (Qty: 1, In Stock: 8.5k)\n- USB-C: HRO TYPE-C-31-M-12 (Qty: 1, In Stock: 22k)', delay: 1200 },
      { type: 'check', message: 'Generating connectivity layout... Mapping USB-C DM/DP directly to GPIO 19/20 of the ESP32-S3. Mapping I2C to GPIO 11/12 with 4.7kΩ pull-up resistors.', delay: 1800 },
      { type: 'check', message: 'Running Electrical Rule Checker (ERC):\n- VBUS short checks: Passed\n- Decoupling capacitors added to MCU VDD and LDO VOUT\n- 0 warnings, 0 errors.', delay: 1100 },
      { type: 'route', message: 'Commencing board routing...\n- Board Outline initialized: 50.0mm x 50.0mm.\n- Placed USB-C on edge, LDO close to entry, ESP32-S3 centered for antenna clearance.', delay: 1400 },
      { type: 'route', message: 'Routing high-speed differential pairs (USB_D+ and USB_D-) with 90Ω target impedance.', delay: 1600 },
      { type: 'route', message: 'Routing power lines (3.3V and VBUS) with 0.4mm trace widths. Pouring solid ground planes on Top and Bottom layers.', delay: 1300 },
      { type: 'success', message: 'Board fully routed! DRC validation successfully completed. Ready for preview and KiCad export.', delay: 900 }
    ],
  },
  {
    id: 'lipo-charger',
    title: 'USB-C LiPo Battery Charger',
    prompt: 'Design a simple USB-C Lithium Polymer battery charger board. Needs a charging indicator LED, a full indicator LED, and basic over-discharge protection.',
    description: 'An autonomous charging circuit using TP4056 with DW01A protection IC.',
    boardWidth: 35,
    boardHeight: 25,
    components: [
      {
        id: 'U1',
        name: 'TP4056',
        value: 'Li-Ion Charger IC',
        footprint: 'Package_SO:SOIC-8-1EP_3.9x4.9mm_P1.27mm',
        x: 220,
        y: 180,
        width: 80,
        height: 80,
        pins: [
          { num: '1', name: 'TEMP' },
          { num: '2', name: 'PROG' },
          { num: '3', name: 'GND' },
          { num: '4', name: 'VCC' },
          { num: '5', name: 'BAT' },
          { num: '6', name: 'STDBY' },
          { num: '7', name: 'CHRG' },
          { num: '8', name: 'CE' },
        ],
      },
      {
        id: 'U2',
        name: 'DW01A',
        value: 'Battery Protection',
        footprint: 'Package_TO_SOT_SMD:SOT-23-6',
        x: 400,
        y: 180,
        width: 60,
        height: 60,
        pins: [
          { num: '1', name: 'OD' },
          { num: '2', name: 'CS' },
          { num: '3', name: 'OC' },
          { num: '4', name: 'TD' },
          { num: '5', name: 'VCC' },
          { num: '6', name: 'GND' },
        ],
      },
      {
        id: 'J1',
        name: 'USB-C',
        value: 'USB Type-C',
        footprint: 'Connector_USB:USB_C_Receptacle_HRO_TYPE-C-31-M-12',
        x: 80,
        y: 180,
        width: 60,
        height: 80,
        pins: [
          { num: '1', name: 'GND' },
          { num: '2', name: 'VBUS' },
        ],
      },
      {
        id: 'D1',
        name: 'LED_RED',
        value: 'Charging LED',
        footprint: 'LED_SMD:LED_0603_1608Metric',
        x: 200,
        y: 60,
        width: 40,
        height: 40,
        pins: [
          { num: '1', name: 'A' },
          { num: '2', name: 'K' },
        ],
      },
      {
        id: 'D2',
        name: 'LED_GREEN',
        value: 'Done LED',
        footprint: 'LED_SMD:LED_0603_1608Metric',
        x: 280,
        y: 60,
        width: 40,
        height: 40,
        pins: [
          { num: '1', name: 'A' },
          { num: '2', name: 'K' },
        ],
      },
    ],
    pcbComponents: [
      {
        id: 'J1',
        name: 'USB-C',
        value: 'USB Type-C',
        footprint: 'USB_C_Receptacle',
        x: 5,
        y: 12.5,
        rotation: 270,
        width: 6,
        height: 9,
        pads: [
          { num: '1', x: -1.5, y: -3.2, shape: 'rect', w: 1.2, h: 0.6 },
          { num: '2', x: -1.5, y: -2.0, shape: 'rect', w: 1.2, h: 0.6 },
        ],
      },
      {
        id: 'U1',
        name: 'U1',
        value: 'TP4056',
        footprint: 'SOIC-8',
        x: 18,
        y: 12.5,
        rotation: 0,
        width: 4.9,
        height: 3.9,
        pads: [
          { num: '1', x: -2.2, y: -1.9, shape: 'rect', w: 1.5, h: 0.6 },
          { num: '2', x: -2.2, y: -0.63, shape: 'rect', w: 1.5, h: 0.6 },
          { num: '3', x: -2.2, y: 0.63, shape: 'rect', w: 1.5, h: 0.6 },
          { num: '4', x: -2.2, y: 1.9, shape: 'rect', w: 1.5, h: 0.6 },
          { num: '5', x: 2.2, y: 1.9, shape: 'rect', w: 1.5, h: 0.6 },
          { num: '6', x: 2.2, y: 0.63, shape: 'rect', w: 1.5, h: 0.6 },
          { num: '7', x: 2.2, y: -0.63, shape: 'rect', w: 1.5, h: 0.6 },
          { num: '8', x: 2.2, y: -1.9, shape: 'rect', w: 1.5, h: 0.6 },
        ],
      },
      {
        id: 'U2',
        name: 'U2',
        value: 'DW01A',
        footprint: 'SOT-23-6',
        x: 29,
        y: 12.5,
        rotation: 90,
        width: 3.0,
        height: 3.0,
        pads: [
          { num: '1', x: -0.95, y: -1.3, shape: 'rect', w: 0.55, h: 0.8 },
          { num: '2', x: 0, y: -1.3, shape: 'rect', w: 0.55, h: 0.8 },
          { num: '3', x: 0.95, y: -1.3, shape: 'rect', w: 0.55, h: 0.8 },
          { num: '4', x: 0.95, y: 1.3, shape: 'rect', w: 0.55, h: 0.8 },
          { num: '5', x: 0, y: 1.3, shape: 'rect', w: 0.55, h: 0.8 },
          { num: '6', x: -0.95, y: 1.3, shape: 'rect', w: 0.55, h: 0.8 },
        ],
      },
      {
        id: 'D1',
        name: 'LED_CHG',
        value: 'RED',
        footprint: 'LED_0603',
        x: 18,
        y: 4,
        rotation: 0,
        width: 1.6,
        height: 0.8,
        pads: [
          { num: '1', x: -0.75, y: 0, shape: 'rect', w: 0.8, h: 0.8 },
          { num: '2', x: 0.75, y: 0, shape: 'rect', w: 0.8, h: 0.8 },
        ],
      },
      {
        id: 'D2',
        name: 'LED_DONE',
        value: 'GREEN',
        footprint: 'LED_0603',
        x: 23,
        y: 4,
        rotation: 0,
        width: 1.6,
        height: 0.8,
        pads: [
          { num: '1', x: -0.75, y: 0, shape: 'rect', w: 0.8, h: 0.8 },
          { num: '2', x: 0.75, y: 0, shape: 'rect', w: 0.8, h: 0.8 },
        ],
      },
    ],
    nets: [
      {
        name: 'GND',
        color: '#00ffff',
        connections: [
          { componentId: 'J1', pinNum: '1' },
          { componentId: 'U1', pinNum: '3' },
          { componentId: 'U2', pinNum: '6' },
        ],
      },
      {
        name: 'VBUS',
        color: '#ff0055',
        connections: [
          { componentId: 'J1', pinNum: '2' },
          { componentId: 'U1', pinNum: '4' },
          { componentId: 'U1', pinNum: '8' },
          { componentId: 'D1', pinNum: '1' },
          { componentId: 'D2', pinNum: '1' },
        ],
      },
      {
        name: 'LED_CHG_SIG',
        color: '#ffaa00',
        connections: [
          { componentId: 'U1', pinNum: '7' },
          { componentId: 'D1', pinNum: '2' },
        ],
      },
      {
        name: 'LED_DONE_SIG',
        color: '#00ff33',
        connections: [
          { componentId: 'U1', pinNum: '6' },
          { componentId: 'D2', pinNum: '2' },
        ],
      },
      {
        name: 'VBAT',
        color: '#ff00cc',
        connections: [
          { componentId: 'U1', pinNum: '5' },
          { componentId: 'U2', pinNum: '5' },
        ],
      },
    ],
    traces: [
      {
        net: 'VBUS',
        layer: 'F.Cu',
        width: 0.5,
        points: [
          [5.0, 11.0], // J1.VBUS
          [10.0, 11.0],
          [15.8, 14.4], // U1.4
        ],
      },
      {
        net: 'GND',
        layer: 'F.Cu',
        width: 0.5,
        points: [
          [5.0, 14.0], // J1.GND
          [12.0, 14.0],
          [15.8, 13.13], // U1.3
        ],
      },
      {
        net: 'LED_CHG_SIG',
        layer: 'F.Cu',
        width: 0.2,
        points: [
          [20.2, 11.87], // U1.7
          [20.2, 8.0],
          [18.75, 4.0], // D1.2
        ],
      },
      {
        net: 'LED_DONE_SIG',
        layer: 'F.Cu',
        width: 0.2,
        points: [
          [20.2, 13.13], // U1.6
          [22.0, 13.13],
          [22.0, 8.0],
          [23.75, 4.0], // D2.2
        ],
      },
      {
        net: 'VBAT',
        layer: 'F.Cu',
        width: 0.5,
        points: [
          [20.2, 14.4], // U1.5 (BAT)
          [25.0, 14.4],
          [29.0, 12.5], // U2.5 (VCC/BAT protection)
        ],
      },
    ],
    logs: [
      { type: 'info', message: 'Vibe Spec: USB-C Lithium Polymer charger with status LEDs and DW01A protection.', delay: 500 },
      { type: 'search', message: 'Locating TP4056 SOP-8 packages and DW01A SOT-23 battery protectors...', delay: 1000 },
      { type: 'check', message: 'Configuring charging current to 1A using a 1.2kΩ resistor on the PROG pin. Setting up protection FETs.', delay: 1200 },
      { type: 'check', message: 'ERC Checks: VBUS lines rated for 5V; decoupling cap added. Passed.', delay: 800 },
      { type: 'route', message: 'Routing board (35mm x 25mm). Grouping charging components for tight thermal dissipation.', delay: 1100 },
      { type: 'success', message: 'Routing complete! Gerber packages and assembly layers finalized.', delay: 700 }
    ],
  },
];
