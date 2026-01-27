import societies from "../societies.json" with { type: "json" };
import { chromium } from "playwright";
import { db, client } from "../db/db.js";
import { eventsTable } from "../db/schema.js";
import { DateTime } from "luxon";
import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { eq } from "drizzle-orm";

type ParsedEvent = {
  title: string;
  dateText: string;
  location: string;
  description: string;
};

const societiesWithFacebookUrl = societies.filter((s) => s.facebookurl);

try {
  for (const society of societiesWithFacebookUrl) {
    const fb = normalizeFacebookPageUrl(society.facebookurl);
    if (!fb) continue;

    const eventUrl = eventsUrl(society.facebookurl || "");
    if (!eventUrl.includes('facebook.com')) continue;

    const events = await scrapeEvents(eventUrl);

    for (const event of events) {
      console.log("dateText:", JSON.stringify(event.dateText));
      const date = fbWhenToDateSydney(event.dateText);
      if (!date) {
        console.log("FAILED TO PARSE DATE:", event.dateText);
        continue;
      }
      const start = date.start
      const end = date.end;

      const inserted = await db
        .insert(eventsTable)
        .values({
          societyName: society.title,
          title: event.title,
          startTime: start,
          endTime: end,
          location: event.location,
          description: event.description,
        })
        .onConflictDoNothing()
        .returning({ id: eventsTable.id });
        
      const insertedId = inserted[0]?.id;
      if (insertedId) {
        const textToEmbed = eventTextToEmbed(event);
        if (textToEmbed) {
          try {
            const { embedding } = await embed({
              model: openai.embedding("text-embedding-3-small"),
              value: textToEmbed,
            });

            await db
              .update(eventsTable)
              .set({ embedding })
              .where(eq(eventsTable.id, insertedId));
          } catch (e) {
            console.warn(
              `Failed to embed event "${event.title}" (still saved without embedding).`,
              e
            );
          }
        }
      }
    }
  }
} catch (error) {
  console.error("Error:", error);
} finally {
  await client.end({ timeout: 5000 });
}

function eventTextToEmbed(event: ParsedEvent): string {
  const title = event.title.trim();
  const description = event.description.trim();

  const text = `${title}\n\n${description}`.trim();

  return text.slice(0, 6000);
}


