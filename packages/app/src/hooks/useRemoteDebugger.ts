import { useLatest } from 'ahooks';
import { atom, useRecoilState } from 'recoil';

export const remoteDebuggerState = atom({
  key: 'remoteDebuggerState',
  default: {
    socket: null as WebSocket | null,
    started: false,
    reconnecting: false,
    port: 0,
  },
});

let currentDebuggerMessageHandler: ((message: string, data: unknown) => void) | null = null;

export function setCurrentDebuggerMessageHandler(handler: (message: string, data: unknown) => void) {
  currentDebuggerMessageHandler = handler;
}

// Hacky but whatev, shared between all useRemoteDebugger hooks
let manuallyDisconnecting = false;

export function useRemoteDebugger(options: { onConnect?: () => void; onDisconnect?: () => void } = {}) {
  const [remoteDebugger, setRemoteDebuggerState] = useRecoilState(remoteDebuggerState);
  const onConnectLatest = useLatest(options.onConnect ?? (() => {}));
  const onDisconnectLatest = useLatest(options.onDisconnect ?? (() => {}));

  const connect = (port: number = 21888) => {
    const socket = new WebSocket(`ws://localhost:${port}`);
    onConnectLatest.current?.();

    setRemoteDebuggerState((prevState) => ({
      ...prevState,
      socket,
      started: true,
      port,
    }));
    manuallyDisconnecting = false;

    socket.onopen = () => {
      setRemoteDebuggerState((prevState) => ({
        ...prevState,
        reconnecting: false,
      }));
    };

    socket.onclose = () => {
      if (manuallyDisconnecting) {
        setRemoteDebuggerState((prevState) => ({
          ...prevState,
          started: false,
          reconnecting: false,
        }));
      } else {
        setRemoteDebuggerState((prevState) => ({
          ...prevState,
          started: false,
          reconnecting: true,
        }));

        setTimeout(() => {
          connect(port);
        }, 2000);
      }
    };

    socket.onmessage = (event) => {
      const { message, data } = JSON.parse(event.data);
      currentDebuggerMessageHandler?.(message, data);
    };
  };

  return {
    remoteDebuggerState: remoteDebugger,
    connect,
    disconnect: () => {
      if (remoteDebugger.socket) {
        manuallyDisconnecting = true;
        remoteDebugger.socket.close();
        onDisconnectLatest.current?.();
      }
    },
    send(type: string, data: unknown) {
      if (remoteDebugger.socket?.readyState === WebSocket.OPEN) {
        remoteDebugger.socket.send(JSON.stringify({ type, data }));
      }
    },
  };
}
