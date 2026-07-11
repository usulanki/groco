import User from "./user.model";
import Admin from "./admin.model";
import Role from "./role.model";
import Store from "./store.model";
import Outlet from "./outlet.model";
import Menu from "./menu.model";
import Permission from "./permission.model";
import State from "./state.model";
import City from "./city.model";
import Address from "./address.model";
import Media from "./media.model";
import Category from "./category.model";
import Product from "./product.model";
import Cart from "./cart.model";
import Order from "./order.model";
import OrderItem from "./orderItem.model";
import Payment from "./payment.model";
import Review from "./review.model";
import Wishlist from "./wishlist.model";
import Tax from "./tax.model";
import Uom from "./uom.model";
import Brand from "./brand.model";
import CustomerGroup from "./customerGroup.model";
import CustomerGroupMember from "./customerGroupMember.model";
import ProductOutlet from "./productOutlet.model";
import VariantAttribute from "./variantAttribute.model";
import VariantAttributeValue from "./variantAttributeValue.model";
import ProductVariant from "./productVariant.model";
import ProductVariantOption from "./productVariantOption.model";
import ProductMedia from "./productMedia.model";
import ProductPrice from "./productPrice.model";
import ProductInventory from "./productInventory.model";
import Discount from "./discount.model";
import DiscountApplicability from "./discountApplicability.model";
import DiscountUsage from "./discountUsage.model";
import Vendor from "./vendor.model";
import Material from "./material.model";
import Invoice from "./invoice.model";
import Purchase from "./purchase.model";
import PurchaseItem from "./purchaseItem.model";
import Grn from "./grn.model";
import Return from "./return.model";
import ReturnLineItem from "./returnLineItem.model";
import CreditNote from "./creditNote.model";
import Transaction from "./transaction.model";
import Config from "./config.model";
import ConfigItem from "./configItem.model";
import ProductReturnPolicy from "./productReturnPolicy.model";
import NotificationSetting from "./notificationSetting.model";
import BackgroundJob from "./backgroundJob.model";
import OrderHistory from "./orderHistory.model";
import DeliveryPartner from "./deliveryPartner.model";
import DeliveryAgent from "./deliveryAgent.model";
import StoreFeatureFlag from "./storeFeatureFlag.model";
// Admin <-> Role
Role.hasMany(Admin, { foreignKey: "role_id" });
Admin.belongsTo(Role, { foreignKey: "role_id" });

// Role <-> Store (store-scoped custom roles)
Store.hasMany(Role, { foreignKey: "store_id" });
Role.belongsTo(Store, { foreignKey: "store_id", as: "store" });

// Role created_by Admin
Role.belongsTo(Admin, { foreignKey: "created_by", as: "creator" });

// Store owner and creator (both FK to admins)
Admin.hasMany(Store, { foreignKey: "owner_id", as: "ownedStores" });
Store.belongsTo(Admin, { foreignKey: "owner_id", as: "owner" });
Store.belongsTo(Admin, { foreignKey: "created_by", as: "creator" });

// Admin <-> Store (admin's assigned store)
Store.hasMany(Admin, { foreignKey: "store_id", as: "storeAdmins" });
Admin.belongsTo(Store, { foreignKey: "store_id", as: "store" });

// Admin <-> Outlet (admin's assigned outlet)
Outlet.hasMany(Admin, { foreignKey: "outlet_id", as: "outletAdmins" });
Admin.belongsTo(Outlet, { foreignKey: "outlet_id", as: "outlet" });

// Outlet <-> Store
Store.hasMany(Outlet, { foreignKey: "store_id" });
Outlet.belongsTo(Store, { foreignKey: "store_id" });

// Outlet manager and creator (both FK to admins)
Admin.hasMany(Outlet, { foreignKey: "manager_id", as: "managedOutlets" });
Outlet.belongsTo(Admin, { foreignKey: "manager_id", as: "manager" });
Outlet.belongsTo(Admin, { foreignKey: "created_by", as: "creator" });

