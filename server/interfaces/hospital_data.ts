// One of hospital data objects that will be received in array
export interface HospitalData {
    country?: string;
    indicator?: string;
    date?: string;
    year_week?: string;
    source?: string;
    url?: string;
    value?: number;
};

// Data object that will be received from hospital data JSON site
export interface HospitalDatas extends Array<HospitalData>{};

// Our bed data object, that we will be storing and returning
export interface BedData {
    country: string;
    date: string;
    value: number;
};

// Array of bed data objects
export interface BedDatas extends Array<BedData>{};

// Our icu data object, that we will be storing and returning
export interface ICUData {
    country: string;
    date: string;
    value: number;
};

// Array of icu data objects
export interface ICUDatas extends Array<ICUData>{};