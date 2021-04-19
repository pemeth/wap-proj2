/**
 * Module for the `HospitalDataWorker` class, which handles data parsing
 * and filtering for the `/beds` and `/icu` API calls.
 * @module
 * @author Matus Skuta <xskuta04@stud.fit.vutbr.cz>
 */
import { get } from "https";
import { byInternet, CountryCode } from "country-code-lookup";
import { singleton } from "tsyringe";
import { BedDatas, BedData, HospitalData, HospitalDatas, ICUDatas, ICUData } from "../interfaces/hospital_data";
import { HOSPITAL_JSON_PAGE } from "../config";
import { schedule } from "node-cron";
import { IncomingMessage } from "node:http";

/**
 * Class holding loaded hospital JSON data, that will filter out and return data based on given conditions.
 * @class
 */
@singleton()
export class HospitalDataWorker {
    // Class variables
    private hospital_data: BedDatas = [];
    private icu_data: ICUDatas = [];
    private json_last_modified: Date | null = null;

    constructor() { }

    /**
     * Check if one of object received from web request is correct.
     * @param {HospitalData} data JSON Data object
     * @param {string} indicator Type of indicator we are looking for
     * @returns {boolean} True when data are correct, false otherwise
     */
    private checkDataCorrectness(data: HospitalData, indicator: string): boolean {
        // When one of the attributes does not exist, return false
        if (data.indicator === undefined || data.country === undefined || data.date === undefined || data.value === undefined) {
            return false;
        }

        return data.indicator === indicator;
    }

