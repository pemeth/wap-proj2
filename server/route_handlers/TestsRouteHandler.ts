import { container, singleton } from "tsyringe";
import { Express } from "express-serve-static-core";
import { TestsDataWorker } from "../json_data_workers/tests_data_worker";
import { Request, Response } from "express";
import { TestDatas } from "../interfaces/tests_data";

@singleton()
export class TestsRouteHandler {
    private tests_data_worker: TestsDataWorker;

    constructor() {
        this.tests_data_worker = container.resolve(TestsDataWorker);
    }

    public loadData(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.tests_data_worker.loadData('https://opendata.ecdc.europa.eu/covid19/testing/json/')
            .then(() => {
                return resolve();
            })
            .catch(() => {
                return reject();
            });
        });
    }

    public addRoutes(app: Express) {
        this.addTestsRoutes(app);
    }

    private addTestsRoutes(app: Express): void {
        app.route('/tests/:country')
            .get((req: Request, res: Response) => {
                // Country param is missing
                if (req.params.country === undefined || typeof req.params.country !== 'string') {
                    return res.status(400).send();
                }

                // Return JSON array of datas for given country
                this.tests_data_worker.getTestDataByCountry(req.params.country)
                .then((data: TestDatas) => {
                    res.header("Content-Type",'application/json');
                    return res.json(data);
                })
                .catch(() => {
                    return res.status(400).send();
                });

                return;
            });

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

                // Return JSON array of datas for given country
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