import { singleton } from "tsyringe";
import { JsonTestData, JsonTestDatas, TestData, TestDatas } from "../interfaces/tests_data";
import { get } from "https";
import { byInternet, CountryCode } from "country-code-lookup";

@singleton()
export class TestsDataWorker {
    private test_data: TestDatas = [];

    constructor() {
        
    }

    public loadData(web_page: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            get(web_page, (resp) => {
                let data = '';

                // A chunk of data has been received.
                resp.on('data', (chunk) => {
                    data += chunk;
                });

                // The whole response has been received. Print out the result.
                resp.on('end', () => {
                    const json_data = (JSON.parse(data) as JsonTestDatas);

                    // Create new array from received JSON
                    this.test_data = Array.from<JsonTestData, TestData>(
                        json_data.filter((data: JsonTestData) => {
                            return this.checkDataCorrectness(data);
                        })
                        , (data: JsonTestData) => {
                        return {
                            country: data.country,
                            year_week: data.year_week,
                            new_cases: data.new_cases,
                            tests_done: data.tests_done,
                            population: data.population,
                            testing_rate: data.testing_rate,
                            positivity_rate: data.positivity_rate
                        } as TestData;
                    });

                    return resolve();
                });

                // Received error
                }).on("error", (err) => {
                    console.error(err);
                    return reject();
                });
        });
    }

    private checkDataCorrectness(data: JsonTestData): boolean {
        if (
            data.country === undefined || data.year_week === undefined || data.new_cases === undefined ||
            data.tests_done === undefined || data.population === undefined || data.testing_rate === undefined ||
            data.positivity_rate === undefined || data.level === undefined
            ) {
            return false;
        }


        return data.level === 'national';
    }

    public getTestDataByCountry(country_code: string): Promise<TestDatas> {
        return new Promise<TestDatas>((resolve, reject) => {
            // Get country from country code
            const country: string | null = this.countryCodeToCountry(country_code);

            // Invalid country code
            if (country === null) {
                return reject();
            }

            // 
            return resolve(this.test_data.filter((data: TestData) => {
                return data.country.toLowerCase() === country;
            }));
        });
    }

    public getTestDataByCountryYearWeek(country_code: string, year: string, week: string): Promise<TestDatas> {
        return new Promise<TestDatas>((resolve, reject) => {
            // Get country from country code
            const country: string | null = this.countryCodeToCountry(country_code);
            const year_week: string | null = this.genYearWeek(year, week);

            // Invalid country code
            if (country === null || year_week === null) {
                return reject();
            }

            return resolve(this.test_data.filter((data: TestData) => {
                return data.country.toLowerCase() === country && year_week === data.year_week;
            }));
        });
    }

    private countryCodeToCountry(country_code: string): string | null {
        // Hospital data got country CZ, as Czechia and not Czech Republic
        if (country_code === 'CZ') {
            return 'czechia';
        }

        // Get country name from country code
        const country: CountryCode = byInternet(country_code);

        // Return country name in lower case
        if (country !== null) {
            return country.country.toLowerCase();
        }

        // Invalid country code
        return null;
    }

    private genYearWeek(year: string, week: string): string | null {
        const num: number = Number(week);

        // JSON contains week values from 1 to 53
        if (Number.isInteger(num)) {
            return `${year}-W${(num < 10) ? `0${num}` : num}`;
        }

        return null;
    }
}