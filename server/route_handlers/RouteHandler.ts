import { container, singleton } from "tsyringe";
import { Express } from "express-serve-static-core";
import { json, Response } from "express";
import { HospitalRouteHandler } from "./HospitalRouteHandler";
import cors from 'cors';

@singleton()
export class RouteHandler {
    private hospital_route_handler: HospitalRouteHandler;

    constructor() {
        this.hospital_route_handler = container.resolve(HospitalRouteHandler);
    }
    
    public load_data_workers(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            Promise.all([
                this.hospital_route_handler.load_data()
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

        this.hospital_route_handler.addRoutes(app);

        app.route('*')
            .all((_, res: Response) => {
                return res.status(400).send();
            });
    }
}