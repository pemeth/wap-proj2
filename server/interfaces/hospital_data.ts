export interface HospitalData {
    country?: string;
    indicator?: string;
    date?: string;
    year_week?: string;
    source?: string;
    url?: string;
    value?: number;
};

export interface HospitalDatas extends Array<HospitalData>{};

export interface BedData {
    country: string;
    date: string;
    value: number;
};

export interface BedDatas extends Array<BedData>{};

export interface ICUData {
    country: string;
    date: string;
    value: number;
};

export interface ICUDatas extends Array<ICUData>{};