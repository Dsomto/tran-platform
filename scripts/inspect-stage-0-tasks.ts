import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
const prisma = new PrismaClient();
(async () => {
  const room = await prisma.room.findUnique({ where: { slug: "induction-at-the-gate" } });
  if (!room) { console.log("no room"); return; }
  const assigns = await prisma.assignment.findMany({
    where: { roomId: room.id },
    select: { order: true, title: true, isClosed: true },
    orderBy: { order: "asc" }
  });
  console.log(`Room: ${room.title} (${room.id})`);
  console.log(`Total assignments: ${assigns.length}`);
  console.log(`Active (isClosed=false): ${assigns.filter(a => !a.isClosed).length}`);
  console.log();
  assigns.forEach(a => console.log(`  order=${String(a.order).padStart(3)} closed=${a.isClosed} | ${a.title}`));
  await prisma.$disconnect();
})();
