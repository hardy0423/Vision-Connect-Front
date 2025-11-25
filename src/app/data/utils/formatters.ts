export const formatDateTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  export const formatSpeed = (speed: number): string => {
    return Math.round(speed).toString();
  };
  
  export const formatTemperature = (temp: number): string => {
    return temp.toFixed(1);
  };

