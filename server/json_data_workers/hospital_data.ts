import { get } from "https";
import { byInternet, CountryCode } from "country-code-lookup";
import { singleton } from "tsyringe";
import { BedDatas, BedData, HospitalData, HospitalDatas, ICUDatas, ICUData } from "../interfaces/hospital_data";

@singleton()
export class HospitalDataWorker {
    private hospital_data: BedDatas = [];
    private icu_data: ICUDatas = [];

    constructor() {
        
    }

    public LoadData(web_page: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            get(web_page, (resp) => {
                let data = '';

                // A chunk of data has been received.
                resp.on('data', (chunk) => {
                    data += chunk;
                });

                // The whole response has been received. Print out the result.
                resp.on('end', () => {
                    const json_data = (JSON.parse(data) as HospitalDatas);

                    // Create new array from received JSON
                    this.hospital_data = Array.from<HospitalData, BedData>(
                        json_data.filter((data: HospitalData) => {
                            return data.indicator !== undefined && data.indicator === 'Daily hospital occupancy';
                        })
                        , (data: HospitalData) => {
                        return {
                            country: data.country,
                            date: data.date,
                            value: data.value
                        } as BedData;
                    });

                    // Create new array from received JSON
                    this.icu_data = Array.from<HospitalData, ICUData>(
                        json_data.filter((data: HospitalData) => {
                            return data.indicator !== undefined && data.indicator === 'Daily ICU occupancy';
                        })
                        , (data: HospitalData) => {
                        return {
                            country: data.country,
                            date: data.date,
                            value: data.value
                        } as ICUData;
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

    public getBedDataByCountry(country_code: string): Promise<BedDatas> {
        return new Promise<BedDatas>((resolve, reject) => {
            const country: string | null = this.countryCodeToCountry(country_code);

            // Country not found
            if (country === null) {
                return reject();
            }
            
            return resolve(this.hospital_data.filter((data: BedData) => {
                return data.country.toLowerCase() === country;
            }));
        });
    }

    public getBedDataByCountryDate(country_code: string, date: Date): Promise<BedDatas> {
        return new Promise<BedDatas>((resolve, reject) => {
            const country: string | null = this.countryCodeToCountry(country_code);

            // Country not found
            if (country === null) {
                return reject();
            }
    
            return resolve(this.hospital_data.filter((data: BedData) => {
                return data.country.toLowerCase() === country && (new Date(data.date)).getTime() === date.getTime();
            }));
        });
    }

    public getBedDataByCountryDateFromTo(country_code: string, date_from: Date, date_to: Date): Promise<BedDatas> {
        return new Promise<BedDatas>((resolve, reject) => {
            const country: string | null = this.countryCodeToCountry(country_code);

            // Country not found
            if (country === null) {
                return reject();
            }
    
            return resolve(this.hospital_data.filter((data: BedData) => {
                const date: number = new Date(data.date).getTime();
                return data.country.toLowerCase() === country && date_from.getTime() <= date && date <= date_to.getTime();
            }));
        });
    }

    public getICUDataByCountry(country_code: string): Promise<ICUDatas> {
        return new Promise<ICUDatas>((resolve, reject) => {
            const country: string | null = this.countryCodeToCountry(country_code);
            
            // Country not found
            if (country === null) {
                return reject();
            }
            
            return resolve(this.icu_data.filter((data: ICUData) => {
                return data.country.toLowerCase() === country;
            }));
        });
    }

    public getICUDataByCountryDate(country_code: string, date: Date): Promise<ICUDatas> {
        return new Promise<ICUDatas>((resolve, reject) => {
            const country: string | null = this.countryCodeToCountry(country_code);
                
            // Country not found
            if (country === null) {
                return reject();
            }
    
            return resolve(this.icu_data.filter((data: ICUData) => {
                return data.country.toLowerCase() === country && (new Date(data.date)).getTime() === date.getTime();
            }));
        });
    }

    public getICUDataByCountryDateFromTo(country_code: string, date_from: Date, date_to: Date): Promise<ICUDatas> {
        return new Promise<ICUDatas>((resolve, reject) => {
            const country: string | null = this.countryCodeToCountry(country_code);
                
            // Country not found
            if (country === null) {
                return reject();
            }
    
            return resolve(this.icu_data.filter((data: ICUData) => {
                const date: number = new Date(data.date).getTime();
                return data.country.toLowerCase() === country && date_from.getTime() <= date && date <= date_to.getTime();
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
}