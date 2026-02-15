import "dotenv/config";
import { db } from "../db";
import { drugs, wards, wardConstantDrugs, orders, orderItems, announcements, constantSets } from "../db/schema";

async function main() {
    console.log("Seeding database...");

    // 1. Wards
    await db.delete(wards);
    await db.insert(wards).values([
        { id: "1", name: "内科病棟", password: "naika123", role: "user" },
        { id: "2", name: "外科病棟", password: "geka456", role: "user" },
        { id: "admin", name: "管理者", password: "admin", role: "admin" },
    ]);

    // 2. Drugs
    await db.delete(drugs);
    const drugResult = await db.insert(drugs).values([
        { name: "アセトアミノフェン錠 500mg", furigana: "あせとあみのふぇん", category: "解熱鎮痛剤", unit: "錠" },
        { name: "イブプロフェン錠 200mg", furigana: "いぶぷろふぇん", category: "解熱鎮痛剤", unit: "錠" },
        { name: "生理食塩水500ml", furigana: "せいりしょくえんすい", category: "輸液", unit: "ml" },
        { name: "インスリン注射液", furigana: "いんすりん", category: "糖尿病薬", unit: "本" },
        { name: "アモキシシリン錠 250mg", furigana: "あもきししりん", category: "抗生物質", unit: "錠" },
    ]).returning();

    // 3. Constant Sets & Drugs
    await db.delete(wardConstantDrugs);
    await db.delete(constantSets);

    const sets = await db.insert(constantSets).values([
        { wardId: "1", name: "標準セット" },
        { wardId: "2", name: "標準セット" },
        { wardId: "1", name: "緊急セット" },
    ]).returning();

    await db.insert(wardConstantDrugs).values([
        { wardId: "1", setId: sets[0].id, drugId: drugResult[0].id, quantity: 100 },
        { wardId: "1", setId: sets[0].id, drugId: drugResult[2].id, quantity: 50 },
        { wardId: "2", setId: sets[1].id, drugId: drugResult[1].id, quantity: 80 },
        { wardId: "2", setId: sets[1].id, drugId: drugResult[3].id, quantity: 20 },
    ]);

    // 4. Sample Orders
    await db.delete(orders);
    await db.delete(orderItems);

    // Order 1: 内科, 臨時, 承認待ち
    const order1 = await db.insert(orders).values({
        wardId: "1",
        requestId: "25-1",
        type: "臨時",
        status: "承認待ち",
        reason: "緊急で必要です",
    }).returning();

    await db.insert(orderItems).values([
        { orderId: order1[0].id, drugId: drugResult[0].id, quantity: 10, status: "承認待ち" },
        { orderId: order1[0].id, drugId: drugResult[4].id, quantity: 5, status: "承認待ち" },
    ]);

    // Order 2: 外科, 定時, 一部承認済み
    const order2 = await db.insert(orders).values({
        wardId: "2",
        requestId: "25-2",
        type: "定時",
        status: "部分承認",
        reason: "定期補充",
        approvedBy: "管理者",
        approvedDate: new Date().toISOString(),
    }).returning();

    await db.insert(orderItems).values([
        {
            orderId: order2[0].id,
            drugId: drugResult[1].id,
            quantity: 50,
            approvedQuantity: 50,
            status: "承認済み"
        },
        {
            orderId: order2[0].id,
            drugId: drugResult[3].id,
            quantity: 10,
            approvedQuantity: 5,
            rejectedQuantity: 5,
            status: "承認済み",
            comment: "在庫不足のため半数のみ"
        },
    ]);

    // 5. Announcements
    await db.delete(announcements);
    await db.insert(announcements).values([
        { title: "システム稼働開始", content: "新しい医薬品請求システムが稼働しました。" },
        { title: "年末年始の対応について", content: "12/29〜1/3は定期配送がお休みです。" },
    ]);

    console.log("Seeding complete!");
}

main().catch((err) => {
    console.error("SEED SCRIPT ERROR:");
    console.error(err);
    if (err instanceof Error) {
        console.error("Message:", err.message);
        console.error("Stack:", err.stack);
    } else {
        console.error("Unknown error object:", JSON.stringify(err, null, 2));
    }
    process.exit(1);
});
