export interface UpdatePermissionDto {
  view?: boolean;
  add?: boolean;
  edit?: boolean;
  delete?: boolean;
  upload?: boolean;
  download?: boolean;
}