// Menu self-reference (submenus)
Menu.hasMany(Menu, { foreignKey: "parent_id", as: "subMenus" });
Menu.belongsTo(Menu, { foreignKey: "parent_id", as: "parent" });

// Permission <-> Menu, Role, Store
Menu.hasMany(Permission, { foreignKey: "menu_id" });
Permission.belongsTo(Menu, { foreignKey: "menu_id" });
Role.hasMany(Permission, { foreignKey: "role_id" });
Permission.belongsTo(Role, { foreignKey: "role_id" });
Store.hasMany(Permission, { foreignKey: "store_id" });
Permission.belongsTo(Store, { foreignKey: "store_id" });

// State <-> City
State.hasMany(City, { foreignKey: "state_id" });
City.belongsTo(State, { foreignKey: "state_id" });

// Address <-> User, City, State
User.hasMany(Address, { foreignKey: "user_id" });
Address.belongsTo(User, { foreignKey: "user_id" });
City.hasMany(Address, { foreignKey: "city_id" });
Address.belongsTo(City, { foreignKey: "city_id" });
State.hasMany(Address, { foreignKey: "state_id" });
Address.belongsTo(State, { foreignKey: "state_id" });

// Media <-> Category
Media.hasMany(Category, { foreignKey: "media_id" });
Category.belongsTo(Media, { foreignKey: "media_id", as: "media" });

// Category self-reference (subcategories)
Category.hasMany(Category, { foreignKey: "parent_id", as: "children" });
Category.belongsTo(Category, { foreignKey: "parent_id", as: "parent" });

// Category <-> Store & Outlet
Store.hasMany(Category, { foreignKey: "store_id" });
Category.belongsTo(Store, { foreignKey: "store_id" });
Outlet.hasMany(Category, { foreignKey: "outlet_id" });
Category.belongsTo(Outlet, { foreignKey: "outlet_id" });

// Product <-> Category
Category.hasMany(Product, { foreignKey: "category_id" });
Product.belongsTo(Category, { foreignKey: "category_id" });

// Product <-> Store
Store.hasMany(Product, { foreignKey: "store_id" });
Product.belongsTo(Store, { foreignKey: "store_id" });

// Product created_by Admin
Admin.hasMany(Product, { foreignKey: "created_by", as: "createdProducts" });
Product.belongsTo(Admin, { foreignKey: "created_by", as: "creator" });

// Product <-> Outlet (many-to-many via product_outlets)
Product.belongsToMany(Outlet, { through: ProductOutlet, foreignKey: "product_id", as: "outlets" });
Outlet.belongsToMany(Product, { through: ProductOutlet, foreignKey: "outlet_id", as: "products" });

// Cart <-> User & Product (flat, one row per line item)
User.hasMany(Cart, { foreignKey: "user_id" });
Cart.belongsTo(User, { foreignKey: "user_id" });
Product.hasMany(Cart, { foreignKey: "product_id" });
Cart.belongsTo(Product, { foreignKey: "product_id" });

// Wishlist <-> User & Product
User.hasMany(Wishlist, { foreignKey: "user_id" });
Wishlist.belongsTo(User, { foreignKey: "user_id" });
Product.hasMany(Wishlist, { foreignKey: "product_id" });
Wishlist.belongsTo(Product, { foreignKey: "product_id" });

// Order <-> User
User.hasMany(Order, { foreignKey: "user_id" });
Order.belongsTo(User, { foreignKey: "user_id" });

// Order <-> Store & Outlet
Store.hasMany(Order, { foreignKey: "store_id" });
Order.belongsTo(Store, { foreignKey: "store_id" });
Outlet.hasMany(Order, { foreignKey: "outlet_id" });
Order.belongsTo(Outlet, { foreignKey: "outlet_id" });

// Order <-> Address
Order.belongsTo(Address, { foreignKey: "address_id" });

