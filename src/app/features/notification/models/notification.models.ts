export interface Notification {
  uid: string;
  message: string;
  notification_type: 'Faible' | 'Moyen' | 'Élevé' | 'Critique';
  created_at: string;
  alert_id?: string;
  read?:boolean;
  class?:string;
}


export interface NotificationResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Notification[];
}
