import { Password } from "@convex-dev/auth/providers/Password";
console.log(typeof Password().crypto?.hashSecret);
