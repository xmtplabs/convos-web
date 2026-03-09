import { createFileRoute } from "@tanstack/react-router";
import { PinataSDK } from "pinata";
import { createLogger } from "@/utils/log";
import { checkRateLimit } from "@/utils/rateLimit";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY,
});

const log = createLogger("upload-url-api");

export const Route = createFileRoute("/api/v1/upload-url")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        log.info("GET upload-url");

        if (!(await checkRateLimit(request))) {
          log.warn("rate limited");
          return new Response("Too many requests", { status: 429 });
        }

        try {
          const url = await pinata.upload.public.createSignedURL({
            expires: 60,
            groupId: process.env.PINATA_GROUP_ID,
          });
          return Response.json({ url });
        } catch (err) {
          log.error("createSignedURL failed", err);
          return new Response("Failed to create signed URL", { status: 500 });
        }
      },
    },
  },
});