async function scrapeEvents(url: string) {
  const browser = await chromium.launch({ headless: false }); 
  const page = await browser.newPage();
  console.log("Navigating to:", url);

  await page.goto(url);
  // if (url === "https://www.facebook.com") {
  //   await browser.close();
  //   return [];
  // }

  if (await page.getByRole('heading', { name: /This page isn't available/i }).isVisible() ||
   await page.locator('span.x193iq5w.xeuugli.x13faqbe.x1vvkbs.xlh3980.xvmahel.x1n0sxbx.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.xudqn12.x41vudc.x1603h9y.x1u7k74.x1xlr1w8.xi81zsa.x2b8uid').isVisible() ||
   await page.getByRole('heading', { name: 'Facebook helps you connect and share with the people in your life.' }).isVisible()) {
    console.log("Page not found");
    await browser.close();
    return [];
  }

  await page.getByRole('button', { name: 'Close' }).click()

  const links = page.locator('a[href*="/events/"]');
  const count = await links.count();
  
  const ids = new Set<string>();
  
  for (let i = 0; i < count; i++) {
    const href = (await links.nth(i).getAttribute("href")) || "";
    const m = href.match(/\/events\/(\d+)/);
    if (m) ids.add(m[1]);
  }
  
  const eventUrls = [...ids].map((id) => `https://www.facebook.com/events/${id}/`);  

  const eventInfo: ParsedEvent[] = [];
  for (const eventUrl of eventUrls) {
    await page.goto(eventUrl, { waitUntil: "domcontentloaded" });
    await page.getByRole('button', { name: 'Close' }).click()

    // const seeMore = page.getByText('See more', { exact: true }).first();
    // if (await seeMore.isVisible()) {
    //   await seeMore.click();
    // }

    const seeMore = page.getByRole("button", { name: "See more" });

    for (let i = 0; i < await seeMore.count(); i++) {
      const btn = seeMore.nth(i);
      if (!(await btn.isVisible())) continue;

      if ((await btn.innerText()).trim() !== "See more") continue;

      await btn.evaluate(el => (el as HTMLElement).click());
      break;
    }

    const eventRoot = page.locator('xpath=//*[@aria-label="Event permalink"]//*[@role="main"]');
    await eventRoot.waitFor({ state: "visible", timeout: 15000 });
    const eventRootText = await eventRoot.allInnerTexts();
    eventInfo.push(parseFbEventText(eventRootText[0]));
  }

  await browser.close();

  return eventInfo;
}

export function fbWhenToDateSydney(when: string): { start: Date, end: Date | null } | null {
  if (!when || typeof when !== "string") return null;
  const cleaned = when
  .replace(/\b(AEDT|AEST|NZDT|NZST)\b/gi, "")
  .replace(/\s*[+\-]\d{1,2}(?::\d{2})?/g, "")
  .replace(/[—–]/g, "-")
  .trim();

  const parts = cleaned.split(/\s-\s/).map((s) => s.trim()).filter(Boolean);
  const start = parts[0];
  const end = parts[1];

  const startFormats = [
    "cccc d LLLL yyyy 'at' HH:mm",
    "cccc d LLLL yyyy 'at' h:mm a",
    "ccc, d LLL 'at' HH:mm",  
    "ccc, d LLL 'at' H:mm",
    "ccc d LLL 'at' HH:mm",
    "d LLL 'at' HH:mm",          
    "d LLL 'at' H:mm",            
    "LLL d 'at' HH",
    "LLL d 'at' HH:mm",
    "LLL d 'at' H",
    "LLL d 'at' H:mm",
  ];

  let startDate: DateTime | null = null;
  for (const format of startFormats) {
    const date = DateTime.fromFormat(start, format, {
      zone: "Australia/Sydney",
    });

    if (date.isValid) {
      startDate = date;
      break;
    }
  }

  if (!startDate) return null;

  const now = DateTime.now().setZone("Australia/Sydney");
  if (startDate < now) return null;

  if (!end) return { start: startDate.toJSDate(), end: null };


  const endTimeFormats = ["h:mm a", "hh:mm a", "H:mm", "HH:mm"];
  for (const format of endTimeFormats) {
    const date = DateTime.fromFormat(end, format, {
      zone: "Australia/Sydney",
    });

    if (!date.isValid) continue;
    let endDate = startDate.set({ hour: date.hour, minute: date.minute, second: 0, millisecond: 0 });
    if (endDate <= startDate) endDate = endDate.plus({ days: 1 }); 
    return { start: startDate.toJSDate(), end: endDate.toJSDate() };
  }

  const endDateFormats = [
    "cccc d LLLL yyyy 'at' HH:mm",
    "cccc d LLLL yyyy 'at' h:mm a",
    "ccc, d LLL 'at' HH:mm",  
    "ccc, d LLL 'at' H:mm",
    "ccc d LLL 'at' HH:mm",
    "d LLL 'at' HH:mm",          
    "d LLL 'at' H:mm",            
    "LLL d 'at' HH",
    "LLL d 'at' HH:mm",
    "LLL d 'at' H",
    "LLL d 'at' H:mm",
  ];

  let endDate: DateTime | null = null;
  for (const format of endDateFormats) {
    const date = DateTime.fromFormat(end, format, {
      zone: "Australia/Sydney",
    });

    if (date.isValid) {
      endDate = date;
      break;
    }
  }

  if (!endDate) return { start: startDate.toJSDate(), end: null };

  return { start: startDate.toJSDate(), end: endDate.toJSDate() };
}


function eventsUrl(facebookUrl: string) {
  const base = facebookUrl.trim().replace(/\/+$/, ""); 
  return `${base}/upcoming_hosted_events`;
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

export function parseFbEventText(raw: string): ParsedEvent {
  const lines = raw
    .split("\n")
    .map(s => s.trim())
    .filter(Boolean);

    const isDateLine = (l: string) => {
      const hasAt = /\bat\b/i.test(l);
      const hasMonth = /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/i.test(l);
      const hasTime = /\b\d{1,2}(:\d{2})?\b/.test(l); 
      return hasAt && hasMonth && hasTime;
    };
    
  const junk = new Set([
    "Invite", "Details", "Host", "Suggested events",
    "Privacy", "Terms", "Advertising", "Ad choices", "Cookies", "More",
    "About", "Discussion",
  ]);

  const dateIdx = lines.findIndex(isDateLine);
  const dateText = dateIdx >= 0 ? lines[dateIdx] : "";
  const title = dateIdx >= 0 ? (lines[dateIdx + 1] ?? "") : "";

  let location = "";
  for (let i = dateIdx + 2; i < lines.length; i++) {
    const l = lines[i];
    if (junk.has(l)) continue;
    if (/people responded/i.test(l)) continue;
    if (/^Event by /i.test(l)) continue;
    if (/^Public$/i.test(l)) continue;
    if (/Anyone on or off Facebook/i.test(l)) continue;
    if (l === title) continue;
    location = l;
    break;
  }

  let startIdx = lines.findIndex(l => /Anyone on or off Facebook/i.test(l));
  if (startIdx !== -1) startIdx += 1;
  else {
    startIdx = lines.findIndex(l => /^Public$/i.test(l));
    if (startIdx !== -1) startIdx += 1;
    else startIdx = dateIdx + 3;
  }

  const stopRe = /^(Host|Suggested events|Privacy)$/i;

  const descLines: string[] = [];
  for (let i = startIdx; i < lines.length; i++) {
    const l = lines[i];

    if (stopRe.test(l)) break;
    if (junk.has(l)) continue;

    if (isDateLine(l)) continue;
    if (/people responded/i.test(l)) continue;
    if (/^Event by /i.test(l)) continue;
    if (/^Public$/i.test(l)) continue;

    if (/^See (less|more)$/i.test(l)) continue;

    descLines.push(l);
  }

  const description = descLines.join("\n").trim();

  return { title, dateText, location, description };
}




