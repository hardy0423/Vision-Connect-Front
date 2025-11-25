export interface Toast {
  classname: string;
  message: string;
  delay?: number;
  type: 'danger' | 'warning' | 'success';
  icon?: string; // Nouvelle propriété pour l'icône
}
