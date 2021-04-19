/**
 * Module for the `HospitalRouteHandler` class, which handles `/beds` and `/icu`
 * API request routes.
 * @module
 * @author Matus Skuta <xskuta04@stud.fit.vutbr.cz>
 */
import { container, singleton } from "tsyringe";
import { HospitalDataWorker } from "../json_data_workers/hospital_data_worker";
import { Express } from "express-serve-static-core";
import { Request, Response } from "express";
import { BedDatas, ICUDatas } from "../interfaces/hospital_data";

/**
 * Class that will load data of data workers and add routes to the application.
 * @class
 */
@singleton()
export class HospitalRouteHandler {
    private hospital_data_worker: HospitalDataWorker;

    /**
     * Instantiate singleton object for holding hospital data.
     * @constructor
     */
    constructor() {
        this.hospital_data_worker = container.resolve(HospitalDataWorker);
    }

    /**
     * Load data for data worker.
     * @returns {Promise<void>} Returns promise that will be resolved, when data are loaded, or rejected when loading failes
     */
    public loadData(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.hospital_data_worker.loadData()
            .then(() => {
                return resolve();
            })
            .catch(() => {
                return reject();
            });
        });
    }

    /**
     * Add routes to server.
     * @param {Express} app Instance of express web server
     */
    public addRoutes(app: Express) {
        this.addBedRoutes(app);
        this.addICURoutes(app);
    }

    /**
     * Add all types of routes that start with /beds.
     * @param {Express} app Instance of express web server
     */
    private addBedRoutes(app: Express): void {
        // Add GET route for /beds/<country>
        app.route('/beds/:country')
            .get((req: Request, res: Response) => {
                // Country param is missing
                if (req.params.country === undefined || typeof req.params.country !== 'string') {
                    return res.status(400).send();
                }

                // Return JSON array of datas for given country
                this.hospital_data_worker.getBedDataByCountry(req.params.country)
                .then((data: BedDatas) => {
                    return res.json(data);
                })
                .catch(() => {
                    return res.status(400).send();
                });

                return;
            });

        // Add GET route for /beds/<country>/<date>
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

                // Return JSON array of datas for given country and date
                this.hospital_data_worker.getBedDataByCountryDate(req.params.country, date)
                .then((data: BedDatas) => {
                    return res.json(data);
                })
                .catch(() => {
                    return res.status(400).send();
                });

                return;
            });
        
        // Add GET route for /beds/<country>/<date-start>/<date-end>
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
                    return res.json(data);
                })
                .catch(() => {
                    return res.status(400).send();
                });

                return;
            });
    }

    /**
     * Add all types of routes that start with /icu.
     * @param {Express} app Instance of express web server
     */
    private addICURoutes(app: Express): void {
        // Add GET route for /icu/<country>
        app.route('/icu/:country')
            .get((req: Request, res: Response) => {
                // Country param is missing
                if (req.params.country === undefined || typeof req.params.country !== 'string') {
                    return res.status(400).send();
                }

                // Return JSON array of datas for given country
                this.hospital_data_worker.getICUDataByCountry(req.params.country)
                .then((data: ICUDatas) => {
                    return res.json(data);
                })
                .catch(() => {
                    return res.status(400).send();
                });

                return;
            });

        // Add GET route for /icu/<country>/<date>
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

                // Return JSON array of datas for given country and date
                this.hospital_data_worker.getICUDataByCountryDate(req.params.country, date)
                .then((data: ICUDatas) => {
                    return res.json(data);
                })
                .catch(() => {
                    return res.status(400).send();
                });

                return;
            });

        // Add GET route for /icu/<country>/<date-start>/<date-end>
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
                    return res.json(data);
                })
                .catch(() => {
                    return res.status(400).send();
                });

                return;
            });
    }

    /**
     * Validate if given date in request, contains all values.
     * @param {string|undefined} day Request param day
     * @param {string|undefined} month Request param month
     * @param {string|undefined} year Request param year
     * @returns {boolean} True when request contains given data, false otherwise
     */
    private validate_date(day: string | undefined, month: string | undefined, year: string | undefined): boolean {
        // When attribute day is missing, return false
        if (day === undefined || typeof day !== 'string') {
            return false;
        }

        // When attribute month is missing, return false
        if (month === undefined || typeof month !== 'string') {
            return false;
        }

        // When attribute year is missing, return false
        if (year === undefined || typeof year !== 'string') {
            return false;
        }

        // Return true, all attributes are present
        return true;
    }

    /**
     * Generate date from date given in request.
     * @param {string} day Number of day in month as string
     * @param {string} month Number of month in year as string
     * @param {string} year Year as string
     * @returns {Date|null} Returns Date object when values are valid, null otherwise
     */
    private genDate(day: string, month: string, year: string): Date | null {
        // Convert values into numbers
        const d: number = Number(day);
        const m: number = Number(month);
        const y: number = Number(year);

        // When one of the values is not integer, return null
        if (!Number.isInteger(d) || !Number.isInteger(Number(m)) || !Number.isInteger(Number(y))) {
            return null;
        }

        // Decrement 1 from month, because in JS months start from 0 (January)
        return new Date(y, (m - 1), d, 0, 0, 0, 0);
    }
}