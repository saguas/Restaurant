import "./security";
import "./policy.js";
export { default as Restaurant } from "./helpers/helpers.js";
//export { default as jsdom, jsdomHelpers } from "./jsdom/jsdom.js";
export { default as DefaultUser } from "./helpers/createDefaultUser";
export { default as EmployeeUser } from "./helpers/createEmployee";
import "./helpers/CreateUser";
import "./helpers/load-imports";
import "./helpers/load-tables";
import "./methods/tables";
import "./helpers/restaurantSettings";
import "./collections/ClientCounters";
import "./publications/ClientsTable";
import "./publications/ClientsTableHistory";
import "./publications/DefaultUser";
import "./publications/TableMap";
import "./publications/UserClientId";
import "./publications/TableRequestMsg";
import "./publications/RestaurantSettings";
import "./load";
import * as Collections from "../lib/collections";
import { Reaction } from "/server/api";
import "./helpers/clearRequestsMsg";
import "./methods/setUsernameAfterSetShipmentAddress";
import "./frappe/login.js";
//import "./helpers/genClientHtmlFiles";

import cleanupRequestMsg from "./helpers/clearRequestsMsg";


Object.assign(Reaction.Collections, Collections);

cleanupRequestMsg();
