import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Modal } from "./Modal";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const pendingRef = useRef<PendingConfirm | null>(null);
  pendingRef.current = pending;

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    const current = pendingRef.current;
    if (current) current.resolve(value);
    setPending(null);
  }, []);

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {pending && (
        <Modal
          title={pending.title ?? "Please confirm"}
          onClose={() => settle(false)}
          footer={
            <>
              <button
                type="button"
                className="secondary"
                onClick={() => settle(false)}
              >
                {pending.cancelLabel ?? "Cancel"}
              </button>
              <button
                type="button"
                className={pending.danger ? "danger" : undefined}
                onClick={() => settle(true)}
              >
                {pending.confirmLabel ?? "Confirm"}
              </button>
            </>
          }
        >
          <p className="confirm-message">{pending.message}</p>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = (): ConfirmFn => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return context;
};
