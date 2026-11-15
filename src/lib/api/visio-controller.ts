import { AdminBaseController } from "./base-controller";

/**
 * Joining a call on our own Jitsi (visio.hashcode.digital; https://localhost:8443
 * locally): the backend signs a token for that one room.
 */
export type VisioJoin =
  | { provider: "hosted"; domain: string; roomName: string; jwt: string }
  /** No Jitsi secret on the backend: the public room. */
  | { provider: "jitsi"; url: string };

export type EventVisioJoin = VisioJoin & {
  title: string;
  startsAt: string;
  endsAt: string;
  displayName: string;
};

export class AdminVisioController extends AdminBaseController {
  /** An HR event's visio, as a moderator. */
  async joinEvent(room: string): Promise<EventVisioJoin> {
    const url = this.createURL(
      `/admin/event/visio/${encodeURIComponent(room)}/join`,
      new URLSearchParams(),
    );
    return this.post<EventVisioJoin>(url, {});
  }
}

const controller = new AdminVisioController();
export const joinEventVisio = controller.joinEvent.bind(controller);
