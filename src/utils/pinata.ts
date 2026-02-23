import { PinataSDK } from "pinata";

export const pinata = new PinataSDK({
  pinataJwt: "",
  pinataGateway: import.meta.env.VITE_PINATA_GATEWAY,
});