// OrderItem <-> Order, Product & ProductVariant
Order.hasMany(OrderItem, { foreignKey: "order_id" });
OrderItem.belongsTo(Order, { foreignKey: "order_id" });
Product.hasMany(OrderItem, { foreignKey: "product_id" });
OrderItem.belongsTo(Product, { foreignKey: "product_id" });
ProductVariant.hasMany(OrderItem, { foreignKey: "variant_id", as: "orderItems" });
OrderItem.belongsTo(ProductVariant, { foreignKey: "variant_id", as: "Variant" });

// Payment <-> Order (one-to-one)
Order.hasOne(Payment, { foreignKey: "order_id" });
Payment.belongsTo(Order, { foreignKey: "order_id" });

// Tax <-> Store
Store.hasMany(Tax, { foreignKey: "store_id" });
Tax.belongsTo(Store, { foreignKey: "store_id" });

// Uom <-> Store
Store.hasMany(Uom, { foreignKey: "store_id" });
Uom.belongsTo(Store, { foreignKey: "store_id" });

// Brand <-> Store (nullable for global brands)
Store.hasMany(Brand, { foreignKey: "store_id" });
Brand.belongsTo(Store, { foreignKey: "store_id" });

// Product <-> Brand (optional)
Brand.hasMany(Product, { foreignKey: "brand_id", as: "products" });
Product.belongsTo(Brand, { foreignKey: "brand_id", as: "brand" });

// Brand <-> Media
Media.hasMany(Brand, { foreignKey: "media_id" });
Brand.belongsTo(Media, { foreignKey: "media_id", as: "media" });

// CustomerGroup <-> Store
Store.hasMany(CustomerGroup, { foreignKey: "store_id" });
CustomerGroup.belongsTo(Store, { foreignKey: "store_id" });

// CustomerGroupMember <-> CustomerGroup, User
CustomerGroup.hasMany(CustomerGroupMember, { foreignKey: "customer_group_id", as: "members" });
CustomerGroupMember.belongsTo(CustomerGroup, { foreignKey: "customer_group_id" });
User.hasMany(CustomerGroupMember, { foreignKey: "user_id" });
CustomerGroupMember.belongsTo(User, { foreignKey: "user_id" });

// VariantAttribute <-> Store
Store.hasMany(VariantAttribute, { foreignKey: "store_id" });
VariantAttribute.belongsTo(Store, { foreignKey: "store_id" });

// VariantAttributeValue <-> VariantAttribute
VariantAttribute.hasMany(VariantAttributeValue, { foreignKey: "attribute_id", as: "values" });
VariantAttributeValue.belongsTo(VariantAttribute, { foreignKey: "attribute_id", as: "attribute" });

// ProductVariant <-> Product
Product.hasMany(ProductVariant, { foreignKey: "product_id", as: "variants" });
ProductVariant.belongsTo(Product, { foreignKey: "product_id" });

// ProductVariant <-> VariantAttributeValue (many-to-many via product_variant_options)
ProductVariant.belongsToMany(VariantAttributeValue, { through: ProductVariantOption, foreignKey: "variant_id", as: "attributeValues" });
VariantAttributeValue.belongsToMany(ProductVariant, { through: ProductVariantOption, foreignKey: "attribute_value_id", as: "variants" });

// Product <-> Media (many-to-many via product_media)
Product.belongsToMany(Media, { through: ProductMedia, foreignKey: "product_id", as: "images" });
Media.belongsToMany(Product, { through: ProductMedia, foreignKey: "media_id", as: "products" });
ProductMedia.belongsTo(Media, { foreignKey: "media_id", as: "media" });

