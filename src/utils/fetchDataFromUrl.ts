import axios from "axios";
import * as cheerio from "cheerio";

export const fetchAndExtract = async (url: string) => {
  const res = await axios.get(url, {
    timeout: 30000,
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const $ = cheerio.load(res.data);

  // Remove non-content nodes
  ["script", "style", "noscript"].forEach((tag) => $(tag).remove());

  const title = $("title").first().text().trim();
  const text = $("body").text().replace(/\s+/g, " ").trim();
  return { url, title, text };
};
