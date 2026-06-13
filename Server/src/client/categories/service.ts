import { Category, Media } from "../../models/index";

// Only expose safe public fields — never leak store_id, outlet_id, deleted_by, etc.
const PUBLIC_ATTRS = ["id", "name", "slug"] as const;
const MEDIA_ATTRS  = ["id", "path", "filename", "original_name"] as const;

const BASE_WHERE = { is_deleted: false, status: true, store_id: null } as const;

const childrenInclude = {
  model: Category,
  as: "children",
  attributes: [...PUBLIC_ATTRS],
  where: BASE_WHERE,
  required: false,
  include: [
    {
      model: Media,
      as: "media",
      attributes: [...MEDIA_ATTRS],
      required: false,
    },
  ],
};

export const getCategories = async () => {
  return Category.findAll({
    where: { ...BASE_WHERE, parent_id: null },
    attributes: [...PUBLIC_ATTRS],
    include: [
      { model: Media, as: "media", attributes: [...MEDIA_ATTRS], required: false },
      childrenInclude,
    ],
    order: [["name", "ASC"]],
  });
};

export const getCategoryBySlug = async (slug: string) => {
  const category = await Category.findOne({
    where: { ...BASE_WHERE, slug },
    attributes: [...PUBLIC_ATTRS],
    include: [
      { model: Media, as: "media", attributes: [...MEDIA_ATTRS], required: false },
      childrenInclude,
    ],
  });

  if (!category) {
    throw Object.assign(new Error("Category not found"), { statusCode: 404 });
  }

  return category;
};
