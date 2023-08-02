import React from "react";
import { DataSource } from "typeorm/browser";

export type AppContextType = {
  dataSource: DataSource | null;
  setDataSource: (user: DataSource | null) => void;
  consumptionValid: boolean;
  setConsumptionValid: (valid: boolean) => void;
};

export const AppContext = React.createContext<AppContextType | null>(null);
