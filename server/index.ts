import "reflect-metadata";
import { container } from "tsyringe";
import { Server } from "./server";

const server = container.resolve(Server);
