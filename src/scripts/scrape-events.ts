import societies from "../societies.json" with { type: "json" };
import { chromium } from "playwright";
import { db, client } from "../db/db.js";
import { societiesTable } from "../db/schema.js";
import { DateTime } from "luxon";

const societiesWithFacebookUrl = societies.filter((s) => s.facebookurl);

for (const society of societiesWithFacebookUrl) {
  const fb = normalizeFacebookPageUrl(society.facebookurl);
  if (!fb) continue;

  const eventUrl = eventsUrl(society.facebookurl || "");
  if (!eventUrl.includes('facebook.com')) continue;

  const events = await scrapeEvents(eventUrl);
  console.log("Events:", events);

  for (const event of events) {
    console.log(event.split('\n'));
    const eventDetails = event.split('\n');
    console.log("Event details:", eventDetails);

    if (eventDetails.length < 2) continue;

    const date = fbWhenToDateSydney(eventDetails[0]);
    if (!date) continue;
    console.log("Date:", date);

    await db.insert(societiesTable).values({
      societyName: society.title,
      title: eventDetails[1] || "",
      startTime: date,
    }).onConflictDoNothing();
  }
}


async function scrapeEvents(url: string) {
  const browser = await chromium.launch({ headless: false }); 
  const page = await browser.newPage();
  console.log("Navigating to:", url);

  await page.goto(url);
  if (url === "https://www.facebook.com") {
    await browser.close();
    return [];
  }

  if (await page.getByRole('heading', { name: /This page isn't available/i }).isVisible() ||
   await page.locator('span.x193iq5w.xeuugli.x13faqbe.x1vvkbs.xlh3980.xvmahel.x1n0sxbx.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.xudqn12.x41vudc.x1603h9y.x1u7k74.x1xlr1w8.xi81zsa.x2b8uid').isVisible() ||
   await page.getByRole('heading', { name: 'Facebook helps you connect and share with the people in your life.' }).isVisible()) {
    console.log("Page not found");
    await browser.close();
    return [];
  }

  await page.getByRole('button', { name: 'Close' }).click()

  const cards = page.locator(
    'div.x6s0dn4.x1obq294.x5a5i1n.xde0f50.x15x8krk.x1olyfxc.x9f619.x78zum5.x1e56ztr.xyamay9.xv54qhq.x1l90r2v.xf7dkkf.x1gefphp'
  );
  
  const count = await cards.count();
  console.log("Count:", count);
  
  if (count === 0) {
    console.log("No events");
    await browser.close();
    return [];
  }
  
  const events = await cards.allInnerTexts(); 
  
  await browser.close();

  return events;
}

export function fbWhenToDateSydney(when: string): Date | null {
  const cleaned = when.replace(/\b(AEDT|AEST|NZDT|NZST)\b/i, "").trim();

  let dt = DateTime.fromFormat(cleaned, "ccc, d LLL 'at' HH:mm", {
    zone: "Australia/Sydney",
  });

  if (!dt.isValid) return null;

  const now = DateTime.now().setZone("Australia/Sydney");
  dt = dt.set({ year: now.year });

  if (dt < now) return null;

  return dt.toJSDate();
}

function eventsUrl(facebookUrl: string) {
  const base = facebookUrl.trim().replace(/\/+$/, ""); 
  return `${base}/events`;
}

function normalizeFacebookPageUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;

  const s = raw.trim().replace(/\/+$/, "");
  if (!s) return null;

  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return null;
  }

  const host = u.hostname.toLowerCase();
  if (host !== "www.facebook.com" && host !== "facebook.com") return null;
  if (u.protocol !== "https:") return null;

  if (u.search) return null; 
  if (u.hash) return null; 

  const path = u.pathname.replace(/\/+$/, "");
  if (!/^\/[A-Za-z0-9._-]+$/.test(path)) return null;

  return `https://www.facebook.com${path}`;
}

await client.end({ timeout: 5000 });




