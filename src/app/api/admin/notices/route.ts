import { currentUser } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { adminNoticeWhere } from "@/lib/admin-notifications";
import { formatDateTime } from "@/components/admin/datetime";
export async function GET() {
  const session=await currentUser();
  if(!session?.id) return Response.json({error:"UNAUTHORIZED"},{status:401});
  const me=await prisma.user.findFirst({where:{id:session.id,status:"ACTIVE",role:{in:["ADMIN","EDITOR"]}},select:{id:true}});
  if(!me) return Response.json({error:"FORBIDDEN"},{status:403});
  const [items,unread]=await Promise.all([
    prisma.notification.findMany({where:adminNoticeWhere(me.id),orderBy:{createdAt:"desc"},take:12}),
    prisma.notification.count({where:adminNoticeWhere(me.id,"unread")}),
  ]);
  return Response.json({unread,items:items.map(n=>({id:n.id,kind:n.kind,title:n.titleAr,body:n.bodyAr||"",href:n.href||"/admin/notifications",unread:!n.readAt,when:formatDateTime(n.createdAt)}))},{headers:{"Cache-Control":"no-store"}});
}
