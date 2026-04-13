import { Networking } from '@flamework/networking';

interface ServerToClientEvents {
  core: {
    dataDelta: (payload: buffer) => void;
  };
}

interface ServerToClientFunctions {}

interface ClientToServerEvents {}

interface ClientToServerFunctions {
  requestHydration: () => void;
}

export const GlobalEvents = Networking.createEvent<ClientToServerEvents, ServerToClientEvents>();
export const GlobalFunctions = Networking.createFunction<
  ClientToServerFunctions,
  ServerToClientFunctions
>();
