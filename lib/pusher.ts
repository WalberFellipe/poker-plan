import Pusher from "pusher";
import PusherClient from "pusher-js";

let pusherInstance: Pusher | null = null;

export const pusher = (() => {
  if (!pusherInstance) {
    if (
      !process.env.PUSHER_APP_ID ||
      !process.env.NEXT_PUBLIC_PUSHER_KEY ||
      !process.env.PUSHER_SECRET ||
      !process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    ) {
      throw new Error("Pusher environment variables are not set");
    }

    pusherInstance = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      useTLS: true,
    });
  }

  return pusherInstance;
})();

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY!,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    forceTLS: true,
  }
);
