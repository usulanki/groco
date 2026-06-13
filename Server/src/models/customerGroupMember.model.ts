import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface CustomerGroupMemberAttributes {
  id: number;
  customer_group_id: number;
  user_id: number;
}

type CustomerGroupMemberCreationAttributes = Optional<CustomerGroupMemberAttributes, "id">;

class CustomerGroupMember extends Model<CustomerGroupMemberAttributes, CustomerGroupMemberCreationAttributes>
  implements CustomerGroupMemberAttributes {
  declare id: number;
  declare customer_group_id: number;
  declare user_id: number;
}

CustomerGroupMember.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    customer_group_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "customer_groups", key: "id" },
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
  },
  {
    sequelize,
    tableName: "customer_group_members",
    timestamps: false,
  }
);

export default CustomerGroupMember;
