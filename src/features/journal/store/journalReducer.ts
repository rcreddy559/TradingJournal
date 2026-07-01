import { JournalAction, JournalState } from "./journalTypes";

export const journalReducer = (
  state: JournalState,
  action: JournalAction,
): JournalState => {
  switch (action.type) {
    case "SET_VIEW":
      return {
        ...state,
        ui: { ...state.ui, view: action.payload },
      };
    case "SET_EDITING_TRADE_ID":
      return {
        ...state,
        ui: { ...state.ui, editingTradeId: action.payload },
      };
    case "SET_START_DATE":
      return {
        ...state,
        filters: { ...state.filters, startDate: action.payload },
      };
    case "SET_END_DATE":
      return {
        ...state,
        filters: { ...state.filters, endDate: action.payload },
      };
    case "ADD_TRADE":
      return {
        ...state,
        trades: [action.payload, ...state.trades],
      };
    case "UPDATE_TRADE":
      return {
        ...state,
        trades: state.trades.map((trade) =>
          trade.id === action.payload.id ? action.payload : trade,
        ),
      };
    case "DELETE_TRADE":
      return {
        ...state,
        trades: state.trades.filter((trade) => trade.id !== action.payload),
      };
    case "ADD_STRATEGY":
      return {
        ...state,
        strategies: [action.payload, ...state.strategies],
      };
    case "UPDATE_STRATEGY":
      return {
        ...state,
        strategies: state.strategies.map((strategy) =>
          strategy.id === action.payload.id ? action.payload : strategy,
        ),
      };
    case "DELETE_STRATEGY":
      return {
        ...state,
        strategies: state.strategies.filter(
          (strategy) => strategy.id !== action.payload,
        ),
      };
    case "ADD_INSTRUMENT":
      return {
        ...state,
        instruments: [...state.instruments, action.payload],
      };
    case "UPDATE_INSTRUMENT":
      return {
        ...state,
        instruments: state.instruments.map((instrument) =>
          instrument.id === action.payload.id ? action.payload : instrument,
        ),
      };
    case "DELETE_INSTRUMENT":
      return {
        ...state,
        instruments: state.instruments.filter(
          (instrument) => instrument.id !== action.payload,
        ),
      };
    case "SET_SETTINGS":
      return {
        ...state,
        settings: action.payload,
      };
    case "SET_PROFILE":
      return {
        ...state,
        profile: action.payload,
      };
    case "DELETE_PROFILE":
      return {
        ...state,
        profile: null,
      };
    case "REPLACE_ALL_DATA":
      return {
        ...state,
        trades: action.payload.trades,
        strategies: action.payload.strategies,
        instruments: action.payload.instruments ?? state.instruments,
        settings: action.payload.settings ?? state.settings,
        profile:
          action.payload.profile !== undefined
            ? action.payload.profile
            : state.profile,
      };
    default:
      return state;
  }
};
