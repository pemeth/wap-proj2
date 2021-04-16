// One of covid test data objects that will be received in array
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

// Data object that will be received from covid test JSON site
export interface JsonTestDatas extends Array<JsonTestData>{};

// Our covid test object, that we will be storing and returning
export interface TestData {
    country: string;
    year_week: string;
    new_cases: number;
    tests_done: number;
    population: number;
    testing_rate: string;
    positivity_rate: string;
};

// Array of covid test objects that we will be returning
export interface TestDatas extends Array<TestData>{};