import "reflect-metadata";
import { container } from "tsyringe";
import { Server } from "./server";

/**
 * Holds the only instance of the server.
 * @var {Server}
 */
const server = container.resolve(Server);
