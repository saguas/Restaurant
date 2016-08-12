import { Reaction, Logger, Hooks } from "/server/api";
import { ClientCounters } from "../../lib";
import { Shops } from "/lib/collections";


if (Hooks) {
  Hooks.Events.add("onCoreInit", () => {
    Logger.info("Initialize using Bees Knees Data");
    Reaction.Import.fixture().process(Assets.getText("custom/data/Shops.json"), ["name"], Reaction.Import.shop);
    // ensure Shops are loaded first.
    Reaction.Import.flush(Shops);
    // these will flush/import with the rest of the imports from core init.
    Reaction.Import.fixture().process(Assets.getText("custom/data/Products.json"), ["title"], Reaction.Import.load);
    Reaction.Import.fixture().process(Assets.getText("custom/data/Tags.json"), ["name"], Reaction.Import.load);
    //Reaction.Import.fixture().process(Assets.getText("custom/data/Shipping.json"), ["name"], Reaction.Import.load);
    Reaction.Import.flush();
  });

}
