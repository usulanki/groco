import sequelize from "../config/database";
import "../models/index";
import Menu from "../models/menu.model";

(async () => {
  await sequelize.authenticate();
  const menus = await Menu.findAll({ where: { parent_id: null }, order: [["sort_order", "ASC"]], raw: true });
  menus.forEach((m: any) => console.log(`id=${m.id} name="${m.name}" sort=${m.sort_order} sidebar=${m.show_in_sidebar}`));
  await sequelize.close();
})();
