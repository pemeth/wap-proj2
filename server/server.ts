import express, { Router } from "express";
import { Express } from "express-serve-static-core";
import { container, singleton } from "tsyringe";
import { RouteHandler } from "./RouteHandler";

const port: number = 3000;

@singleton()
export class Server {
    private app: Express;
    private route_handler: RouteHandler;

    constructor() {
        this.app = express();
        this.route_handler = container.resolve(RouteHandler);
        this.route_handler.adddRoutes(this.app);
        this.route_handler.load_data_workers()
        .catch(() => {
            console.error('Failed to load JSON data, exiting');
        })
        .finally(() => {
            this.listen();
        });
    }

    private listen(): void {
        this.app.use("/", Router);
        this.app.listen(port)
        .on('listening', () => {
            console.log(`Server is listening on ${port}`);
        })
        .on('error', (err: Error) => {
            console.error(err);
        });
    }
}