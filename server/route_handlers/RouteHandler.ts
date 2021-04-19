/**
 * Module for the `RouteHandler` class, which takes care of instantiating
 * specific route handlers.
 * @module
 * @author Matus Skuta <xskuta04@stud.fit.vutbr.cz>
 */
import { container, singleton } from "tsyringe";
import { Express } from "express-serve-static-core";
import { json, Response } from "express";
import { HospitalRouteHandler } from "./HospitalRouteHandler";
import cors from 'cors';
import { TestsRouteHandler } from "./TestsRouteHandler";

/**
 * Class for instantiating all routes and loading data for each data worker.
 * @class
 */
@singleton()
export class RouteHandler {
    private hospital_route_handler: HospitalRouteHandler;
    private tests_route_handler: TestsRouteHandler;

    /**
     * Instantiate singleton objects for handling routes.
     * @constructor
     */
    constructor() {
        this.hospital_route_handler = container.resolve(HospitalRouteHandler);
        this.tests_route_handler = container.resolve(TestsRouteHandler);
    }
    
    /**
     * Load data for each data worker we have defined.
     * @returns {Promise<void>} Promise that will resolve when all data are loaded, reject when one of them failes
     */
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

    /**
     * Add middleware and routes to the application.
     * @param {Express} app Instance of express web server
     */
    public adddRoutes(app: Express): void {
        // Add middleware for JSON parsing
        app.use(json());

        // Add middleware for adding 'Access-Control-Allow-Origin: *' header
        app.use(cors());
        
        // Set JSON formatted output
        app.set('json spaces', 2);

        // Add routes for /beds and /icu
        this.hospital_route_handler.addRoutes(app);

        // Add routes for /tests
        this.tests_route_handler.addRoutes(app);

        // Add last route that will be executed when all routes failed and return 404 Not Found
        app.route('*')
            .all((_, res: Response) => {
                return res.status(404).send();
            });
    }
}