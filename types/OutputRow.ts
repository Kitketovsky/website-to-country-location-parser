import { IInputRow } from "./InputRow";

export type IOutputRow = {
  website: IInputRow["website"];
  company: IInputRow["company"];
  language: string | null;
  whoIsV1: string | null;
  whoIsV2: string | null;
  redirect: string | null;
  error: string | null;
  withImage: boolean;
};
