import { ReactionProduct } from "/lib/api";
import { Media } from "/lib/collections";

/**
 * productList helpers
 */

Template.productListBeesknees.helpers({
  products: function () {
    return ReactionProduct.getProductsByTag(this.tag);
  },
  media: function () {
    let defaultImage;
    const variants = getTopVariants();
    if (variants.length > 0) {
      const variantId = variants[0]._id;
      defaultImage = Media.findOne({
        "metadata.variantId": variantId,
        "metadata.priority": 0
      });
    }
    if (defaultImage) {
      return defaultImage;
    }
    return false;
  }
});
