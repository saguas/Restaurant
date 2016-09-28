//import { BrowserPolicy } from "meteor/browser-policy-common";
//import { WebApp } from "meteor/webapp";

 /*BrowserPolicy.content.allowOriginForAll("*");
 BrowserPolicy.content.allowConnectOrigin("*");
 BrowserPolicy.content.allowDataUrlForAll();*/
 //BrowserPolicy.content.allowJsonDataUrlForAll();
/**
 * Set headers for Reaction CDN
 */
/*WebApp.rawConnectHandlers.use((req, res, next) => {
  //if (req._parsedUrl.pathname.match(/\.(ttf|ttc|otf|eot|woff|svg|font\.css|css)$/)) {
  res.setHeader("Access-Control-Allow-Origin", "https://places-dsn.algolia.net:443");
  //console.log("request ", req);
  //res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, connection, accept-encoding, content-length");
  //res.setHeader("Access-Control-Allow-Headers", "*");
  //res.setHeader('Access-Control-Allow-Credentials', true);
  //res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
  //}
  next();
});*/


//BrowserPolicy.content.allowOriginForAll("https://places-dsn.algolia.net:*");
//BrowserPolicy.content.allowConnectOrigin("http://places-dsn.algolia.net");
//BrowserPolicy.content.allowConnectOrigin("https://places-dsn.algolia.net:*");
//BrowserPolicy.framing.allowAll();
