import { container, singleton } from "tsyringe";
import { HospitalDataWorker } from "../json_data_workers/hospital_data_worker";
import { Express } from "express-serve-static-core";
import { Request, Response } from "express";
import { BedDatas, ICUDatas } from "../interfaces/hospital_data";

@singleton()
export class HospitalRouteHandler {
    private hospital_data_worker: HospitalDataWorker;

    constructor() {
        this.hospital_data_worker = container.resolve(HospitalDataWorker);
    }

    public loadData(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.hospital_data_worker.loadData('https://opendata.ecdc.europa.eu/covid19/hospitalicuadmissionrates/json/')
            .then(() => {
                return resolve();
            })
            .catch(() => {
                return reject();
            });
        });
    }

    public addRoutes(app: Express) {
        this.addBedRoutes(app);
        this.addICURoutes(app);
    }

    private addBedRoutes(app: Express): void {
        app.route('/beds/:country')
            .get((req: Request, res: Response) => {
                // Country param is missing
                if (req.params.country === undefined || typeof req.params.country !== 'string') {
                    return res.status(400).send();
                }

                // Return JSON array of datas for given country
                this.hospital_data_worker.getBedDataByCountry(req.params.country)
                .then((data: BedDatas) => {
                    return res.jsonp(data);
                })
                .catch(() => {
                    return res.status(400).send();
                });

                return;
            });

        app.route('/beds/:country/:day/:month/:year')
            .get((req: Request, res: Response) => {
                // Country is missing
                if (req.params.country === undefined || typeof req.params.country !== 'string') {
                    return res.status(400).send();
                }

                // Validate date
                if (!this.validate_date(req.params.day, req.params.month, req.params.year)) {
                    return res.status(400).send();
                }

                // Generate date from request
                const date: Date | null = this.genDate(req.params.day, req.params.month, req.params.year);

                // Invalid date
                if (date === null) {
                    return res.status(400).send();
                }

                // Return JSON array of datas for given country, for given date
                this.hospital_data_worker.getBedDataByCountryDate(req.params.country, date)
                .then((data: BedDatas) => {
                    return res.jsonp(data);
                })
                .catch(() => {
                    return res.status(400).send();
                });

                return;
            });

        app.route('/beds/:country/:day_from/:month_from/:year_from/:day_to/:month_to/:year_to')
            .get((req: Request, res: Response) => {
                // Country is missing
                if (req.params.country === undefined || typeof req.params.country !== 'string') {
                    return res.status(400).send();
                }   

                // Validate from date
                if (!this.validate_date(req.params.day_from, req.params.month_from, req.params.year_from)) {
                    return res.status(400).send();
                }

                // Validate to date
                if (!this.validate_date(req.params.day_to, req.params.month_to, req.params.year_to)) {
                    return res.status(400).send();
                }

                // Create dates from request
                const date_from: Date | null = this.genDate(req.params.day_from, req.params.month_from, req.params.year_from);
                const date_to: Date | null = this.genDate(req.params.day_to, req.params.month_to, req.params.year_to);

                // Invalid dates
                if (date_from === null || date_to === null) {
                    return res.status(400).send();
                }

                // Return JSON array of datas for given country, between given dates
                this.hospital_data_worker.getBedDataByCountryDateFromTo(req.params.country, date_from, date_to)
                .then((data: BedDatas) => {
                    return res.jsonp(data);
                })
                .catch(() => {
                    return res.status(400).send();
                });

                return;
            });
    }

    private addICURoutes(app: Express): void {
        app.route('/icu/:country')
            .get((req: Request, res: Response) => {
                // Country param is missing
                if (req.params.country === undefined || typeof req.params.country !== 'string') {
                    return res.status(400).send();
                }

                // Return JSON array of datas for given country
                this.hospital_data_worker.getICUDataByCountry(req.params.country)
                .then((data: ICUDatas) => {
                    return res.jsonp(data);
                })
                .catch(() => {
                    return res.status(400).send();
                });

                return;
            });

        app.route('/icu/:country/:day/:month/:year')
            .get((req: Request, res: Response) => {
                // Country is missing
                if (req.params.country === undefined || typeof req.params.country !== 'string') {
                    return res.status(400).send();
                }

                // Validate date
                if (!this.validate_date(req.params.day, req.params.month, req.params.year)) {
                    return res.status(400).send();
                }

                // Generate date from request
                const date: Date | null = this.genDate(req.params.day, req.params.month, req.params.year);

                // Invalid date
                if (date === null) {
                    return res.status(400).send();
                }

                // Return JSON array of datas for given country, for given date
                this.hospital_data_worker.getICUDataByCountryDate(req.params.country, date)
                .then((data: ICUDatas) => {
                    return res.jsonp(data);
                })
                .catch(() => {
                    return res.status(400).send();
                });

                return;
            });

        app.route('/icu/:country/:day_from/:month_from/:year_from/:day_to/:month_to/:year_to')
            .get((req: Request, res: Response) => {
                // Country is missing
                if (req.params.country === undefined || typeof req.params.country !== 'string') {
                    return res.status(400).send();
                }   

                // Validate from date
                if (!this.validate_date(req.params.day_from, req.params.month_from, req.params.year_from)) {
                    return res.status(400).send();
                }

                // Validate to date
                if (!this.validate_date(req.params.day_to, req.params.month_to, req.params.year_to)) {
                    return res.status(400).send();
                }

                // Create dates from request
                const date_from: Date | null = this.genDate(req.params.day_from, req.params.month_from, req.params.year_from);
                const date_to: Date | null = this.genDate(req.params.day_to, req.params.month_to, req.params.year_to);

                // Invalid dates
                if (date_from === null || date_to === null) {
                    return res.status(400).send();
                }

                // Return JSON array of datas for given country, between given dates
                this.hospital_data_worker.getICUDataByCountryDateFromTo(req.params.country, date_from, date_to)
                .then((data: ICUDatas) => {
                    return res.jsonp(data);
                })
                .catch(() => {
                    return res.status(400).send();
                });

                return;
            });
    }

    private validate_date(day: string, month: string, year: string): boolean {
        if (day === undefined || typeof day !== 'string') {
            return false;
        }

        if (month === undefined || typeof month !== 'string') {
            return false;
        }

        if (year === undefined || typeof year !== 'string') {
            return false;
        }

        return true;
    }

    private genDate(day: string, month: string, year: string): Date | null {
        const d: number = Number(day);
        const m: number = Number(month);
        const y: number = Number(year);

        // When one of the values is not integer, return error
        if (!Number.isInteger(d) || !Number.isInteger(Number(m)) || !Number.isInteger(Number(y))) {
            return null;
        }

        // Decrement 1 from month, because in JS months start from 0 (January)
        return new Date(y, (m - 1), d, 0, 0, 0, 0);
    }
}