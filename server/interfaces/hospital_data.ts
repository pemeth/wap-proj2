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

