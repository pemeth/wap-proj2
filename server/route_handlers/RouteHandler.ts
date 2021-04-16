import { container, singleton } from "tsyringe";
import { Express } from "express-serve-static-core";
import { json, Response } from "express";
import { HospitalRouteHandler } from "./HospitalRouteHandler";
import cors from 'cors';
import { TestsRouteHandler } from "./TestsRouteHandler";

@singleton()
export class RouteHandler {
    private hospital_route_handler: HospitalRouteHandler;
    private tests_route_handler: TestsRouteHandler;

    constructor() {
        this.hospital_route_handler = container.resolve(HospitalRouteHandler);
        this.tests_route_handler = container.resolve(TestsRouteHandler);
    }
    
    public loadDataWorkers(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            Promise.all([
                this.hospital_route_handler.loadData(),
                this.tests_route_handler.loadData()
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
        app.use(cors());
        
        // Set JSON formatted output
        app.set('json spaces', 2);

        this.hospital_route_handler.addRoutes(app);
        this.tests_route_handler.addRoutes(app);

        app.route('*')
            .all((_, res: Response) => {
                return res.status(404).send();
            });
    }
}