// ProductPrice <-> Product, Variant, CustomerGroup, Outlet
Product.hasMany(ProductPrice, { foreignKey: "product_id", as: "prices" });
ProductPrice.belongsTo(Product, { foreignKey: "product_id" });
ProductVariant.hasMany(ProductPrice, { foreignKey: "variant_id", as: "prices" });
ProductPrice.belongsTo(ProductVariant, { foreignKey: "variant_id", as: "variant" });
CustomerGroup.hasMany(ProductPrice, { foreignKey: "customer_group_id" });
ProductPrice.belongsTo(CustomerGroup, { foreignKey: "customer_group_id", as: "customerGroup" });
Outlet.hasMany(ProductPrice, { foreignKey: "outlet_id" });
ProductPrice.belongsTo(Outlet, { foreignKey: "outlet_id", as: "outlet" });

// ProductInventory <-> Product, Material, Variant, Store, Outlet
Product.hasMany(ProductInventory, { foreignKey: "product_id", as: "inventory" });
ProductInventory.belongsTo(Product, { foreignKey: "product_id" });
Material.hasMany(ProductInventory, { foreignKey: "material_id", as: "inventory" });
ProductInventory.belongsTo(Material, { foreignKey: "material_id", as: "material" });
ProductVariant.hasMany(ProductInventory, { foreignKey: "variant_id", as: "inventory" });
ProductInventory.belongsTo(ProductVariant, { foreignKey: "variant_id", as: "variant" });
Store.hasMany(ProductInventory, { foreignKey: "store_id" });
ProductInventory.belongsTo(Store, { foreignKey: "store_id" });
Outlet.hasMany(ProductInventory, { foreignKey: "outlet_id" });
ProductInventory.belongsTo(Outlet, { foreignKey: "outlet_id", as: "outlet" });

// Discount <-> Store
Store.hasMany(Discount, { foreignKey: "store_id" });
Discount.belongsTo(Store, { foreignKey: "store_id" });

// DiscountApplicability <-> Discount
Discount.hasMany(DiscountApplicability, { foreignKey: "discount_id", as: "applicability" });
DiscountApplicability.belongsTo(Discount, { foreignKey: "discount_id" });

// DiscountUsage <-> Discount, User, Order
Discount.hasMany(DiscountUsage, { foreignKey: "discount_id", as: "usages" });
DiscountUsage.belongsTo(Discount, { foreignKey: "discount_id" });
User.hasMany(DiscountUsage, { foreignKey: "user_id" });
DiscountUsage.belongsTo(User, { foreignKey: "user_id" });
Order.hasMany(DiscountUsage, { foreignKey: "order_id" });
DiscountUsage.belongsTo(Order, { foreignKey: "order_id" });


// Vendor <-> Store
Store.hasMany(Vendor, { foreignKey: "store_id" });
Vendor.belongsTo(Store, { foreignKey: "store_id" });

// Material <-> Store, Uom, Category
Store.hasMany(Material, { foreignKey: "store_id" });
Material.belongsTo(Store, { foreignKey: "store_id" });
Uom.hasMany(Material, { foreignKey: "uom_id" });
Material.belongsTo(Uom, { foreignKey: "uom_id", as: "Uom" });
Category.hasMany(Material, { foreignKey: "category_id" });
Material.belongsTo(Category, { foreignKey: "category_id", as: "Category" });
Category.hasMany(Material, { foreignKey: "subcategory_id" });
Material.belongsTo(Category, { foreignKey: "subcategory_id", as: "Subcategory" });

// Invoice <-> Store, Admin
Store.hasMany(Invoice, { foreignKey: "store_id" });
Invoice.belongsTo(Store, { foreignKey: "store_id" });
Admin.hasMany(Invoice, { foreignKey: "created_by", as: "createdInvoices" });
Invoice.belongsTo(Admin, { foreignKey: "created_by", as: "CreatedBy" });

