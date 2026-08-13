import { NextResponse } from "next/server";

export const runtime = "nodejs";

type BookingItem = {
  name: string;
  sku: string;
  quantity: number;
  price: string;
};

type BookingPayload = {
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    notes?: string;
  };
  items: BookingItem[];
};

const adminEmail = process.env.GANGOTRI_ADMIN_EMAIL || "rishabh@arevei.com";
const sheetDbEndpoint =
  process.env.SHEETDB_ENDPOINT || "https://sheetdb.io/api/v1/syojj970dm028";
const sheetName = process.env.SHEETDB_SHEET || "gangotri";
const fromEmail = process.env.GANGOTRI_FROM_EMAIL || "Gangotri <onboarding@resend.dev>";

function required(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function formatItems(items: BookingItem[]) {
  return items
    .filter((item) => Number(item.quantity) > 0)
    .map((item) => `${item.name} x ${item.quantity}`)
    .join(", ");
}

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to,
      subject,
      html
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend email failed: ${detail}`);
  }
}

function bookingEmail(payload: BookingPayload, orderId: string, isAdmin = false) {
  const { customer } = payload;
  const items = formatItems(payload.items);

  return `
    <div style="font-family: Georgia, serif; color: #10243a; line-height: 1.55;">
      <h1 style="color: #062846;">${isAdmin ? "New Gangotri preorder" : "Your Gangotri preorder is confirmed"}</h1>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Items:</strong> ${items}</p>
      <p><strong>Name:</strong> ${customer.name}</p>
      <p><strong>Email:</strong> ${customer.email}</p>
      <p><strong>Phone:</strong> ${customer.phone}</p>
      <p><strong>Address:</strong> ${customer.address}, ${customer.city}, ${customer.state} - ${customer.pincode}</p>
      ${customer.notes ? `<p><strong>Notes:</strong> ${customer.notes}</p>` : ""}
      <p>${isAdmin ? "Please contact the customer to confirm payment and delivery." : "We will contact you soon to confirm availability, payment and delivery details."}</p>
    </div>
  `;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as BookingPayload;
    const customer = payload.customer;
    const selectedItems = Array.isArray(payload.items)
      ? payload.items.filter((item) => Number(item.quantity) > 0)
      : [];

    if (
      !customer ||
      !required(customer.name) ||
      !required(customer.email) ||
      !required(customer.phone) ||
      !required(customer.address) ||
      !required(customer.city) ||
      !required(customer.state) ||
      !required(customer.pincode) ||
      selectedItems.length === 0
    ) {
      return NextResponse.json({ error: "Please complete all required booking details." }, { status: 400 });
    }

    const orderId = `GGT-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const itemsText = formatItems(selectedItems);

    const sheetResponse = await fetch(`${sheetDbEndpoint}?sheet=${encodeURIComponent(sheetName)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [
          {
            order_id: orderId,
            created_at: createdAt,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            city: customer.city,
            state: customer.state,
            pincode: customer.pincode,
            items: itemsText,
            quantity_500ml: selectedItems.find((item) => item.sku === "500ml")?.quantity || 0,
            quantity_1litre: selectedItems.find((item) => item.sku === "1litre")?.quantity || 0,
            notes: customer.notes || "",
            status: "Pre-order received"
          }
        ]
      })
    });

    if (!sheetResponse.ok) {
      const detail = await sheetResponse.text();
      throw new Error(`SheetDB save failed: ${detail}`);
    }

    await Promise.all([
      sendEmail(
        customer.email,
        `Gangotri preorder confirmed: ${orderId}`,
        bookingEmail({ ...payload, items: selectedItems }, orderId)
      ),
      sendEmail(
        adminEmail,
        `New Gangotri preorder: ${orderId}`,
        bookingEmail({ ...payload, items: selectedItems }, orderId, true)
      )
    ]);

    return NextResponse.json({ ok: true, orderId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to place preorder.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
