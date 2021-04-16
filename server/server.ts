import express, { Router } from "express";
import { Express } from "express-serve-static-core";
import { container, singleton } from "tsyringe";
import { DEFAULT_PORT } from "./config";
import { RouteHandler } from "./route_handlers/RouteHandler";

/**
 * Class that will load JSON data, routes with server and start listening for requests
 */
@singleton()
export class Server {
    // variables
    private app: Express;
    private route_handler: RouteHandler;

    /**
     * Instantiate express app and other objects that will be used throughout application
     */
    constructor() {
        this.app = express();
        this.route_handler = container.resolve(RouteHandler);
        this.route_handler.adddRoutes(this.app);
        this.route_handler.loadDataWorkers()
        .catch(() => {
            console.error('Failed to load JSON data, exiting');
        })
        .finally(() => {
            this.listen();
        });
    }

    /**
     * Open server for incoming traffic on default port
     */
    private listen(): void {
        this.app.use("/", Router);
        this.app.listen(DEFAULT_PORT)
        .on('listening', () => {
            console.log(`Server is listening on ${DEFAULT_PORT}`);
        })
        .on('error', (err: Error) => {
            console.error(err);
        });
    }
}