// Purchase <-> Store, Vendor, Admin, Invoice, PurchaseItem
Store.hasMany(Purchase, { foreignKey: "store_id" });
Purchase.belongsTo(Store, { foreignKey: "store_id" });
Vendor.hasMany(Purchase, { foreignKey: "vendor_id" });
Purchase.belongsTo(Vendor, { foreignKey: "vendor_id", as: "Vendor" });
Admin.hasMany(Purchase, { foreignKey: "created_by", as: "createdPurchases" });
Purchase.belongsTo(Admin, { foreignKey: "created_by", as: "CreatedBy" });
Admin.hasMany(Purchase, { foreignKey: "grn_by", as: "grnPurchases" });
Purchase.belongsTo(Admin, { foreignKey: "grn_by", as: "GrnBy" });
Invoice.hasMany(Purchase, { foreignKey: "invoice_ref_id", as: "purchases" });
Purchase.belongsTo(Invoice, { foreignKey: "invoice_ref_id", as: "Invoice" });
Purchase.hasMany(PurchaseItem, { foreignKey: "purchase_id", as: "items" });
PurchaseItem.belongsTo(Purchase, { foreignKey: "purchase_id" });

// Grn <-> Purchase, Admin (self-ref for partial→full linkage)
Purchase.hasMany(Grn, { foreignKey: "purchase_id", as: "grns" });
Grn.belongsTo(Purchase, { foreignKey: "purchase_id" });
Admin.hasMany(Grn, { foreignKey: "created_by", as: "createdGrns" });
Grn.belongsTo(Admin, { foreignKey: "created_by", as: "CreatedBy" });
Grn.hasMany(Grn, { foreignKey: "full_grn_id", as: "partialGrns" });
Grn.belongsTo(Grn, { foreignKey: "full_grn_id", as: "fullGrn" });
// Grn <-> Return
Return.belongsTo(Grn, { foreignKey: "grn_id", as: "grn" });
Grn.hasMany(Return, { foreignKey: "grn_id", as: "returns" });

// Purchase/Grn outlet
Outlet.hasMany(Purchase, { foreignKey: "outlet_id", as: "purchasesAtOutlet" });
Purchase.belongsTo(Outlet, { foreignKey: "outlet_id", as: "outlet" });
Outlet.hasMany(Grn, { foreignKey: "outlet_id", as: "grnsAtOutlet" });
Grn.belongsTo(Outlet, { foreignKey: "outlet_id", as: "outlet" });

// Transaction <-> Store, Outlet, Admin
Store.hasMany(Transaction, { foreignKey: "store_id" });
Transaction.belongsTo(Store, { foreignKey: "store_id" });
Outlet.hasMany(Transaction, { foreignKey: "outlet_id", as: "transactions" });
Transaction.belongsTo(Outlet, { foreignKey: "outlet_id", as: "outlet" });
Admin.hasMany(Transaction, { foreignKey: "created_by", as: "createdTransactions" });
Transaction.belongsTo(Admin, { foreignKey: "created_by", as: "createdBy" });

// CreditNote <-> Return, Store, Outlet, Vendor, Admin
Return.hasMany(CreditNote, { foreignKey: "return_id", as: "creditNotes" });
CreditNote.belongsTo(Return, { foreignKey: "return_id", as: "return" });
CreditNote.belongsTo(Admin,   { foreignKey: "created_by", as: "createdBy" });
CreditNote.belongsTo(Outlet,  { foreignKey: "outlet_id",  as: "outlet" });
CreditNote.belongsTo(Vendor,  { foreignKey: "vendor_id",  as: "vendor" });

