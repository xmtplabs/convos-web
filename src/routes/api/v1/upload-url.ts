import { createFileRoute } from "@tanstack/react-router";
import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY,
});

export const Route = createFileRoute("/api/v1/upload-url")({
  server: {
    handlers: {
      GET: async () => {
        const url = await pinata.upload.public.createSignedURL({
          expires: 60,
          groupId: process.env.PINATA_GROUP_ID,
        });
        return Response.json({ url });
      },
    },
  },
});