    /**
     * Send GET request to JSON page, that contains hospital data.
     * @returns {Promise<void>} Resolves when data are loaded and processed, rejects otherwise
     */
    public loadData(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            // Schedule check for new data after 30 minutes
            schedule('*/30 * * * *', () => {
                this.updateData();
            });

            // Send get request to page from config.ts
            get(HOSPITAL_JSON_PAGE, (resp) => {
                let data = '';

                // Load chunks of data into data buffer
                resp.on('data', (chunk) => {
                    data += chunk;
                });

                // The whole response has been received, process received data
                resp.on('end', () => {
                    // Parse JSON
                    const json_data = (JSON.parse(data) as HospitalDatas);

                    // Create new array of bed data from received JSON
                    this.hospital_data = Array.from<HospitalData, BedData>(
                        // Filter out invalid data
                        json_data.filter((data: HospitalData) => {
                            return this.checkDataCorrectness(data, 'Daily hospital occupancy');
                        })
                        , (data: HospitalData) => {
                        return {
                            country: data.country,
                            date: data.date,
                            value: data.value
                        } as BedData;
                    });

                    // Create new array of icu data from received JSON
                    this.icu_data = Array.from<HospitalData, ICUData>(
                        // Filter out invalid data
                        json_data.filter((data: HospitalData) => {
                            return this.checkDataCorrectness(data, 'Daily ICU occupancy');
                        })
                        , (data: HospitalData) => {
                        return {
                            country: data.country,
                            date: data.date,
                            value: data.value
                        } as ICUData;
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
     * Check if last-modified header was changed, then load new JSON data.
     */
    private updateData(): void {
        // Send HEAD request
        get(HOSPITAL_JSON_PAGE,
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
                        console.error('Failed to update hospital JSON data!, will try again in 30 minutes.');
                    });
                    return;
                }
            }
        // When error occurs, log error
        }).on('error', () => {
            console.error('Failed to update hospital JSON data!, will try again in 30 minutes.');
        }).end();
    }

    /**
     * Filter out bed data based on country code.
     * @param {string} country_code Country code representing country (SK, CZ, ...)
     * @returns {Promise<BedDatas>} Resolves when country code is valid, and return array of BedData, reject otherwise
     */
    public getBedDataByCountry(country_code: string): Promise<BedDatas> {
        return new Promise<BedDatas>((resolve, reject) => {
            // Convert country code into country name
            const country: string | null = this.countryCodeToCountry(country_code);

            // Country with given code not found
            if (country === null) {
                return reject();
            }

            // Filter out array of BedData that are from given country
            return resolve(this.hospital_data.filter((data: BedData) => {
                return data.country.toLowerCase() === country;
            }));
        });
    }

    /**
     * Filter out bed data based on country code and given date.
     * @param {string} country_code Country code representing country (SK, CZ, ...)
     * @param {Date} date Date object representing date from when we want data
     * @returns {Promise<BedDatas>} Resolves when country code and date are valid, and return array of BedData, reject otherwise
     */
    public getBedDataByCountryDate(country_code: string, date: Date): Promise<BedDatas> {
        return new Promise<BedDatas>((resolve, reject) => {
            // Convert country code into country name
            const country: string | null = this.countryCodeToCountry(country_code);

            // Country with given code not found
            if (country === null) {
                return reject();
            }

            // Filter out array of BedData that are from given country and with given date
            return resolve(this.hospital_data.filter((data: BedData) => {
                return data.country.toLowerCase() === country && (new Date(data.date)).getTime() === date.getTime();
            }));
        });
    }

    /**
     * Filter out bed data based on country code and given date.
     * @param {string} country_code Country code representing country (SK, CZ, ...)
     * @param {Date} date_from Date object representing date from when we want data
     * @param {Date} date_to Date object representing date until when we want data
     * @returns {Promise<BedDatas>} Resolves when country code and date_from with date_to are valid, and return array of BedData, reject otherwise
     */
    public getBedDataByCountryDateFromTo(country_code: string, date_from: Date, date_to: Date): Promise<BedDatas> {
        return new Promise<BedDatas>((resolve, reject) => {
            // Convert country code into country name
            const country: string | null = this.countryCodeToCountry(country_code);

            // Country with given code not found
            if (country === null) {
                return reject();
            }

            // Filter out array of BedData that are from given country and between given dates
            return resolve(this.hospital_data.filter((data: BedData) => {
                const date: number = new Date(data.date).getTime();
                return data.country.toLowerCase() === country && date_from.getTime() <= date && date <= date_to.getTime();
            }));
        });
    }

    /**
     * Filter out icu data based on country code.
     * @param {string} country_code Country code representing country (SK, CZ, ...)
     * @returns {Promise<ICUDatas>} Resolves when country code is valid, and return array of ICUData, reject otherwise
     */
    public getICUDataByCountry(country_code: string): Promise<ICUDatas> {
        return new Promise<ICUDatas>((resolve, reject) => {
            // Convert country code into country name
            const country: string | null = this.countryCodeToCountry(country_code);

            // Country with given code not found
            if (country === null) {
                return reject();
            }

            // Filter out array of ICUData that are from given country
            return resolve(this.icu_data.filter((data: ICUData) => {
                return data.country.toLowerCase() === country;
            }));
        });
    }

    /**
     * Filter out icu data based on country code and given date.
     * @param {string} country_code Country code representing country (SK, CZ, ...)
     * @param {Date} date ICUDatas object representing date from when we want data
     * @returns {Promise<BedDatas>} Resolves when country code and date are valid, and return array of ICUData, reject otherwise
     */
    public getICUDataByCountryDate(country_code: string, date: Date): Promise<ICUDatas> {
        return new Promise<ICUDatas>((resolve, reject) => {
            // Convert country code into country name
            const country: string | null = this.countryCodeToCountry(country_code);

            // Country with given code not found
            if (country === null) {
                return reject();
            }

            // Filter out array of ICUData that are from given country and with given date
            return resolve(this.icu_data.filter((data: ICUData) => {
                return data.country.toLowerCase() === country && (new Date(data.date)).getTime() === date.getTime();
            }));
        });
    }

    /**
     * Filter out icu data based on country code and given date.
     * @param {string} country_code Country code representing country (SK, CZ, ...)
     * @param {Date} date_from Date object representing date from when we want data
     * @param {Date} date_to Date object representing date until when we want data
     * @returns {Promise<ICUDatas>} Resolves when country code and date_from with date_to are valid, and return array of BedData, reject otherwise
     */
    public getICUDataByCountryDateFromTo(country_code: string, date_from: Date, date_to: Date): Promise<ICUDatas> {
        return new Promise<ICUDatas>((resolve, reject) => {
            // Convert country code into country name
            const country: string | null = this.countryCodeToCountry(country_code);

            // Country with given code not found
            if (country === null) {
                return reject();
            }

            // Filter out array of ICUData that are from given country and between given dates
            return resolve(this.icu_data.filter((data: ICUData) => {
                const date: number = new Date(data.date).getTime();
                return data.country.toLowerCase() === country && date_from.getTime() <= date && date <= date_to.getTime();
            }));
        });
    }

    /**
     * Convert country code into country.
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

        // Return country name in lower case, when we found one
        if (country !== null) {
            return country.country.toLowerCase();
        }

        // Invalid country code, return false
        return null;
    }
}