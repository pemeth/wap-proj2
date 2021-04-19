/**
 * Module for the `TestsRouteHandler` class, which handles `/tests`
 * API request routes.
 * @module
 * @author Matus Skuta <xskuta04@stud.fit.vutbr.cz>
 */
import { container, singleton } from "tsyringe";
import { Express } from "express-serve-static-core";
import { TestsDataWorker } from "../json_data_workers/tests_data_worker";
import { Request, Response } from "express";
import { TestDatas } from "../interfaces/tests_data";

/**
 * Class that will load data of data workers and add routes to the application
 */
@singleton()
export class TestsRouteHandler {
    private tests_data_worker: TestsDataWorker;

    /**
     * Instantiate singleton object for holding covid test data
     */
    constructor() {
        this.tests_data_worker = container.resolve(TestsDataWorker);
    }

    /**
     * Load data for data worker
     * @returns {Promise<void>} Returns promise that will be resolved, when data are loaded, or rejected when loading failes
     */
    public loadData(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.tests_data_worker.loadData()
            .then(() => {
                return resolve();
            })
            .catch(() => {
                return reject();
            });
        });
    }

    /**
     * Add routes to server
     * @param {Express} app Instance of express web server
     */
    public addRoutes(app: Express) {
        this.addTestsRoutes(app);
    }

    /**
     * Add all types of routes that start with /tests
     * @param {Express} app Instance of express web server
     */
    private addTestsRoutes(app: Express): void {
        // Add GET route for /tests/<country>
        app.route('/tests/:country')
            .get((req: Request, res: Response) => {
                // Country param is missing
                if (req.params.country === undefined || typeof req.params.country !== 'string') {
                    return res.status(400).send();
                }

                // Return JSON array of datas for given country
                this.tests_data_worker.getTestDataByCountry(req.params.country)
                .then((data: TestDatas) => {
                    return res.json(data);
                })
                .catch(() => {
                    return res.status(400).send();
                });

                return;
            });

        // Add GET route for /tests/<country>/<year>
        app.route('/tests/:country/:year')
            .get((req: Request, res: Response) => {
                // Country param is missing
                if (req.params.country === undefined || typeof req.params.country !== 'string') {
                    return res.status(400).send();
                }

                // Year param is missing
                if (req.params.year === undefined || typeof req.params.year !== 'string') {
                    return res.status(400).send();
                }

                // Return JSON array of datas for given country and year
                this.tests_data_worker.getTestDataByCountryYear(req.params.country, req.params.year)
                .then((data: TestDatas) => {
                    return res.json(data);
                })
                .catch(() => {
                    return res.status(400).send();
                });

                return;
            });

        // Add GET route for /tests/<country>/<year>/<week>
        app.route('/tests/:country/:year/:week')
            .get((req: Request, res: Response) => {
                // Country param is missing
                if (req.params.country === undefined || typeof req.params.country !== 'string') {
                    return res.status(400).send();
                }

                // Year param is missing
                if (req.params.year === undefined || typeof req.params.year !== 'string') {
                    return res.status(400).send();
                }

                // Week param is missing
                if (req.params.week === undefined || typeof req.params.week !== 'string') {
                    return res.status(400).send();
                }

                // Return JSON array of datas for given country and year_week
                this.tests_data_worker.getTestDataByCountryYearWeek(req.params.country, req.params.year, req.params.week)
                .then((data: TestDatas) => {
                    return res.json(data);
                })
                .catch(() => {
                    return res.status(400).send();
                });

                return;
            });
    }
}