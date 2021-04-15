import { container, singleton } from "tsyringe";
import { Express } from "express-serve-static-core";
import { json, Request, Response } from "express";
import { HospitalDataWorker } from "./json_data_workers/hospital_data";
import { HospitalDatas } from "./interfaces/hospital_data";

@singleton()
export class RouteHandler {
    private hospital_data_worker: HospitalDataWorker;
    
    constructor() {
        this.hospital_data_worker = container.resolve(HospitalDataWorker);
    }
    
    public load_data_workers(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            Promise.all([
                this.hospital_data_worker.LoadData('https://opendata.ecdc.europa.eu/covid19/hospitalicuadmissionrates/json/')
            ])
            .then(() => {
                return resolve();
            })
            .catch(() => {
                return reject();
            });
        });
    }

    public adddRoutes(app: Express): void {
        app.use(json());

        this.addHospitalRoutes(app);

        app.route('*')
            .all((_, res: Response) => {
                return res.status(400).send();
            });
    }

    private addHospitalRoutes(app: Express): void {
        app.route('/beds/:country')
            .get((req: Request, res: Response) => {
                // Country param is missing
                if (req.params.country === undefined || typeof req.params.country !== 'string') {
                    return res.status(400).send();
                }

                this.hospital_data_worker.getDataByCountry(req.params.country)
                .then((data: HospitalDatas) => {
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

                // Day param is missing
                if (req.params.day === undefined || typeof req.params.day !== 'string') {
                    return res.status(400).send();
                }

                // Month param is missing
                if (req.params.month === undefined || typeof req.params.month !== 'string') {
                    return res.status(400).send();
                }

                // Year param is missing
                if (req.params.year === undefined || typeof req.params.year !== 'string') {
                    return res.status(400).send();
                }

                const date: Date | null = this.genDate(req.params.day, req.params.month, req.params.year);

                if (date === null) {
                    return res.status(400).send();
                }

                this.hospital_data_worker.getDataByCountryDate(req.params.country, date)
                .then((data: HospitalDatas) => {
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

                // Day_from param is missing
                if (req.params.day_from === undefined || typeof req.params.day_from !== 'string') {
                    return res.status(400).send();
                }

                // Month_from param is missing
                if (req.params.month_from === undefined || typeof req.params.month_from !== 'string') {
                    return res.status(400).send();
                }

                // Year_from param is missing
                if (req.params.year_from === undefined || typeof req.params.year_from !== 'string') {
                    return res.status(400).send();
                }

                // Day_to param is missing
                if (req.params.day_to === undefined || typeof req.params.day_to !== 'string') {
                    return res.status(400).send();
                }

                // Month_to param is missing
                if (req.params.month_to === undefined || typeof req.params.month_to !== 'string') {
                    return res.status(400).send();
                }

                // Year_to param is missing
                if (req.params.year_to === undefined || typeof req.params.year_to !== 'string') {
                    return res.status(400).send();
                }
                
                const date_from: Date | null = this.genDate(req.params.day_from, req.params.month_from, req.params.year_from);
                const date_to: Date | null = this.genDate(req.params.day_to, req.params.month_to, req.params.year_to);

                if (date_from === null || date_to === null) {
                    return res.status(400).send();
                }

                this.hospital_data_worker.getDataByCountryDateFromTo(req.params.country, date_from, date_to)
                .then((data: HospitalDatas) => {
                    return res.jsonp(data);
                })
                .catch(() => {
                    return res.status(400).send();
                });

                return;
            });
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