// Return <-> Store, Outlet, Vendor, Admin, ReturnLineItem
Store.hasMany(Return, { foreignKey: "store_id" });
Return.belongsTo(Store, { foreignKey: "store_id" });
Outlet.hasMany(Return, { foreignKey: "outlet_id", as: "returns" });
Return.belongsTo(Outlet, { foreignKey: "outlet_id", as: "outlet" });
Vendor.hasMany(Return, { foreignKey: "vendor_id", as: "returns" });
Return.belongsTo(Vendor, { foreignKey: "vendor_id", as: "vendor" });
Admin.hasMany(Return, { foreignKey: "created_by", as: "createdReturns" });
Return.belongsTo(Admin, { foreignKey: "created_by", as: "createdBy" });
Return.hasMany(ReturnLineItem, { foreignKey: "return_id", as: "lineItems" });
ReturnLineItem.belongsTo(Return, { foreignKey: "return_id", as: "return" });
ReturnLineItem.belongsTo(PurchaseItem, { foreignKey: "purchase_item_id", as: "purchaseItem" });
Store.hasMany(ReturnLineItem, { foreignKey: "store_id" });
ReturnLineItem.belongsTo(Store, { foreignKey: "store_id" });
Vendor.hasMany(ReturnLineItem, { foreignKey: "vendor_id", as: "returnLineItems" });
ReturnLineItem.belongsTo(Vendor, { foreignKey: "vendor_id", as: "vendor" });
Outlet.hasMany(ReturnLineItem, { foreignKey: "outlet_id", as: "returnLineItemsAtOutlet" });
ReturnLineItem.belongsTo(Outlet, { foreignKey: "outlet_id", as: "outlet" });

// Config <-> ConfigItem
Config.hasMany(ConfigItem, { foreignKey: "config_id", as: "items" });
ConfigItem.belongsTo(Config, { foreignKey: "config_id", as: "config" });

// ProductReturnPolicy <-> Product & ConfigItem
Product.hasMany(ProductReturnPolicy, { foreignKey: "product_id", as: "returnPolicies" });
ProductReturnPolicy.belongsTo(Product, { foreignKey: "product_id" });
ConfigItem.hasMany(ProductReturnPolicy, { foreignKey: "config_item_id" });
ProductReturnPolicy.belongsTo(ConfigItem, { foreignKey: "config_item_id", as: "configItem" });

// Review <-> User & Product
User.hasMany(Review, { foreignKey: "user_id" });
Review.belongsTo(User, { foreignKey: "user_id" });
Product.hasMany(Review, { foreignKey: "product_id" });
Review.belongsTo(Product, { foreignKey: "product_id" });

// NotificationSetting <-> Admin
Admin.hasMany(NotificationSetting, { foreignKey: "admin_id", as: "notificationSettings" });
NotificationSetting.belongsTo(Admin, { foreignKey: "admin_id" });

// BackgroundJob <-> Admin
Admin.hasMany(BackgroundJob, { foreignKey: "admin_id", as: "backgroundJobs" });
BackgroundJob.belongsTo(Admin, { foreignKey: "admin_id", as: "createdBy" });

// OrderHistory <-> Order & Admin
Order.hasMany(OrderHistory, { foreignKey: "order_id" });
OrderHistory.belongsTo(Order, { foreignKey: "order_id" });
Admin.hasMany(OrderHistory, { foreignKey: "admin_id", as: "orderHistory" });
OrderHistory.belongsTo(Admin, { foreignKey: "admin_id" });

export {
  User, Admin, Role, Store, Outlet, Menu, Permission, Vendor, Material, Invoice, Purchase, PurchaseItem, Grn, Brand,
  State, City, Address,
  Media, Category, Product, Cart, Order, OrderItem, Payment, Review, Wishlist, Tax, Uom,
  CustomerGroup,
  CustomerGroupMember,
  ProductOutlet,
  VariantAttribute,
  VariantAttributeValue,
  ProductVariant,
  ProductVariantOption,
  ProductMedia,
  ProductPrice,
  ProductInventory,
  Return,
  ReturnLineItem,
  CreditNote,
  Transaction,
  Discount,
  DiscountApplicability,
  DiscountUsage,
  Config,
  ConfigItem,
  ProductReturnPolicy,
  NotificationSetting,
  BackgroundJob,
  OrderHistory,
  DeliveryPartner,
  DeliveryAgent,
  StoreFeatureFlag,
};
