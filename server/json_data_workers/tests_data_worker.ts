/**
 * Module for the `TestsDataWorker` class, which handles data parsing
 * and filtering for the `/tests` API call.
 * @module
 * @author Matus Skuta <xskuta04@stud.fit.vutbr.cz>
 */
import { singleton } from "tsyringe";
import { JsonTestData, JsonTestDatas, TestData, TestDatas } from "../interfaces/tests_data";
import { get } from "https";
import { byInternet, CountryCode } from "country-code-lookup";
import { TESTS_JSON_PAGE } from "../config";
import { schedule } from "node-cron";
import { IncomingMessage } from "node:http";

/**
 * Class holding loaded covid tests JSON data, that will filter out and return data based on given conditions
 * @class
 */
@singleton()
export class TestsDataWorker {
    // Variables
    private test_data: TestDatas = [];
    private json_last_modified: Date | null = null;

    constructor() { }

    /**
     * Check if one of object received from web request is correct
     * @param {JsonTestData} data JSON Data object
     * @returns {boolean} True when data are correct, false otherwise
     */
    private checkDataCorrectness(data: JsonTestData): boolean {
        // When one of given attributes does not exist, return false
        if (
            data.country === undefined || data.year_week === undefined || data.new_cases === undefined ||
            data.tests_done === undefined || data.population === undefined || data.testing_rate === undefined ||
            data.positivity_rate === undefined || data.level === undefined
            ) {
            return false;
        }

        // We want data only from national level
        return data.level === 'national';
    }

    /**
     * Send GET request to JSON page, that contains covid tests data
     * @returns {Promise<void>} Resolves when data are loaded and processed, rejects otherwise
     */
    public loadData(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            // Schedule check for new data after 30 minutes
            schedule('*/30 * * * *', () => {
                this.updateData();
            });

            // Send get request to page from config.ts
            get(TESTS_JSON_PAGE, (resp) => {
                let data = '';

                // Load chunks of data into data buffer
                resp.on('data', (chunk) => {
                    data += chunk;
                });

                // The whole response has been received, process received data
                resp.on('end', () => {
                    // Parse JSON
                    const json_data = (JSON.parse(data) as JsonTestDatas);

                    // Create new array of covid tests from received JSON
                    this.test_data = Array.from<JsonTestData, TestData>(
                        // Filter out invalid data
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

                    // Save date of last modification
                    if (resp.headers['last-modified'] !== undefined && typeof resp.headers['last-modified'] === 'string') {
                        this.json_last_modified = new Date(resp.headers['last-modified']);
                    }

                    return resolve();
                });

                // Received error, print out error and reject
                }).on("error", (err) => {
                    console.error(err);
                    return reject();
                });
        });
    }

    /**
     * Check if last-modified header was changed, then load new JSON data
     */
    private updateData(): void {
        // Send HEAD request
        get(TESTS_JSON_PAGE,
        {
            host: 'opendata.ecdc.europa.eu',
            method: 'HEAD'
        }, (res: IncomingMessage) => {
            // Check if last-modified header was set
            if (res.headers['last-modified'] !== undefined && typeof res.headers['last-modified'] === 'string') {
                // Compare saved last modified, with new last modified and when they do not match, load new JSON data from server
                if (this.json_last_modified === null || new Date(res.headers['last-modified']).getTime() !== this.json_last_modified?.getTime()) {
                    this.loadData()
                    .catch(() => {
                        console.error('Failed to update covid tests JSON data!, will try again in 30 minutes.');
                    });
                    return;
                }
            }
        // When error occurs, log error
        }).on('error', () => {
            console.error('Failed to update covid tests JSON data!, will try again in 30 minutes.');
        }).end();
    }

    /**
     * Filter out covid test data based on country code
     * @param {string} country_code Country code representing country (SK, CZ, ...)
     * @returns {Promise<TestDatas>} Resolves when country code is valid, and return array of TestData, reject otherwise
     */
    public getTestDataByCountry(country_code: string): Promise<TestDatas> {
        return new Promise<TestDatas>((resolve, reject) => {
            // Convert country code into country name
            const country: string | null = this.countryCodeToCountry(country_code);

            // Country with given code not found
            if (country === null) {
                return reject();
            }

            // Filter out array of TestData that are from given country
            return resolve(this.test_data.filter((data: TestData) => {
                return data.country.toLowerCase() === country;
            }));
        });
    }

    /**
     * Filter out covid test data based on country code and year
     * @param {string} country_code Country code representing country (SK, CZ, ...)
     * @param {string} year Year from which we want given data
     * @returns {Promise<TestDatas>} Resolves when country code and year are valid, and return array of TestData, reject otherwise
     */
    public getTestDataByCountryYear(country_code: string, year: string): Promise<TestDatas> {
        return new Promise<TestDatas>((resolve, reject) => {
            // Convert country code into country name
            const country: string | null = this.countryCodeToCountry(country_code);
            // Invalid country code or year and week
            if (country === null) {
                return reject();
            }

            // Filter out array of TestData that are from given country and from given year
            return resolve(this.test_data.filter((data: TestData) => {
                return data.country.toLowerCase() === country && data.year_week.indexOf(year) === 0;
            }));
        });
    }

    /**
     * Filter out covid test data based on country code and given year and week
     * @param {string} country_code Country code representing country (SK, CZ, ...)
     * @param {string} year Year from which we want given data
     * @param {string} week Week from when we want given data, correct values are from 1 to 53
     * @returns {Promise<TestDatas>} Resolves when country code, year and week are valid, and return array of TestData, reject otherwise
     */
    public getTestDataByCountryYearWeek(country_code: string, year: string, week: string): Promise<TestDatas> {
        return new Promise<TestDatas>((resolve, reject) => {
            // Convert country code into country name
            const country: string | null = this.countryCodeToCountry(country_code);

            // Generate year_week string from year and week
            const year_week: string | null = this.genYearWeek(year, week);

            // Invalid country code or year and week
            if (country === null || year_week === null) {
                return reject();
            }

            // Filter out array of TestData that are from given country and from given year and week
            return resolve(this.test_data.filter((data: TestData) => {
                return data.country.toLowerCase() === country && year_week === data.year_week;
            }));
        });
    }

    /**
     * Convert country code into country
     * @param {string} country_code Country code representing country (SK, CZ, ...)
     * @returns {string|null} Returns country name or null when given country code is invalid
     */
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

    /**
     * Generates year_week string in format <year>-W<week>
     * @param {string} year Year in string format
     * @param {string }week Number of week in string format
     * @returns {string|null} Returns formatted string or null when given year or week are not number
     */
    private genYearWeek(year: string, week: string): string | null {
        // Convert week to number
        const num: number = Number(week);

        // When week is number, convert into formatted string
        if (Number.isInteger(num)) {
            return `${year}-W${(num < 10) ? `0${num}` : num}`;
        }

        // Invalid week, return false
        return null;
    }
}