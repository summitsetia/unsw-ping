import societies from "../societies.json" with { type: "json" };
import { chromium } from "playwright";

const societiesWithFacebookUrl = societies.filter((s) => s.facebookurl);

for (const society of societiesWithFacebookUrl) {
  const url = society.facebookurl + "/events";
  scrapeEvents(url);
}

async function scrapeEvents(url: string) {
  const browser = await chromium.launch({ headless: false }); 
  const page = await browser.newPage();

  await page.goto(url);

  const title = await page.title();
  console.log("Page title:", title);

  await browser.close();
}

