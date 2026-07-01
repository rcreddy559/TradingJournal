import { AppView } from "../../../shared/types/app";
import {
  AppSettings,
  InstrumentDef,
  Strategy,
  Trade,
  TraderProfile,
} from "../types/trade";

export interface JournalState {
  trades: Trade[];
  strategies: Strategy[];
  instruments: InstrumentDef[];
  settings: AppSettings;
  profile: TraderProfile | null;
  filters: {
    startDate: string;
    endDate: string;
  };
  ui: {
    view: AppView;
    editingTradeId: string | null;
  };
}

export type JournalAction =
  | { type: "SET_VIEW"; payload: AppView }
  | { type: "SET_EDITING_TRADE_ID"; payload: string | null }
  | { type: "SET_START_DATE"; payload: string }
  | { type: "SET_END_DATE"; payload: string }
  | { type: "ADD_TRADE"; payload: Trade }
  | { type: "UPDATE_TRADE"; payload: Trade }
  | { type: "DELETE_TRADE"; payload: string }
  | { type: "ADD_STRATEGY"; payload: Strategy }
  | { type: "UPDATE_STRATEGY"; payload: Strategy }
  | { type: "DELETE_STRATEGY"; payload: string }
  | { type: "ADD_INSTRUMENT"; payload: InstrumentDef }
  | { type: "UPDATE_INSTRUMENT"; payload: InstrumentDef }
  | { type: "DELETE_INSTRUMENT"; payload: string }
  | { type: "SET_SETTINGS"; payload: AppSettings }
  | { type: "SET_PROFILE"; payload: TraderProfile }
  | { type: "DELETE_PROFILE" }
  | {
      type: "REPLACE_ALL_DATA";
      payload: {
        trades: Trade[];
        strategies: Strategy[];
        instruments?: InstrumentDef[];
        settings?: AppSettings;
        profile?: TraderProfile | null;
      };
    };
