"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import * as XLSX from "xlsx";

export const importCommitments = action({
  args: {
    companyId: v.id("companies"),
    fileData: v.string(), // Base64 encoded file data
  },
  handler: async (ctx, args) => {
    try {
      const buffer = Buffer.from(args.fileData, 'base64');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      let importedCount = 0;
      let errors = [];

      for (const row of data as any[]) {
        try {
          // Map Excel columns to commitment fields
          // Expected columns: Account, Description, Amount, Due Date (YYYY-MM-DD), Status
          const account = row["الحساب"] || row["Account"];
          const description = row["الوصف"] || row["Description"];
          const amount = parseFloat(row["المبلغ"] || row["Amount"]);
          const dueDateStr = row["تاريخ الاستحقاق"] || row["Due Date"];
          const status = (row["الحالة"] || row["Status"] || "active").toLowerCase();

          if (!account || isNaN(amount) || !dueDateStr) {
            errors.push(`بيانات ناقصة في الصف: ${JSON.stringify(row)}`);
            continue;
          }

          const dueDate = new Date(dueDateStr).getTime();
          if (isNaN(dueDate)) {
            errors.push(`تاريخ غير صالح: ${dueDateStr}`);
            continue;
          }

          // Map Arabic status to English if needed
          const statusMap: Record<string, string> = {
            "نشط": "active",
            "مؤجل": "postponed",
            "مدفوع": "paid",
            "مدفوع جزئياً": "partialPaid",
            "ملغي": "cancelled",
            "active": "active",
            "postponed": "postponed",
            "paid": "paid",
            "partialpaid": "partialPaid",
            "cancelled": "cancelled"
          };

          const finalStatus = statusMap[status] || "active";

          await ctx.runMutation(internal.commitments.createCommitmentInternal, {
            companyId: args.companyId,
            account,
            description: description || "",
            amount,
            dueDate,
            status: finalStatus as any,
          });

          importedCount++;
        } catch (e: any) {
          errors.push(`خطأ في معالجة الصف: ${e.message}`);
        }
      }

      return {
        success: true,
        importedCount,
        errors: errors.length > 0 ? errors : null,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
});
