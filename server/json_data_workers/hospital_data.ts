import { get } from "https";
import { byInternet, CountryCode } from "country-code-lookup";
import { singleton } from "tsyringe";
import { HospitalData, HospitalDatas } from "../interfaces/hospital_data";

@singleton()
export class HospitalDataWorker {
    private data: HospitalDatas = [];

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
                    this.data = JSON.parse(data);
                    return resolve();
                });

                // Received error
                }).on("error", (err) => {
                    console.error(err);
                    return reject();
                });
        });
    }

    public getDataByCountry(country_code: string): Promise<HospitalDatas> {
        return new Promise<HospitalDatas>((resolve, reject) => {
            const country: string | null = this.countryCodeToCountry(country_code);
            
            // Country not found
            if (country === null) {
                return reject();
            }
            
            return resolve(this.data.filter((data: HospitalData) => {
                return data.country && data.country.toLowerCase() === country;
            }));
        });
    }

    public getDataByCountryDate(country_code: string, date: Date): Promise<HospitalDatas> {
        return new Promise<HospitalDatas>((resolve, reject) => {
            const country: string | null = this.countryCodeToCountry(country_code);
                
            // Country not found
            if (country === null) {
                return reject();
            }
    
            return resolve(this.data.filter((data: HospitalData) => {
                return data.country !== undefined && data.date && data.country.toLowerCase() === country && (new Date(data.date)).getTime() === date.getTime();
            }));
        });
    }

    public getDataByCountryDateFromTo(country_code: string, date_from: Date, date_to: Date): Promise<HospitalDatas> {
        return new Promise<HospitalDatas>((resolve, reject) => {
            const country: string | null = this.countryCodeToCountry(country_code);
                
            // Country not found
            if (country === null) {
                return reject();
            }
    
            return resolve(this.data.filter((data: HospitalData) => {
                if (data.date === undefined) {
                    return false;
                }
    
                const date: number = new Date(data.date).getTime();
    
                return data.country && data.date && data.country.toLowerCase() === country &&
                date_from.getTime() <= date &&
                date <= date_to.getTime();
            }));
        });
    }

    private countryCodeToCountry(country_code: string): string | null {
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