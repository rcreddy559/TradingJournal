import {
  createContext,
  Dispatch,
  ReactNode,
  useContext,
  useReducer,
} from "react";
import { journalService } from "../api/journalService";
import { JournalAction, JournalState } from "./journalTypes";
import { journalReducer } from "./journalReducer";

interface JournalContextValue {
  state: JournalState;
  dispatch: Dispatch<JournalAction>;
}

const initialState: JournalState = {
  trades: [],
  strategies: [],
  instruments: [],
  settings: journalService.getSettings(),
  profile: null,
  filters: {
    startDate: "",
    endDate: "",
  },
  ui: {
    view: "DASHBOARD",
    editingTradeId: null,
  },
};

const getInitialState = (): JournalState => {
  return {
    ...initialState,
    trades: journalService.getTrades(),
    strategies: journalService.getStrategies(),
    instruments: journalService.getInstruments(),
    settings: journalService.getSettings(),
    profile: journalService.getProfile(),
  };
};

const JournalContext = createContext<JournalContextValue | null>(null);

export function JournalProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    journalReducer,
    undefined,
    getInitialState,
  );
  return (
    <JournalContext.Provider value={{ state, dispatch }}>
      {children}
    </JournalContext.Provider>
  );
}

export const useJournalContext = (): JournalContextValue => {
  const context = useContext(JournalContext);
  if (!context) {
    throw new Error("useJournalContext must be used within JournalProvider");
  }
  return context;
};
