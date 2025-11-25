import { Country } from "../../company/models/country.interface";

export interface Device {
  uid?: string;
  imei: string;
  name: string;
  car_name: string;
  sim_number: string;
  status: boolean;
  mode_status?:string;
  type: {
    uid?: string;
    name: string;
    status: boolean;
    product: string;
    value: string;
    port: string;
  };
  company_manager: {
    uid?: string;
    name: string;
    region?: string;
    role?: string;
    department?: string;
    description?: string;
    user_uid?: string;
    email?: string;
    country?: Country;
    adress?: string;
    nbr_device?: number;
    is_actif?: boolean;
    created_by?: string;
  };
  zone?: {
    uid: string;
    nameZone: string;
    geom: {
      type: string;
      coordinates: number[][][];
    };
  };
  is_actif?: boolean;
  is_device_addable?: boolean;
  ip_address?: string;
  port?: number;
  speed_limit: number;
  engine_lock: boolean;
  isNew?: boolean;
}

export interface DeviceType {
  uid?: string;
  name: string;
  status: boolean;
  product: string;
  value: string;
  port: string;
}

export interface DeviceAndZoneInterface {
  device: {
    imei: string;
    name: string;
    car_name: string;
    sim_number: string;
    status: boolean;
    type: {
      uid?: string;
      name: string;
      status: boolean;
      product: string;
      value: string;
      port: string;
    };
    company_manager: {
      uid?: string;
      name: string;
      region?: string;
      role?: string;
      department?: string;
      description?: string;
      user_uid?: string;
    };
  };
  zone: {
    type: string;
    geometry: {
      type: string;
      coordinates: number[][][];
    };
    properties: {
      Name: string;
      nameZone: string;
    };
    zoneId: string;
  };
}

export interface DeviceInterfaceOutput {
  uid: string;
  type: string;
  imei: string;
  name: string;
  car_name: string;
  sim_number: string;
  status: boolean;
  company_manager: string;
  zone: string;
}

export interface DeviceStatus {
  device_id: string;
  status: string;
  type?: string;
  position?: Position;
  speed?: string;
  car_name?: string;
  companyName?: string;
  address?: string;
}

interface Position {
  lat: number;
  lng: number;
  device_mode: string;
  status: string;
  name: string;
}

export interface DeviceCommand {
  engine_toggle?: string;
  speed_limit?: number;
}

export interface SelectedCommand {
  id: number;
  name: string;
  description: string;
  disable: boolean;
}

export interface GetDeviceInfo {
  RTC: string;
  Init: string;
  UpTime: string;
  PWR: string;
  RST: string;
  GPS: string;
  SAT: string;
  TTFF: string;
  TTLF: string;
  NOGPS: string;
  SR: string;
  FG: string;
  FL: string;
  SMS: string;
  REC: string;
  MD: string;
  DB: string;
}

export interface FieldDescriptions {
  [key: string]: string;
}

export interface DeviceInfo {
  [key: string]: any;
}

export interface CommandeInfoResponse {
  success: string;
  message: string;
  response: GetDeviceInfo;
}

export interface GetDeviceStatus {
  GPRS: string;
  Phone: string;
  SIM: string;
  OP: string;
  Signal: string;
  NewSMS: string;
  Roaming: string;
  SMSFull: string;
  LAC: string;
  Cell: string;
  NetType: string;
  FwUpd: string;
  Link: string;
}

export interface CommandeStatusInfoResponse {
  success: string;
  message: string;
  response: GetDeviceStatus;
}

export interface DeviceStatusKey {
  [key: string]: any;
}

export interface GetDevicePosition {
  D: string;
  T: string;
  S: string;
  C: string;
  Url: string;
}

export interface CommandePositionInfoResponse {
  success: string;
  message: string;
  response: GetDevicePosition;
}


export interface CommandeEngineImmobilizerResponse {
  success: string;
  message: string;
  response: GetDeviceEngineImmobilizer;
}

export interface GetDeviceEngineImmobilizer {
  DOUT1: string;
  DOUT2: string;
  DOUT3: string;
  Timeout: string;
}


export interface DeviceResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Device[];
}