import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

interface ReviewAttributes {
  id: number;
  user_id: number;
  product_id: number;
  review: string;
  likes: number;
  created_ts?: Date;
}

type ReviewCreationAttributes = Optional<ReviewAttributes, "id" | "likes">;

class Review extends Model<ReviewAttributes, ReviewCreationAttributes> implements ReviewAttributes {
  declare id: number;
  declare user_id: number;
  declare product_id: number;
  declare review: string;
  declare likes: number;
  declare created_ts: Date;
}

Review.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    product_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "products", key: "id" },
    },
    review: { type: DataTypes.TEXT, allowNull: false },
    likes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    created_ts: { type: DataTypes.DATE },
  },
  { sequelize, tableName: "reviews", createdAt: "created_ts", updatedAt: false }
);

export default Review;
