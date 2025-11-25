export interface DeviceAndZoneInterface {
    device :  {
        imei: string;
        name: string;
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
    },
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
    }
    
  }
  