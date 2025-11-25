export const GPS_QUALITY = {
    HDOP: {
      EXCELLENT: 0.8,
      GOOD: 1.2,
      MODERATE: 2.0,
      FAIR: 5.0
    },
    MIN_SATELLITES: 4
  };
  
  export const VEHICLE_PARAMS = {
    BATTERY: {
      MIN: 11.5,
      MAX: 14.4
    },
    ENGINE: {
      IDLE: 800,
      MAX: 2500
    }
  };
  
  export const TEMPERATURE = {
    MIN_ALERT: -20,
    MAX_ALERT: 45
  };
  
  export const STATUS = {
    DOOR: ['open', 'closed'] as const,
    CARGO: ['loaded', 'unloading', 'empty', 'loading'] as const
  };