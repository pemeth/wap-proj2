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