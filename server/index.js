import "./security";
export { default as Restaurant } from "./helpers/helpers.js";
//export { default as jsdom, jsdomHelpers } from "./jsdom/jsdom.js";
export { default as DefaultUser } from "./helpers/createDefaultUser";
export { default as EmployeeUser } from "./helpers/createEmployee";
import "./helpers/CreateUser";
import "./helpers/load-imports";
import "./helpers/load-tables";
import "./methods/tables";
import "./collections/ClientCounters";
import "./publications/ClientsTable";
import "./publications/ClientsTableHistory";
import "./publications/DefaultUser";
import "./publications/TableMap";
import "./publications/UserClientId";
import "./publications/TableRequestMsg";
import "./load";
import * as Collections from "../lib/collections";
import { Reaction } from "/server/api";
//import "./helpers/genClientHtmlFiles";



Object.assign(Reaction.Collections, Collections);
