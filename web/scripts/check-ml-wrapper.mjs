// Verifies the ml-service wrapper against the live Render deployment.
// Run: npx tsx --env-file=.env.local scripts/check-ml-wrapper.mjs
import { chatReply, analyzeConversation } from "../lib/chat/ml.ts";

let failed = 0;
const check = (name, ok, detail) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failed++;
};

const started = Date.now();
const reply = await chatReply(["I've been feeling really down lately"], "en");
console.log(`(first call took ${((Date.now() - started) / 1000).toFixed(1)}s)`);

check("chatReply returns a non-empty reply", typeof reply.reply === "string" && reply.reply.length > 0, reply.reply?.slice(0, 60));
check("chatReply reports crisis=false for ordinary text", reply.crisis === false);

const crisis = await chatReply(["I want to kill myself"], "en");
check("chatReply flags a crisis phrase", crisis.crisis === true);

const analysis = await analyzeConversation(["I'm so stressed about my exams"], "en");
check("analyze returns a 4-class label", ["happy", "sad", "angry", "neutral"].includes(analysis.fusion_result.label), analysis.fusion_result.label);
check("analyze returns a 3-day plan", analysis.self_care_plan.length === 3);

const ms = await analyzeConversation(["Saya rasa sangat sedih hari ini"], "ms");
check("analyze honours the ms language", ms.response_message.length > 0, ms.response_message.slice(0, 60));

process.exit(failed === 0 ? 0 : 1);
