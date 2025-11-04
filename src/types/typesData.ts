export interface ImagemProfile {
    id: number;
    documentId: string;
    name: string;
    alternativeText: string | null;
    caption: string | null;
    width: number;
    height: number;
    formats: {
      thumbnail: {
        name: string;
        hash: string;
        ext: string;
        mime: string;
        path: string | null;
        width: number;
        height: number;
        size: number;
        sizeInBytes: number;
        url: string;
      };
      small?: {
        name: string;
        hash: string;
        ext: string;
        mime: string;
        path: string | null;
        width: number;
        height: number;
        size: number;
        sizeInBytes: number;
        url: string;
      };
    };
    hash: string;
    ext: string;
    mime: string;
    size: number;
    url: string;
    previewUrl: string | null;
    provider: string;
    provider_metadata: null;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  }
  
  export type ColaboardorsData = {
    id: number;
    documentId: string;
    nome: string;
    biografia: string;
    cargo: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    locale: string;
    foto_perfil: ImagemProfile[];
    localizations: LocalizationData[];
  }; 

  export type ServicosData = {
    id: number;
    documentId: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    icon: ImagemProfile[];
  }; 

  type AliancaDigital = {
    id: number;
    nome: string;
    link: string;
    canal_digital: string;
  }

  type LinksUteis = {
    id: number;
    nome: string;
    link: string;
  }

  type RedeSociais = {
    id: number;
    nome: string;
    url: string;
    icon: IconData[];
  }

  type IconData = {
    name: string;
    url: string;
  }

  interface dias_uteis {
    id: number;
    diasUteis: string;
  }

  export type ContactInfosData = {
    id: number;
    documentId: string;
    telefone1: string;
    telefone2: string;
    latitude: string;
    adress: string;
    email: string;
    messageWhatspp: string;
    contactoWhatsapp: string;
    dias_uteis: string;
    longitude: string;
    cidade: string;
    pais: string;
    horarios: dias_uteis[];
    alianca_digitals: AliancaDigital[];
    link_utels: LinksUteis[];
    rede_socials: RedeSociais[];
  }; 
  
  export type PartenrsData = {
    id: number;
    documentId: string;
    name: string;
    descricao: string;
    cargo: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    locale: string;
    logo_parceiro: ImagemProfile[];
    localizations: LocalizationData[];
  };

  export type BannerData = {
    id: number;
    title: string;
    description: string;
    banner_img: ImagemProfile[];
    category: string;
  };
  
  export type ButtonData = {
    id: number;
    label: string;
    category: string;
  };
  
  interface LocalizationData {
    id: number;
    locale: string;
    publishedAt: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export type APIResponse<T> = {
    data: T[];
    meta: {
      pagination: {
        page: number;
        pageSize: number;
        pageCount: number;
        total: number;
      };
    };
  };
  
  // Simulation types
  export type Simulation = {
    id: number;
    reference: string;
    createdAt?: string;
    totalPremium?: number;
  };
  
// Removed duplicate SimulationResponse - using the complete interface below

  // Product types for simulation
  export type Product = {
    productId: string;
    name: string;
    description: string;
    icon?: string;
    category?: string;
    tabs?: any[];
  };

  export interface ApiResponse<T> {
    info: {
      count: number;
      page: number;
      status: number;
      errors: null | string;
    };
    results: T;
  }

  export interface InstallmentValue {
    name: string;
    value: number;
    annualValue: number;
    taxes: Record<string, number>;
  }

  export interface PropertyValue {
    name: string;
    type: string;
    value: string;
    rank: number;
    translationCode: string;
  }

  export interface PropertyGroup {
    name: string;
    values: PropertyValue[];
  }

  export interface Risk {
    name: string;
    order: number;
    code: string;
    active: boolean;
    capital: number;
    capitalOption: string | null;
    premium: number;
    taxes: Record<string, number>;
    bonusMalus: any;
    deductibleValue: number;
  }

  export interface SimulationObject {
    idSimulationObject: number | null;
    reference: string;
    capital: number;
    premium: number;
    premiumTotal: number | null;
    startDate: string;
    endDate: string | null;
    code: string | null;
    status: string;
    description: string | null;
    type: any;
    discount: number;
    franchise: number | null;
    propertyGroup: PropertyGroup | null;
    properties: any;
    risks: Risk[];
    children: SimulationObject[] | null;
    dependents: any;
  }

  export interface SimulationResponse {
    idSimulationTel: number;
    idContract: number;
    reference: string;
    totalPremium: number;
    premium: number;
    renewalDate: string;
    continuedDate: string | null;
    clientReference: string | null;
    producerReference: string;
    product: any;
    propertyGroup: any;
    installmentValues: InstallmentValue[];
    simulationObjects: SimulationObject[];
    currency: string;
    currencySymbol: string;
    hasError: boolean;
    errors: string[];
    hasWarnings: boolean;
    warnings: string[];
  }