export enum CustomerStatus {
  NEGOTIATION = '商談中',
  APPLIED = '設計申込済',
  BASIC_DESIGN = '基本設計中',
  SPEC_MEETING = '仕様打合せ中',
  CONSTRUCTION_PREP = '着工準備中',
  CONSTRUCTION = '工事中',
  RESIDENT = '入居者',
}

export enum ConstructionPhase {
  PRE_CONSTRUCTION = '工事前',
  FOUNDATION = '基礎工事中',
  FRAMING = '上棟',
  CARPENTRY = '大工工事',
  SCAFFOLDING_REMOVAL = '足場解体',
  EXTERIOR = '外構工事',
}

export type ColumnType = 'text' | 'date' | 'currency' | 'phone' | 'select' | 'person';

export interface Column {
  id: string;
  title: string;
  type: ColumnType;
  options?: string[]; // For select type
  order: number;
  removable: boolean;
}

export interface Customer {
  id:string;
  name: string;
  status: CustomerStatus;
  currentPhase?: ConstructionPhase;
  location: { 
    x: number; 
    y: number; 
    lat: number; 
    lng: number; 
  };
  data: Record<string, any>; // Dynamic data matching column IDs
  created_at: string;
}

export interface Task {
  id: string;
  customerId: string;
  category: '営業' | '設計' | '申請' | '工務';
  title: string;
  isCompleted: boolean;
  isMilestone: boolean; // Triggers celebration
  created_at: string;
}

export interface TemplateTask {
  id: string;
  category: '営業' | '設計' | '申請' | '工務';
  title: string;
  isMilestone: boolean;
}

export interface AvatarConfig {
  skinColor: string;
  faceShape: string; // New
  hairStyle: string;
  hairColor: string;
  eyebrows: string; // New
  eyeStyle: string;
  mouthStyle: string;
  clothing: string;
  clothingColor: string;
  glasses: string;
  hat: string; // Helmet, Cap, None
  beard: string;
  accessory: string; // Mic, Earrings
}

export interface Employee {
  id: string;
  name: string;
  role: '営業' | '設計' | 'IC' | '工務' | 'その他';
  avatar?: AvatarConfig;
  created_at: string;
}

export interface CompanyInfo {
  id: number;
  name: string;
  branch: string;
  address: string;
  phone: string;
}

export interface AppState {
  customers: Customer[];
  columns: Column[];
  tasks: Task[];
  employees: Employee[];
  templateTasks: TemplateTask[];
  companyInfo: CompanyInfo | null;
  viewMode: 'list' | 'gantt_map' | '3d_progress' | 'construction_schedule';
  hiddenColumns: Record<CustomerStatus, string[]>;
}