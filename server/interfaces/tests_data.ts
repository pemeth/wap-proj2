export interface JsonTestData {
    country?: string;
    country_code?: string;
    year_week?: string;
    level?: string;
    region?: string;
    region_name?: string;
    new_cases?: number;
    tests_done?: number;
    population?: number;
    testing_rate?: string;
    positivity_rate?: string;
    testing_data_source?: string;
};

export interface JsonTestDatas extends Array<JsonTestData>{};

export interface TestData {
    country: string;
    year_week: string;
    new_cases: number;
    tests_done: number;
    population: number;
    testing_rate: string;
    positivity_rate: string;
};

export interface TestDatas extends Array<TestData>{};