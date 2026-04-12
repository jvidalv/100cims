import { Elysia } from "elysia";

import { planChatAllGetRoute } from "@/api/routes/protected/plan-chat/plan-chat.all.get";
import { planChatDeleteDeleteRoute } from "@/api/routes/protected/plan-chat/plan-chat.delete.delete";
import { planChatReadPostRoute } from "@/api/routes/protected/plan-chat/plan-chat.read.post";
import { planChatSendPostRoute } from "@/api/routes/protected/plan-chat/plan-chat.send.post";
import { planChatUnreadGetRoute } from "@/api/routes/protected/plan-chat/plan-chat.unread.get";

export const planChatRoute = new Elysia({ prefix: "/plans/chat" })
  .use(planChatReadPostRoute)
  .use(planChatUnreadGetRoute)
  .use(planChatSendPostRoute)
  .use(planChatAllGetRoute)
  .use(planChatDeleteDeleteRoute);
