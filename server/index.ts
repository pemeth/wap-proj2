import "reflect-metadata";
import { container } from "tsyringe";
import { Server } from "./server";

// Create single instance of server
const server = container.resolve(Server);
