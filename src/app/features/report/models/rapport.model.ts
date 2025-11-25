export interface ReportInterface {
  timestamp: string;
  device: {
    name: string;
  };
  report_type: string;
  coordinates: {
    type: string;
    coordinates: [number, number] | [number, number][];
  };
  data: {
    speed: number;
    status: string;
  };
}

export interface ModalData {
  device: string;
  date: string;
  showZone: boolean;
  zoneId: string;
  idCompany?: string;
}

export interface TrajectoryProperties {
  uid: string;
  device_id: string;
  device_name: string;
  start_time: string;
  end_time: string | null;
  properties: any[]; // à corrigé
}


export interface TrajectoryData {
  deviceId: string;
  geom: string;
  deviceData: string;
  startTime: string;
  endTime: string;
  testJsonField: string;
}

//data not found

export interface GpsData {
  satellites: number;
  hdop: number;
  speed: number;
}

export interface VehicleData {
  ignition: boolean;
  engine_rpm: number;
  fuel_level: number;
  total_fuel: number;
  odometer: number;
  battery_voltage: number;
}

export interface SensorData {
  temperature1: number;
  temperature2: number;
  door_status: 'open' | 'closed';
  cargo_status: 'loaded' | 'unloading' | 'empty' | 'loading';
}

export interface Telemetry {
  gps: GpsData;
  vehicle: VehicleData;
  sensors: SensorData;
}

export interface Location {
  lat: number;
  lng: number;
  city: string;
  name?:string
  status?: string;
}

export interface TrajectoryPoint {
  timestamp: string;
  location: Location;
  telemetry: Telemetry;
}

export interface MatchedPoint {
  location: {
    lat: number;
    lng: number;
    city: string;
  };
  telemetry: {
    gps: {
      speed: number;
    };
  };
}